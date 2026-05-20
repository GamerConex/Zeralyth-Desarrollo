const mongoose = require('mongoose');
const env = require('./env');

async function connectDB(uri = env.mongodb.uri) {
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error conectando MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
