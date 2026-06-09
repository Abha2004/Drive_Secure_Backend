const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, predictionController.predict);
router.get('/history', protect, predictionController.getHistory);
router.delete('/history/:id', protect, predictionController.deleteHistory);

module.exports = router;
