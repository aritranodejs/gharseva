const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user?.id;
      const workerId = req.worker?._id;
      
      const notifications = await notificationService.getNotifications(userId, workerId);
      sendSuccess(res, notifications);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async markRead(req, res) {
    try {
      const notification = await notificationService.readNotification(req.params.id, req.user?.id, req.worker?._id);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async markAllRead(req, res) {
    try {
      await notificationService.readAllNotifications(req.user?.id, req.worker?._id);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }
}

module.exports = new NotificationController();
