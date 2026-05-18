const express = require('express');
const { v4: uuid } = require('uuid');
const User = require('../models/User');
const Role = require('../models/Role');
const Category = require('../models/Category');
const Resource = require('../models/Resource');
const Ticket = require('../models/Ticket');
const { requireAuth, requireOwner } = require('../middleware/auth');
const { sendEmail } = require('../services/email');

const router = express.Router();

router.get('/', async (req, res) => {
  const [resources, users, tickets] = await Promise.all([
    Resource.find().sort({ createdAt: -1 }).limit(6).populate('author'),
    User.countDocuments(),
    Ticket.countDocuments()
  ]);
  const totalDownloads = resources.reduce((acc, r) => acc + r.downloads, 0);
  res.render('home', { resources, stats: { users, resources: resources.length, tickets, downloads: totalDownloads } });
});

router.get('/recursos', async (req, res) => {
  const resources = await Resource.find().sort({ createdAt: -1 }).populate('author');
  res.render('resources', { resources });
});

router.get('/recursos/nuevo', requireAuth, async (req, res) => {
  const categories = await Category.find().sort({ order: 1 });
  res.render('new-resource', { categories });
});

router.post('/recursos', requireAuth, async (req, res) => {
  await Resource.create({ ...req.body, author: req.session.userId });
  return res.redirect('/recursos');
});

router.post('/recursos/:id/download', async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  resource.downloads += 1;
  await resource.save();
  return res.redirect(resource.links?.download || resource.fileUrl);
});

router.get('/tickets', requireAuth, async (req, res) => {
  const tickets = await Ticket.find({ authorId: req.session.userId }).sort({ createdAt: -1 });
  res.render('tickets', { tickets });
});

router.post('/tickets', requireAuth, async (req, res) => {
  await Ticket.create({ title: req.body.title, description: req.body.description, priority: req.body.priority, authorId: req.session.userId });
  res.redirect('/tickets');
});

router.get('/login', (_, res) => res.render('login'));
router.get('/registro', (_, res) => res.render('register'));

router.post('/registro', async (req, res) => {
  const user = await User.create(req.body);
  req.session.userId = user._id;
  await sendEmail(user.email, 'Bienvenido a LasCoTorras.com', 'Cuenta creada correctamente.');
  res.redirect('/');
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ $or: [{ email: req.body.identifier }, { username: req.body.identifier }] });
  if (!user || !(await user.comparePassword(req.body.password))) return res.redirect('/login');
  if (user.isSuspended) return res.redirect('/suspended');
  req.session.userId = user._id;
  res.redirect('/');
});

router.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
router.get('/suspended', (_, res) => res.render('suspended'));

router.get('/panel', requireAuth, requireOwner, async (req, res) => {
  const [users, roles, resources, tickets] = await Promise.all([User.find(), Role.find(), Resource.find(), Ticket.find()]);
  res.render('panel', { users, roles, resources, tickets });
});

router.post('/panel/roles', requireAuth, requireOwner, async (req, res) => {
  await Role.create({ id: req.body.id || uuid().slice(0, 8), name: req.body.name, color: req.body.color });
  res.redirect('/panel');
});

module.exports = router;
