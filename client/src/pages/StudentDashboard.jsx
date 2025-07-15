import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, paymentsAPI, bookingsAPI } from '../services/api';

function getNext7Days() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toLocaleDateString('en-CA'));
  }
  return days;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [dayBookings, setDayBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDay, setSearchDay] = useState('');
  const [searchPayment, setSearchPayment] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    const startDate = startOfWeek.toLocaleDateString('en-CA');
    const endDate = endOfWeek.toLocaleDateString('en-CA');
    Promise.all([
      mealsAPI.getAll({ startDate, endDate }),
      bookingsAPI.getDayBookingsByUser(),
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
      setDayBookings(bookingsRes.data || []);
      setPayments(paymentsRes.data || []);
    }).catch(() => {
      setMeals([]);
      setDayBookings([]);
      setPayments([]);
    }).finally(() => setLoading(false));
  }, [user]);

  // Stats
  const totalMeals = meals.length;
  const totalDayBookings = dayBookings.filter(b => b.status === 'booked').length;
  const totalPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

  // Weekly Meal Plan structure
  const weekMeals = getNext7Days().map(dateStr => {
    const dayMeals = meals.filter(m => new Date(m.date).toLocaleDateString('en-CA') === dateStr);
    return {
      dateStr,
      day: new Date(dateStr).toLocaleDateString('en-CA', { weekday: 'short' }),
      meals: {
        breakfast: dayMeals.find(m => m.mealType === 'breakfast'),
        lunch: dayMeals.find(m => m.mealType === 'lunch'),
        dinner: dayMeals.find(m => m.mealType === 'dinner'),
      }
    };
  });

  const getDayBooking = (dateStr) => {
    return dayBookings.find(booking => booking.date === dateStr);
  };

  const calculateDayTotal = (meals) => {
    return Object.values(meals).filter(Boolean).reduce((sum, meal) => sum + (meal.price || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Meals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMeals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmed Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDayBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Meal Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly Meal Plan</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Breakfast</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lunch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {getNext7Days().map(dateStr => {
                  const dayMeals = meals.filter(m => new Date(m.date).toLocaleDateString('en-CA') === dateStr);
                  const mealsObj = {
                    breakfast: dayMeals.find(m => m.mealType === 'breakfast'),
                    lunch: dayMeals.find(m => m.mealType === 'lunch'),
                    dinner: dayMeals.find(m => m.mealType === 'dinner'),
                  };
                  const dayBooking = getDayBooking(dateStr);
                  const totalAmount = calculateDayTotal(mealsObj);
                  
                  return (
                    <tr key={dateStr} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{new Date(dateStr).toLocaleDateString('en-CA', { weekday: 'short' })}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{dateStr}</td>
                      {['breakfast', 'lunch', 'dinner'].map(type => (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300" key={type}>
                          {mealsObj[type]?.items?.map(item => item.name).join(', ') || mealsObj[type]?.description || <span className="text-gray-400">-</span>}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                        ₹{totalAmount}
                      </td>
                      <td className="px-6 py-4">
                        {dayBooking ? (
                          <span className={`font-semibold ${
                            dayBooking.status === 'booked' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {dayBooking.status === 'booked' ? 'Booked' : 'Pending Payment'}
                          </span>
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

        {/* My Day Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Day Bookings</h2>
          <input
            type="text"
            placeholder="Find by day or date (e.g. Monday or 2025-07-13)"
            value={searchDay}
            onChange={e => setSearchDay(e.target.value)}
            className="mb-4 px-3 py-2 border rounded w-full max-w-xs text-sm"
          />
          {dayBookings.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No day bookings yet. Book your first day to get started!</div>
          ) : (
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {dayBookings
                .filter(dayBooking => {
                  if (!searchDay) return true;
                  const dayName = new Date(dayBooking.date).toLocaleDateString('en-US', { weekday: 'long' });
                  return dayName.toLowerCase().includes(searchDay.toLowerCase()) ||
                    dayBooking.date.includes(searchDay);
                })
                .map((dayBooking) => (
                  <div key={dayBooking.date} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-semibold text-lg">
                        {new Date(dayBooking.date).toLocaleDateString('en-CA', { weekday: 'long' })} ({dayBooking.date})
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dayBooking.status === 'booked' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dayBooking.status === 'booked' ? 'Confirmed' : 'Pending Payment'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {dayBooking.bookings.map(booking => (
                        <div key={booking._id} className="bg-white dark:bg-gray-700 rounded p-3 shadow">
                          <div className="font-bold capitalize text-sm">{booking.mealId?.mealType}</div>
                          <div className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                            {Array.isArray(booking.mealId?.items) ? booking.mealId.items.map(i => i.name).join(', ') : ''}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ₹{booking.mealId?.price || 0} | {booking.mealId?.isVegetarian ? 'Veg' : 'Non-Veg'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold">{dayBooking.mealCount} meals</span> for the day
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        Total: ₹{dayBooking.totalAmount}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Payments</h2>
          <input
            type="text"
            placeholder="Find by meal day, meal date, payment date, or amount"
            value={searchPayment}
            onChange={e => setSearchPayment(e.target.value)}
            className="mb-4 px-3 py-2 border rounded w-full max-w-xs text-sm"
          />
          {payments.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No payments found.</div>
          ) : (
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {Object.entries(
                payments.reduce((acc, payment) => {
                  // Use payment.dueDate as the meal day, fallback to createdAt
                  const mealDateRaw = payment.dueDate || payment.createdAt;
                  const mealDateObj = new Date(mealDateRaw);
                  const mealDate = mealDateObj.toISOString().slice(0, 10); // Always YYYY-MM-DD
                  if (!acc[mealDate]) acc[mealDate] = { ...payment, amount: 0, mealDateRaw };
                  acc[mealDate].amount += payment.amount;
                  return acc;
                }, {})
              )
                .filter(([mealDate, payment]) => {
                  if (!searchPayment) return true;
                  const mealDayName = new Date(payment.mealDateRaw).toLocaleDateString('en-US', { weekday: 'long' });
                  const paymentDate = new Date(payment.createdAt).toISOString().slice(0, 10);
                  return mealDayName.toLowerCase().includes(searchPayment.toLowerCase()) ||
                    mealDate.includes(searchPayment) ||
                    paymentDate.includes(searchPayment) ||
                    String(payment.amount).includes(searchPayment);
                })
                .slice(0, 50)
                .map(([mealDate, payment]) => {
                  const dayName = new Date(payment.mealDateRaw).toLocaleDateString('en-US', { weekday: 'long' });
                  const paymentDate = new Date(payment.createdAt).toISOString().slice(0, 10);
                  return (
                    <div key={mealDate} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Day meal payment ({dayName}, {mealDate})</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Payment date: {paymentDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">₹{payment.amount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
