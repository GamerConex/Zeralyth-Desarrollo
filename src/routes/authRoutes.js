const express = require('express');
const {
  showRegister,
  showLogin,
  showVerify,
  register,
  verifyEmail,
  login,
  logout
} = require('../controllers/authController');

const router = express.Router();

router.get('/register', showRegister);
router.post('/register', register);
router.get('/login', showLogin);
router.post('/login', login);
router.get('/verify-email', showVerify);
router.post('/verify-email', verifyEmail);
router.post('/logout', logout);

module.exports = router;
