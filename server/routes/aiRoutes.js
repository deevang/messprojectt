const express = require('express');
const router = express.Router();
const { getCalorieEstimation, analyzeSentiment } = require('../controllers/aiController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/estimate-calories', verifyToken, isAdmin, getCalorieEstimation);
router.post('/analyze-sentiment', verifyToken, isAdmin, analyzeSentiment);

module.exports = router; 