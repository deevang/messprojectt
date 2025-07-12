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
  markAsReadByAdmin,
  markAsReadByStaff,
  markAsReadByStudent,
  markMultipleAsReadByAdmin,
  markMultipleAsReadByStaff,
  getUnreadCountForAdmin,
  getUnreadCountForStaff,
  getUnreadCountForStudent
} = require('../controllers/feedbackController');
const { verifyToken, isAdmin, isStaffHead } = require('../middleware/authMiddleware');

// User routes (students)
router.get('/my-feedback', verifyToken, getFeedbacksByUser);
router.post('/', verifyToken, createFeedback);
router.put('/:id', verifyToken, updateFeedback);
router.delete('/:id', verifyToken, deleteFeedback);

// Admin routes
router.get('/', verifyToken, isAdmin, getFeedbacks);
router.get('/stats', verifyToken, isAdmin, getFeedbackStats);
router.get('/unread-count-admin', verifyToken, isAdmin, getUnreadCountForAdmin);
router.put('/:id/respond', verifyToken, isAdmin, respondToFeedback);
router.put('/:id/mark-read-admin', verifyToken, isAdmin, markAsReadByAdmin);
router.post('/mark-multiple-read-admin', verifyToken, isAdmin, markMultipleAsReadByAdmin);

// Staff Head routes (can also manage feedbacks)
router.get('/staff', verifyToken, isStaffHead, getFeedbacks);
router.get('/staff/stats', verifyToken, isStaffHead, getFeedbackStats);
router.get('/unread-count-staff', verifyToken, isStaffHead, getUnreadCountForStaff);
router.put('/staff/:id/respond', verifyToken, isStaffHead, respondToFeedback);
router.put('/staff/:id/mark-read-staff', verifyToken, isStaffHead, markAsReadByStaff);
router.post('/staff/mark-multiple-read-staff', verifyToken, isStaffHead, markMultipleAsReadByStaff);

// Student routes for notifications
router.get('/unread-count-student', verifyToken, getUnreadCountForStudent);
router.put('/:id/mark-read-student', verifyToken, markAsReadByStudent);

module.exports = router; 