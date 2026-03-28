const subscriptionService = require('../services/subscriptionService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class SubscriptionController {
  async getSubscriptions(req, res) {
    try {
      const subscriptions = await subscriptionService.getUserSubscriptions(req.user.id);
      sendSuccess(res, subscriptions);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async subscribe(req, res) {
    try {
      const subscription = await subscriptionService.createSubscription(req.user.id, req.body);
      sendSuccess(res, subscription, 'Subscription activated successfully', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async updateStatus(req, res) {
    try {
      const subscription = await subscriptionService.updateSubscriptionStatus(req.params.id, req.body.status);
      if (!subscription) return sendError(res, 'Subscription not found', 404);
      sendSuccess(res, subscription, `Subscription ${req.body.status} successfully`);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }
}

module.exports = new SubscriptionController();
