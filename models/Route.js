const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const routeSchema = new Schema({
  startLocation: {
    latitude: Number,
    longitude: Number
  },
  endLocation: {
    latitude: Number,
    longitude: Number
  },
  riskScore: {
    type: Number
  },
  routePath: [
    {
      latitude: Number,
      longitude: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);