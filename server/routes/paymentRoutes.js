const express = require('express');
const router = express.Router();
const { 
  createPayment, 
  getPayments, 
  updatePayment, 
  deletePayment,
  getPaymentsByUser,
  getPaymentStats,
  processPayment,
  generateInvoice
} = require('../controllers/paymentController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// User routes
router.get('/my-payments', verifyToken, getPaymentsByUser);
router.post('/process', verifyToken, processPayment);
router.get('/invoice/:id', verifyToken, generateInvoice);

// Admin routes
router.get('/', verifyToken, isAdmin, getPayments);
router.get('/stats', verifyToken, isAdmin, getPaymentStats);
router.post('/', verifyToken, isAdmin, createPayment);
router.put('/:id', verifyToken, isAdmin, updatePayment);
router.delete('/:id', verifyToken, isAdmin, deletePayment);

module.exports = router; 