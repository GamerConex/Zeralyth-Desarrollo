const User = require('../models/User');

const renderPage = (view, title) => (req, res) => {
  res.render(view, {
    title,
    user: req.session.userId
      ? {
          id: req.session.userId,
          role: req.session.userRole
        }
      : null
  });
};

const appPage = async (req, res) => {
  const user = await User.findById(req.session.userId).select('email role');
  res.render('app', {
    title: 'Aplicación',
    user
  });
};

module.exports = {
  home: renderPage('home', 'Inicio'),
  download: renderPage('download', 'Descargar'),
  contact: renderPage('contact', 'Contacto'),
  appPage
};
