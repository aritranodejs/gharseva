const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    bookingId: { type: String, unique: true }, // Custom Branded ID: GS-XXXXXXXXXXXX
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
    platformFee: { type: Number, default: 0 },   // Added for Revenue Model (Paid by User)
    commissionFee: { type: Number, default: 0 }, // Added for Revenue Model (Cut from Worker)
    workerEarnings: { type: Number, default: 0 }, // Net for Worker
    commissionApplied: { type: Number, default: 0 }, // % used for this job
    totalAmount: { type: Number, default: 0 },    // Base price + platform fee
    paymentMethod: { type: String, enum: ['upi', 'cash', 'card', 'online', 'bank'], default: 'cash' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    upiId: { type: String },
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ['user', 'worker'] },
    acceptedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    beforeServiceImages: [{ type: String }],
    afterServiceImages: [{ type: String }],
    excludedWorkerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
    completionOtp: { type: String, default: () => Math.floor(1000 + Math.random() * 9000).toString() }
  },
  {
    timestamps: true,
  }
);

// Auto-generate a unique branded Booking ID before saving
bookingSchema.pre('save', async function () {
  if (!this.bookingId) {
    const random = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random
    const suffix = this._id.toString().slice(-4).toUpperCase();
    this.bookingId = `GS-${random}${suffix}`;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
