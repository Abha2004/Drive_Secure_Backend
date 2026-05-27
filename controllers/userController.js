const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.body.userId; 
        const updatedData = req.body;
        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
