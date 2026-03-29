const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false }, // Goes online/offline from Worker App
    pincodes: { type: [String], required: true }, // Serviceable areas (fallback)
    skills: { type: [String], required: true }, // e.g., ['cleaning', 'electrician']
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    documents: [{ type: String }], // Keeping for legacy/generic docs
    aadhaarNumber: { type: String },
    aadhaarImage: { type: String },
    panNumber: { type: String },
    panImage: { type: String },
    policeVerification: { type: String },
    certification: { type: String },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    profilePicture: { type: String, default: '' },
    activeBookingsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    totalEarnings: { type: Number, default: 0 },
    isTrustVerified: { type: Boolean, default: false },
    pushToken: { type: String, default: '' }, // Expo push token for notifications
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    }
  },
  { timestamps: true }
);

// 2dsphere index for $near geo queries
workerSchema.index({ location: '2dsphere' });

// Hash password on save
workerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

workerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Worker', workerSchema);
