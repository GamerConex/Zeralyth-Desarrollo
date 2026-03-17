const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  if (!roles.includes(req.session.userRole)) {
    return res.status(403).render('403', { title: '403 - Sin permisos' });
  }
  next();
};

module.exports = { requireAuth, requireRole };
