import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, paymentsAPI } from '../services/api';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StudentDashboard = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    const startDate = startOfWeek.toISOString().slice(0, 10);
    const endDate = endOfWeek.toISOString().slice(0, 10);
    Promise.all([
      mealsAPI.getAll({ startDate, endDate }),
      mealsAPI.getMyBookings(),
      paymentsAPI.getByUser()
    ]).then(([mealsRes, bookingsRes, paymentsRes]) => {
      let data = mealsRes.data.meals || mealsRes.data;
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA - dateB !== 0) return dateA - dateB;
        return (a.mealType || '').localeCompare(b.mealType || '');
      });
      setMeals(data);
      setBookings([...(bookingsRes.data.upcomingMeals || []), ...(bookingsRes.data.previousMeals || [])]);
      setPayments(paymentsRes.data || []);
    }).catch(() => {
      setMeals([]);
      setBookings([]);
      setPayments([]);
    }).finally(() => setLoading(false));
  }, [user]);

  // Helpers
  const getDateForDay = (dayName) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const targetDayIdx = daysOfWeek.indexOf(dayName);
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + targetDayIdx);
    return targetDate.toISOString().slice(0, 10);
  };
  const getBookingsForDay = (dateStr) => bookings.filter(b => b.mealId && b.mealId.date && b.mealId.date.slice(0, 10) === dateStr);
  const getDayBookingStatus = (meals, bookings) => {
    const mealTypes = ['breakfast', 'lunch', 'dinner'].filter(type => meals[type]);
    if (mealTypes.length === 0) return 'none';
    if (mealTypes.every(type => bookings.some(b => b.mealId && b.mealId.mealType === type && b.status === 'booked'))) return 'booked';
    if (mealTypes.some(type => bookings.some(b => b.mealId && b.mealId.mealType === type && b.status === 'pending'))) return 'pending';
    return 'none';
  };

  // Stats
  const totalMeals = meals.length;
  const totalBookings = bookings.filter(b => b.status === 'booked').length;
  const totalPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  // Weekly Meal Plan structure
  const weekMeals = daysOfWeek.map(day => {
    const dayMeals = meals.filter(m => daysOfWeek[new Date(m.date).getDay()] === day);
    return {
      day,
      meals: {
        breakfast: dayMeals.find(m => m.mealType === 'breakfast'),
        lunch: dayMeals.find(m => m.mealType === 'lunch'),
        dinner: dayMeals.find(m => m.mealType === 'dinner'),
      }
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your meals, bookings, and payments from your dashboard.</p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Meals</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalMeals}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-300">My Bookings</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalBookings}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Payments</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalPayments}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Pending Payments</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingPayments}</div>
          </div>
        </div>
        {/* Weekly Meal Plan Table (Read-only) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Meal Plan</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">View your meal plan and booking status for the week</p>
          </div>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Breakfast</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lunch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {daysOfWeek.map(day => {
                  const dateStr = getDateForDay(day);
                  const dayMeals = meals.filter(m => daysOfWeek[new Date(m.date).getDay()] === day);
                  const mealsObj = {
                    breakfast: dayMeals.find(m => m.mealType === 'breakfast'),
                    lunch: dayMeals.find(m => m.mealType === 'lunch'),
                    dinner: dayMeals.find(m => m.mealType === 'dinner'),
                  };
                  const bookingsForDay = getBookingsForDay(dateStr);
                  const status = getDayBookingStatus(mealsObj, bookingsForDay);
                  return (
                    <tr key={day} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{day}</td>
                      {['breakfast', 'lunch', 'dinner'].map(type => (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300" key={type}>
                          {mealsObj[type]?.items?.map(item => item.name).join(', ') || mealsObj[type]?.description || <span className="text-gray-400">-</span>}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        {status === 'booked' ? (
                          <span className="text-green-600 font-semibold">Booked</span>
                        ) : status === 'pending' ? (
                          <span className="text-yellow-600 font-semibold">Pending Payment</span>
                        ) : (
                          <span className="text-gray-400">Not Booked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* My Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Bookings</h2>
          {daysOfWeek.map(day => {
            const dateStr = getDateForDay(day);
            const bookingsForDay = getBookingsForDay(dateStr).filter(b => b.status === 'booked');
            if (bookingsForDay.length === 0) return null;
            return (
              <div key={day} className="bg-blue-50 rounded p-4 mb-4">
                <div className="font-semibold mb-2">{day} ({dateStr})</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  {bookingsForDay.map(b => (
                    <div key={b._id} className="bg-white rounded p-2 shadow">
                      <div className="font-bold capitalize">{b.mealId?.mealType}</div>
                      <div className="text-gray-600 text-sm">{Array.isArray(b.mealId?.items) ? b.mealId.items.map(i => i.name).join(', ') : ''}</div>
                      <div className="text-xs text-gray-500">Calories: {b.mealId?.totalCalories || 0} | Price: ₹{b.mealId?.price || 0} | {b.mealId?.isVegetarian ? 'Veg' : 'Non-Veg'}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Payments</h2>
          {payments.length === 0 ? (
            <div className="text-gray-500">No payments yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.slice(0, 5).map(payment => (
                    <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">₹{payment.amount}</td>
                      <td className="px-6 py-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
