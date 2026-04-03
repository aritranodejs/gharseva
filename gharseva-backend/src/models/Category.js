const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String }, // emoji or name
    color: { type: String, default: '#EEF2FF' },
    isPremium: { type: Boolean, default: false },
    isLuxury: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    serviceCount: { type: Number, default: 0 }, // Virtual field from aggregation
    image: { type: String }, // URL or Base64
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);
