const Worker = require('../models/Worker');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');

class AdminRepository {
  async countBookings(query = {}) {
    return await Booking.countDocuments(query);
  }

  async countWorkers(query = {}) {
    return await Worker.countDocuments(query);
  }

  async countUsers(query = {}) {
    return await User.countDocuments(query);
  }

  async getRecentBookings(limit = 5) {
    return await Booking.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .populate('serviceId', 'name');
  }

  async findBookings(query, populateFields = []) {
    let q = Booking.find(query);
    populateFields.forEach(field => {
      q = q.populate(field.path, field.select);
    });
    return await q.exec();
  }

  async aggregateBookings(pipeline) {
    return await Booking.aggregate(pipeline);
  }

  async getSettings() {
    return await Settings.findOne();
  }

  async createSettings(data) {
    return await Settings.create(data);
  }

  async updateSettings(updates) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updates);
    } else {
      Object.assign(settings, updates);
    }
    return await settings.save();
  }

  async getAllBookingsSorted(query) {
    return await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name phoneNumber')
      .populate('assignedWorkerId', 'name phoneNumber')
      .populate('serviceId', 'name');
  }

  async getWorkersSorted(query) {
    return await Worker.find(query).sort({ createdAt: -1 }).populate('categories');
  }

  async deleteWorker(id) {
    return await Worker.findByIdAndDelete(id);
  }

  async getUsersSorted(query) {
    return await User.find(query).sort({ createdAt: -1 });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  async updateUser(id, updates) {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async updateWorker(id, updates) {
    return await Worker.findByIdAndUpdate(id, updates, { new: true });
  }

  async assignWorkerToBooking(bookingId, workerId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return null;
    booking.assignedWorkerId = workerId;
    booking.status = 'confirmed';
    return await booking.save();
  }
}

module.exports = new AdminRepository();
