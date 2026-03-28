const subscriptionRepository = require('../repositories/subscriptionRepository');

class SubscriptionService {
  async getUserSubscriptions(userId) {
    return await subscriptionRepository.findByUserId(userId);
  }

  async createSubscription(userId, data) {
    // 1. Check if user already has an active subscription for this exact package
    const activeSubs = await subscriptionRepository.findByUserId(userId);
    const existing = activeSubs.find(
      sub => sub.packageId?._id?.toString() === data.packageId && sub.status === 'active'
    );
    
    if (existing) {
      throw new Error('You already have an active rolling subscription for this package.');
    }

    const subscription = await subscriptionRepository.create({
      userId,
      ...data,
      status: 'active',
      startDate: new Date()
    });

    // Auto-generate the first booking for this subscription
    await this.generateBookingFromSubscription(subscription);
    return subscription;
  }

  async generateBookingFromSubscription(subscription) {
    const bookingRepository = require('../repositories/bookingRepository');
    const assignmentService = require('./assignmentService');
    const Package = require('../models/Package');

    // Fetch package details to get serviceId
    const pkg = await Package.findById(subscription.packageId);
    if (!pkg) return;

    const booking = await bookingRepository.create({
      userId: subscription.userId,
      serviceId: pkg.services[0], // Use first service in package
      address: subscription.address,
      pincode: subscription.pincode,
      schedule: subscription.nextVisitDate || new Date(),
      price: 0, // Subscription visits are pre-paid
      status: 'pending',
      subscriptionId: subscription._id
    });

    // Trigger assignment
    assignmentService.assignWorkerToBooking(booking._id).catch(console.error);
    return booking;
  }

  async updateSubscriptionStatus(subscriptionId, status) {
    return await subscriptionRepository.updateStatus(subscriptionId, status);
  }
}

module.exports = new SubscriptionService();
