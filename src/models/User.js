const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpiresAt: { type: Date, default: null },
    verificationResendCount: { type: Number, default: 0 },
    lastVerificationSentAt: { type: Date, default: null },
    role: {
      type: String,
      enum: ['user', 'owner', 'admin'],
      default: 'user'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
