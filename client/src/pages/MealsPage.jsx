import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, bookingsAPI, paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

const UPI_ID = "aryantanwarr@okaxis";
const UPI_NAME = "Aryan Tanwar";

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MealsPage = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [payModal, setPayModal] = useState({ open: false, amount: 0, mealNames: '', mealIds: [], day: '', dateStr: '' });
  const [payPendingModal, setPayPendingModal] = useState({ open: false, amount: 0, mealNames: '', bookingIds: [], date: '' });

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
      mealsAPI.getMyBookings()
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
      setBookings([...(bookingsRes.data.upcomingMeals || []), ...(bookingsRes.data.previousMeals || [])]);
    }).catch(() => {
      setMeals([]);
      setBookings([]);
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
  const canBookOrCancelDay = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return target > today;
  };
  const groupBookingsByDate = (bookings) => {
    const grouped = {};
    bookings.forEach(b => {
      const date = b.mealId?.date?.slice(0, 10);
      if (!date) return;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(b);
    });
    return grouped;
  };

  // Robust booking matching for a meal
  const getBookingForMeal = (meal) => {
    if (!meal) return null;
    return bookings.find(b => {
      if (!b.mealId) return false;
      const bookingMealId = typeof b.mealId === 'string' ? b.mealId : b.mealId._id;
      return String(bookingMealId) === String(meal._id);
    });
  };

  // Book all meals for a day and open payment modal
  const handleBookAndPayDay = async (day, meals) => {
    console.log('Booking for day:', day, 'meals:', meals);
    setBookingLoading(true);
    try {
      const dateStr = getDateForDay(day);
      const mealList = ['breakfast', 'lunch', 'dinner'].map(type => meals[type]).filter(Boolean);
      const ids = mealList.map(m => m._id);
      console.log('Meal list:', mealList, 'IDs:', ids);
      
      // Create pending bookings for all meals
      for (const meal of mealList) {
        await bookingsAPI.create({ 
          mealId: meal._id, 
          specialRequests: `Booked for ${day}`
        });
      }
      
      const total = mealList.reduce((sum, m) => sum + (m.price || 0), 0);
      const names = mealList.map(m => m.items?.map(i => i.name).join(', ') || m.description || '').join(' | ');
      setPayModal({ open: true, amount: total, mealNames: names, mealIds: ids, day, dateStr });
      
      // Refresh bookings to show pending status
      const res = await mealsAPI.getMyBookings();
      setBookings([...(res.data.upcomingMeals || []), ...(res.data.previousMeals || [])]);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error(err.response?.data?.error || 'Failed to book meals for the day');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle payment submission for new bookings
  const handlePaySubmit = async (txnId) => {
    try {
      const dueDate = new Date(payModal.dateStr);
      if (!txnId) throw new Error('Transaction ID is required');
      if (!payModal.amount || isNaN(payModal.amount) || payModal.amount <= 0) throw new Error('Amount is required and must be positive');
      if (!payModal.dateStr || isNaN(dueDate.getTime())) throw new Error('Due date is required and must be valid');
      if (!payModal.mealIds || !payModal.mealIds.length) throw new Error('Meal ID is required');
      for (const mealId of payModal.mealIds) {
        await paymentsAPI.createMealPayment({
          mealId,
          transactionId: txnId,
          amount: payModal.amount,
          paymentType: 'daily',
          paymentMethod: 'online',
          status: 'pending',
          description: `Meal payment for ${payModal.mealNames} (${payModal.day})`,
          dueDate: payModal.dateStr,
          month: dueDate.getMonth() + 1, // 1-12
          year: dueDate.getFullYear()
        });
      }
      setPayModal({ ...payModal, open: false });
      toast.success('Payment submitted! Your booking is confirmed.');
      
      // Refresh bookings
      const res = await mealsAPI.getMyBookings();
      setBookings([...(res.data.upcomingMeals || []), ...(res.data.previousMeals || [])]);
    } catch (err) {
      console.error('Payment error:', err, err.response?.data);
      toast.error(err.response?.data?.error || err.message || 'Failed to submit payment.');
    }
  };

  // Handle payment for pending bookings
  const handlePayPendingSubmit = async (txnId) => {
    try {
      const dueDate = new Date(payPendingModal.date);
      if (!txnId) throw new Error('Transaction ID is required');
      if (!payPendingModal.amount || isNaN(payPendingModal.amount) || payPendingModal.amount <= 0) throw new Error('Amount is required and must be positive');
      if (!payPendingModal.date || isNaN(dueDate.getTime())) throw new Error('Due date is required and must be valid');
      if (!payPendingModal.bookingIds || !payPendingModal.bookingIds.length) throw new Error('Booking ID is required');
      for (const bookingId of payPendingModal.bookingIds) {
        await paymentsAPI.createMealPayment({
          bookingId,
          transactionId: txnId,
          amount: payPendingModal.amount,
          paymentType: 'daily',
          paymentMethod: 'online',
          status: 'pending',
          description: `Meal payment for ${payPendingModal.mealNames} (${payPendingModal.date})`,
          dueDate: payPendingModal.date,
          month: dueDate.getMonth() + 1, // 1-12
          year: dueDate.getFullYear()
        });
      }
      setPayPendingModal({ ...payPendingModal, open: false });
      toast.success('Payment submitted! Your booking is confirmed.');
      
      // Refresh bookings
      const res = await mealsAPI.getMyBookings();
      setBookings([...(res.data.upcomingMeals || []), ...(res.data.previousMeals || [])]);
    } catch (err) {
      console.error('Payment error:', err, err.response?.data);
      toast.error(err.response?.data?.error || err.message || 'Failed to submit payment.');
    }
  };

  // Cancel all bookings for a day
  const handleCancelDay = async (bookings) => {
    setBookingLoading(true);
    try {
      for (const booking of bookings) {
        await bookingsAPI.delete(booking._id);
      }
      toast.success('All bookings for the day cancelled!');
      // Refresh bookings and meals
      const [mealsRes, bookingsRes] = await Promise.all([
        mealsAPI.getAll(),
        mealsAPI.getMyBookings()
      ]);
      let data = mealsRes.data.meals || mealsRes.data;
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setMeals(data);
      setBookings([...(bookingsRes.data.upcomingMeals || []), ...(bookingsRes.data.previousMeals || [])]);
    } catch (err) {
      toast.error('Failed to cancel bookings for the day');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Please log in to view meals.</div>;
  if (loading) return <div className="p-8 text-center">Loading meals...</div>;

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
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Book meals for any future day in the current week</p>
            </div>
            <div className="overflow-x-auto">
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
                  {weekMeals.map(({ day, meals }) => {
                    const dateStr = getDateForDay(day);
                    const isFuture = canBookOrCancelDay(dateStr);
                    return (
                      <tr key={day} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{day}</td>
                        {['breakfast', 'lunch', 'dinner'].map(type => {
                          const meal = meals[type];
                          const booking = getBookingForMeal(meal);
                          return (
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300" key={type}>
                              {meal ? (
                                <>
                                  {meal.items?.map(item => item.name).join(', ') || meal.description}
                                  <div className="text-xs text-gray-500">
                                    ₹{meal.price} | {meal.isVegetarian ? 'Veg' : 'Non-Veg'}
                                  </div>
                                  {booking && booking.status === 'booked' ? (
                                    <span className="text-green-600 font-semibold block">Booked</span>
                                  ) : (
                                    <button
                                      className="bg-gradient-to-r from-blue-500 to-green-600 text-white px-3 py-1 rounded mt-1 text-xs font-medium"
                                      onClick={() => handleBookAndPayDay(day, { [type]: meal })}
                                      disabled={!isFuture || bookingLoading}
                                    >
                                      {bookingLoading ? 'Booking...' : 'Book & Pay'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4">
                          {/* Day status column can be left as is or updated if needed */}
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

        {/* Upcoming Meals */}
        {user.role === 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No bookings yet. Book your first meal to get started!</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupBookingsByDate(bookings)).map(([date, dayBookings]) => {
                  const mealTypes = ['breakfast', 'lunch', 'dinner'];
                  const mealsForDay = mealTypes.map(type => dayBookings.find(b => b.mealId?.mealType === type)).filter(Boolean);
                  const status = getDayBookingStatus(
                    mealsForDay.reduce((acc, b) => { acc[b.mealId.mealType] = b.mealId; return acc; }, {}),
                    dayBookings
                  );
                  return (
                    <div key={date} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="font-semibold mb-2">
                        {new Date(date).toLocaleDateString()} - 
                        <span className={
                          status === 'booked' ? 'text-green-600' : 
                          status === 'pending' ? 'text-yellow-600' : 'text-gray-400'
                        }> {status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        {mealsForDay.map(b => (
                          <div key={b._id} className="bg-white dark:bg-gray-700 rounded p-2 shadow">
                            <div className="font-bold capitalize">{b.mealId?.mealType}</div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm">
                              {Array.isArray(b.mealId?.items) ? b.mealId.items.map(i => i.name).join(', ') : ''}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Calories: {b.mealId?.totalCalories || 0} | Price: ₹{b.mealId?.price || 0} | {b.mealId?.isVegetarian ? 'Veg' : 'Non-Veg'}
                            </div>
                            <div className="text-xs text-gray-400">Status: {b.status === 'completed' || b.status === 'paid' ? (
  <span className="text-green-600 font-bold">Paid</span>
) : b.status === 'pending_verification' ? (
  <span className="text-yellow-600 font-bold">Pending Verification</span>
) : b.status === 'pending' ? (
  <span className="text-yellow-600 font-bold">Pending Payment</span>
) : b.status}
</div>
                          </div>
                        ))}
                      </div>
                      {status === 'booked' && (
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                          onClick={() => handleCancelDay(dayBookings)}
                          disabled={bookingLoading || !canBookOrCancelDay(date)}
                        >
                          {bookingLoading ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                      {status === 'pending' && (
                        <button
                          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                          onClick={() => {
                            const pendingBookings = dayBookings.filter(b => b.status === 'pending');
                            const total = pendingBookings.reduce((sum, b) => sum + (b.mealId?.price || 0), 0);
                            const names = pendingBookings.map(b => b.mealId?.items?.map(i => i.name).join(', ') || b.mealId?.description || '').join(' | ');
                            setPayPendingModal({ open: true, amount: total, mealNames: names, bookingIds: pendingBookings.map(b => b._id), date });
                          }}
                          disabled={bookingLoading}
                        >
                          Pay Now
                        </button>
                      )}
                      {status === 'pending' && (
                        <span className="text-yellow-600 ml-4">Please complete payment to confirm booking.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Payment Modals */}
        <MealPayModal
          open={payModal.open}
          onClose={() => setPayModal({ ...payModal, open: false })}
          amount={payModal.amount}
          mealName={payModal.mealNames}
          onSubmit={handlePaySubmit}
        />

        <MealPayModal
          open={payPendingModal.open}
          onClose={() => setPayPendingModal({ ...payPendingModal, open: false })}
          amount={payPendingModal.amount}
          mealName={payPendingModal.mealNames}
          onSubmit={handlePayPendingSubmit}
        />
      </div>
    </div>
  );
};

function MealPayModal({ open, onClose, amount, mealName, onSubmit }) {
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&tn=${encodeURIComponent(mealName)}`;
  return (
    <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Scan to Pay via UPI</h2>
        <QRCode value={upiUrl} size={200} />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">UPI ID: <span className="font-mono">{UPI_ID}</span></p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Amount: <span className="font-bold">₹{amount}</span></p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Purpose: {mealName}</p>
        <input
          className="mt-4 border border-gray-300 dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          type="text"
          placeholder="Enter UPI Transaction/Ref ID after payment"
          value={txnId}
          onChange={e => setTxnId(e.target.value)}
          disabled={loading}
        />
        {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
        <div className="flex gap-2 mt-4 w-full">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1 disabled:opacity-50" 
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                if (!txnId) {
                  setError("Please enter the UPI Transaction/Ref ID.");
                  setLoading(false);
                  return;
                }
                await onSubmit(txnId);
                setTxnId("");
                onClose();
              } catch (err) {
                setError("Failed to submit payment. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button 
            className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 flex-1" 
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MealsPage; 