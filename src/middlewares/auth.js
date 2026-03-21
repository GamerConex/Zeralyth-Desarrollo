const getSessionUser = (req) => req.session.user || (req.session.userId ? { id: req.session.userId, role: req.session.userRole } : null);

const requireAuth = (req, res, next) => {
  if (!getSessionUser(req)) {
    return res.redirect('/login');
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return res.redirect('/login');
  }
  if (!roles.includes(sessionUser.role)) {
    return res.status(403).render('403', { title: '403 - Sin permisos' });
  }
  next();
};

module.exports = { requireAuth, requireRole };
