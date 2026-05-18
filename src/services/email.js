const nodemailer = require('nodemailer');

function getTransport() {
  const user = process.env.GMAIL_SMTP_EMAIL;
  const pass = process.env.GMAIL_SMTP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ host: 'smtp.gmail.com', port: 587, secure: false, auth: { user, pass } });
}

async function sendEmail(to, subject, text) {
  const tx = getTransport();
  if (!tx) return;
  await tx.sendMail({ from: process.env.GMAIL_SMTP_EMAIL, to, subject, text });
}

module.exports = { sendEmail };
