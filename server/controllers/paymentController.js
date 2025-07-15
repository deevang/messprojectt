const Payment = require('../models/Payment');
const User = require('../models/User');
const Booking = require('../models/Booking');

exports.createPayment = async (req, res) => {
  try {
    const { amount, paymentType, dueDate, month, year, description, mealId, transactionId, paymentMethod, status, bookingId } = req.body;
    // Ensure dueDate is set and required
    if (!dueDate) {
      return res.status(400).json({ error: 'dueDate (meal day) is required for payment.' });
    }
    const payment = await Payment.create({
      userId: req.user.userId, // Use authenticated user's ID
      amount,
      paymentType: paymentType || (mealId ? 'daily' : undefined),
      dueDate: new Date(dueDate),
      month: month || (dueDate ? new Date(dueDate).getMonth() + 1 : new Date().getMonth() + 1),
      year: year || (dueDate ? new Date(dueDate).getFullYear() : new Date().getFullYear()),
      description,
      transactionId,
      paymentMethod,
      status: status || 'pending', // allow pending or completed
      mealId,
      bookingId
    });

    // Always update related booking(s) to 'booked' after payment
    const userId = req.user.userId;
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'booked', price: amount });
    } else if (mealId && userId && dueDate) {
      await Booking.updateMany({ mealId, userId, date: new Date(dueDate) }, { status: 'booked', price: amount });
    }
    
    res.status(201).json(payment);
    const io = req.app.get('io');
    if (io) io.emit('paymentUpdate', { payment });
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

    // If payment is now completed, update related booking(s) to 'booked'
    if (status === 'completed') {
      if (payment.bookingId) {
        await Booking.findByIdAndUpdate(payment.bookingId, { status: 'booked' });
      } else if (payment.mealId && payment.userId && payment.dueDate) {
        await Booking.updateMany({ mealId: payment.mealId, userId: payment.userId, date: payment.dueDate }, { status: 'booked' });
      }
    }
    
    res.json(payment);
    const io = req.app.get('io');
    if (io) io.emit('paymentUpdate', { payment });
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
    // Always include dueDate in the response
    const paymentsWithDueDate = payments.map(p => ({
      ...p.toObject(),
      dueDate: p.dueDate
    }));
    res.json(paymentsWithDueDate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const paymentsForStats = await Payment.find({ status: { $in: ['completed', 'paid'] } });
    console.log('Payments included in stats:', paymentsForStats.map(p => ({ _id: p._id, amount: p.amount, status: p.status }))); 
    const totalAmount = await Payment.aggregate([
      { $match: { status: { $in: ['completed', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyStats = await Payment.aggregate([
      { $match: { status: { $in: ['completed', 'paid'] } } },
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