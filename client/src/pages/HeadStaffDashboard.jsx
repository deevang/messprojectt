import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentsAPI, weeklyMealPlanAPI, expenseAPI, mealsAPI, bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const mealTypes = ['breakfast', 'lunch', 'dinner'];

function getDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

function getNext7DaysUTC() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const HeadStaffDashboard = () => {
  const { user } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [editWeeklyPlan, setEditWeeklyPlan] = useState([]);
  const [editingPlan, setEditingPlan] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category: '', date: '' });
  const [expenses, setExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [creatingDefaultMeals, setCreatingDefaultMeals] = useState(false);
  const [availableMeals, setAvailableMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [weeklyMealsLoading, setWeeklyMealsLoading] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [addMealModal, setAddMealModal] = useState({ open: false, mealData: {} });

  // New state for meals chart
  const [meals, setMeals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMealId, setEditingMealId] = useState(null);
  const [newMealForm, setNewMealForm] = useState({
    date: '',
    mealType: 'breakfast',
    description: '',
    items: [{ name: '', calories: 0 }],
    price: 0,
    maxCapacity: 50,
    isVegetarian: true,
    isAvailable: true
  });
  const [refresh, setRefresh] = useState(0); // Dummy state to force re-render
  const [searchBooking, setSearchBooking] = useState("");
  const [searchExpense, setSearchExpense] = useState("");

  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dayOfWeek));
  const endOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + (6 - dayOfWeek)));
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
  const endOfWeekStr = endOfWeek.toISOString().slice(0, 10);

  useEffect(() => {
    fetchRollingMealsChart();
    fetchRecentPayments();
    fetchRecentBookings();
    fetchExpenses();
    fetchAvailableMeals();
    fetchWeeklyMealsChart();
    console.log('Meals state in render:', meals);
  }, []);

  useEffect(() => {
    console.log('Meals state in render:', meals);
  }, [meals]);

  const fetchWeeklyPlan = async () => {
    setPlanLoading(true);
    try {
      const res = await weeklyMealPlanAPI.getWeeklyPlan();
      setWeeklyPlan(res.data.meals || []);
      setEditWeeklyPlan(res.data.meals || []);
    } catch (err) {
      setWeeklyPlan([]);
      setEditWeeklyPlan([]);
    } finally {
      setPlanLoading(false);
    }
  };

  const handlePlanChange = (idx, field, value) => {
    setEditWeeklyPlan(prev => prev.map((day, i) => i === idx ? { ...day, [field]: value } : day));
  };

  const handleSavePlan = async () => {
    setPlanLoading(true);
    try {
      await weeklyMealPlanAPI.updateWeeklyPlan(editWeeklyPlan);
      setWeeklyPlan(editWeeklyPlan);
      setEditingPlan(false);
      toast.success('Weekly meal plan updated!');
    } catch (err) {
      toast.error('Failed to update meal plan');
    } finally {
      setPlanLoading(false);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const res = await paymentsAPI.getAll({ limit: 10, sort: '-createdAt' });
      setRecentPayments(res.data.payments || []);
    } catch (err) {
      setRecentPayments([]);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const res = await bookingsAPI.getRecentWithPayments();
      setRecentBookings(res.data || []);
    } catch (err) {
      setRecentBookings([]);
    }
  };

  const fetchExpenses = async () => {
    setExpenseLoading(true);
    try {
      const res = await expenseAPI.getExpenses();
      setExpenses(res.data || []);
    } catch (err) {
      setExpenses([]);
      toast.error('Failed to fetch expenses');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleExpenseChange = (e) => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseLoading(true);
    try {
      await expenseAPI.addExpense(expenseForm);
      setExpenseForm({ amount: '', description: '', category: '', date: '' });
      fetchExpenses();
      toast.success('Expense added!');
    } catch (err) {
      toast.error('Failed to add expense');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleCreateDefaultMeals = async () => {
    setCreatingDefaultMeals(true);
    try {
      await mealsAPI.createDefaultWeek();
      toast.success('Default meals created successfully for the week!');
      fetchAvailableMeals(); // Refresh meals list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create default meals');
    } finally {
      setCreatingDefaultMeals(false);
    }
  };

  const fetchAvailableMeals = async () => {
    setMealsLoading(true);
    try {
      const res = await mealsAPI.getAll({ limit: 20, sort: '-date' });
      setAvailableMeals(res.data.meals || []);
    } catch (err) {
      setAvailableMeals([]);
    } finally {
      setMealsLoading(false);
    }
  };

  // Fetch meals for the weekly chart
  const fetchWeeklyMealsChart = async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dayOfWeek));
    const endOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + (6 - dayOfWeek)));
    const startDate = startOfWeek.toISOString().slice(0, 10);
    const endDate = endOfWeek.toISOString().slice(0, 10);
    
    try {
      const [mealsRes, bookingsRes] = await Promise.all([
        mealsAPI.getAll({ startDate, endDate }),
        bookingsAPI.getAll({ startDate, endDate })
      ]);
      
      let data = mealsRes.data.meals || mealsRes.data;
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA - dateB !== 0) return dateA - dateB;
        return (a.mealType || '').localeCompare(b.mealType || '');
      });
      setMeals(data);
      setBookings(bookingsRes.data.bookings || bookingsRes.data || []);
      setRefresh(r => r + 1); // Force re-render
    } catch (err) {
      setMeals([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch meals for the next 7 days
  const fetchRollingMealsChart = async () => {
    setLoading(true);
    try {
      const [mealsRes, bookingsRes] = await Promise.all([
        mealsAPI.getMealsForNext7Days(),
        bookingsAPI.getAll()
      ]);
      let data = mealsRes.data.meals || mealsRes.data;
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA - dateB !== 0) return dateA - dateB;
        return (a.mealType || '').localeCompare(b.mealType || '');
      });
      setMeals(data);
      setBookings(bookingsRes.data.bookings || bookingsRes.data || []);
    } catch (err) {
      setMeals([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Helpers for meals chart
  const getDateForDay = (dayName) => {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dayOfWeek));
    const targetDayIdx = getNext7DaysUTC().indexOf(dayName);
    const targetDate = new Date(startOfWeek);
    targetDate.setUTCDate(startOfWeek.getUTCDate() + targetDayIdx);
    return targetDate.toISOString().slice(0, 10);
  };

  const getBookingsForDay = (dateStr) => bookings.filter(b => b.mealId && b.mealId.date && b.mealId.date.slice(0, 10) === dateStr);

  const formatDate = date => new Date(date).toISOString().slice(0, 10);
  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      // Duplicate check (robust)
      const exists = meals.some(m =>
        formatDate(m.date) === formatDate(newMealForm.date) &&
        m.mealType === newMealForm.mealType &&
        (!editingMealId || m._id !== editingMealId)
      );
      if (exists) {
        toast.error('A meal for this date and type already exists.');
        return;
      }
      if (editingMealId) {
        await mealsAPI.update(editingMealId, newMealForm);
      } else {
        await mealsAPI.create(newMealForm);
      }
      toast.success('Meal saved successfully!');
      setNewMealForm({
        date: '',
        mealType: 'breakfast',
        description: '',
        items: [{ name: '', calories: 0 }],
        price: 0,
        maxCapacity: 50,
        isVegetarian: true,
        isAvailable: true
      });
      setEditingMealId(null);
      await fetchRollingMealsChart();
      setAddMealModal({ open: false, mealData: {} });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save meal');
    }
  };

  const handleEditMeal = async (mealId, updatedData) => {
    try {
      await mealsAPI.update(mealId, updatedData);
      toast.success('Meal updated successfully!');
      setEditingMealId(null);
      fetchRollingMealsChart();
      setAddMealModal({ open: false, mealData: {} });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update meal');
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await mealsAPI.delete(mealId);
        toast.success('Meal deleted successfully!');
        fetchRollingMealsChart();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete meal');
      }
    }
  };

  const addMealItem = () => {
    setNewMealForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', calories: 0 }]
    }));
  };

  const removeMealItem = (index) => {
    setNewMealForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateMealItem = (index, field, value) => {
    setNewMealForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Head Staff Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage meals, expenses, and view bookings</p>
        </div>

        {/* Weekly Meals Chart - Editable by Head Staff */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Meals Chart</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Manage meals for the week - Add, edit, and delete meals</p>
            </div>
            {/* Removed Create Sample and Add Meal buttons */}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Breakfast</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lunch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinner</th>
                   
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getNext7DaysUTC().map(dateStr => {
                    const dayMeals = meals.filter(m => m.date.slice(0, 10) === dateStr);
                    const mealsObj = {
                      breakfast: dayMeals.find(m => m.mealType === 'breakfast'),
                      lunch: dayMeals.find(m => m.mealType === 'lunch'),
                      dinner: dayMeals.find(m => m.mealType === 'dinner'),
                    };
                    return (
                      <tr key={dateStr} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{getDayName(dateStr)}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-200">{dateStr}</td>
                        {['breakfast', 'lunch', 'dinner'].map(type => (
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300" key={type}>
                            {mealsObj[type] ? (
                              <div>
                                <div className="font-medium">
                                  {mealsObj[type].items?.map(item => item.name).join(', ') || mealsObj[type].description}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ₹{mealsObj[type].price} | {mealsObj[type].isVegetarian ? 'Veg' : 'Non-Veg'} | 
                                  Bookings: {bookings.filter(b => b.mealId?._id === mealsObj[type]._id).length}/{mealsObj[type].maxCapacity}
                                </div>
                                <button
                                  className="text-green-600 hover:text-green-800 text-xs font-medium mt-1"
                                  onClick={() => {
                                    setNewMealForm({
                                      date: formatDate(mealsObj[type].date),
                                      mealType: mealsObj[type].mealType,
                                      description: mealsObj[type].description,
                                      items: mealsObj[type].items,
                                      price: mealsObj[type].price,
                                      maxCapacity: mealsObj[type].maxCapacity,
                                      isVegetarian: mealsObj[type].isVegetarian,
                                      isAvailable: mealsObj[type].isAvailable
                                    });
                                    setEditingMealId(mealsObj[type]._id);
                                    setAddMealModal({ open: true, mealData: mealsObj[type] });
                                  }}
                                >Edit</button>
                              </div>
                            ) : (
                              <button
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                onClick={() => {
                                  setNewMealForm({
                                    date: dateStr,
                                    mealType: type,
                                    description: '',
                                    items: [{ name: '', calories: 0 }],
                                    price: 0,
                                    maxCapacity: 50,
                                    isVegetarian: true,
                                    isAvailable: true
                                  });
                                  setEditingMealId(null);
                                  setAddMealModal({ open: true, mealData: { date: dateStr, mealType: type } });
                                }}
                              >Add</button>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Bookings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Bookings</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Recent bookings made by students with payment information</p>
          </div>
          <div className="mb-4 flex justify-end">
            <input
              type="text"
              className="w-full md:w-72 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Search by name, ID, amount, meal day, or time"
              value={searchBooking}
              onChange={e => setSearchBooking(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student (Name/ID)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Meal Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Date & Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Group bookings by student and meal day, filter and limit to 3 */}
                  {Object.values(
                    recentBookings.reduce((acc, booking) => {
                      // Key: studentId + meal day
                      const studentId = booking.studentId || booking.student || booking._id || '';
                      const mealDateRaw = booking.date || booking.time;
                      const mealDateObj = new Date(mealDateRaw);
                      const mealDate = mealDateObj.toISOString().slice(0, 10);
                      const key = `${studentId}_${mealDate}`;
                      if (!acc[key]) acc[key] = {
                        student: booking.student,
                        studentId: studentId,
                        mealDateRaw,
                        mealDate,
                        amount: 0,
                        paymentTime: booking.time,
                        paymentDateTime: new Date(booking.time),
                      };
                      acc[key].amount += booking.amount;
                      // Use latest payment time for the group
                      if (new Date(booking.time) > acc[key].paymentDateTime) {
                        acc[key].paymentTime = booking.time;
                        acc[key].paymentDateTime = new Date(booking.time);
                      }
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b.paymentDateTime - a.paymentDateTime)
                    .filter(booking => {
                      const mealDayName = new Date(booking.mealDateRaw).toLocaleDateString('en-US', { weekday: 'long' });
                      const paymentDate = booking.paymentDateTime.toISOString().slice(0, 10);
                      const paymentDayName = booking.paymentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
                      const paymentTime = booking.paymentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const search = searchBooking.toLowerCase();
                      return (
                        booking.student?.toLowerCase().includes(search) ||
                        booking.studentId?.toLowerCase().includes(search) ||
                        booking.amount?.toString().includes(search) ||
                        mealDayName.toLowerCase().includes(search) ||
                        booking.mealDate?.includes(search) ||
                        paymentDate.includes(search) ||
                        paymentDayName.toLowerCase().includes(search) ||
                        paymentTime.toLowerCase().includes(search)
                      );
                    })
                    .slice(0, 3)
                    .map((booking, idx) => {
                      const mealDayName = new Date(booking.mealDateRaw).toLocaleDateString('en-US', { weekday: 'long' });
                      const paymentDate = booking.paymentDateTime.toISOString().slice(0, 10);
                      const paymentDayName = booking.paymentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
                      const paymentTime = booking.paymentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{booking.student} <span className="text-xs text-gray-400">({booking.studentId})</span></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{mealDayName}, {booking.mealDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">₹{booking.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{paymentDate} {paymentTime} ({paymentDayName})</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Expense</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Track expenses for better financial management</p>
          </div>
          <form onSubmit={handleAddExpense} className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
              name="amount" 
              type="number" 
              placeholder="Amount" 
              value={expenseForm.amount} 
              onChange={handleExpenseChange} 
              required 
            />
            <input 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
              name="description" 
              placeholder="Description" 
              value={expenseForm.description} 
              onChange={handleExpenseChange} 
              required 
            />
            <input 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
              name="category" 
              placeholder="Category (e.g. groceries)" 
              value={expenseForm.category} 
              onChange={handleExpenseChange} 
              required 
            />
            <input 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
              name="date" 
              type="date" 
              value={expenseForm.date} 
              onChange={handleExpenseChange} 
              required 
            />
            <button 
              type="submit" 
              className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-md"
            >
              Add Expense
            </button>
          </form>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses List</h3>
          </div>
          <div className="mb-4 flex justify-end">
            <input
              type="text"
              className="w-full md:w-72 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Search by category, description, or amount"
              value={searchExpense}
              onChange={e => setSearchExpense(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {expenseLoading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <p>No expenses found</p>
                        </div>
                      </td>
                    </tr>
                  ) : expenses
                      .filter(exp => {
                        const search = searchExpense.toLowerCase();
                        return (
                          exp.category?.toLowerCase().includes(search) ||
                          exp.description?.toLowerCase().includes(search) ||
                          exp.amount?.toString().includes(search)
                        );
                      })
                      .slice(0, 3)
                      .map(exp => (
                        <tr key={exp._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{exp.date?.slice(0,10)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{exp.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{exp.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">₹{exp.amount}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Meal Modal */}
      {addMealModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingMealId ? 'Edit Meal' : 'Add New Meal'}
              </h3>
              <button
                onClick={() => setAddMealModal({ open: false, mealData: {} })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddMeal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newMealForm.date}
                    onChange={(e) => setNewMealForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={newMealForm.mealType}
                    onChange={(e) => setNewMealForm(prev => ({ ...prev, mealType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newMealForm.description}
                  onChange={(e) => setNewMealForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Meal description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meal Items
                </label>
                {newMealForm.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateMealItem(index, 'name', e.target.value)}
                      placeholder="Item name"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                    <input
                      type="number"
                      value={item.calories}
                      onChange={(e) => updateMealItem(index, 'calories', parseInt(e.target.value) || 0)}
                      placeholder="Calories"
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                    {newMealForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMealItem(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMealItem}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newMealForm.price}
                    onChange={(e) => setNewMealForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    value={newMealForm.maxCapacity}
                    onChange={(e) => setNewMealForm(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newMealForm.isVegetarian ? 'vegetarian' : 'non-vegetarian'}
                    onChange={(e) => setNewMealForm(prev => ({ ...prev, isVegetarian: e.target.value === 'vegetarian' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non-vegetarian">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={newMealForm.isAvailable}
                  onChange={(e) => setNewMealForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-700 dark:text-gray-300">
                  Available for booking
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md"
                >
                  {editingMealId ? 'Update Meal' : 'Add Meal'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddMealModal({ open: false, mealData: {} })}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadStaffDashboard; 