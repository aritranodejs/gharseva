const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
  {
    isPremiumEnabled: {
      type: Boolean,
      default: false,
    },
    isLuxuryEnabled: {
      type: Boolean,
      default: false,
    },
    platformFeeType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed',
    },
    platformFeeValue: {
      type: Number,
      default: 29,
    },
    workerCommissionPercentage: {
      type: Number,
      default: 10,
    },
    minJobsForCommission: {
      type: Number,
      default: 10,
    },
    acceptCOD: {
      type: Boolean,
      default: true,
    },
    acceptUPI: {
      type: Boolean,
      default: true,
    },
    acceptCard: {
      type: Boolean,
      default: true,
    },
    acceptBank: {
      type: Boolean,
      default: true,
    },
    razorpayEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
