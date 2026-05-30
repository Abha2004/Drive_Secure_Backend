const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Securely retrieve from protect middleware
        const { name, email, phone, profilePhoto } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (profilePhoto) user.profilePhoto = profilePhoto;

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
