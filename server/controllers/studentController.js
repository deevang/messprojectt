const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

exports.getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, paymentStatus } = req.query;
    const query = { role: 'student' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // For each student, fetch latest payment and booking
    const studentsWithDetails = await Promise.all(students.map(async (student) => {
      const payments = await Payment.find({ userId: student._id }).sort({ createdAt: -1 }).limit(1);
      const bookings = await Booking.find({ userId: student._id }).populate('mealId').sort({ date: -1 }).limit(1);
      // For compatibility with frontend, rename mealId to meal
      const bookingsWithMeal = bookings.map(b => ({ ...b.toObject(), meal: b.mealId }));
      return {
        ...student.toObject(),
        payments,
        bookings: bookingsWithMeal
      };
    }));
    
    const total = await User.countDocuments(query);
    
    res.json({
      students: studentsWithDetails,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { name, roomNumber, phoneNumber, messPlan, dietaryRestrictions, isActive, monthlyFee, paymentStatus } = req.body;
    
    const student = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        roomNumber,
        phoneNumber,
        messPlan,
        dietaryRestrictions,
        isActive,
        monthlyFee,
        paymentStatus
      },
      { new: true }
    ).select('-password');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Also delete related bookings and payments
    await Booking.deleteMany({ userId: req.params.id });
    await Payment.deleteMany({ userId: req.params.id });
    
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const paidStudents = await User.countDocuments({ role: 'student', paymentStatus: 'paid' });
    const pendingStudents = await User.countDocuments({ role: 'student', paymentStatus: 'pending' });
    
    const planStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$messPlan', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalStudents,
      activeStudents,
      paidStudents,
      pendingStudents,
      planStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentMeals = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.params.id };
    
    if (status) query.status = status;
    
    const bookings = await Booking.find(query)
      .populate('mealId')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.params.id };
    
    if (status) query.status = status;
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).select('-password');
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};