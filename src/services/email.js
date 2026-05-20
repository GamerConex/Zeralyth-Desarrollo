const nodemailer = require('nodemailer');
const env = require('../config/env');

function getTransport() {
  if (!env.smtp.enabled || !env.smtp.user || !env.smtp.pass) return null;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    tls: { rejectUnauthorized: env.smtp.tlsRejectUnauthorized }
  });
}

async function sendEmail(to, subject, text) {
  const tx = getTransport();
  if (!tx) return false;
  await tx.sendMail({ from: env.smtp.from, to, subject, text });
  return true;
}

module.exports = { sendEmail };
