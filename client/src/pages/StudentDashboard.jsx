import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealsAPI, bookingsAPI, paymentsAPI } from '../services/api';
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      booked: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" /> },
      consumed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> }
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
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      failed: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your meals, bookings, and payments from your dashboard.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Meals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMeals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">My Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Meals */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Available Meals</h2>
              <p className="text-sm text-gray-600">Book your meals for today and upcoming days</p>
            </div>
            <div className="p-6">
              {meals.length > 0 ? (
                <div className="space-y-4">
                  {meals.map((meal) => (
                    <div key={meal._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">{meal.mealType}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(meal.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {meal.items.map(item => item.name).join(', ')}
                          </p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-sm text-gray-600">
                              ₹{meal.price}
                            </span>
                            <span className="text-sm text-gray-600">
                              {meal.totalCalories} cal
                            </span>
                            {meal.isVegetarian && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Veg
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleBookMeal(meal._id)}
                          disabled={meal.currentBookings >= meal.maxCapacity}
                          className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {meal.currentBookings >= meal.maxCapacity ? 'Full' : 'Book'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No meals available at the moment</p>
                </div>
              )}
            </div>
          </div>

          {/* My Bookings */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Bookings</h2>
              <p className="text-sm text-gray-600">Track your meal bookings and consumption</p>
            </div>
            <div className="p-6">
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 capitalize">{booking.mealType}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.date).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        {booking.status === 'booked' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="btn-danger btn-sm"
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
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <p className="text-sm text-gray-600">Track your payment history and status</p>
          </div>
          <div className="p-6">
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.slice(0, 5).map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.paymentType} Payment
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.description || 'Mess fee payment'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{payment.amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
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
