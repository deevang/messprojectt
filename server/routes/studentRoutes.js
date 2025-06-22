const express = require('express');
const router = express.Router();
const { 
  getAllStudents, 
  getStudentById, 
  updateStudent, 
  deleteStudent,
  getStudentStats,
  getStudentMeals,
  getStudentPayments,
  updatePaymentStatus
} = require('../controllers/studentController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Admin routes
router.get('/', verifyToken, isAdmin, getAllStudents);
router.get('/stats', verifyToken, isAdmin, getStudentStats);
router.get('/:id', verifyToken, isAdmin, getStudentById);
router.put('/:id', verifyToken, isAdmin, updateStudent);
router.delete('/:id', verifyToken, isAdmin, deleteStudent);
router.get('/:id/meals', verifyToken, isAdmin, getStudentMeals);
router.get('/:id/payments', verifyToken, isAdmin, getStudentPayments);
router.put('/:id/payment-status', verifyToken, isAdmin, updatePaymentStatus);

module.exports = router;
