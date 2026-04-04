const Worker = require('../models/Worker');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { uploadFileBuffer } = require('../services/imageUpload');

class AdminController {
  async getStats(req, res) {
    try {
      const [userCount, workerCount, bookingCount] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        Worker.countDocuments(),
        Booking.countDocuments()
      ]);

      const stats = {
        users: userCount,
        workers: workerCount,
        bookings: bookingCount,
        recentBookings: await Booking.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name').populate('serviceId', 'name')
      };

      sendSuccess(res, stats);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getSettings(req, res) {
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({});
      }
      sendSuccess(res, settings);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async updateSettings(req, res) {
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings(req.body);
      } else {
        Object.assign(settings, req.body);
      }
      await settings.save();
      sendSuccess(res, settings, 'Settings updated successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async exportTransactions(req, res) {
    try {
      // Basic implementation for now: return all completed bookings
      const bookings = await Booking.find({ status: 'completed' })
        .populate('userId', 'name')
        .populate('assignedWorkerId', 'name')
        .populate('serviceId', 'name');
      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getAllBookings(req, res) {
    try {
      const { status, pincode } = req.query;
      const query = {};
      if (status) query.status = status;
      if (pincode) query.pincode = pincode;

      const bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .populate('userId', 'name phoneNumber')
        .populate('assignedWorkerId', 'name phoneNumber')
        .populate('serviceId', 'name');

      sendSuccess(res, bookings);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getWorkers(req, res) {
    try {
      const { status } = req.query;
      const query = status ? { status } : {};
      const workers = await Worker.find(query).sort({ createdAt: -1 }).populate('categories');
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
      
      if (status === 'approved') {
        updates.isActive = true;
      }

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

      const worker = await Worker.findByIdAndUpdate(id, updates, { new: true });
      if (!worker) throw new Error('Worker not found');

      sendSuccess(res, worker, `Worker status updated to ${status}`);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async assignWorker(req, res) {
    try {
      const { bookingId, workerId } = req.body;
      const booking = await Booking.findById(bookingId);
      if (!booking) throw new Error('Booking not found');

      booking.assignedWorkerId = workerId;
      booking.status = 'confirmed';
      await booking.save();

      sendSuccess(res, booking, 'Worker assigned successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }
}

module.exports = new AdminController();
