const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Public routes (no auth needed for dashboard stats)
router.get('/', alertController.getAlerts);
router.get('/stats', alertController.getAlertStats);
router.post('/', alertController.createAlert);

module.exports = router;
