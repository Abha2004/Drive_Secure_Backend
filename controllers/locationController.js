const Location = require('../models/Location');

exports.updateLocation = async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        const userId = req.user.id; // Get from authenticated middleware
        
        const location = new Location({ userId, name, latitude, longitude });
        await location.save();
        res.json({ message: 'Location updated successfully', location });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all locations for current user
exports.getUserLocations = async (req, res) => {
    try {
        const userId = req.user.id;
        const locations = await Location.find({ userId }).sort({ createdAt: -1 });
        res.json({ locations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get latest location for current user
exports.getLatestLocation = async (req, res) => {
    try {
        const userId = req.user.id;
        const location = await Location.findOne({ userId }).sort({ createdAt: -1 });
        if (!location) {
            return res.json({ location: null, message: 'No location found' });
        }
        res.json({ location });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
