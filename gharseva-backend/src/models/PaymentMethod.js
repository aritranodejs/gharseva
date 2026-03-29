const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['card', 'upi'], required: true },
    brand: { type: String }, // e.g., "Visa", "Google Pay"
    last4: { type: String }, // e.g., "4242"
    identifier: { type: String, required: true }, // Encrypted (UPI ID or Card Token)
    hashedIdentifier: { type: String, required: true, index: true }, // Non-reversible hash for lookups
    expiryInfo: { type: String }, // For cards
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
