const mongoose = require('mongoose');

const serviceableAreaSchema = new mongoose.Schema(
  {
    cityName: { type: String, required: true },
    pincodes: { type: [String], required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceableArea', serviceableAreaSchema);
