require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const pageRoutes = require('./routes/pageRoutes');
const pushRoutes = require('./routes/pushRoutes');
const Message = require('./models/Message');
const User = require('./models/User');
const { notifyUser } = require('./services/pushService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

connectDB();

const sessionMiddleware = session({
  name: 'lascotorras.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(sessionMiddleware);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, role: req.session.userRole }
    : null;
  next();
});

app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/push', pushRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Página no encontrada' });
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', async (socket) => {
  const sessionData = socket.request.session;
  if (!sessionData?.userId) return socket.disconnect(true);

  const user = await User.findById(sessionData.userId).select('role email');
  if (!user || !['owner', 'admin'].includes(user.role)) {
    return socket.disconnect(true);
  }

  socket.join('owners-room');

  socket.on('owner-message', async (content) => {
    if (!content || typeof content !== 'string') return;

    const msg = await Message.create({ user: user._id, content });
    io.to('owners-room').emit('owner-message', {
      user: user.email,
      content: msg.content,
      date: msg.createdAt
    });

    const owners = await User.find({ role: { $in: ['owner', 'admin'] } }).select('_id');
    await Promise.all(
      owners.map((owner) =>
        notifyUser(owner._id, {
          title: 'Nuevo mensaje de owners',
          body: content,
          url: '/owner-chat'
        })
      )
    );
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
