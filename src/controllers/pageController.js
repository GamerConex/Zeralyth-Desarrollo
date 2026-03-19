const Message = require('../models/Message');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');

const renderPage = (view, title) => (req, res) => {
  res.render(view, {
    title,
    user: req.session.userId
      ? {
          id: req.session.userId,
          role: req.session.userRole,
          email: req.session.userEmail
        }
      : null
  });
};

const appPage = async (req, res) => {
  const account = await User.findById(req.session.userId).select('email role isVerified createdAt');

  if (!account) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
    return;
  }

  const [totalUsers, ownerCount, messageCount, pushCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: { $in: ['owner', 'admin'] } }),
    ['owner', 'admin'].includes(account.role) ? Message.countDocuments() : Promise.resolve(0),
    PushSubscription.countDocuments({ user: account._id })
  ]);

  res.render('app', {
    title: 'Dashboard',
    user: account,
    stats: {
      totalUsers,
      ownerCount,
      messageCount,
      pushCount
    }
  });
};

module.exports = {
  home: renderPage('home', 'Inicio'),
  download: renderPage('download', 'Descargar'),
  contact: renderPage('contact', 'Contacto'),
  appPage
};
