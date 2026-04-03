const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    addresses: [
      {
        label: String, // e.g., 'Home', 'Office'
        street: String,
        city: String,
        pinCode: String,
        lat: Number,
        lng: Number,
        isDefault: { type: Boolean, default: false },
      },
    ],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
