const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  avatar: String,
  discordId: { type: String, unique: true, sparse: true },
  role: { type: String, default: 'user' },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: String,
  suspensionDate: Date,
  suspensionDuration: Number,
  suspendedBy: String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(raw) {
  return bcrypt.compare(raw, this.password);
};

module.exports = mongoose.model('User', userSchema);
