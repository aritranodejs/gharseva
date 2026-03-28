const reviewRepository = require('../repositories/reviewRepository');
const Service = require('../models/Service');

class ReviewService {
  async getServiceReviews(serviceId) {
    return await reviewRepository.findByServiceId(serviceId);
  }

  async createReview(data) {
    const review = await reviewRepository.create(data);
    
    // Recalculate Service Rating
    const reviews = await reviewRepository.findByServiceId(data.serviceId);
    const avgRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
    
    await Service.findByIdAndUpdate(data.serviceId, {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewsCount: reviews.length
    });

    return review;
  }
}

module.exports = new ReviewService();
