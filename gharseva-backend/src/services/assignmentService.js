const redisService = require('./redisService');
const workerRepository = require('../repositories/workerRepository');
const bookingRepository = require('../repositories/bookingRepository');
const Notification = require('../models/Notification');
const { BOOKING_STATUS } = require('../utils/constants');

class AssignmentService {
  constructor() {
    this.activeBroadcasts = new Map();
  }

  async assignWorkerToBooking(bookingId) {
    try {
      const booking = await bookingRepository.findById(bookingId);
      if (!booking) return;

      // Update status to SEARCHING
      await bookingRepository.updateStatus(bookingId, BOOKING_STATUS.SEARCHING);

      const categoryId = booking.serviceId?.categoryId || booking.categoryId; // Handle both populated and raw
      const isTrustService = booking.serviceId?.isTrustService;

      const query = {
        _id: { $nin: booking.excludedWorkerIds || [] },
        isOnline: true,
        isActive: true,
        categories: categoryId,
        ...(isTrustService ? { isTrustVerified: true } : {}),
      };

      // 1. Find Near Workers (Geo)
      let eligibleWorkers = [];
      try {
        eligibleWorkers = await workerRepository.findNear(
          [booking.lng || 0, booking.lat || 0],
          10000,
          query
        );
      } catch (err) {
        console.warn('Geo query failed, falling back to pincode');
      }

      // 2. Fallback to Pincode if Geo fails or is near 0,0
      if (eligibleWorkers.length === 0) {
        console.log(`[AssignmentService] Geo search failed for Booking ${bookingId}, falling back to Pincode: ${booking.pincode}`);
        eligibleWorkers = await workerRepository.findInPincodes(
          booking.pincode,
          query
        );
      }

      if (eligibleWorkers.length === 0) {
        console.log(`[AssignmentService] No online workers found for Booking ${bookingId}`);
        return;
      }

      // 3. Status to PENDING_ACCEPTANCE (no specific worker assigned yet)
      await bookingRepository.updateInternalStatus(bookingId, BOOKING_STATUS.PENDING_ACCEPTANCE, null);

      // 4. Store State in Redis
      await redisService.set(`broadcast:${bookingId}`, 'active', 60);

      // 5. Broadcast via Socket.io & Push Notifications
      const io = global.io;
      const pushService = require('./pushNotificationService');

      if (io) {
        const payload = {
          bookingId: booking._id,
          pincode: booking.pincode,
          address: booking.address,
          serviceName: booking.serviceId?.name,
          price: booking.price,
          customerName: booking.userId?.name,
          customerPicture: booking.userId?.profilePicture
        };

        eligibleWorkers.slice(0, 3).forEach(async (worker) => {
          // 5a. Socket.io (Real-time in-app)
          io.to(`worker_${worker._id}`).emit('new_booking_request', payload);
          console.log(`[AssignmentService] Broadcast → Worker: ${worker.name}`);

          // 5b. Push Notification (Background/Locked)
          if (worker.pushToken) {
            const earnings = booking.price - Math.round(booking.price * 0.1);
            pushService.sendPushNotification(
              worker.pushToken,
              'New Job Available! 🚀',
              `Claim ${booking.serviceId?.name || 'Service'} at ${booking.address.split(',')[0]}. Earn ₹${earnings}!`,
              { type: 'new_job', bookingId: booking._id }
            ).catch(err => console.error('[PushError]', err));
          }

          // Save to Notification History for Worker App
          await Notification.create({
            workerId: worker._id,
            title: 'New Booking Available! 🚀',
            message: `New ${booking.serviceId?.name || 'Service'} request near you. Claim it now to earn!`,
            type: 'booking'
          }).catch(err => console.error('[AssignmentService] Notification save error:', err));
        });
      }

      // 6. Set 60s Timeout (Modularized)
      setTimeout(async () => {
        await this.handleAssignmentTimeout(bookingId);
      }, 60000);

    } catch (error) {
      console.error('[AssignmentService] Error:', error);
    }
  }

  async handleAssignmentTimeout(bookingId) {
    await redisService.del(`broadcast:${bookingId}`);
    
    const booking = await bookingRepository.findById(bookingId);
    if (booking?.status === BOOKING_STATUS.PENDING_ACCEPTANCE) {
      console.log(`[AssignmentService] Timeout for Booking ${bookingId}. Reverting to SEARCHING.`);
      await bookingRepository.updateStatus(bookingId, BOOKING_STATUS.SEARCHING);
    }
  }
}

module.exports = new AssignmentService();
