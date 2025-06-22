const express = require('express');
const router = express.Router();
const { 
  getAllMeals, 
  getMealById, 
  createMeal, 
  updateMeal, 
  deleteMeal,
  getMealsByDate,
  getMealsByType,
  bookMeal,
  cancelBooking,
  getMyBookings,
  getMealStats
} = require('../controllers/mealController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllMeals);
router.get('/date/:date', getMealsByDate);
router.get('/type/:type', getMealsByType);
router.get('/stats', getMealStats);

// Protected routes
router.get('/my-bookings', verifyToken, getMyBookings);
router.post('/book/:mealId', verifyToken, bookMeal);
router.put('/cancel-booking/:bookingId', verifyToken, cancelBooking);
router.get('/:id', getMealById);

// Admin routes
router.post('/', verifyToken, isAdmin, createMeal);
router.put('/:id', verifyToken, isAdmin, updateMeal);
router.delete('/:id', verifyToken, isAdmin, deleteMeal);

module.exports = router;
