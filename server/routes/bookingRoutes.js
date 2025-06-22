const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  updateBooking, 
  deleteBooking,
  getBookingsByDate,
  getBookingsByUser,
  markAsConsumed
} = require('../controllers/bookingController');
const { verifyToken, isAdmin, isMessStaff } = require('../middleware/authMiddleware');

// Protected routes
router.get('/my-bookings', verifyToken, getBookingsByUser);
router.post('/', verifyToken, createBooking);
router.put('/:id/consume', verifyToken, isMessStaff, markAsConsumed);
router.delete('/:id', verifyToken, deleteBooking);

// Admin routes
router.get('/', verifyToken, isAdmin, getBookings);
router.get('/date/:date', verifyToken, isAdmin, getBookingsByDate);
router.put('/:id', verifyToken, isAdmin, updateBooking);

module.exports = router; 