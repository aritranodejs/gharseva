const { BOOKING_STATUS } = require('../utils/constants');
const Worker = require('../models/Worker');
const notificationService = require('./notificationService');

class BookingService {
  get bookingRepository() {
    return require('../repositories/bookingRepository');
  }

  async getWorkerBookings(workerId) {
    const statuses = [
      BOOKING_STATUS.PENDING_ACCEPTANCE,
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.IN_PROGRESS
    ];
    return await this.bookingRepository.findByWorkerAndStatus(workerId, statuses);
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

    if (booking.status !== BOOKING_STATUS.PENDING_ACCEPTANCE) {
      throw new Error('This job is no longer available.');
    }

    const assignedId = booking.assignedWorkerId?._id || booking.assignedWorkerId;
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
      global.io.to(`user_${booking.userId}`).emit('booking_confirmed', {
        bookingId: booking._id,
        workerName: workerName
      });
      // Broadcast to other workers so they can remove the request banner
      global.io.emit('job_claimed_by_other', {
        bookingId: booking._id,
        workerName: workerName
      });
    }

    // CREATE PERSISTENT NOTIFICATIONS
    await notificationService.createNotification({
       userId: booking.userId,
       title: 'Booking Confirmed!',
       message: `${workerName} has accepted your ${booking.serviceName} request.`,
       type: 'booking'
    });

    // RE-POPULATE before returning to ensure worker sees customer name
    const finalBooking = await this.bookingRepository.findById(booking._id);
    return finalBooking || booking;
  }

  async updateBookingStatus(bookingId, workerId, status, userId, otp = null) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (status === 'in_progress') {
        booking.startedAt = new Date();
    } else if (status === 'completed') {
        booking.completedAt = new Date();
    }
    await booking.save();

    const updatedBooking = await this.bookingRepository.updateStatus(bookingId, status, workerId);
    if (!updatedBooking) throw new Error('Booking update failed or unauthorized');

    if (status === 'completed') {
      if (!otp || String(booking.completionOtp) !== String(otp)) {
        // Rollback status to previous (which should be in_progress) if wrong OTP
        await this.bookingRepository.updateStatus(bookingId, 'in_progress', workerId);
        throw new Error('Invalid Completion OTP. Ask the customer for their 4-digit PIN.');
      }

      const platformFee = booking.platformFee || Math.max(29, Math.round(booking.price * 0.1));
      const workerEarnings = booking.price - platformFee;
      
      await this.bookingRepository.updateInternalStatus(bookingId, status, workerId);
      // Store revenue details in booking (assuming model has these fields or we add them)
      booking.platformFee = platformFee;
      booking.workerEarnings = workerEarnings;
      await booking.save();

      await Worker.findByIdAndUpdate(workerId, { 
        $inc: { 
          activeBookingsCount: -1,
          totalEarnings: workerEarnings
        } 
      });
    }

    if (global.io) {
      global.io.to(`user_${booking.userId}`).emit('booking_status_update', { 
        bookingId: booking._id, 
        status 
      });
    }

    // Notify user of completion
    if (status === 'completed') {
      await notificationService.createNotification({
         userId: booking.userId,
         title: 'Service Completed',
         message: `Your ${booking.serviceName} has been successfully completed.`,
         type: 'booking'
      });
    }

    // RE-POPULATE before returning to ensure worker sees customer name
    const finalBooking = await this.bookingRepository.findById(booking._id);
    return finalBooking || booking;
  }

  async createUserBooking(userId, bookingData) {
    // Read platform fee from ENV, default to 29 if not set or invalid
    const envFee = parseInt(process.env.PLATFORM_FEE);
    const platformFee = !isNaN(envFee) ? envFee : 29;
    
    const totalAmount = bookingData.price + platformFee;

    const booking = await this.bookingRepository.create({
      userId,
      ...bookingData,
      platformFee,
      totalAmount,
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

    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new Error(`Cannot cancel a booking that is already ${booking.status}`);
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
      const targetRoom = cancelledBy === 'user' 
        ? `worker_${booking.assignedWorkerId}` 
        : `user_${booking.userId}`;
      
      global.io.to(targetRoom).emit('booking_cancelled', {
        bookingId: booking._id,
        reason,
        cancelledBy
      });
    }

    return booking;
  }
}

module.exports = new BookingService();
