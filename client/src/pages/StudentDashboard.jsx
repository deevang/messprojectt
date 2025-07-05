import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, bookingsAPI, paymentsAPI, weeklyMealPlanAPI } from '../services/api';
import { 
  Utensils, 
  Calendar, 
  CreditCard, 
  User, 
  Clock, 
  Star,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeals: 0,
    totalBookings: 0,
    totalPayments: 0,
    pendingPayments: 0
  });
  const [weekMeals, setWeekMeals] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchWeekMeals();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [mealsRes, bookingsRes, paymentsRes] = await Promise.all([
        mealsAPI.getAll({ limit: 5 }),
        bookingsAPI.getByUser(),
        paymentsAPI.getByUser()
      ]);

      setMeals(mealsRes.data.meals || []);
      setBookings(bookingsRes.data || []);
      setPayments(paymentsRes.data || []);

      // Calculate stats
      const pendingPayments = paymentsRes.data.filter(p => p.status === 'pending').length;
      setStats({
        totalMeals: mealsRes.data.total || 0,
        totalBookings: bookingsRes.data.length,
        totalPayments: paymentsRes.data.length,
        pendingPayments
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekMeals = async () => {
    try {
      // Get meals for the current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
      const startDate = startOfWeek.toISOString().slice(0, 10);
      const endDate = endOfWeek.toISOString().slice(0, 10);
      const res = await mealsAPI.getAll({ startDate, endDate });
      let data = res.data.meals || res.data;
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA - dateB !== 0) return dateA - dateB;
        return (a.mealType || '').localeCompare(b.mealType || '');
      });
      setWeekMeals(data);
    } catch (err) {
      setWeekMeals([]);
    }
  };

  const handleBookMeal = async (mealId) => {
    try {
      await mealsAPI.book(mealId);
      toast.success('Meal booked successfully!');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to book meal';
      toast.error(message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await mealsAPI.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully!');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to cancel booking';
      toast.error(message);
    }
  };

  const handleBookToday = async () => {
    try {
      const res = await bookingsAPI.bookTodayFromPlan();
      if (res.data.paymentRequired) {
        toast.success('Proceed to payment to complete booking.');
        // Redirect to payment page or open payment modal here
      } else {
        toast.success('Today\'s meal booked!');
      }
      fetchDashboardData();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to book today\'s meal';
      toast.error(message);
    }
  };

  const handleBookWeek = async () => {
    try {
      const res = await bookingsAPI.bookWeekFromPlan();
      if (res.data.paymentRequired) {
        toast.success('Proceed to payment to complete booking.');
        // Redirect to payment page or open payment modal here
      } else {
        toast.success('Meals for the week booked!');
      }
      fetchDashboardData();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to book meals for the week';
      toast.error(message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      booked: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <Clock className="w-4 h-4" /> },
      consumed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle className="w-4 h-4" /> },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <XCircle className="w-4 h-4" /> }
    };
    
    const config = statusConfig[status] || statusConfig.booked;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <AlertCircle className="w-4 h-4" /> },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle className="w-4 h-4" /> },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <XCircle className="w-4 h-4" /> }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Meals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMeals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">My Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Meal Plan (Read-only) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Standard Meals</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">View the standard meal plan for the week and book your meals</p>
          </div>
          {planLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto mb-6">
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
                    {weekMeals.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-8 text-gray-500 dark:text-gray-400">No meals available for this week.</td></tr>
                    ) : weekMeals.map(meal => (
                      <tr key={meal._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{new Date(meal.date).toLocaleDateString()}<br/>{meal.mealType}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{meal.items?.map(item => item.name).join(', ') || meal.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">₹{meal.price}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{meal.isVegetarian ? 'Veg' : 'Non-Veg'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4">
                <button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md" 
                  onClick={handleBookToday}
                >
                  Book Today's Meal
                </button>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Bookings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Track your meal bookings and consumption</p>
            </div>
            <div className="p-6">
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white capitalize">{booking.mealType}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(booking.date).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        {booking.status === 'booked' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bookings yet</p>
                  <p className="text-sm text-gray-400">Book your first meal to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Payments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Track your payment history and status</p>
          </div>
          <div className="p-6">
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                          {payments.slice(0, 5).map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {payment.paymentType} Payment
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {payment.description || 'Mess fee payment'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">₹{payment.amount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentStatusBadge(payment.status)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payments yet</p>
                <p className="text-sm text-gray-400">Your payment history will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
