const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

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

    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
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