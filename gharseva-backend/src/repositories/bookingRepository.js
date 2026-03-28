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
      .populate('assignedWorkerId', 'name profilePicture rating phoneNumber');
  }

  async findByWorkerAndStatus(workerId, statuses) {
    return await Booking.find({
      assignedWorkerId: workerId,
      status: { $in: statuses }
    }).populate('serviceId', 'name icon categoryId');
  }

  async updateStatus(id, status, workerId) {
    // Standard update: requires workerId match for security
    return await Booking.findOneAndUpdate(
      { _id: id, assignedWorkerId: workerId },
      { status },
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
    return await Booking.findOne({ _id: id, ...query });
  }
}

module.exports = new BookingRepository();
