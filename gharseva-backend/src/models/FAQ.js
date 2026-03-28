const mongoose = require('mongoose');

const faqSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String, // e.g., 'Booking', 'Payments', 'Services'
      default: 'General',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FAQ', faqSchema);
