const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    schedule: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'searching_worker', 'pending_acceptance', 'confirmed', 'in_progress', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    price: { type: Number, required: true },
    assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    platformFee: { type: Number, default: 0 },   // Added for Revenue Model
    workerEarnings: { type: Number, default: 0 }, // Added for Revenue Model
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ['user', 'worker'] },
    completionOtp: { type: String, default: () => Math.floor(1000 + Math.random() * 9000).toString() }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
