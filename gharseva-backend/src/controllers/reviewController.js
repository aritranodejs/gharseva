const reviewService = require('../services/reviewService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class ReviewController {
  async getReviews(req, res) {
    try {
      const reviews = await reviewService.getServiceReviews(req.params.serviceId);
      sendSuccess(res, reviews);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  }

  async createReview(req, res) {
    try {
      const review = await reviewService.createReview({
        ...req.body,
        userId: req.user.id
      });
      sendSuccess(res, review, 'Review submitted successfully', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }
}

module.exports = new ReviewController();
