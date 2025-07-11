const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  updateBooking, 
  deleteBooking,
  getBookingsByDate,
  getBookingsByUser,
  markAsConsumed,
  bookTodayFromPlan,
  bookWeekFromPlan,
  getRecentBookingsWithPayments,
  createDayBooking,
  getDayBookingsByUser
} = require('../controllers/bookingController');
const { verifyToken, isAdmin, isMessStaff } = require('../middleware/authMiddleware');

// Protected routes
router.get('/my-bookings', verifyToken, getBookingsByUser);
router.get('/my-day-bookings', verifyToken, getDayBookingsByUser);
router.post('/', verifyToken, createBooking);
router.post('/day', verifyToken, createDayBooking);
router.put('/:id/consume', verifyToken, isMessStaff, markAsConsumed);
router.post('/book-today-from-plan', verifyToken, bookTodayFromPlan);
router.post('/book-week-from-plan', verifyToken, bookWeekFromPlan);

// Admin/Head Staff routes
router.get('/', verifyToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Only admin or head staff can view all bookings.' });
}, getBookings);
router.get('/date/:date', verifyToken, isAdmin, getBookingsByDate);
router.put('/:id', verifyToken, isAdmin, updateBooking);
router.get('/recent-with-payments', verifyToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Only admin or head staff can view this data.' });
}, getRecentBookingsWithPayments);

module.exports = router; 