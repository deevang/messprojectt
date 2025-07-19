const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword, resetPassword, getAllStaff, updateStaff, markSalaryPaid, getStaffAttendance, updateStaffAttendance, getMyAttendance, updateRole, getPendingHeadStaff, approveHeadStaff, getNotifications, markNotificationRead, setPassword, verifyEmail } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { isMessStaff } = require('../middleware/authMiddleware');
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.put('/update-role', verifyToken, updateRole);
// Password reset via email link
router.post('/reset-password', require('../controllers/authController').resetPassword);
router.get('/staff', verifyToken, require('../middleware/authMiddleware').isStaffHead, getAllStaff);
router.put('/staff/:id', verifyToken, isAdmin, updateStaff);
router.post('/staff/:id/pay-salary', verifyToken, isAdmin, markSalaryPaid);
router.get('/staff-attendance', verifyToken, isMessStaff, getStaffAttendance);
router.patch('/staff/:id/attendance', verifyToken, isMessStaff, updateStaffAttendance);
router.get('/my-attendance', verifyToken, getMyAttendance);

// Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureFlash: true 
  }),
  (req, res) => {
    console.log('Google OAuth callback triggered');
    const user = req.user;
    console.log('Google callback user:', user);
    if (!user) {
      console.error('No user found in Google callback. Session:', req.session, 'Request:', req);
      return res.redirect('/login');
    }
    try {
      // For new users with 'pending' role, include 'pending' in the token
      // For existing users, include their actual role
      const tokenRole = user.role === 'pending' ? 'pending' : user.role;
      const token = jwt.sign(
        { userId: user._id, role: tokenRole },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '7d' }
      );
      console.log('Generated JWT token for user:', user.email);
      console.log('Token payload:', { userId: user._id, role: tokenRole });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      // If user has no password set, redirect to set-password page
      if (!user.password) {
        const redirectUrl = `${frontendUrl}/set-password?token=${token}`;
        console.log('User has no password, redirecting to set-password:', redirectUrl);
        res.redirect(redirectUrl);
      } else if (user.role === 'pending') {
        // If user has pending role, redirect to role selection page
        const redirectUrl = `${frontendUrl}/role-selection?token=${token}`;
        console.log('New user detected, redirecting to role selection:', redirectUrl);
        res.redirect(redirectUrl);
      } else {
        // Existing user, redirect to home with token
        const redirectUrl = `${frontendUrl}?token=${token}`;
        console.log('Existing user, redirecting to home:', redirectUrl);
        res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Error generating JWT token or redirecting:', error);
      res.redirect('/login');
    }
  }
);

// Google OAuth failure handler
router.get('/google/failure', (req, res) => {
  console.error('Google OAuth authentication failed');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
});

// Set password after Google OAuth
router.put('/set-password', verifyToken, setPassword);

// Email verification route
router.get('/verify-email', verifyEmail);

// Head Staff approval workflow routes (admin only)
router.get('/pending-headstaff', verifyToken, isAdmin, getPendingHeadStaff);
router.post('/approve-headstaff/:userId', verifyToken, isAdmin, approveHeadStaff);
router.post('/reject-headstaff/:userId', verifyToken, isAdmin, require('../controllers/authController').rejectHeadStaff);

// Notification routes (admin only)
router.get('/notifications', verifyToken, isAdmin, getNotifications);
router.post('/notifications/mark-read/:id', verifyToken, isAdmin, markNotificationRead);

module.exports = router;