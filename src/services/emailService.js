const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendVerificationCode = async (email, code) => {
  const templatePath = path.join(__dirname, '../../views/emails/verificationEmail.html');
  const htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
  const html = htmlTemplate.replace('{{CODE}}', code);

  await transporter.sendMail({
    from: `"Las Cotorras" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Verificación de correo - Las Cotorras',
    html
  });
};

module.exports = { sendVerificationCode };
