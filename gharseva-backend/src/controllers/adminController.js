const adminService = require('../services/adminService');
const workerService = require('../services/workerService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { uploadFileBuffer } = require('../services/imageUpload');

class AdminController {
  async getDashboardStats(req, res) {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getAllWorkers(req, res) {
    try {
      const { status } = req.query;
      const workers = await adminService.getAllWorkers(status);
      sendSuccess(res, workers);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async updateWorkerStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const uploadFiles = req.files || {};
      
      const updates = { status };
      
      // Update and standardize document paths if provided during verification
      if (uploadFiles['aadhaarImage']) {
        updates.aadhaarImage = await uploadFileBuffer(uploadFiles['aadhaarImage'][0], '/uploads/aadhaarImage');
      }
      if (uploadFiles['panImage']) {
        updates.panImage = await uploadFileBuffer(uploadFiles['panImage'][0], '/uploads/panImage');
      }
      if (uploadFiles['policeVerification']) {
        updates.policeVerification = await uploadFileBuffer(uploadFiles['policeVerification'][0], '/uploads/policeVerification');
      }
      if (uploadFiles['certification']) {
        updates.certification = await uploadFileBuffer(uploadFiles['certification'][0], '/uploads/certification');
      }

      const worker = await adminService.updateWorkerStatus(id, updates);
      sendSuccess(res, worker, `Worker status updated to ${status}`);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await adminService.getAllUsers();
      sendSuccess(res, users);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getAdminBookings(req, res) {
    try {
      const { status, pincode } = req.query;
      const bookings = await adminService.getAllBookings(status, pincode);
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async assignWorker(req, res) {
    try {
      const { bookingId, workerId } = req.body;
      const booking = await adminService.manuallyAssignWorker(bookingId, workerId);
      sendSuccess(res, booking, 'Worker assigned successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }
}

module.exports = new AdminController();
