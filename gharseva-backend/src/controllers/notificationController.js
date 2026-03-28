const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      sendSuccess(res, notifications);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async markRead(req, res) {
    try {
      const notification = await notificationService.readNotification(req.params.id, req.user.id);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }
}

module.exports = new NotificationController();
