const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationCode } = require('../services/emailService');

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const showRegister = (req, res) => res.render('register', { title: 'Registro', error: null });
const showLogin = (req, res) => res.render('login', { title: 'Iniciar sesión', error: null });
const showVerify = (req, res) => res.render('verify', { title: 'Verificar correo', error: null });

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).render('register', { title: 'Registro', error: 'El correo ya existe.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const code = generateCode();

    const user = await User.create({
      email,
      password: hashed,
      verificationCode: code,
      verificationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendVerificationCode(email, code);

    req.session.pendingUserId = user._id.toString();
    return res.redirect('/verify-email');
  } catch (error) {
    return res.status(500).render('register', { title: 'Registro', error: 'Error interno al registrarse.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    if (!req.session.pendingUserId) {
      return res.redirect('/register');
    }

    const user = await User.findById(req.session.pendingUserId);
    if (!user) return res.redirect('/register');

    const isValidCode = user.verificationCode === code;
    const isNotExpired = user.verificationCodeExpiresAt && user.verificationCodeExpiresAt > new Date();

    if (!isValidCode || !isNotExpired) {
      return res.status(400).render('verify', { title: 'Verificar correo', error: 'Código inválido o expirado.' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    req.session.userId = user._id.toString();
    req.session.userRole = user.role;
    delete req.session.pendingUserId;

    return res.redirect('/app');
  } catch (error) {
    return res.status(500).render('verify', { title: 'Verificar correo', error: 'No se pudo verificar.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('login', { title: 'Iniciar sesión', error: 'Credenciales inválidas.' });
    }

    if (!user.isVerified) {
      return res.status(403).render('login', {
        title: 'Iniciar sesión',
        error: 'Debes verificar tu correo antes de iniciar sesión.'
      });
    }

    req.session.userId = user._id.toString();
    req.session.userRole = user.role;
    return res.redirect('/app');
  } catch (error) {
    return res.status(500).render('login', { title: 'Iniciar sesión', error: 'Error al iniciar sesión.' });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('lascotorras.sid');
    res.redirect('/');
  });
};

module.exports = {
  showRegister,
  showLogin,
  showVerify,
  register,
  verifyEmail,
  login,
  logout
};
