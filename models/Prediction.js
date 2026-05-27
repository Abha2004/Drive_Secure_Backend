const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const predictionSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputs: {
    age_band_of_driver: String,
    driving_experience: String,
    type_of_vehicle: String,
    location: String,
    road_surface_conditions: String,
    light_conditions: String,
    weather_conditions: String
  },
  random_forest: {
    risk_level: String,
    confidence_score: Number
  },
  logistic_regression: {
    risk_level: String,
    confidence_score: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
