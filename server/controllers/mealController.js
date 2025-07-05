const Meal = require('../models/Meal');
const Booking = require('../models/Booking');
const User = require('../models/User');
const WeeklyMealPlan = require('../models/WeeklyMealPlan');
const Expense = require('../models/Expense');

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

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const previousMeals = [];
    const upcomingMeals = [];

    bookings.forEach(booking => {
      if (booking.date < now) {
        previousMeals.push(booking);
      } else {
        upcomingMeals.push(booking);
      }
    });

    res.json({ previousMeals, upcomingMeals });
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

exports.getWeeklyMealPlan = async (req, res) => {
  try {
    console.log('getWeeklyMealPlan called by user:', req.user);
    let plan = await WeeklyMealPlan.findOne();
    if (!plan) {
      plan = await WeeklyMealPlan.create({
        meals: [
          { 
            day: 'Monday', 
            breakfast: 'Poha with Tea, Fruits', 
            lunch: 'Rice, Dal, Mixed Vegetables, Curd', 
            dinner: 'Roti, Paneer Curry, Salad' 
          },
          { 
            day: 'Tuesday', 
            breakfast: 'Bread Omelette, Milk', 
            lunch: 'Khichdi, Papad, Pickle', 
            dinner: 'Rice, Chicken Curry, Vegetables' 
          },
          { 
            day: 'Wednesday', 
            breakfast: 'Upma, Coffee', 
            lunch: 'Roti, Dal, Mixed Vegetables, Curd', 
            dinner: 'Rice, Egg Curry, Salad' 
          },
          { 
            day: 'Thursday', 
            breakfast: 'Idli Sambar, Chutney', 
            lunch: 'Rice, Dal, Mixed Vegetables, Curd', 
            dinner: 'Roti, Paneer Curry, Salad' 
          },
          { 
            day: 'Friday', 
            breakfast: 'Cornflakes with Milk, Banana', 
            lunch: 'Biryani, Raita, Salad', 
            dinner: 'Roti, Dal, Mixed Vegetables' 
          },
          { 
            day: 'Saturday', 
            breakfast: 'Paratha with Curd, Tea', 
            lunch: 'Rice, Dal, Mixed Vegetables, Curd', 
            dinner: 'Rice, Fish Curry, Vegetables' 
          },
          { 
            day: 'Sunday', 
            breakfast: 'Puri Bhaji, Tea', 
            lunch: 'Special Thali (Rice, Dal, 2 Vegetables, Curd, Sweet)', 
            dinner: 'Roti, Dal, Mixed Vegetables, Salad' 
          },
        ],
        updatedBy: req.user ? req.user.userId : null
      });
    }
    res.json(plan);
  } catch (err) {
    console.error('getWeeklyMealPlan error:', err.stack || err, '\nRequest user:', req.user, '\nRequest headers:', req.headers);
    res.status(500).json({ error: 'Failed to fetch or create weekly meal plan: ' + err.message });
  }
};

exports.updateWeeklyMealPlan = async (req, res) => {
  try {
    if (req.user.role !== 'staff_head') {
      return res.status(403).json({ error: 'Only head staff can update the weekly meal plan.' });
    }
    const { meals } = req.body;
    let plan = await WeeklyMealPlan.findOne();
    if (!plan) {
      plan = new WeeklyMealPlan();
    }
    plan.meals = meals;
    plan.updatedBy = req.user.userId;
    plan.updatedAt = new Date();
    await plan.save();
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    if (!amount || !description || !category || !date) {
      return res.status(400).json({ error: 'All fields are required for expense.' });
    }
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const expense = await Expense.create({
      amount,
      description,
      category,
      date,
      addedBy: req.user.userId
    });
    res.status(201).json(expense);
  } catch (err) {
    console.error('addExpense error:', err.stack || err, '\nRequest user:', req.user, '\nRequest body:', req.body);
    res.status(400).json({ error: 'Failed to add expense: ' + err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    console.log('getExpenses called by user:', req.user);
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { all } = req.query;
    console.log('getExpenses query params:', req.query);
    if (all === 'true' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view all expenses.' });
    }
    let query = all === 'true' ? {} : { addedBy: req.user.userId };
    console.log('getExpenses final query:', query);
    const expenses = await Expense.find(query).sort({ date: -1 });
    console.log('getExpenses found:', expenses.length, 'expenses');
    res.json(expenses);
  } catch (err) {
    console.error('getExpenses error:', err.stack || err, '\nRequest user:', req.user, '\nRequest query:', req.query);
    res.status(500).json({ error: 'Failed to fetch expenses: ' + err.message });
  }
};

exports.createDefaultMealsForWeek = async (req, res) => {
  try {
    if (req.user.role !== 'staff_head') {
      return res.status(403).json({ error: 'Only head staff can create default meals.' });
    }

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    // Create just 3 sample meals for today and next 2 days
    const sampleMeals = [
      {
        date: new Date(today),
        mealType: 'breakfast',
        items: [{ name: 'Poha with Tea, Fruits', calories: 300 }],
        price: 50,
        isVegetarian: true,
        maxCapacity: 100,
        description: 'Light and healthy breakfast',
        isAvailable: true
      },
      {
        date: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        mealType: 'lunch',
        items: [{ name: 'Rice, Dal, Mixed Vegetables, Curd', calories: 600 }],
        price: 80,
        isVegetarian: true,
        maxCapacity: 100,
        description: 'Complete vegetarian lunch',
        isAvailable: true
      },
      {
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        mealType: 'dinner',
        items: [{ name: 'Roti, Paneer Curry, Salad', calories: 500 }],
        price: 70,
        isVegetarian: true,
        maxCapacity: 100,
        description: 'Protein-rich dinner',
        isAvailable: true
      }
    ];

    // Check if meals already exist for the next 3 days
    const existingMeals = await Meal.find({
      date: { 
        $gte: today, 
        $lt: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) 
      }
    });

    if (existingMeals.length > 0) {
      return res.status(400).json({ error: 'Sample meals for the next 3 days already exist. Please delete existing meals first.' });
    }

    // Create sample meals
    const createdMeals = await Meal.insertMany(
      sampleMeals.map(meal => ({
        ...meal,
        preparedBy: req.user.userId,
        currentBookings: 0
      }))
    );

    res.status(201).json({
      message: 'Sample meals created successfully',
      count: createdMeals.length,
      meals: createdMeals
    });
  } catch (err) {
    console.error('createDefaultMealsForWeek error:', err);
    res.status(500).json({ error: 'Failed to create default meals: ' + err.message });
  }
};