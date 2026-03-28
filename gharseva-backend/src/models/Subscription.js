const mongoose = require('mongoose');

// A Subscription tracks a user's active package plan
const subscriptionSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },

    // Chosen tier
    frequency: { type: Number, required: true },      // visits per week: 2, 4, 7
    tierLabel: { type: String },                      // "2x / week"
    monthlyPrice: { type: Number, required: true },   // e.g. 1499

    // Service address
    address: { type: String, required: true },
    pincode: { type: String, required: true },

    // Subscription lifecycle
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active',
    },
    startDate: { type: Date, default: Date.now },
    nextVisitDate: { type: Date },

    // Track how many visits have been used this month
    visitsUsedThisMonth: { type: Number, default: 0 },
    totalVisitsCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
