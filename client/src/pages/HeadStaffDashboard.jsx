import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { paymentsAPI, weeklyMealPlanAPI, expenseAPI, mealsAPI, bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchWeeklyPlan();
    fetchRecentPayments();
    fetchRecentBookings();
    fetchExpenses();
    fetchAvailableMeals();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Head Staff Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage meals, expenses, and view bookings</p>
        </div>

        {/* Weekly Meal Plan - Always show table, edit in-place */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Standard Meals</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Edit the standard meal plan for the week</p>
            </div>
            <button 
              onClick={handleCreateDefaultMeals}
              disabled={creatingDefaultMeals}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 font-medium shadow-md"
            >
              {creatingDefaultMeals ? 'Creating...' : 'Create Sample Meals'}
            </button>
          </div>
          {planLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Breakfast</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lunch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinner</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(editingPlan ? editWeeklyPlan : weeklyPlan).map((day, idx) => (
                      <tr key={day.day} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{day.day}</td>
                        {['breakfast', 'lunch', 'dinner'].map(mealType => (
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300" key={mealType}>
                            {editingPlan ? (
                              <input
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                value={editWeeklyPlan[idx][mealType]}
                                onChange={e => handlePlanChange(idx, mealType, e.target.value)}
                              />
                            ) : (
                              <span className={day[mealType] ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                                {day[mealType] || 'Not set'}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {user.role === 'staff_head' && (
                editingPlan ? (
                  <div className="flex gap-3 mt-6">
                    <button 
                      type="button" 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md" 
                      onClick={handleSavePlan}
                    >
                      Save Changes
                    </button>
                    <button 
                      type="button" 
                      className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 font-medium" 
                      onClick={() => { setEditingPlan(false); setEditWeeklyPlan(weeklyPlan); }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md mt-6" 
                    onClick={() => setEditingPlan(true)}
                  >
                    Edit Plan
                  </button>
                )
              )}
            </>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Students can select their preferred meals for the week from this standard menu.</p>
        </div>

        {/* Available Meals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Meals</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">These are the actual meals available for booking by students</p>
          </div>
          {mealsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Meal Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {availableMeals.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <p>No meals available</p>
                          <p className="text-sm">Create sample meals to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : availableMeals.map(meal => (
                    <tr key={meal._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(meal.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">{meal.mealType}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{meal.items?.map(item => item.name).join(', ') || meal.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">₹{meal.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{meal.maxCapacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{meal.currentBookings || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          meal.isAvailable 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {meal.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Bookings (Combined) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Bookings</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Recent bookings made by students with payment information</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">No. of Meals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No recent bookings found</p>
                      </div>
                    </td>
                  </tr>
                ) : recentBookings.map((booking, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{booking.student}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{booking.meals}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">₹{booking.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(booking.time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
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
                ) : expenses.map(exp => (
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
  );
};

export default HeadStaffDashboard; 