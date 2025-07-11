import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, bookingsAPI, paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

const UPI_ID = "aryantanwarr@okaxis";
const UPI_NAME = "Aryan Tanwar";

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

const MealsPage = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [dayBookings, setDayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [payModal, setPayModal] = useState({ open: false, amount: 0, mealNames: '', bookingIds: [], day: '', dateStr: '' });

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
      bookingsAPI.getDayBookingsByUser()
    ]).then(([mealsRes, bookingsRes]) => {
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
    }).catch(() => {
      setMeals([]);
      setDayBookings([]);
    }).finally(() => setLoading(false));
  }, [user]);

  // Helpers
  const canBookDay = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return target > today;
  };

  const getDayBooking = (dateStr) => {
    return dayBookings.find(booking => booking.date === dateStr);
  };

  const calculateDayTotal = (meals) => {
    return Object.values(meals).filter(Boolean).reduce((sum, meal) => sum + (meal.price || 0), 0);
  };

  const getDayMealNames = (meals) => {
    return Object.values(meals)
      .filter(Boolean)
      .map(meal => meal.items?.map(item => item.name).join(', ') || meal.description || '')
      .join(' | ');
  };

  // Book all meals for a day
  const handleBookDay = async (dateStr, meals) => {
    console.log('Booking day:', dateStr, 'meals:', meals);
    setBookingLoading(true);
    try {
      const response = await bookingsAPI.createDayBooking(dateStr, `Day booking for ${dateStr}`);
      const { totalAmount, bookings, mealCount } = response.data;
      
      const mealNames = getDayMealNames(meals);
      const bookingIds = bookings.map(b => b._id);
      
      setPayModal({ 
        open: true, 
        amount: totalAmount, 
        mealNames: mealNames, 
        bookingIds: bookingIds, 
        day: new Date(dateStr).toLocaleDateString('en-CA', { weekday: 'long' }), 
        dateStr 
      });
      
      // Refresh day bookings
      const bookingsRes = await bookingsAPI.getDayBookingsByUser();
      setDayBookings(bookingsRes.data || []);
      
      toast.success(`Successfully booked ${mealCount} meals for ${dateStr}`);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.response?.data?.error || 'Failed to book meals for the day');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle payment submission for day bookings
  const handlePaySubmit = async (txnId) => {
    try {
      const dueDate = new Date(payModal.dateStr);
      if (!txnId) throw new Error('Transaction ID is required');
      if (!payModal.amount || isNaN(payModal.amount) || payModal.amount <= 0) throw new Error('Amount is required and must be positive');
      if (!payModal.dateStr || isNaN(dueDate.getTime())) throw new Error('Due date is required and must be valid');
      if (!payModal.bookingIds || !payModal.bookingIds.length) throw new Error('Booking IDs are required');
      
      for (const bookingId of payModal.bookingIds) {
        await paymentsAPI.createMealPayment({
          bookingId,
          transactionId: txnId,
          amount: payModal.amount / payModal.bookingIds.length, // Split amount equally
          paymentType: 'daily',
          paymentMethod: 'online',
          status: 'pending',
          description: `Day meal payment for ${payModal.mealNames} (${payModal.day})`,
          dueDate: payModal.dateStr,
          month: dueDate.getMonth() + 1,
          year: dueDate.getFullYear()
        });
      }
      
      setPayModal({ ...payModal, open: false });
      toast.success('Payment submitted! Your day booking is confirmed.');
      
      // Refresh day bookings
      const bookingsRes = await bookingsAPI.getDayBookingsByUser();
      setDayBookings(bookingsRes.data || []);
    } catch (err) {
      console.error('Payment error:', err, err.response?.data);
      toast.error(err.response?.data?.error || err.message || 'Failed to submit payment.');
    }
  };

  if (!user) return <div className="p-8 text-center">Please log in to view meals.</div>;
  if (loading) return <div className="p-8 text-center">Loading meals...</div>;

  // Weekly Meal Plan structure
  const weekMeals = getNext7Days().map(dateStr => {
    const dayMeals = meals.filter(m => new Date(m.date).toLocaleDateString('en-CA') === dateStr);
    return {
      day: new Date(dateStr).toLocaleDateString('en-CA', { weekday: 'short' }),
      dateStr,
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Weekly Meals</h1>
          <p className="text-gray-600 dark:text-gray-300">Book and manage your meals for the week</p>
        </div>

        {user.role === 'admin' && (
          <div className="mb-6 text-center">
            <Link to="/admin/meals" className="text-blue-600 dark:text-blue-400 underline">Go to Meals Management</Link>
          </div>
        )}

        {/* Weekly Meal Plan Table */}
        {user.role === 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Meal Plan</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Book entire days of meals at once</p>
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {weekMeals.map(({ day, dateStr, meals }) => {
                    const isFuture = canBookDay(dateStr);
                    const dayBooking = getDayBooking(dateStr);
                    const totalAmount = calculateDayTotal(meals);
                    const hasMeals = Object.values(meals).some(meal => meal);
                    
                    return (
                      <tr key={dateStr} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{day}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{dateStr}</td>
                        {['breakfast', 'lunch', 'dinner'].map(type => {
                          const meal = meals[type];
                          return (
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300" key={type}>
                              {meal ? (
                                <>
                                  <div className="font-medium">{meal.items?.map(item => item.name).join(', ') || meal.description}</div>
                                  <div className="text-xs text-gray-500">
                                    ₹{meal.price} | {meal.isVegetarian ? 'Veg' : 'Non-Veg'}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          ₹{totalAmount}
                        </td>
                        <td className="px-6 py-4">
                          {!hasMeals ? (
                            <span className="text-gray-400 text-sm">No meals</span>
                          ) : dayBooking ? (
                            <span className={`font-semibold ${
                              dayBooking.status === 'booked' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {dayBooking.status === 'booked' ? 'Booked' : 'Pending Payment'}
                            </span>
                          ) : (
                            <button
                              className="bg-gradient-to-r from-blue-500 to-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:from-blue-600 hover:to-green-700 disabled:opacity-50"
                              onClick={() => handleBookDay(dateStr, meals)}
                              disabled={!isFuture || bookingLoading}
                            >
                              {bookingLoading ? 'Booking...' : 'Book Day'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Non-student view */}
        {user.role !== 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">All Meals</h2>
            {meals.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No meals found for this week.</div>
            ) : (
              <div className="space-y-4">
                {meals.map(meal => (
                  <div key={meal._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">
                      {meal.mealType ? (meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)) : 'Meal'} - {meal.date ? new Date(meal.date).toLocaleDateString() : ''}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                      {Array.isArray(meal.items) ? meal.items.map(i => i && i.name ? i.name : '').filter(Boolean).join(', ') : ''}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Calories: {meal.totalCalories || 0} | Price: ₹{meal.price || 0} | {meal.isVegetarian ? 'Veg' : 'Non-Veg'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Day Bookings */}
        {user.role === 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Day Bookings</h2>
            {dayBookings.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No day bookings yet. Book your first day to get started!</div>
            ) : (
              <div className="space-y-4">
                {dayBookings.map((dayBooking) => (
                  <div key={dayBooking.date} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
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
        )}

        {/* Payment Modal */}
        {payModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Complete Payment</h3>
              <div className="space-y-3 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Day:</span> {payModal.day}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Meals:</span> {payModal.mealNames}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  <span className="font-semibold">Amount:</span> ₹{payModal.amount}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="text-center mb-3">
                  <QRCode value={`upi://${UPI_ID}?am=${payModal.amount}&tn=Meal Payment`} size={150} />
                </div>
                <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                  <div>UPI ID: {UPI_ID}</div>
                  <div>Name: {UPI_NAME}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Transaction ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  id="transactionId"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const txnId = document.getElementById('transactionId').value;
                      handlePaySubmit(txnId);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Submit Payment
                  </button>
                  <button
                    onClick={() => setPayModal({ ...payModal, open: false })}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealsPage; 