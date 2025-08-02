const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Helper to send verification email
async function sendVerificationEmail(user, req) {
  const token = user.emailVerificationToken;
  const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${token}`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verify your email',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`
  });
}

// Helper to send password reset email
async function sendResetEmail(user, req) {
  const token = user.emailVerificationToken;
  // Use CLIENT_URL for frontend URL, fallback to FRONTEND_URL, then localhost
  const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/set-password?token=${token}`;
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
  });
}

exports.register = async (req, res) => {
  console.log('Register request body:', req.body);
  try {
    let { name, email, password, role, roomNumber, phoneNumber, messPlan, dietaryRestrictions, position, idProofType, idProofNumber, salary } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    // If registering as head_staff, set to pending_staff_head and create notification
    let pendingRole = undefined;
    if (role === 'staff_head') {
      pendingRole = 'staff_head';
      role = 'pending_staff_head';
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role,
      pendingRole,
      roomNumber,
      phoneNumber,
      messPlan,
      dietaryRestrictions,
      position,
      idProofType,
      idProofNumber,
      salary, // <-- add this line
      emailVerified: false,
      emailVerificationToken
    });
    // If head_staff, create notification for admin approval
    let customMessage = 'User registered successfully. Please check your email to verify your account.';
    if (role === 'pending_staff_head') {
      await Notification.create({
        type: 'head_staff_request',
        message: `${name} (${email}) has requested Head Staff access.`,
        sender: newUser._id,
        isRead: false,
        status: 'pending'
      });
      customMessage = 'Registration successful! Please verify your email. Your Head Staff access will require admin approval before you can log in.';
    }
    console.log('Sending verification email with token:', newUser.emailVerificationToken);
    await sendVerificationEmail(newUser, req);
    res.status(201).json({ 
      message: customMessage
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Email verification endpoint
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    console.log('Verifying email with token:', token);
    const user = await User.findOne({ emailVerificationToken: token });
    console.log('User found for token:', user ? user.email : 'none');
    if (!user) return res.status(400).send('Invalid or expired verification token.');
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    res.send('Email verified successfully! You can now log in.');
  } catch (err) {
    res.status(500).send('Server error.');
  }
};

exports.login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.emailVerified) return res.status(403).json({ error: 'Please verify your email before logging in.' });
    if (user.role === 'mess_staff') {
      return res.status(403).json({ error: 'Regular mess staff cannot log in.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roomNumber: user.roomNumber,
        messPlan: user.messPlan
      }
    });
  } catch (err) {
    console.error('Login error:', err); // Add this line
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, roomNumber, phoneNumber, messPlan, dietaryRestrictions } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, roomNumber, phoneNumber, messPlan, dietaryRestrictions },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.userId, { password: hashedNewPassword });
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.userId;
    
    // Validate role
    const validRoles = ['student', 'staff_head', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Restrict to max 2 admins
    if (role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 2) {
        return res.status(400).json({ error: 'Maximum number of admins reached. Only 2 admins allowed.' });
      }
    }
    
    // Check if user exists and has pending role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only allow role update if current role is 'pending'
    if (user.role !== 'pending') {
      return res.status(403).json({ error: 'Role can only be updated during initial setup' });
    }
    
    // Head Staff approval workflow
    if (role === 'staff_head') {
      // Set role to pending_staff_head and pendingRole to staff_head
      user.role = 'pending_staff_head';
      user.pendingRole = 'staff_head';
      await user.save();
      // Create notification for all admins (new format)
      const notification = await Notification.create({
        type: 'head_staff_request',
        message: `${user.name} (${user.email}) has requested Head Staff access.`,
        sender: user._id,
        isRead: false,
        status: 'pending'
      });
      console.log('DEBUG: Created head_staff_request notification:', notification);
      return res.json({
        message: 'Head Staff request submitted. Wait for admin approval.',
        user
      });
    }
    
    // Update user role (student/admin)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role, pendingRole: undefined },
      { new: true }
    ).select('-password');
    
    console.log(`User ${user.email} role updated from 'pending' to '${role}'`);
    
    res.json({ 
      message: 'Role updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Password reset via email link or request
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;

    // 1. If email is provided, send reset link
    if (email) {
      const user = await User.findOne({ email });
      if (!user) return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = resetToken;
      await user.save();
      await sendResetEmail(user, req);
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // 2. If token and password are provided, reset password
    if (token && password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
      user.emailVerificationToken = undefined;
      user.emailVerified = true;
      await user.save();
      return res.json({ message: 'Password reset successfully.' });
    }

    // If neither, error
    return res.status(400).json({ error: 'Token and new password are required.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Set or update password for the logged-in user (after Google OAuth)
exports.setPassword = async (req, res) => {
  try {
    console.log('setPassword called, req.user:', req.user);
    const userId = req.user.userId;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(userId, { password: hashed }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password set successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all staff members (admin only)
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['mess_staff', 'staff_head'] } }).select('-password');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update staff info (admin only)
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    // Prevent updating password or role via this endpoint
    delete updateFields.password;
    delete updateFields.role;
    const updatedStaff = await User.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).select('-password');
    if (!updatedStaff) return res.status(404).json({ error: 'Staff not found' });
    res.json(updatedStaff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mark salary as paid (admin only)
exports.markSalaryPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const staff = await User.findById(id);
    if (!staff || (staff.role !== 'mess_staff' && staff.role !== 'staff_head')) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    staff.salaryPaid = (staff.salaryPaid || 0) + amount;
    staff.outstandingSalary = Math.max((staff.salary || 0) - staff.salaryPaid, 0);
    await staff.save();
    res.json(staff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get attendance for all staff for a given month
exports.getStaffAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(m) || isNaN(y)) return res.status(400).json({ error: 'Invalid month or year' });
    const staff = await User.find({ role: { $in: ['mess_staff', 'staff_head'] } }).select('name position attendance salary phoneNumber role');
    // For each staff, filter attendance to only dates in the given month/year
    const result = staff.map(s => {
      const filteredAttendance = (s.attendance || []).filter(date => {
        const d = new Date(date);
        return d.getMonth() === m && d.getFullYear() === y;
      });
      return {
        _id: s._id,
        name: s.name,
        position: s.position,
        phoneNumber: s.phoneNumber,
        salary: s.salary,
        attendance: filteredAttendance,
        role: s.role
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark/unmark a staff member as present for a given date
exports.updateStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, present } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    const staff = await User.findById(id);
    if (!staff || (staff.role !== 'mess_staff' && staff.role !== 'staff_head')) return res.status(404).json({ error: 'Staff not found' });
    const d = new Date(date);
    const dateStr = d.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    // Only staff_head can mark attendance for any staff/any day
    if (req.user.role !== 'staff_head') {
      return res.status(403).json({ error: 'Only staff head can mark attendance' });
    }
    const attendanceDates = (staff.attendance || []).map(dt => new Date(dt).toISOString().slice(0, 10));
    if (present) {
      if (!attendanceDates.includes(dateStr)) {
        staff.attendance.push(d);
      }
    } else {
      staff.attendance = staff.attendance.filter(dt => new Date(dt).toISOString().slice(0, 10) !== dateStr);
    }
    await staff.save();
    res.json({ attendance: staff.attendance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get own attendance for a given month (mess_staff only)
exports.getMyAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'mess_staff') return res.status(403).json({ error: 'Mess staff access required' });
    const { month, year } = req.query;
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(m) || isNaN(y)) return res.status(400).json({ error: 'Invalid month or year' });
    const staff = await User.findById(req.user.userId).select('name position attendance salary phoneNumber');
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    const filteredAttendance = (staff.attendance || []).filter(date => {
      const d = new Date(date);
      return d.getMonth() === m && d.getFullYear() === y;
    });
    res.json({
      _id: staff._id,
      name: staff.name,
      position: staff.position,
      phoneNumber: staff.phoneNumber,
      salary: staff.salary,
      attendance: filteredAttendance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all users with role 'pending_staff_head' (admin only)
exports.getPendingHeadStaff = async (req, res) => {
  try {
    const pending = await User.find({ role: 'pending_staff_head' }).select('-password');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin approves a pending head staff request
exports.approveHeadStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user || user.role !== 'pending_staff_head') {
      return res.status(404).json({ error: 'Pending head staff not found' });
    }
    user.role = 'staff_head';
    user.pendingRole = undefined;
    await user.save();
    // Mark notification as approved
    await Notification.updateMany(
      { user: user._id, type: 'headstaff_approval', status: 'pending' },
      { status: 'approved', actionedBy: req.user.userId, actionedAt: new Date() }
    );
    res.json({ message: 'Head staff approved', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin rejects a pending head staff request
exports.rejectHeadStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(userId);
    if (!user || user.role !== 'pending_staff_head') {
      return res.status(404).json({ error: 'Pending head staff not found' });
    }
    // Optionally, set role back to 'pending' or remove user
    user.role = 'pending';
    user.pendingRole = undefined;
    await user.save();
    // Mark notification as rejected
    await Notification.updateMany(
      { user: user._id, type: 'headstaff_approval', status: 'pending' },
      { status: 'rejected', actionedBy: req.user.userId, actionedAt: new Date(), reason: reason || '' }
    );
    res.json({ message: 'Head staff request rejected', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List notifications for the current admin
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipients: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark notification as read/history
exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (!notification.readBy.includes(req.user.userId)) {
      notification.readBy.push(req.user.userId);
      await notification.save();
    }
    res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};