const mongoose = require('mongoose');

const serviceableAreaSchema = new mongoose.Schema(
  {
    cityName: { type: String, required: true },
    pincodes: [
      {
        pincode: { type: String, required: true },
        name: { type: String, required: true }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceableArea', serviceableAreaSchema);
