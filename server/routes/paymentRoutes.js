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

// Admin and Head Staff routes
router.get('/', verifyToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Forbidden' });
}, getPayments);
router.get('/stats', verifyToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Forbidden' });
}, getPaymentStats);
router.post('/', verifyToken, createPayment);
router.put('/:id', verifyToken, isAdmin, updatePayment);
router.delete('/:id', verifyToken, isAdmin, deletePayment);

module.exports = router; 