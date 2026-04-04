const adminService = require('../services/adminService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class AdminController {
  async getStats(req, res) {
    try {
      const { range = 'week', specificYear } = req.query;
      const data = await adminService.getDashboardStats(range, specificYear);
      sendSuccess(res, { ...data, selectedRange: range, selectedYear: specificYear });
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getSettings(req, res) {
    try {
      const settings = await adminService.getSettings();
      sendSuccess(res, settings);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async updateSettings(req, res) {
    try {
      const settings = await adminService.updateSettings(req.body);
      sendSuccess(res, settings, 'Global configuration synchronized successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async exportTransactions(req, res) {
    try {
      const bookings = await adminService.exportTransactions();
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getAllBookings(req, res) {
    try {
      const { status, pincode, specificYear } = req.query;
      const bookings = await adminService.getAllBookings(status, pincode, specificYear);
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getWorkers(req, res) {
    try {
      const { status } = req.query;
      const workers = await adminService.getWorkers(status);
      sendSuccess(res, workers);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async deleteWorker(req, res) {
    try {
      await adminService.deleteWorker(req.params.id);
      sendSuccess(res, null, 'Worker account deleted successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getUsers(req, res) {
    try {
      const users = await adminService.getUsers();
      sendSuccess(res, users);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async deleteUser(req, res) {
    try {
      await adminService.deleteUser(req.params.id);
      sendSuccess(res, null, 'Customer account deleted successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async updateUser(req, res) {
    try {
      const user = await adminService.updateUser(req.params.id, req.body, req.file);
      sendSuccess(res, user, 'Customer profile updated successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async updateWorkerStatus(req, res) {
    try {
      const worker = await adminService.updateWorkerStatus(req.params.id, req.body, req.files || {});
      sendSuccess(res, worker, `Professional profile updated successfully`);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async assignWorker(req, res) {
    try {
      const { bookingId, workerId } = req.body;
      const booking = await adminService.assignWorker(bookingId, workerId);
      sendSuccess(res, booking, 'Worker assigned successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }
}

module.exports = new AdminController();
