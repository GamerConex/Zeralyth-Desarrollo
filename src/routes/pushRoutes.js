const express = require('express');
const PushSubscription = require('../models/PushSubscription');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.get('/public-key', requireAuth, (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', requireAuth, async (req, res) => {
  const subscription = req.body;
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      user: req.session.userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys
    },
    { upsert: true, new: true }
  );

  res.status(201).json({ ok: true });
});

module.exports = router;
