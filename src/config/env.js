function toBool(v, fallback = false) {
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const env = {
  app: {
    port: toNum(process.env.PORT, 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    sessionSecret: process.env.SESSION_SECRET || 'change_this_secret'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://vixon:Yansi@vixon.z1v83vq.mongodb.net/lascotorras'
  },
  discord: {
    enabled: toBool(process.env.DISCORD_OAUTH_ENABLED, false),
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback'
  },
  smtp: {
    enabled: toBool(process.env.SMTP_ENABLED, false),
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: toNum(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || process.env.GMAIL_SMTP_EMAIL || '',
    pass: process.env.SMTP_PASS || process.env.GMAIL_SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'LasCoTorras <no-reply@lascotorras.com>',
    tlsRejectUnauthorized: toBool(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true)
  }
};

module.exports = env;
