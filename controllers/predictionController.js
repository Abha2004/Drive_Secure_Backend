const axios = require('axios');
const Prediction = require('../models/Prediction');

exports.predict = async (req, res) => {
    try {
        const mlApiUrl = process.env.ML_API_URL || 'http://127.0.0.1:8000/predict';
        const response = await axios.post(mlApiUrl, req.body);
        
        // Save prediction record to DB if user is logged in
        if (req.user && req.user.id) {
            const newPrediction = new Prediction({
                user: req.user.id,
                inputs: {
                    age_band_of_driver: req.body.age_band_of_driver,
                    driving_experience: req.body.driving_experience,
                    type_of_vehicle: req.body.type_of_vehicle,
                    location: req.body.location,
                    road_surface_conditions: req.body.road_surface_conditions,
                    light_conditions: req.body.light_conditions,
                    weather_conditions: req.body.weather_conditions
                },
                random_forest: response.data.random_forest,
                logistic_regression: response.data.logistic_regression
            });
            await newPrediction.save();
        }
        
        res.json(response.data);
    } catch (error) {
        console.error('Error calling ML API:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const history = await Prediction.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        console.error('Error fetching prediction history:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteHistory = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const prediction = await Prediction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!prediction) {
            return res.status(404).json({ message: 'Prediction not found or unauthorized' });
        }
        res.json({ message: 'Prediction deleted successfully' });
    } catch (error) {
        console.error('Error deleting prediction history:', error.message);
        res.status(500).json({ error: error.message });
    }
};
