const bookingService = require('../services/bookingService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { uploadFileBuffer } = require('../services/imageUpload');

class BookingController {
  async create(req, res) {
    try {
      const bookingData = {
        userId: req.user.id,
        ...req.body
      };
      // Correctly call the user booking creation service
      const booking = await bookingService.createUserBooking(req.user.id, req.body);
      
      // Trigger Assignment/Broadcast to nearby workers
      const assignmentService = require('../services/assignmentService');
      assignmentService.assignWorkerToBooking(booking._id).catch(err => {
        console.error('[BookingController] Broadcast Error:', err);
      });

      sendSuccess(res, booking, 'Booking created successfully. Finding professionals...', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async getUserBookings(req, res) {
    try {
      const { status } = req.query;
      const bookings = await bookingService.getUserBookings(req.user.id, status);
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message, 404);
    }
  }

  async getWorkerBookings(req, res) {
    try {
      const { status } = req.query;
      const bookings = await bookingService.getWorkerBookings(req.worker._id, status);
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async getWorkerHistory(req, res) {
    try {
      const bookings = await bookingService.getWorkerHistory(req.worker._id);
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;
      const workerId = req.worker ? req.worker._id : null;
      const booking = await bookingService.getBookingById(id, userId, workerId);
      sendSuccess(res, booking);
    } catch (err) {
      sendError(res, err.message, 404);
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason, cancellationReason, otp } = req.body;
      const uploadFiles = req.files || {};
      
      const additionalUpdates = { 
        cancelReason: reason || cancellationReason 
      };

      if (uploadFiles['beforeServiceImages']) {
        console.log(`[Evidence] Attempting Cloud upload for ${uploadFiles['beforeServiceImages'].length} BEFORE images...`);
        additionalUpdates.beforeServiceImages = await Promise.all(
          uploadFiles['beforeServiceImages'].map(file => uploadFileBuffer(file, 'uploads/beforeServiceImages'))
        );
      }
      if (uploadFiles['afterServiceImages']) {
        console.log(`[Evidence] Attempting Cloud upload for ${uploadFiles['afterServiceImages'].length} AFTER images...`);
        additionalUpdates.afterServiceImages = await Promise.all(
          uploadFiles['afterServiceImages'].map(file => uploadFileBuffer(file, 'uploads/afterServiceImages'))
        );
      }

      const booking = await bookingService.updateBookingStatus(id, req.worker._id, status, null, otp, additionalUpdates);
      sendSuccess(res, booking, `Booking status updated to ${status}`);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async acceptBooking(req, res) {
    try {
      const booking = await bookingService.acceptBooking(req.params.id, req.worker._id, req.worker.name);
      sendSuccess(res, booking, 'Job accepted successfully');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const booking = await bookingService.cancelBooking(id, req.user.id, null, reason, 'user');
      sendSuccess(res, booking, 'Booking cancelled successfully');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async rebroadcast(req, res) {
    try {
      const { id } = req.params;
      const Booking = require('../models/Booking');
      
      // Clear excluded workers to give everyone a fresh chance
      await Booking.findByIdAndUpdate(id, { excludedWorkerIds: [] });

      const assignmentService = require('../services/assignmentService');
      await assignmentService.assignWorkerToBooking(id);
      
      sendSuccess(res, null, 'Searching for professionals...');
    } catch (err) {
      console.error('[BookingController] Rebroadcast Error:', err.message);
      sendError(res, err.message, 400);
    }
  }

  async workerCancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const booking = await bookingService.workerCancelBooking(id, req.worker._id, reason);
      sendSuccess(res, booking, 'Job cancelled. We are searching for a replacement.');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }
}

module.exports = new BookingController();
