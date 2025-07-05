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
  getMealStats,
  getWeeklyMealPlan,
  updateWeeklyMealPlan,
  addExpense,
  getExpenses,
  createDefaultMealsForWeek
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
router.get('/weekly-plan', verifyToken, (req, res, next) => {
  console.log('Route /api/meals/weekly-plan hit');
  next();
}, getWeeklyMealPlan);
router.put('/weekly-plan', verifyToken, updateWeeklyMealPlan);
router.post('/expenses', verifyToken, (req, res, next) => {
  if (req.user.role === 'staff_head' || req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Only head staff or admin can add expenses.' });
}, addExpense);
router.get('/expenses', verifyToken, getExpenses);
router.get('/:id', getMealById);

// Head Staff routes
router.post('/', verifyToken, (req, res, next) => {
  if (req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Only head staff can add meals.' });
}, createMeal);
router.post('/create-default-week', verifyToken, (req, res, next) => {
  if (req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Only head staff can create default meals.' });
}, createDefaultMealsForWeek);
router.put('/:id', verifyToken, (req, res, next) => {
  if (req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Only head staff can update meals.' });
}, updateMeal);
router.delete('/:id', verifyToken, (req, res, next) => {
  if (req.user.role === 'staff_head') return next();
  return res.status(403).json({ error: 'Only head staff can delete meals.' });
}, deleteMeal);

module.exports = router;
