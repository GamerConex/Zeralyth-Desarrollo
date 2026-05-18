require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const morgan = require('morgan');
const connectDB = require('./config/db');
const User = require('./models/User');
const webRoutes = require('./routes/web');
const Role = require('./models/Role');
const Category = require('./models/Category');

const app = express();

async function bootstrap() {
  await connectDB(process.env.MONGODB_URI);

  const rolesCount = await Role.countDocuments();
  if (rolesCount === 0) {
    await Role.insertMany([
      { id: 'owner', name: 'Owner', color: '#ff6b6b', permissions: { canUploadResources: true, canModerate: true, canManageRoles: true, canEditSettings: true, canManageUsers: true, canAccessPanel: true } },
      { id: 'staff', name: 'Staff', color: '#4ecdc4', permissions: { canUploadResources: true, canModerate: true, canManageUsers: true, canAccessPanel: true } },
      { id: 'moderator', name: 'Moderador', color: '#95e1d3', permissions: { canUploadResources: true, canModerate: true, canAccessPanel: true } },
      { id: 'user', name: 'Usuario', color: '#a0aec0', permissions: { canUploadResources: true } }
    ]);
  }

  const categoriesCount = await Category.countDocuments();
  if (categoriesCount === 0) {
    await Category.insertMany([
      { id: 'plugins', name: 'Plugins', order: 1 },
      { id: 'mods', name: 'Mods', order: 2 },
      { id: 'configs', name: 'Configuraciones', order: 3 },
      { id: 'skripts', name: 'Skripts', order: 4 }
    ]);
  }

  app.listen(process.env.PORT || 3000, () => console.log('🚀 http://localhost:' + (process.env.PORT || 3000)));
}

app.set('view engine', 'ejs');
app.set('views', `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(session({ secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: false }));

app.use(async (req, res, next) => {
  req.currentUser = req.session.userId ? await User.findById(req.session.userId) : null;
  res.locals.currentUser = req.currentUser;
  next();
});

app.use(webRoutes);

app.use((_, res) => res.status(404).send('404 - Página no encontrada'));

bootstrap();
