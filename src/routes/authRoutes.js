const express = require('express');
const {
  showRegister,
  showLogin,
  showVerify,
  register,
  verifyEmail,
  resendVerificationCode,
  login,
  logout
} = require('../controllers/authController');
const { antiBotRegister } = require('../middlewares/antiBot');

const router = express.Router();

router.get('/register', showRegister);
router.post('/register', antiBotRegister, register);
router.get('/login', showLogin);
router.post('/login', login);
router.get('/verify-email', showVerify);
router.post('/verify-email', verifyEmail);
router.post('/verify-email/resend', resendVerificationCode);
router.post('/logout', logout);

module.exports = router;
