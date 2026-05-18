const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Category', categorySchema);
