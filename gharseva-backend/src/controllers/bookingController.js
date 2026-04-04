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
      const booking = await bookingService.createBooking(bookingData);
      sendSuccess(res, booking, 'Booking created successfully', 201);
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

  async getDetails(req, res) {
    try {
      const booking = await bookingService.getBookingDetails(req.params.id);
      sendSuccess(res, booking);
    } catch (err) {
      sendError(res, err.message, 404);
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, cancellationReason } = req.body;
      const uploadFiles = req.files || {};
      
      const updateData = { status, cancellationReason };

      // Handle service verification images (before/after)
      if (uploadFiles['beforeServiceImage']) {
        updateData.beforeServiceImage = await uploadFileBuffer(uploadFiles['beforeServiceImage'][0], '/uploads/beforeServiceImages');
      }
      if (uploadFiles['afterServiceImage']) {
        updateData.afterServiceImage = await uploadFileBuffer(uploadFiles['afterServiceImage'][0], '/uploads/afterServiceImages');
      }

      const booking = await bookingService.updateBookingStatus(id, updateData);
      sendSuccess(res, booking, `Booking status updated to ${status}`);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async acceptJob(req, res) {
    try {
      const booking = await bookingService.acceptBooking(req.params.id, req.worker._id);
      sendSuccess(res, booking, 'Job accepted successfully');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async cancelJob(req, res) {
    try {
      const { reason } = req.body;
      const booking = await bookingService.updateBookingStatus(req.params.id, { 
        status: 'cancelled', 
        cancellationReason: reason 
      });
      sendSuccess(res, booking, 'Job cancelled');
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }
}

module.exports = new BookingController();
