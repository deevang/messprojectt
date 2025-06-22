const Payment = require('../models/Payment');
const User = require('../models/User');
const Booking = require('../models/Booking');

exports.createPayment = async (req, res) => {
  try {
    const { userId, amount, paymentType, dueDate, month, year, description } = req.body;
    
    const payment = await Payment.create({
      userId,
      amount,
      paymentType,
      dueDate: new Date(dueDate),
      month,
      year,
      description
    });
    
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, month, year } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (month) query.month = month;
    if (year) query.year = year;
    
    const payments = await Payment.find(query)
      .populate('userId', 'name email roomNumber')
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

exports.updatePayment = async (req, res) => {
  try {
    const { amount, status, paidDate, paymentMethod, transactionId } = req.body;
    
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        amount,
        status,
        paidDate: paidDate ? new Date(paidDate) : undefined,
        paymentMethod,
        transactionId
      },
      { new: true }
    ).populate('userId', 'name email roomNumber');
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentsByUser = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const monthlyStats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: { month: '$month', year: '$year' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      totalPayments,
      pendingPayments,
      completedPayments,
      totalAmount: totalAmount[0]?.total || 0,
      monthlyStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { paymentId, paymentMethod, transactionId } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to process this payment' });
    }
    
    payment.status = 'completed';
    payment.paymentMethod = paymentMethod;
    payment.transactionId = transactionId;
    payment.paidDate = new Date();
    await payment.save();
    
    // Update user payment status
    await User.findByIdAndUpdate(req.user.userId, { paymentStatus: 'paid' });
    
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email roomNumber');
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    if (payment.userId._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this invoice' });
    }
    
    // In a real application, you would generate a PDF invoice
    const invoice = {
      invoiceNumber: `INV-${payment._id.toString().slice(-8)}`,
      payment,
      generatedAt: new Date()
    };
    
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};