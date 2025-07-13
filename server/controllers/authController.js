const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.register = async (req, res) => {
  console.log('Register request body:', req.body);
  try {
    const { name, email, password, role, roomNumber, phoneNumber, messPlan, dietaryRestrictions, position, idProofType, idProofNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role,
      roomNumber,
      phoneNumber,
      messPlan,
      dietaryRestrictions,
      position,
      idProofType,
      idProofNumber
    });

    res.status(201).json({ 
      message: 'User registered successfully'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
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
      // Create notification for all admins
      const admins = await User.find({ role: 'admin' });
      const notification = await Notification.create({
        type: 'headstaff_approval',
        message: `${user.name} (${user.email}) has requested Head Staff access.`,
        user: user._id,
        recipients: admins.map(a => a._id),
        readBy: [],
        status: 'pending'
      });
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

exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });
    
    // In a real application, you would send this via email
    res.json({ message: 'Password reset successful. Check your email for new password.' });
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
    if (!staff || staff.role !== 'mess_staff') {
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
    if (!staff || staff.role !== 'mess_staff') return res.status(404).json({ error: 'Staff not found' });
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