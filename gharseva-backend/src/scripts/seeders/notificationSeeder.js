const Notification = require('../../models/Notification');
const User = require('../../models/User');

const seedNotifications = async () => {
  const firstUser = await User.findOne();
  if (firstUser) {
    await Notification.deleteMany({ userId: firstUser._id });
    await Notification.create([
      { userId: firstUser._id, title: 'Welcome to GharSeva!', message: 'Thank you for joining our platform. Book your first service today!', type: 'system' },
      { userId: firstUser._id, title: 'Check out Home Cleaning', message: 'Professional deep cleaning now available at 20% off.', type: 'promo' }
    ]);
  }
};

module.exports = seedNotifications;
