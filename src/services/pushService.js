const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

webPush.setVapidDetails(
  'mailto:soporte@lascotorras.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const notifyUser = async (userId, payload) => {
  const subscriptions = await PushSubscription.find({ user: userId });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(sub, JSON.stringify(payload));
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );
};

module.exports = { notifyUser };
