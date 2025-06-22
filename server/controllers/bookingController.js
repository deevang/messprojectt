const Booking = require('../models/Booking');
const Meal = require('../models/Meal');
const User = require('../models/User');

exports.createBooking = async (req, res) => {
  try {
    const { mealId, specialRequests } = req.body;
    
    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    if (!meal.isAvailable) {
      return res.status(400).json({ error: 'Meal is not available for booking' });
    }
    
    if (meal.currentBookings >= meal.maxCapacity) {
      return res.status(400).json({ error: 'Meal is fully booked' });
    }
    
    const existingBooking = await Booking.findOne({ userId: req.user.userId, mealId });
    if (existingBooking) {
      return res.status(400).json({ error: 'You have already booked this meal' });
    }
    
    const booking = await Booking.create({
      userId: req.user.userId,
      mealId,
      date: meal.date,
      mealType: meal.mealType,
      specialRequests,
      price: meal.price
    });
    
    await Meal.findByIdAndUpdate(mealId, { $inc: { currentBookings: 1 } });
    
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date, type } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    let bookingsQuery = Booking.find(query)
      .populate({
        path: 'userId',
        select: 'name email roomNumber'
      })
      .populate({
        path: 'mealId',
        model: 'Meal',
        ...(type && { match: { type: type } })
      })
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const bookings = await bookingsQuery.exec();
    const filteredBookings = bookings.filter(b => b.mealId);
    const total = await Booking.countDocuments(query);
    
    res.json({
      bookings: filteredBookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { status, specialRequests } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, specialRequests },
      { new: true }
    ).populate('userId', 'name email').populate('mealId');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this booking' });
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    
    // Update meal booking count
    await Meal.findByIdAndUpdate(booking.mealId, { $inc: { currentBookings: -1 } });
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    const bookings = await Booking.find({
      date: { $gte: startDate, $lt: endDate }
    }).populate('userId', 'name email roomNumber').populate('mealId');
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBookingsByUser = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId })
      .populate('mealId')
      .sort({ date: -1 });
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsConsumed = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'mess_staff') {
      return res.status(403).json({ error: 'Not authorized to perform this action' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'consumed', consumedAt: new Date() },
      { new: true }
    );
    
    res.json(updatedBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};