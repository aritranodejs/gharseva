const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    priceType: { type: String, enum: ['fixed', 'hourly', 'visit'], default: 'fixed' },
    basePrice: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g., '1 hr'
    isActive: { type: Boolean, default: true },
    icon: { type: String }, // e.g., emoji symbol
    image: { type: String, required: true },
    description: { type: String },
    included: { type: [String] }, // List of what's provided
    availablePincodes: { type: [String] }, // Pincodes where this service is available
    checklist: { type: [String] },
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 0 },
    isTrustService: { type: Boolean, default: false },
    isSkilledService: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
