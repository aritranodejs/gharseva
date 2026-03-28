const Review = require('../models/Review');

class ReviewRepository {
  async findByServiceId(serviceId) {
    return await Review.find({ serviceId }).populate('userId', 'name').sort({ createdAt: -1 });
  }

  async create(data) {
    return await Review.create(data);
  }
}

module.exports = new ReviewRepository();
