const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#a0aec0' },
  permissions: {
    canUploadResources: { type: Boolean, default: true },
    canModerate: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false },
    canEditSettings: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canAccessPanel: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
