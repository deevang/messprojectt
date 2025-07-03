import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MealsPage = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [previousMeals, setPreviousMeals] = useState([]);
  const [upcomingMeals, setUpcomingMeals] = useState([]);

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
  }, [user]);
  // Remove stray 'socorrect them ' and ensure code is syntactically correct.
  // There is no error at $PLACEHOLDER$; the code is valid as is.
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

  if (!user) return <div className="p-8 text-center">Please log in to view meals.</div>;
  if (loading) return <div className="p-8 text-center">Loading meals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const getBookingForMeal = (mealId, bookingsArr) => bookingsArr.find(b => b.mealId && b.mealId._id === mealId && b.status === 'booked');

  return (
    <div className="p-8 max-w-3xl mx-auto bg-background dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Meals for This Week</h1>
      {user.role === 'admin' && (
        <div className="mb-4">
          <Link to="/admin/meals" className="text-blue-600 dark:text-blue-400 underline">Go to Meals Management</Link>
        </div>
      )}
      {(!meals || meals.length === 0) ? (
        <div className="text-gray-700 dark:text-gray-200">No meals found for this week.</div>
      ) : (
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
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
};

export default MealsPage; 