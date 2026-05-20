const express = require('express');
const { v4: uuid } = require('uuid');
const User = require('../models/User');
const Role = require('../models/Role');
const Category = require('../models/Category');
const Resource = require('../models/Resource');
const Ticket = require('../models/Ticket');
const { requireAuth, requireOwner } = require('../middleware/auth');
const { sendEmail } = require('../services/email');
const env = require('../config/env');

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

router.get('/foro', async (req, res) => {
  const stats = { threads: 23451, replies: 156891, members: await User.countDocuments(), online: 342 };
  const sections = [
    { name: 'Optimización y Rendimiento', color: 'blue', items:[{title:'Optimización y Rendimiento', desc:'Mejora el TPS y rendimiento de tu servidor', posts:987}]},
    { name: 'Desarrollo', color: 'purple', items:[{title:'Desarrollo de Plugins', desc:'Programación en Java para Spigot/Paper', posts:1243},{title:'Skripts', desc:'Scripting con Skript y addons', posts:891}]},
    { name: 'Comunidad', color: 'orange', items:[{title:'Presentaciones', desc:'Preséntate a la comunidad', posts:3421},{title:'Servidores', desc:'Publicita tu servidor Minecraft', posts:2187},{title:'Noticias y Anuncios', desc:'Novedades de la plataforma y Minecraft', posts:456}]}
  ];
  res.render('foro', { stats, sections });
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


router.get('/auth/discord', (req, res) => {
  if (!env.discord.enabled) return res.status(503).send('Discord OAuth deshabilitado');
  const state = uuid();
  req.session.discordState = state;
  const params = new URLSearchParams({
    client_id: env.discord.clientId,
    redirect_uri: env.discord.redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state
  });
  return res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get('/auth/discord/callback', async (req, res) => {
  if (!env.discord.enabled) return res.redirect('/login');
  if (!req.query.code || !req.query.state || req.query.state !== req.session.discordState) return res.redirect('/login');

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.discord.clientId,
      client_secret: env.discord.clientSecret,
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: env.discord.redirectUri
    })
  });
  if (!tokenRes.ok) return res.redirect('/login');
  const tokenData = await tokenRes.json();

  const meRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  if (!meRes.ok) return res.redirect('/login');
  const me = await meRes.json();

  let user = await User.findOne({ discordId: me.id });
  if (!user && me.email) user = await User.findOne({ email: me.email });

  if (!user) {
    user = await User.create({
      username: `${me.username}_${String(me.id).slice(-4)}`,
      email: me.email || `${me.id}@discord.local`,
      password: uuid(),
      avatar: me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png` : undefined,
      discordId: me.id,
      role: 'user'
    });
  } else if (!user.discordId) {
    user.discordId = me.id;
    if (me.avatar) user.avatar = `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png`;
    await user.save();
  }

  req.session.userId = user._id;
  req.session.discordState = null;
  return res.redirect('/');
});


router.get('/voxnovayt-giveowner', (req, res) => {
  res.render('give-owner', { error: null, success: null });
});

router.post('/voxnovayt-giveowner', requireAuth, async (req, res) => {
  if (req.body.password !== 'HoyEsUnDiaMuyBonito') {
    return res.status(401).render('give-owner', { error: '❌ Contraseña incorrecta.', success: null });
  }

  const user = await User.findById(req.session.userId);
  if (!user) return res.redirect('/login');

  user.role = 'owner';
  await user.save();

  return res.render('give-owner', { error: null, success: '👑 ¡Listo! Ahora eres owner.' });
});

router.get('/login', (_, res) => res.render('login', { discordEnabled: env.discord.enabled }));
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
