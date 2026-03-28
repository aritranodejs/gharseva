const Notification = require('../models/Notification');

class NotificationRepository {
  async findByUserId(userId) {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  }

  async markAsRead(id, userId) {
    return await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
  }
}

module.exports = new NotificationRepository();
