const { BOOKING_STATUS } = require('../utils/constants');
const Worker = require('../models/Worker');
const notificationService = require('./notificationService');

class BookingService {
  get bookingRepository() {
    return require('../repositories/bookingRepository');
  }

  async getWorkerBookings(workerId, status) {
    const statuses = status ? [status] : [
      BOOKING_STATUS.PENDING_ACCEPTANCE,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.IN_PROGRESS
    ];
    
    // 1. Get jobs already assigned to this worker
    const assignedJobs = await this.bookingRepository.findByWorkerAndStatus(workerId, statuses);
    
    // 2. Get jobs available nearby (if not filtering for a specific already-assigned status)
    let availableJobs = [];
    if (!status || status === BOOKING_STATUS.PENDING_ACCEPTANCE) {
      const worker = await Worker.findById(workerId);
      if (worker && worker.isOnline) {
        availableJobs = await this.bookingRepository.findAvailableForWorker(
          workerId, 
          worker.categories || [], 
          worker.location?.coordinates[0], 
          worker.location?.coordinates[1]
        );
      }
    }

    // Combine them into a single list or return both
    return {
      active: assignedJobs,
      available: availableJobs
    };
  }

  async getWorkerHistory(workerId) {
    const statuses = [
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED
    ];
    // Return completed and cancelled jobs assigned to this worker
    return await this.bookingRepository.findByWorkerAndStatus(workerId, statuses);
  }

  async acceptBooking(bookingId, workerId, workerName) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const assignedId = booking.assignedWorkerId?._id || booking.assignedWorkerId;

    // Gracefully handle if the worker accidentally double-taps
    if (booking.status === BOOKING_STATUS.CONFIRMED && String(assignedId) === String(workerId)) {
        return booking;
    }

    if (![BOOKING_STATUS.PENDING_ACCEPTANCE, BOOKING_STATUS.SEARCHING].includes(booking.status)) {
      throw new Error('This job is no longer available.');
    }

    if (assignedId && String(assignedId) !== String(workerId)) {
      throw new Error('This job was already claimed by another professional.');
    }

    booking.assignedWorkerId = workerId;
    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.acceptedAt = new Date(); // Record acceptance time
    await booking.save();

    // Increment worker's active bookings count
    await Worker.findByIdAndUpdate(workerId, { $inc: { activeBookingsCount: 1 } });

    // Trigger Socket.io (if global.io exists)
    if (global.io) {
      const uId = booking.userId?._id || booking.userId;
      global.io.to(`user_${uId}`).emit('booking_confirmed', {
        bookingId: booking._id,
        bookingDisplayId: booking.bookingId,
        workerName: workerName
      });
      // Broadcast to other workers so they can remove the request banner
      global.io.emit('job_claimed_by_other', {
        bookingId: booking._id,
        bookingDisplayId: booking.bookingId,
        workerName: workerName
      });
    }

    // CREATE PERSISTENT NOTIFICATIONS
    const extractedUserId = booking.userId?._id || booking.userId;
    const serviceTitle = booking.serviceId?.name || booking.serviceName || 'Service';
    await notificationService.createNotification({
       userId: extractedUserId,
       title: 'Booking Confirmed!',
       message: `${workerName} has accepted your ${serviceTitle} request.`,
       type: 'booking'
    });

