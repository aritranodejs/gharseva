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

  async createNotification(data) {
    const notification = await notificationRepository.create(data);
    
    // Emit socket event for real-time UI updates and sounds
    if (global.io) {
      const recipientRoom = data.userId ? `user_${data.userId}` : `worker_${data.workerId}`;
      global.io.to(recipientRoom).emit('new_notification', notification);
    }
    
    return notification;
  }
}

module.exports = new NotificationService();
