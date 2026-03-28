const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async getUserNotifications(userId) {
    return await notificationRepository.findByUserId(userId);
  }

  async readNotification(id, userId) {
    return await notificationRepository.markAsRead(id, userId);
  }
}

module.exports = new NotificationService();
