const Booking = require('../models/Booking');
const Meal = require('../models/Meal');
const User = require('../models/User');
const WeeklyMealPlan = require('../models/WeeklyMealPlan');
const Payment = require('../models/Payment');

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
    
    const existingBooking = await Booking.findOne({ 
      userId: req.user.userId, 
      mealId,
      status: { $nin: ['cancelled', 'deleted'] } // Allow rebooking if previously cancelled
    });
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
    
    // Mark as cancelled instead of deleting
    await Booking.findByIdAndUpdate(req.params.id, { 
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    // Update meal booking count
    await Meal.findByIdAndUpdate(booking.mealId, { $inc: { currentBookings: -1 } });
    
    res.json({ message: 'Booking cancelled successfully' });
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
    const bookings = await Booking.find({ 
      userId: req.user.userId,
      status: { $nin: ['cancelled', 'deleted'] } // Don't show cancelled bookings
    })
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

// Book today's set from the weekly plan
exports.bookTodayFromPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Find all available meals for today
    const meals = await Meal.find({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      isAvailable: true
    });
    if (!meals.length) return res.status(404).json({ error: 'No meals available for today' });
    // For each meal, create a booking if not already booked/cancelled
    const bookings = [];
    for (const meal of meals) {
      const existing = await Booking.findOne({
        userId,
        mealId: meal._id,
        status: { $nin: ['cancelled', 'deleted'] }
      });
      if (!existing) {
        const booking = await Booking.create({
          userId,
          mealId: meal._id,
          date: meal.date,
          mealType: meal.mealType,
          status: 'pending',
          specialRequests: '',
          price: meal.price
        });
        await Meal.findByIdAndUpdate(meal._id, { $inc: { currentBookings: 1 } });
        bookings.push(booking);
      }
    }
    if (!bookings.length) return res.status(400).json({ error: 'All meals for today are already booked.' });
    res.status(201).json({ bookings, paymentRequired: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Book the week's set from the weekly plan
exports.bookWeekFromPlan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const plan = await WeeklyMealPlan.findOne();
    if (!plan) return res.status(404).json({ error: 'No weekly meal plan found' });
    // Create a booking for each day (status: pending)
    const bookings = await Promise.all(plan.meals.map(async (day) => {
      return Booking.create({
        userId,
        date: new Date(), // You may want to set the correct date for each day
        mealType: 'day',
        status: 'pending',
        specialRequests: '',
        price: 0 // Set price as needed
      });
    }));
    res.status(201).json({ bookings, paymentRequired: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Admin/Head Staff: Get recent bookings with payment info
exports.getRecentBookingsWithPayments = async (req, res) => {
  try {
    // Only admin or head staff can access
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff_head')) {
      return res.status(403).json({ error: 'Only admin or head staff can view this data.' });
    }
    // Get recent bookings (limit 20)
    const bookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name email')
      .lean();
    // Get payments for these bookings
    const bookingIds = bookings.map(b => b._id);
    const payments = await Payment.find({ bookingId: { $in: bookingIds } }).lean();
    // Map payments by bookingId
    const paymentMap = {};
    payments.forEach(p => { paymentMap[p.bookingId?.toString()] = p; });
    // Combine data
    const result = bookings.map(b => ({
      student: b.userId?.name || 'Unknown',
      meals: 1, // 1 per booking (customize if needed)
      amount: paymentMap[b._id.toString()]?.amount || 0,
      date: b.date,
      time: b.createdAt,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};