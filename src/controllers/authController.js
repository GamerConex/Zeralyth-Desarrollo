const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationCode } = require('../services/emailService');

const VERIFICATION_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 2 * 60 * 1000;
const MAX_RESEND_ATTEMPTS = 4;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const issueVerificationCode = async (user, { force = false } = {}) => {
  const now = new Date();
  const isCodeValid = user.verificationCode && user.verificationCodeExpiresAt && user.verificationCodeExpiresAt > now;

  if (!force && isCodeValid) {
    return { sent: false, reason: 'existing_valid' };
  }

  const code = generateCode();
  user.verificationCode = code;
  user.verificationCodeExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  user.lastVerificationSentAt = now;
  await user.save();
  await sendVerificationCode(user.email, code);
  return { sent: true };
};

const getResendState = (user) => {
  const now = Date.now();
  const lastSent = user.lastVerificationSentAt ? new Date(user.lastVerificationSentAt).getTime() : 0;
  const waitLeftMs = Math.max(0, RESEND_WAIT_MS - (now - lastSent));
  const attemptsLeft = Math.max(0, MAX_RESEND_ATTEMPTS - (user.verificationResendCount || 0));
  return { waitLeftMs, attemptsLeft };
};

const renderLogin = (res, { error = null, info = null, verifyUrl = null } = {}, status = 200) =>
  res.status(status).render('login', {
    title: 'Iniciar sesión',
    error,
    info,
    verifyUrl
  });

const showRegister = (req, res) => {
  const formStartedAt = Date.now();
  req.session.formStartedAt = formStartedAt;
  res.render('register', { title: 'Registro', error: null, formStartedAt });
};

const showLogin = (req, res) => renderLogin(res);

const showVerify = async (req, res) => {
  const email = (req.query.email || '').toLowerCase().trim();
  const user = email ? await User.findOne({ email }) : null;
  const state = user ? getResendState(user) : { attemptsLeft: MAX_RESEND_ATTEMPTS, waitLeftMs: 0 };

  res.render('verify', {
    title: 'Verificar correo',
    error: req.query.error || null,
    info: req.query.info || null,
    email,
    attemptsLeft: state.attemptsLeft,
    waitLeftMs: state.waitLeftMs
  });
};

const register = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const { password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).render('register', {
        title: 'Registro',
        error: 'El correo ya existe.',
        formStartedAt: Date.now()
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      verificationResendCount: 0
    });

    await issueVerificationCode(user, { force: true });
    return res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  } catch (error) {
    return res.status(500).render('register', {
      title: 'Registro',
      error: 'Error interno al registrarse.',
      formStartedAt: Date.now()
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const code = (req.body.code || '').trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).render('verify', {
        title: 'Verificar correo',
        error: 'No existe una cuenta para ese correo.',
        info: null,
        email,
        attemptsLeft: MAX_RESEND_ATTEMPTS,
        waitLeftMs: 0
      });
    }

    const isValidCode = user.verificationCode === code;
    const isNotExpired = user.verificationCodeExpiresAt && user.verificationCodeExpiresAt > new Date();

    if (!isValidCode || !isNotExpired) {
      const state = getResendState(user);
      return res.status(400).render('verify', {
        title: 'Verificar correo',
        error: 'Código inválido o expirado.',
        info: null,
        email,
        attemptsLeft: state.attemptsLeft,
        waitLeftMs: state.waitLeftMs
      });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    user.verificationResendCount = 0;
    user.lastVerificationSentAt = null;
    await user.save();

    return res.redirect('/login');
  } catch (error) {
    return res.status(500).render('verify', {
      title: 'Verificar correo',
      error: 'No se pudo verificar.',
      info: null,
      email: (req.body.email || '').toLowerCase().trim(),
      attemptsLeft: MAX_RESEND_ATTEMPTS,
      waitLeftMs: 0
    });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).render('verify', {
        title: 'Verificar correo',
        error: 'No existe una cuenta para ese correo.',
        info: null,
        email,
        attemptsLeft: MAX_RESEND_ATTEMPTS,
        waitLeftMs: 0
      });
    }

    if (user.isVerified) {
      return res.redirect('/login');
    }

    const state = getResendState(user);
    if (state.attemptsLeft <= 0) {
      return res.status(429).render('verify', {
        title: 'Verificar correo',
        error: 'Límite de reenvíos alcanzado (4/4).',
        info: null,
        email,
        attemptsLeft: 0,
        waitLeftMs: state.waitLeftMs
      });
    }

    if (state.waitLeftMs > 0) {
      return res.status(429).render('verify', {
        title: 'Verificar correo',
        error: `Debes esperar ${Math.ceil(state.waitLeftMs / 1000)} segundos para reenviar.`,
        info: null,
        email,
        attemptsLeft: state.attemptsLeft,
        waitLeftMs: state.waitLeftMs
      });
    }

    user.verificationResendCount = (user.verificationResendCount || 0) + 1;
    await user.save();
    await issueVerificationCode(user, { force: true });

    const newState = getResendState(user);
    return res.render('verify', {
      title: 'Verificar correo',
      error: null,
      info: 'Se envió un nuevo código de verificación a tu correo.',
      email,
      attemptsLeft: newState.attemptsLeft,
      waitLeftMs: newState.waitLeftMs
    });
  } catch (error) {
    return res.status(500).render('verify', {
      title: 'Verificar correo',
      error: 'No se pudo reenviar el código.',
      info: null,
      email: (req.body.email || '').toLowerCase().trim(),
      attemptsLeft: MAX_RESEND_ATTEMPTS,
      waitLeftMs: 0
    });
  }
};

const login = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const { password } = req.body;

    if (!email || !password) {
      return renderLogin(res, { error: 'Debes completar correo y contraseña.' }, 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return renderLogin(res, { error: 'Credenciales inválidas.' }, 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return renderLogin(res, { error: 'Credenciales inválidas.' }, 401);
    }

    if (!user.isVerified) {
      const isExpired = !user.verificationCodeExpiresAt || user.verificationCodeExpiresAt <= new Date();
      let info = 'Tu correo no está verificado. Ingresa el código para continuar.';

      if (isExpired) {
        const state = getResendState(user);
        if (state.attemptsLeft > 0 && state.waitLeftMs <= 0) {
          user.verificationResendCount = (user.verificationResendCount || 0) + 1;
          await user.save();
          await issueVerificationCode(user, { force: true });
          info = 'Tu código había caducado. Se envió uno nuevo automáticamente.';
        } else if (state.waitLeftMs > 0) {
          info = `Tu código caducó. Espera ${Math.ceil(state.waitLeftMs / 1000)} segundos para reenviar.`;
        } else {
          info = 'Tu código caducó y alcanzaste el límite de reenvíos (4/4).';
        }
      }

      return res.redirect(`/verify-email?email=${encodeURIComponent(email)}&info=${encodeURIComponent(info)}`);
    }

    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        return renderLogin(res, { error: 'No se pudo iniciar tu sesión. Intenta nuevamente.' }, 500);
      }

      req.session.userId = user._id.toString();
      req.session.userRole = user.role;
      req.session.userEmail = user.email;
      req.session.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email
      };
      req.session.isAuthenticated = true;

      return req.session.save((sessionError) => {
        if (sessionError) {
          return renderLogin(res, { error: 'No se pudo guardar tu sesión. Intenta nuevamente.' }, 500);
        }
        return res.redirect('/dashboard');
      });
    });
  } catch (error) {
    return renderLogin(res, { error: 'Error al iniciar sesión.' }, 500);
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
  resendVerificationCode,
  login,
  logout
};
