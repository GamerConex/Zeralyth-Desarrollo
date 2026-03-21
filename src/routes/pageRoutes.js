const express = require('express');
const pageController = require('../controllers/pageController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', pageController.home);
router.get('/descargar', pageController.download);
router.get('/contacto', pageController.contact);
router.get('/dashboard', requireAuth, pageController.appPage);
router.get('/app', requireAuth, (req, res) => res.redirect('/dashboard'));
router.get('/owner-chat', requireRole('owner', 'admin'), (req, res) => {
  res.render('owner-chat', { title: 'Chat de Owners' });
});

module.exports = router;
