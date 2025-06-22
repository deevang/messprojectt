const express = require('express');
const router = express.Router();
const { 
  createFeedback, 
  getFeedbacks, 
  updateFeedback, 
  deleteFeedback,
  getFeedbacksByUser,
  getFeedbackStats,
  respondToFeedback,
  analyzeFeedbackSentiment
} = require('../controllers/feedbackController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// User routes
router.get('/my-feedback', verifyToken, getFeedbacksByUser);
router.post('/', verifyToken, createFeedback);
router.put('/:id', verifyToken, updateFeedback);
router.delete('/:id', verifyToken, deleteFeedback);

// Admin routes
router.get('/', verifyToken, isAdmin, getFeedbacks);
router.get('/stats', verifyToken, isAdmin, getFeedbackStats);
router.put('/:id/respond', verifyToken, isAdmin, respondToFeedback);
router.post('/:id/analyze', verifyToken, isAdmin, analyzeFeedbackSentiment);

module.exports = router; 