    // RE-POPULATE before returning to ensure worker sees customer name
    const finalBooking = await this.bookingRepository.findById(booking._id);
    return finalBooking || booking;
  }

  async updateBookingStatus(bookingId, workerId, status, userId, otp = null, additionalUpdates = {}) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const updates = { ...additionalUpdates };
    
    // Explicitly handle array fields to prevent overwriting with single values
    // if the controller passes them as arrays
    if (status === 'in_progress') {
        updates.startedAt = new Date();
    } else if (status === 'completed') {
        updates.completedAt = new Date();
    }

    if (status === 'completed') {
      if (!otp || String(booking.completionOtp) !== String(otp)) {
        throw new Error('Invalid Completion OTP. Ask the customer for their 4-digit PIN.');
      }

      const Settings = require('../models/Settings');
      const settings = (await Settings.findOne()) || { platformFeeType: 'fixed', platformFeeValue: 29, workerCommissionPercentage: 10, minJobsForCommission: 10 };
      
      const dailyCount = await this.bookingRepository.countWorkerCompletedJobsToday(workerId);
      const isThresholdMet = (dailyCount + 1) >= (settings.minJobsForCommission || 10);
      
      const commissionRate = isThresholdMet ? (settings.workerCommissionPercentage || 10) : 0;
      const workerCommissionAmount = Math.round(booking.price * (commissionRate / 100));
      const workerEarnings = booking.price - workerCommissionAmount;
      
      updates.workerEarnings = workerEarnings;
      updates.commissionFee = workerCommissionAmount; // Store explicit Rs. value
      updates.commissionApplied = commissionRate;

      await Worker.findByIdAndUpdate(workerId, { 
        $inc: { 
          activeBookingsCount: -1,
          totalEarnings: workerEarnings
        } 
      });
    }

    const updatedBooking = await this.bookingRepository.updateStatus(bookingId, status, workerId, updates);
    if (!updatedBooking) throw new Error('Booking update failed or unauthorized');

    const uId = booking.userId?._id || booking.userId;

    if (global.io) {
      global.io.to(`user_${uId}`).emit('booking_status_update', { 
        bookingId: booking._id, 
        bookingDisplayId: booking.bookingId,
        status 
      });
    }

    // Notify user of completion
    if (status === 'completed') {
      const serviceTitle = booking.serviceId?.name || booking.serviceName || 'Service';
      await notificationService.createNotification({
         userId: uId,
         title: 'Service Completed',
         message: `Your ${serviceTitle} has been successfully completed.`,
         type: 'booking'
      });
    }

    // RE-POPULATE before returning to ensure worker sees customer name
    const finalBooking = await this.bookingRepository.findById(booking._id);
    return finalBooking || booking;
  }

  async createUserBooking(userId, bookingData) {
    const Settings = require('../models/Settings');
    const settings = (await Settings.findOne()) || { platformFeeType: 'fixed', platformFeeValue: 29 };

    const feeVal = Number(settings.platformFeeValue) || 29;

    let platformFee = 0;
    if (settings.platformFeeType === 'percentage') {
        platformFee = Math.round(bookingData.price * (feeVal / 100));
    } else {
        platformFee = feeVal;
    }
    
    const totalAmount = bookingData.price + platformFee;
    const workerEarnings = bookingData.price;

    const booking = await this.bookingRepository.create({
      userId,
      ...bookingData,
      platformFee,
      totalAmount,
      workerEarnings,
      status: BOOKING_STATUS.PENDING
    });
    return booking;
  }

  async getUserBookings(userId) {
    return await this.bookingRepository.findByUser(userId);
  }

  async getBookingById(bookingId, userId, workerId) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    
    // Security check: ensure booking belongs to user or assigned to worker
    const ownerId = booking.userId?._id || booking.userId;
    const isOwner = userId && String(ownerId) === String(userId);
    
    const assignedId = booking.assignedWorkerId?._id || booking.assignedWorkerId;
    const isAssignedWorker = workerId && assignedId && String(assignedId) === String(workerId);

    if (!isOwner && !isAssignedWorker) {
      throw new Error('Unauthorized access to booking');
    }
    
    return booking;
  }

  async cancelBooking(bookingId, userId, workerId, reason, cancelledBy) {
    const query = { _id: bookingId };
    if (userId) query.userId = userId;
    if (workerId) query.assignedWorkerId = workerId;

    const booking = await this.bookingRepository.findByIdAndQuery(bookingId, query);
    if (!booking) throw new Error('Booking not found or unauthorized to cancel');

    if (['in_progress', 'completed', 'cancelled'].includes(booking.status)) {
      throw new Error(`Cannot cancel a booking that is already ${booking.status.replace('_', ' ')}`);
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelReason = reason;
    booking.cancelledBy = cancelledBy;
    booking.cancelledAt = new Date(); // Record cancellation time
    await booking.save();

    // If it was an active job assigned to a worker, decrement their active count
    if (booking.assignedWorkerId) {
      const wId = booking.assignedWorkerId?._id || booking.assignedWorkerId;
      await Worker.findByIdAndUpdate(wId, { 
        $inc: { activeBookingsCount: -1 } 
      });

      // Notify worker of cancellation
      await notificationService.createNotification({
        workerId: wId,
        title: 'Booking Cancelled',
        message: `Booking for ${booking.serviceName} has been cancelled.`,
        type: 'booking'
      });
    } else {
      // If it was still pending, notify user (if they cancelled) or just log
      await notificationService.createNotification({
        userId: booking.userId,
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.serviceName} has been cancelled.`,
        type: 'booking'
      });
    }

    // Notify the other party
    if (global.io) {
      const wIdTarget = booking.assignedWorkerId?._id || booking.assignedWorkerId;
      const uIdTarget = booking.userId?._id || booking.userId;
      
      const targetRoom = cancelledBy === 'user' 
        ? `worker_${wIdTarget}` 
        : `user_${uIdTarget}`;
      
      global.io.to(targetRoom).emit('booking_cancelled', {
        bookingId: booking._id,
        bookingDisplayId: booking.bookingId,
        reason,
        cancelledBy
      });
    }

    return booking;
  }

  async workerCancelBooking(bookingId, workerId, reason) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const assignedId = booking.assignedWorkerId?._id || booking.assignedWorkerId;
    if (!assignedId || String(assignedId) !== String(workerId)) {
      throw new Error('Unauthorized or job not assigned to you.');
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      const msg = booking.status === 'in_progress' 
        ? 'Cannot cancel a job that has already started.' 
        : 'Job is not in a cancellable state.';
      throw new Error(msg);
    }

    // Reset for re-assignment
    booking.status = BOOKING_STATUS.SEARCHING;
    booking.assignedWorkerId = null;
    
    // Add to excluded list
    if (!booking.excludedWorkerIds) booking.excludedWorkerIds = [];
    if (!booking.excludedWorkerIds.includes(workerId)) {
      booking.excludedWorkerIds.push(workerId);
    }
    
    await booking.save();

    // Decrement worker's active count
    await Worker.findByIdAndUpdate(workerId, { $inc: { activeBookingsCount: -1 } });

    const uId = booking.userId?._id || booking.userId;
    // Notify user of worker cancellation
    if (global.io) {
      global.io.to(`user_${uId}`).emit('worker_cancelled_job', {
        bookingId: booking._id,
        reason
      });
    }

    // CREATE NOTIFICATION for user
    await notificationService.createNotification({
       userId: uId,
       title: 'Professional Cancelled',
       message: `The professional has cancelled the job due to: ${reason}. We are searching for a replacement.`,
       type: 'booking'
    });

    // Re-trigger assignment logic
    const assignmentService = require('./assignmentService');
    assignmentService.assignWorkerToBooking(booking._id).catch(console.error);

    return booking;
  }
}

module.exports = new BookingService();
