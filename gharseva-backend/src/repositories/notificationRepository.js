const Notification = require('../models/Notification');

class NotificationRepository {
  async findNotifications(userId, workerId) {
    const query = userId ? { userId } : { workerId };
    return await Notification.find(query).sort({ createdAt: -1 });
  }

  async markAsRead(id, userId, workerId) {
    const query = { _id: id };
    if (userId) query.userId = userId;
    if (workerId) query.workerId = workerId;
    
    return await Notification.findOneAndUpdate(
      query,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId, workerId) {
    const query = userId ? { userId } : { workerId };
    return await Notification.updateMany(
      query,
      { isRead: true }
    );
  }

  async create(data) {
    return await Notification.create(data);
  }
}

module.exports = new NotificationRepository();
