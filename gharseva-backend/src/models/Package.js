const mongoose = require('mongoose');

// A Package is a bundle of services (e.g., Cleaning + Dishwashing + Laundry)
const packageSchema = mongoose.Schema(
  {
    name: { type: String, required: true },           // "Household Package"
    description: { type: String },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    icon: { type: String, default: '📦' },

    // Pricing tiers
    perVisitPrice: { type: Number, required: true },  // e.g. 499
    subscriptionTiers: [
      {
        label: { type: String },                      // "2x/week", "4x/week", "Daily"
        frequency: { type: Number },                  // visits per week: 2, 4, 7
        monthlyPrice: { type: Number },               // 1499, 2499, 3999
      }
    ],
    isPremium: { type: Boolean, default: false },
    perks: [{ type: String }],                        // ["VIP Support", "Priority Pro"]
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
