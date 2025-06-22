const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.post('/reset-password', resetPassword);

module.exports = router;