const Subscription = require('../models/Subscription');

class SubscriptionRepository {
  async findByUserId(userId) {
    return await Subscription.find({ userId }).populate({
      path: 'packageId',
      populate: { path: 'services' }
    });
  }

  async create(data) {
    return await Subscription.create(data);
  }

  async findById(id) {
    return await Subscription.findById(id).populate({
      path: 'packageId',
      populate: { path: 'services' }
    });
  }

  async updateStatus(id, status) {
    return await Subscription.findByIdAndUpdate(id, { status }, { new: true });
  }
}

module.exports = new SubscriptionRepository();
