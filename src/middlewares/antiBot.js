const registerAttemptsByIp = new Map();
const REGISTER_WINDOW_MS = 15 * 60 * 1000;
const MAX_REGISTER_ATTEMPTS_PER_WINDOW = 8;
const MIN_FORM_FILL_TIME_MS = 2500;

const antiBotRegister = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const entry = registerAttemptsByIp.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > REGISTER_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  registerAttemptsByIp.set(ip, entry);

  if (entry.count > MAX_REGISTER_ATTEMPTS_PER_WINDOW) {
    return res.status(429).render('register', {
      title: 'Registro',
      error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      formStartedAt: req.session.formStartedAt || Date.now()
    });
  }

  const { website, formStartedAt } = req.body;
  if (website && website.trim() !== '') {
    return res.status(400).render('register', {
      title: 'Registro',
      error: 'Solicitud inválida.',
      formStartedAt: req.session.formStartedAt || Date.now()
    });
  }

  const started = Number(formStartedAt || req.session.formStartedAt || now);
  if (!Number.isFinite(started) || now - started < MIN_FORM_FILL_TIME_MS) {
    return res.status(400).render('register', {
      title: 'Registro',
      error: 'Se detectó actividad sospechosa. Inténtalo nuevamente.',
      formStartedAt: req.session.formStartedAt || Date.now()
    });
  }

  next();
};

module.exports = { antiBotRegister };
