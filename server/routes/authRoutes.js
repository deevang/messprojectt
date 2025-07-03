const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword, resetPassword, getAllStaff, updateStaff, markSalaryPaid, getStaffAttendance, updateStaffAttendance, getMyAttendance } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { isMessStaff } = require('../middleware/authMiddleware');

router.post('/register', verifyToken, isMessStaff, register);
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

module.exports = router;