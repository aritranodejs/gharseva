const bookingService = require('../services/bookingService');
const assignmentService = require('../services/assignmentService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class BookingController {
  async getWorkerBookings(req, res) {
    try {
      const bookings = await bookingService.getWorkerBookings(req.worker._id);
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, 'Error fetching bookings');
    }
  }

  async getWorkerHistory(req, res) {
    try {
      const history = await bookingService.getWorkerHistory(req.worker._id);
      sendSuccess(res, history);
    } catch (err) {
      sendError(res, 'Error fetching worker history');
    }
  }

  async acceptBooking(req, res) {
    try {
      const booking = await bookingService.acceptBooking(
        req.params.id, 
        req.worker._id, 
        req.worker.name
      );
      sendSuccess(res, booking, 'Job accepted. Booking confirmed!');
    } catch (err) {
      sendError(res, err.message, 409);
    }
  }

  async updateStatus(req, res) {
    const { status, otp } = req.body;
    const uploadFiles = req.files || {};
    try {
      const additionalUpdates = {};
      if (uploadFiles['beforeServiceImages']) {
        additionalUpdates.beforeServiceImages = uploadFiles['beforeServiceImages'].map(f => `/uploads/${f.filename}`);
      }
      if (uploadFiles['afterServiceImages']) {
        additionalUpdates.afterServiceImages = uploadFiles['afterServiceImages'].map(f => `/uploads/${f.filename}`);
      }

      const booking = await bookingService.updateBookingStatus(
        req.params.id, 
        req.worker._id, 
        status,
        null,
        otp,
        additionalUpdates
      );
      sendSuccess(res, booking, `Booking updated to ${status}`);
    } catch (err) {
      sendError(res, err.message, err.message.includes('OTP') ? 400 : 500);
    }
  }

  async create(req, res) {
    try {
      const booking = await bookingService.createUserBooking(req.user.id, req.body);
      assignmentService.assignWorkerToBooking(booking._id).catch(console.error);
      
      sendSuccess(res, booking, 'Booking created', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async getUserBookings(req, res) {
    try {
      const bookings = await bookingService.getUserBookings(req.user.id);
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async getById(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const workerId = req.worker ? req.worker._id : null;
      
      const booking = await bookingService.getBookingById(req.params.id, userId, workerId);
      sendSuccess(res, booking);
    } catch (err) {
      sendError(res, err.message, 404);
    }
  }

  async cancel(req, res) {
    const { reason } = req.body;
    try {
      // Determine if requester is user or worker
      const userId = req.user?.id;
      const workerId = req.worker?._id;
      const cancelledBy = userId ? 'user' : 'worker';

      const booking = await bookingService.cancelBooking(
        req.params.id, 
        userId, 
        workerId, 
        reason, 
        cancelledBy
      );
      sendSuccess(res, booking, 'Booking cancelled successfully');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async rebroadcast(req, res) {
    try {
      const { id } = req.params;
      
      // Verification: only the user who created it can rebroadcast
      const booking = await bookingService.getBookingById(id, req.user.id);
      
      if (!['searching_worker', 'pending', 'pending_acceptance'].includes(booking.status)) {
        return sendError(res, 'Cannot re-broadcast a job that is already accepted or completed.', 400);
      }

      // Trigger re-assignment
      assignmentService.assignWorkerToBooking(id).catch(err => console.error('[Rebroadcast Error]', err));
      
      sendSuccess(res, null, 'Re-broadcasted to nearby professionals.');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async workerCancel(req, res) {
    const { reason } = req.body;
    try {
      const booking = await bookingService.workerCancelBooking(
        req.params.id,
        req.worker._id,
        reason
      );
      sendSuccess(res, booking, 'Job cancelled. Re-searching for a professional.');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }
}

module.exports = new BookingController();
