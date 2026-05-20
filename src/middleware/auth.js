function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  return next();
}

function requireOwner(req, res, next) {
  if (req.currentUser?.role !== 'owner') return res.status(403).send('Solo owner');
  return next();
}

module.exports = { requireAuth, requireOwner };
