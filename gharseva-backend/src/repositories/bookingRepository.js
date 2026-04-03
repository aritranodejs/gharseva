const Booking = require('../models/Booking');

class BookingRepository {
  async create(data) {
    const booking = new Booking(data);
    return await booking.save();
  }

  async findByUser(userId) {
    return await Booking.find({ userId })
      .populate('serviceId', 'name icon')
      .populate('assignedWorkerId', 'name profilePicture rating phoneNumber')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Booking.findById(id)
      .populate('serviceId')
      .populate('userId', 'name profilePicture phoneNumber')
      .populate('assignedWorkerId', 'name profilePicture rating phoneNumber');
  }

  async findByWorkerAndStatus(workerId, statuses) {
    return await Booking.find({
      assignedWorkerId: workerId,
      status: { $in: statuses }
    }).populate('serviceId', 'name icon categoryId')
      .populate('userId', 'name profilePicture phoneNumber')
      .sort({ createdAt: -1 });
  }

  async updateStatus(id, status, workerId, additionalUpdates = {}) {
    // Standard update: requires workerId match for security
    const update = { status, ...additionalUpdates };
    return await Booking.findOneAndUpdate(
      { _id: id, assignedWorkerId: workerId },
      update,
      { new: true }
    );
  }

  async updateInternalStatus(id, status, workerId = null) {
    // Internal update: used by AssignmentService to set initial worker
    const update = { status };
    if (workerId) update.assignedWorkerId = workerId;
    return await Booking.findByIdAndUpdate(id, update, { new: true });
  }

  async findByIdAndQuery(id, query) {
    // Find a booking by ID that also matches additional query conditions
    // Used for secure cancellation to verify ownership
    return await Booking.findOne({ _id: id, ...query })
      .populate('serviceId', 'name icon')
      .populate('userId', 'name profilePicture phoneNumber')
      .populate('assignedWorkerId', 'name profilePicture rating phoneNumber');
  }

  async countWorkerCompletedJobsToday(workerId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await Booking.countDocuments({
      assignedWorkerId: workerId,
      status: 'completed',
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });
  }
}

module.exports = new BookingRepository();
