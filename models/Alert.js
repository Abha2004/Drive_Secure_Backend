const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
  location: {
    latitude: Number,
    longitude: Number
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  message: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);