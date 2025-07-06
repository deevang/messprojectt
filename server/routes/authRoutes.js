const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword, resetPassword, getAllStaff, updateStaff, markSalaryPaid, getStaffAttendance, updateStaffAttendance, getMyAttendance } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { isMessStaff } = require('../middleware/authMiddleware');
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.post('/reset-password', resetPassword);
router.get('/staff', verifyToken, isMessStaff, getAllStaff);
router.put('/staff/:id', verifyToken, isAdmin, updateStaff);
router.post('/staff/:id/pay-salary', verifyToken, isAdmin, markSalaryPaid);
router.get('/staff-attendance', verifyToken, isMessStaff, getStaffAttendance);
router.patch('/staff/:id/attendance', verifyToken, isMessStaff, updateStaffAttendance);
router.get('/my-attendance', verifyToken, getMyAttendance);

// Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Issue JWT
    const user = req.user;
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    // Redirect to frontend with token
    res.redirect(`http://localhost:5173?token=${token}`);
  }
);

module.exports = router;