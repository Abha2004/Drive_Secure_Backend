const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/update', protect, locationController.updateLocation);
router.get('/user-locations', protect, locationController.getUserLocations);
router.get('/latest', protect, locationController.getLatestLocation);

module.exports = router;
