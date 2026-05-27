const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

router.get('/locations', routeController.getLocations);
router.post('/safe', routeController.getSafeRoute);

module.exports = router;
