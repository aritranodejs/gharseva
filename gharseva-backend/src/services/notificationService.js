const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async getNotifications(userId, workerId) {
    return await notificationRepository.findNotifications(userId, workerId);
  }

  async readNotification(id, userId, workerId) {
    return await notificationRepository.markAsRead(id, userId, workerId);
  }

  async readAllNotifications(userId, workerId) {
    return await notificationRepository.markAllAsRead(userId, workerId);
  }
}

module.exports = new NotificationService();
