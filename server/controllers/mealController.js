const Meal = require('../models/Meal');
const Booking = require('../models/Booking');
const User = require('../models/User');

exports.getAllMeals = async (req, res) => {
  try {
    const { page = 1, limit = 10, mealType, date } = req.query;
    const query = {};
    
    if (mealType) query.mealType = mealType;
    if (date) query.date = { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000) };
    
    const meals = await Meal.find(query)
      .populate('preparedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Meal.countDocuments(query);
    
    res.json({
      meals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id).populate('preparedBy', 'name');
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    res.json(meal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMeal = async (req, res) => {
  try {
    const { date, mealType, items, price, isVegetarian, maxCapacity, description } = req.body;
    
    // Calculate total calories
    const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
    
    const meal = await Meal.create({
      date: new Date(date),
      mealType,
      items,
      totalCalories,
      price,
      isVegetarian,
      maxCapacity,
      description,
      preparedBy: req.user.userId
    });
    
    res.status(201).json(meal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateMeal = async (req, res) => {
  try {
    const { date, mealType, items, price, isVegetarian, maxCapacity, description, isAvailable } = req.body;
    
    const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
    
    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      {
        date: new Date(date),
        mealType,
        items,
        totalCalories,
        price,
        isVegetarian,
        maxCapacity,
        description,
        isAvailable
      },
      { new: true }
    );
    
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    res.json(meal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    // Also delete related bookings
    await Booking.deleteMany({ mealId: req.params.id });
    
    res.json({ message: 'Meal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMealsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    const meals = await Meal.find({
      date: { $gte: startDate, $lt: endDate }
    }).populate('preparedBy', 'name');
    
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMealsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const meals = await Meal.find({ mealType: type })
      .populate('preparedBy', 'name')
      .sort({ date: -1 });
    
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bookMeal = async (req, res) => {
  try {
    const { mealId } = req.params;
    const { specialRequests } = req.body;
    
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
    
    // Check if user already booked this meal
    const existingBooking = await Booking.findOne({
      userId: req.user.userId,
      mealId,
      date: meal.date
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
    
    // Update meal booking count
    await Meal.findByIdAndUpdate(mealId, { $inc: { currentBookings: 1 } });
    
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }
    
    await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
    
    // Update meal booking count
    await Meal.findByIdAndUpdate(booking.mealId, { $inc: { currentBookings: -1 } });
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId })
      .populate('mealId')
      .sort({ date: -1 });
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMealStats = async (req, res) => {
  try {
    const totalMeals = await Meal.countDocuments();
    const todayMeals = await Meal.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    const totalBookings = await Booking.countDocuments();
    const todayBookings = await Booking.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    res.json({
      totalMeals,
      todayMeals,
      totalBookings,
      todayBookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};