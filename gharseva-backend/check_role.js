const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const check = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ phoneNumber: '9999999999' });
  if (user) {
    console.log(`User: ${user.name}, Role: ${user.role}`);
    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log('Role updated to admin');
    }
  } else {
    console.log('User 9999999999 not found');
  }
  process.exit();
};

check();
