import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, bookingsAPI, paymentsAPI, weeklyMealPlanAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

const UPI_ID = "your-upi-id@bank"; // Replace with your UPI ID
const UPI_NAME = "Your Name";      // Replace with your name

const MealsPage = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [previousMeals, setPreviousMeals] = useState([]);
  const [upcomingMeals, setUpcomingMeals] = useState([]);
  const [payModal, setPayModal] = useState({ open: false, amount: 0, mealName: "", mealId: null });
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [payDayModal, setPayDayModal] = useState({ open: false, amount: 0, mealNames: '', mealIds: [], day: '' });

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Calculate week range inside effect to avoid stale values
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday

    const startDate = startOfWeek.toISOString().slice(0, 10);
    const endDate = endOfWeek.toISOString().slice(0, 10);

    mealsAPI.getAll({ startDate, endDate })
      .then(res => {
        let data = res.data.meals || res.data;
        if (!Array.isArray(data)) data = [];
        // Sort meals by date and mealType for better UX
        data.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA - dateB !== 0) return dateA - dateB;
          return (a.mealType || '').localeCompare(b.mealType || '');
        });
        setMeals(data);
      })
      .catch((err) => {
        setError('Failed to load meals');
        console.error('Meals API error:', err);
      })
      .finally(() => setLoading(false));

    if (user.role === 'student') {
      mealsAPI.getMyBookings()
        .then(res => {
          setPreviousMeals(res.data.previousMeals || []);
          setUpcomingMeals(res.data.upcomingMeals || []);
          console.log('Fetched previousMeals:', res.data.previousMeals);
          console.log('Fetched upcomingMeals:', res.data.upcomingMeals);
        })
        .catch((err) => {
          setPreviousMeals([]);
          setUpcomingMeals([]);
          console.error('MyBookings API error:', err);
        });
    }

    fetchWeeklyPlan();
  }, [user]);

  const fetchWeeklyPlan = async () => {
    setPlanLoading(true);
    try {
      const res = await weeklyMealPlanAPI.getWeeklyPlan();
      setWeeklyPlan(res.data.meals || []);
    } catch (err) {
      setWeeklyPlan([]);
    } finally {
      setPlanLoading(false);
    }
  };

  const canBookDay = (dayIdx) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ...
    // Allow booking for today or tomorrow only
    return dayIdx === dayOfWeek || dayIdx === ((dayOfWeek + 1) % 7);
  };

  const handleBookMeal = async (day, mealType) => {
    try {
      // Create a booking for the specific meal from the weekly plan
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ...
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDay = dayNames.indexOf(day.day);
      
      // Calculate the date for the target day
      const daysUntilTarget = (targetDay - dayOfWeek + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      
      // Create a meal booking for this specific meal
      const bookingData = {
        date: targetDate.toISOString().split('T')[0],
        mealType: mealType,
        specialRequests: `Booked from weekly plan: ${day[mealType]}`,
        fromWeeklyPlan: true,
        weeklyPlanMeal: day[mealType]
      };
      
      // Call the booking API
      await bookingsAPI.create(bookingData);
      toast.success(`Booked ${mealType} for ${day.day}: ${day[mealType]}`);
      
      // Refresh bookings
      const res = await mealsAPI.getMyBookings();
      setPreviousMeals(res.data.previousMeals || []);
      setUpcomingMeals(res.data.upcomingMeals || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book meal from weekly plan');
    }
  };

  const handleBook = async (mealId) => {
    setBookingLoading(true);
    try {
      await mealsAPI.book(mealId, {});
      toast.success('Meal booked!');
      const res = await mealsAPI.getMyBookings();
      setPreviousMeals(res.data.previousMeals || []);
      setUpcomingMeals(res.data.upcomingMeals || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setBookingLoading(true);
    try {
      await bookingsAPI.delete(bookingId);
      toast.success('Booking cancelled!');
      const res = await mealsAPI.getMyBookings();
      setPreviousMeals(res.data.previousMeals || []);
      setUpcomingMeals(res.data.upcomingMeals || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancel failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayClick = (meal) => {
    setPayModal({ open: true, amount: meal.price, mealName: meal.name, mealId: meal._id });
  };

  const handlePaySubmit = async (txnId) => {
    try {
      await paymentsAPI.createMealPayment({
        mealId: payModal.mealId,
        transactionId: txnId,
        amount: payModal.amount,
        paymentType: 'daily',
        paymentMethod: 'online',
        status: 'pending',
        description: `Meal payment for ${payModal.mealName}`
      });
      setPayModal({ ...payModal, open: false });
      toast.success('Payment submitted! It will be verified soon.');
    } catch (err) {
      toast.error('Failed to submit payment.');
    }
  };

  const handlePayDayClick = (day, meals) => {
    // Calculate total price and meal names/ids for the day
    const mealList = ['breakfast', 'lunch', 'dinner'].map(type => meals[type]).filter(Boolean);
    const total = mealList.reduce((sum, m) => sum + (m.price || 0), 0);
    const names = mealList.map(m => m.items?.map(i => i.name).join(', ') || m.description || '').join(' | ');
    const ids = mealList.map(m => m._id);
    setPayDayModal({ open: true, amount: total, mealNames: names, mealIds: ids, day });
  };

  const handlePayDaySubmit = async (txnId) => {
    try {
      // Create a payment for all meals in payDayModal.mealIds
      for (const mealId of payDayModal.mealIds) {
        await paymentsAPI.createMealPayment({
          mealId,
          transactionId: txnId,
          amount: payDayModal.amount, // Optionally divide by number of meals if needed
          paymentType: 'daily',
          paymentMethod: 'online',
          status: 'pending',
          description: `Meal payment for ${payDayModal.mealNames} (${payDayModal.day})`
        });
      }
      setPayDayModal({ ...payDayModal, open: false });
      toast.success('Payment submitted! It will be verified soon.');
    } catch (err) {
      toast.error('Failed to submit payment.');
    }
  };

  if (!user) return <div className="p-8 text-center">Please log in to view meals.</div>;
  if (loading) return <div className="p-8 text-center">Loading meals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const getBookingForMeal = (mealId, bookingsArr) => bookingsArr.find(b => b.mealId && b.mealId._id === mealId && b.status === 'booked');

  // 1. Group meals by day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

  // 2. Add a function to book all meals for a day
  const handleBookAndPayDay = async (day, meals) => {
    setBookingLoading(true);
    try {
      // Set the date for the selected day
      const today = new Date();
      const currentDayIdx = today.getDay();
      const targetDayIdx = daysOfWeek.indexOf(day);
      const daysUntilTarget = (targetDayIdx - currentDayIdx + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      // Book all meals for that day
      await bookingsAPI.bookTodayFromPlan({ date: targetDate });
      // Calculate total price and meal names/ids for the day
      const mealList = ['breakfast', 'lunch', 'dinner'].map(type => meals[type]).filter(Boolean);
      const total = mealList.reduce((sum, m) => sum + (m.price || 0), 0);
      const names = mealList.map(m => m.items?.map(i => i.name).join(', ') || m.description || '').join(' | ');
      const ids = mealList.map(m => m._id);
      setPayDayModal({ open: true, amount: total, mealNames: names, mealIds: ids, day });
      // Refresh bookings
      const res = await mealsAPI.getMyBookings();
      setPreviousMeals(res.data.previousMeals || []);
      setUpcomingMeals(res.data.upcomingMeals || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book and pay for the day');
    } finally {
      setBookingLoading(false);
    }
  };

  // Helper: Get all bookings for a given day (by date string, e.g. '2024-06-09')
  const getBookingsForDay = (dateStr) => {
    const allBookings = [...upcomingMeals, ...previousMeals];
    return allBookings.filter(b => b.mealId && b.mealId.date && b.mealId.date.slice(0, 10) === dateStr && b.status === 'booked');
  };

  // Helper: Check if all meals for a day are booked (and paid, if needed)
  const isDayFullyBooked = (meals, bookings) => {
    // Only count meal slots that exist for the day
    const mealTypes = ['breakfast', 'lunch', 'dinner'].filter(type => meals[type]);
    return mealTypes.every(type => bookings.some(b => b.mealId && b.mealId.mealType === type));
  };

  // Helper: Get the date string for a given day name (e.g. 'Monday') in the current week
  const getDateForDay = (dayName) => {
    const today = new Date();
    const currentDayIdx = today.getDay();
    const targetDayIdx = daysOfWeek.indexOf(dayName);
    const daysUntilTarget = (targetDayIdx - currentDayIdx + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate.toISOString().slice(0, 10);
  };

  // Cancel all bookings for a day
  const handleCancelDay = async (day, meals) => {
    setBookingLoading(true);
    try {
      const dateStr = getDateForDay(day);
      const bookings = getBookingsForDay(dateStr);
      // Only cancel bookings for the meal slots that exist for the day
      const mealTypes = ['breakfast', 'lunch', 'dinner'].filter(type => meals[type]);
      const bookingsToCancel = bookings.filter(b => mealTypes.includes(b.mealId.mealType));
      for (const booking of bookingsToCancel) {
        await bookingsAPI.delete(booking._id);
      }
      toast.success('All bookings for the day cancelled!');
      // Refresh bookings
      const res = await mealsAPI.getMyBookings();
      setPreviousMeals(res.data.previousMeals || []);
      setUpcomingMeals(res.data.upcomingMeals || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel bookings for the day');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-background dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Meals for This Week</h1>
      {user.role === 'admin' && (
        <div className="mb-4">
          <Link to="/admin/meals" className="text-blue-600 dark:text-blue-400 underline">Go to Meals Management</Link>
        </div>
      )}

      {/* Weekly Meal Plan Section */}
      {user.role === 'student' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Weekly Meal Plan</h2>
          {planLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Breakfast</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lunch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinner</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {weekMeals.map(({ day, meals }) => {
                    const dateStr = getDateForDay(day);
                    const bookings = getBookingsForDay(dateStr);
                    const fullyBooked = isDayFullyBooked(meals, bookings);
                    return (
                      <tr key={day} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{day}</td>
                        {['breakfast', 'lunch', 'dinner'].map(type => (
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300" key={type}>
                            {meals[type]?.items?.map(item => item.name).join(', ') || meals[type]?.description || <span className="text-gray-400">-</span>}
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          {fullyBooked ? (
                            <button
                              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium shadow-md"
                              onClick={() => handleCancelDay(day, meals)}
                              disabled={bookingLoading}
                            >
                              Cancel Booking
                            </button>
                          ) : (
                            <button
                              className="bg-gradient-to-r from-blue-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md"
                              onClick={() => handleBookAndPayDay(day, meals)}
                              disabled={bookingLoading}
                            >
                              Book & Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {user.role !== 'student' && ((meals && meals.length > 0) ? (
        <div className="space-y-4">
          {meals.map(meal => (
            <div key={meal._id || meal.id || Math.random()} className="bg-white dark:bg-gray-900 shadow rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between transition-colors duration-300">
              <div>
                <div className="font-semibold text-lg text-gray-900 dark:text-white">{meal.mealType ? (meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)) : 'Meal'} - {meal.date ? new Date(meal.date).toLocaleDateString() : ''}</div>
                <div className="text-gray-600 dark:text-gray-300">{Array.isArray(meal.items) ? meal.items.map(i => i && i.name ? i.name : '').filter(Boolean).join(', ') : ''}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Calories: {meal.totalCalories || 0} | Price: ₹{meal.price || 0} | {meal.isVegetarian ? 'Veg' : 'Non-Veg'}</div>
                {meal.description && <div className="text-xs text-gray-400 dark:text-gray-300 mt-1">{meal.description}</div>}
              </div>
              <div className="mt-2 md:mt-0 flex flex-col items-end">
                {user.role === 'student' && (
                  getBookingForMeal(meal._id, upcomingMeals.concat(previousMeals)) ? (
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50"
                      onClick={() => handleCancel(getBookingForMeal(meal._id)._id)}
                      disabled={bookingLoading}
                    >
                      Cancel Booking
                    </button>
                  ) : (
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                      onClick={() => handleBook(meal._id)}
                      disabled={bookingLoading || !meal.isAvailable || (meal.currentBookings && meal.maxCapacity && meal.currentBookings >= meal.maxCapacity)}
                    >
                      {meal.isAvailable && (!meal.currentBookings || !meal.maxCapacity || meal.currentBookings < meal.maxCapacity) ? 'Book Meal' : 'Full/Unavailable'}
                    </button>
                  )
                )}
                {user.role === 'mess_staff' && (
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 mt-2"
                    onClick={() => toast('Mark as served (coming soon)')}
                    disabled
                  >
                    Mark as Served
                  </button>
                )}
                {user.role === 'student' && (
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded"
                    onClick={() => handlePayClick(meal)}
                  >
                    Pay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-700 dark:text-gray-200">No meals found for this week.</div>
      ))}

      {user.role === 'student' && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-2">Upcoming Meals</h2>
          {upcomingMeals.length === 0 ? (
            <div className="text-gray-500">No upcoming meals booked.</div>
          ) : (
            <div className="space-y-4">
              {upcomingMeals.map(booking => (
                <div key={booking._id} className="bg-blue-50 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold">{booking.mealId?.mealType ? (booking.mealId.mealType.charAt(0).toUpperCase() + booking.mealId.mealType.slice(1)) : ''} - {booking.mealId?.date ? new Date(booking.mealId.date).toLocaleDateString() : ''}</div>
                    <div className="text-gray-600">{Array.isArray(booking.mealId?.items) ? booking.mealId.items.map(i => i.name).join(', ') : ''}</div>
                    <div className="text-sm text-gray-500">Calories: {booking.mealId?.totalCalories || 0} | Price: ₹{booking.mealId?.price || 0} | {booking.mealId?.isVegetarian ? 'Veg' : 'Non-Veg'}</div>
                  </div>
                  <div className="mt-2 md:mt-0 flex flex-col items-end">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                      onClick={() => handleCancel(booking._id)}
                      disabled={bookingLoading}
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {user.role === 'student' && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-2">Previous Meals</h2>
          {previousMeals.length === 0 ? (
            <div className="text-gray-500">No previous meals found.</div>
          ) : (
            <div className="space-y-4">
              {previousMeals.map(booking => (
                <div key={booking._id} className="bg-gray-100 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold">{booking.mealId?.mealType ? (booking.mealId.mealType.charAt(0).toUpperCase() + booking.mealId.mealType.slice(1)) : ''} - {booking.mealId?.date ? new Date(booking.mealId.date).toLocaleDateString() : ''}</div>
                    <div className="text-gray-600">{Array.isArray(booking.mealId?.items) ? booking.mealId.items.map(i => i.name).join(', ') : ''}</div>
                    <div className="text-sm text-gray-500">Calories: {booking.mealId?.totalCalories || 0} | Price: ₹{booking.mealId?.price || 0} | {booking.mealId?.isVegetarian ? 'Veg' : 'Non-Veg'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Meal Plan for Students */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Meal Plan</h2>
        {planLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200 mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Breakfast</th>
                  <th className="px-4 py-2">Lunch</th>
                  <th className="px-4 py-2">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {weeklyPlan.map((day, idx) => (
                  <tr key={day.day}>
                    <td className="px-4 py-2 font-bold">{day.day}</td>
                    <td className="px-4 py-2 flex items-center gap-2">{day.breakfast}
                      {canBookDay(idx) && <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleBookMeal(day, 'breakfast')}>Book</button>}
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">{day.lunch}
                      {canBookDay(idx) && <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleBookMeal(day, 'lunch')}>Book</button>}
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">{day.dinner}
                      {canBookDay(idx) && <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleBookMeal(day, 'dinner')}>Book</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <MealPayModal
        open={payModal.open}
        onClose={() => setPayModal({ ...payModal, open: false })}
        amount={payModal.amount}
        mealName={payModal.mealName}
        onSubmit={handlePaySubmit}
      />

      <MealPayModal
        open={payDayModal.open}
        onClose={() => setPayDayModal({ ...payDayModal, open: false })}
        amount={payDayModal.amount}
        mealName={payDayModal.mealNames}
        onSubmit={handlePayDaySubmit}
      />
    </div>
  );
};

function MealPayModal({ open, onClose, amount, mealName, onSubmit }) {
  const [txnId, setTxnId] = useState("");
  if (!open) return null;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&tn=${encodeURIComponent(mealName)}`;
  return (
    <div className="modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">Scan to Pay via UPI</h2>
        <QRCode value={upiUrl} size={200} />
        <p className="mt-2">UPI ID: <span className="font-mono">{UPI_ID}</span></p>
        <p>Amount: <span className="font-bold">₹{amount}</span></p>
        <p>Purpose: {mealName}</p>
        <input
          className="mt-4 border p-2 rounded w-full"
          type="text"
          placeholder="Enter UPI Transaction/Ref ID after payment"
          value={txnId}
          onChange={e => setTxnId(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => onSubmit(txnId)}>Submit</button>
          <button className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default MealsPage; 