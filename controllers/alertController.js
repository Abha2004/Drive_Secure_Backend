const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAlert = async (req, res) => {
    try {
        const { latitude, longitude, riskLevel, message } = req.body;
        const alert = new Alert({
            location: { latitude, longitude },
            riskLevel: riskLevel || 'medium',
            message: message || 'Alert reported'
        });
        await alert.save();
        res.status(201).json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAlertStats = async (req, res) => {
    try {
        const total = await Alert.countDocuments();
        const high = await Alert.countDocuments({ riskLevel: 'high' });
        const medium = await Alert.countDocuments({ riskLevel: 'medium' });
        const low = await Alert.countDocuments({ riskLevel: 'low' });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Alert.countDocuments({ createdAt: { $gte: today } });
        res.json({ total, high, medium, low, todayCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
