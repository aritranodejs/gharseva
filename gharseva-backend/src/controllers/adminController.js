const Worker = require('../models/Worker');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { uploadFileBuffer } = require('../services/imageUpload');

class AdminController {
  async getStats(req, res) {
    try {
      const { range = 'week' } = req.query;
      let startDate;
      let groupBy;
      let format;

      const now = new Date();
      if (range === 'day') {
        startDate = new Date(new Date().setHours(0, 0, 0, 0));
        groupBy = { $hour: { $ifNull: ["$completedAt", "$updatedAt"] } };
        format = "%H:00";
      } else if (range === 'week') {
        startDate = new Date(new Date().setDate(new Date().getDate() - 7));
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$completedAt", "$updatedAt"] } } };
        format = "%Y-%m-%d";
      } else if (range === 'month') {
        startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$completedAt", "$updatedAt"] } } };
        format = "%Y-%m-%d";
      } else if (range === 'year') {
        startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        groupBy = { $month: { $ifNull: ["$completedAt", "$updatedAt"] } };
        format = "%Y-%m";
      }

      const [totalBookings, completedBookings, recentBookings, activeWorkers, usersCount] = await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'completed' }),
        Booking.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name').populate('serviceId', 'name'),
        Worker.countDocuments({ status: 'approved' }),
        User.countDocuments({ role: 'user' })
      ]);

      // Robust date match: Use completedAt primarily, fallback to updatedAt for completed jobs in range
      const dateMatch = {
        status: 'completed',
        $or: [
          { completedAt: { $gte: startDate } },
          { updatedAt: { $gte: startDate } }
        ]
      };

      const rangeBookings = await Booking.find(dateMatch);

      const totalRevenue = rangeBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const platformProfit = rangeBookings.reduce((sum, b) => sum + (b.platformFee || 0) + (b.commissionFee || 0), 0);
      const workerPayouts = rangeBookings.reduce((sum, b) => sum + (b.workerEarnings || 0), 0);

      // Grouping logic: Handle missing completedAt in aggregation
      const groupKey = range === 'day' 
        ? { $hour: { $ifNull: ["$completedAt", "$updatedAt"] } }
        : range === 'year'
        ? { $month: { $ifNull: ["$completedAt", "$updatedAt"] } }
        : { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$completedAt", "$updatedAt"] } } };
      // Advanced aggregation for trend charts
      const chartData = await Booking.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: groupBy,
            revenue: { 
              $sum: { 
                $add: [
                  { $ifNull: ["$platformFee", 0] }, 
                  { $ifNull: ["$commissionFee", 0] }
                ] 
              } 
            },
            volume: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      sendSuccess(res, {
        totalBookings,
        completedBookings,
        activeWorkers,
        usersCount,
        totalRevenue,    // Gross for period
        platformProfit,  // Net for period
        workerPayouts,
        recentBookings,
        chartData,
        selectedRange: range
      });
    } catch (err) {
      console.error('[AdminController] BI Error:', err.message);
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
      const updates = req.body;
      
      // Safety: Standard default for new system options
      if (!settings) {
        settings = new Settings(updates);
      } else {
        Object.assign(settings, updates);
      }
      await settings.save();
      sendSuccess(res, settings, 'Global configuration synchronized successfully');
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

  async deleteWorker(req, res) {
    try {
      const { id } = req.params;
      const worker = await Worker.findByIdAndDelete(id);
      if (!worker) throw new Error('Worker not found');
      sendSuccess(res, null, 'Worker account deleted successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async getUsers(req, res) {
    try {
      const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
      sendSuccess(res, users);
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      if (!user) throw new Error('Customer not found');
      // Potentially cleanup their bookings or keep them orphaned
      sendSuccess(res, null, 'Customer account deleted successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      
      if (req.file) {
        updates.profilePicture = await uploadFileBuffer(req.file, 'uploads/profilePicture');
      }

      const user = await User.findByIdAndUpdate(id, updates, { new: true });
      if (!user) throw new Error('User not found');
      sendSuccess(res, user, 'Customer profile updated successfully');
    } catch (err) {
      sendError(res, err.message);
    }
  }



  async updateWorkerStatus(req, res) {
    try {
      const { id } = req.params;
      const uploadFiles = req.files || {};
      const body = req.body;
      
      const updates = { ...body };
      
      if (body.status === 'approved') {
        updates.isActive = true;
      }

      if (uploadFiles['profilePicture']) {
        updates.profilePicture = await uploadFileBuffer(uploadFiles['profilePicture'][0], 'uploads/profilePicture');
      }
      if (uploadFiles['aadhaarImage']) {
        updates.aadhaarImage = await uploadFileBuffer(uploadFiles['aadhaarImage'][0], 'uploads/aadhaarImage');
      }
      if (uploadFiles['panImage']) {
        updates.panImage = await uploadFileBuffer(uploadFiles['panImage'][0], 'uploads/panImage');
      }
      if (uploadFiles['policeVerification']) {
        updates.policeVerification = await uploadFileBuffer(uploadFiles['policeVerification'][0], 'uploads/policeVerification');
      }
      if (uploadFiles['certification']) {
        updates.certification = await uploadFileBuffer(uploadFiles['certification'][0], 'uploads/certification');
      }

      const worker = await Worker.findByIdAndUpdate(id, updates, { new: true });
      if (!worker) throw new Error('Worker not found');

      sendSuccess(res, worker, `Professional profile updated successfully`);
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
