require('dotenv').config();
const connectDB = require('./config/db');
const Role = require('./models/Role');
const Category = require('./models/Category');

(async () => {
  await connectDB(process.env.MONGODB_URI);
  await Role.deleteMany({});
  await Category.deleteMany({});
  await Role.insertMany([
    { id: 'owner', name: 'Owner', color: '#ff6b6b', permissions: { canUploadResources: true, canModerate: true, canManageRoles: true, canEditSettings: true, canManageUsers: true, canAccessPanel: true } },
    { id: 'staff', name: 'Staff', color: '#4ecdc4', permissions: { canUploadResources: true, canModerate: true, canManageUsers: true, canAccessPanel: true } },
    { id: 'moderator', name: 'Moderador', color: '#95e1d3', permissions: { canUploadResources: true, canModerate: true, canAccessPanel: true } },
    { id: 'user', name: 'Usuario', color: '#a0aec0', permissions: { canUploadResources: true } }
  ]);
  await Category.insertMany([
    { id: 'plugins', name: 'Plugins', order: 1 },
    { id: 'mods', name: 'Mods', order: 2 },
    { id: 'configs', name: 'Configuraciones', order: 3 },
    { id: 'skripts', name: 'Skripts', order: 4 }
  ]);
  console.log('Seed completado');
  process.exit(0);
})();
