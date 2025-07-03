import { useState, useEffect } from 'react';
import { bookingsAPI, mealsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, Utensils, CheckCircle, Search, Clock } from 'lucide-react';

const MessWorkerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('all');
  const [stats, setStats] = useState({
    totalBookings: 0,
    consumedBookings: 0,
    pendingBookings: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [date, mealType]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {
        date,
        type: mealType === 'all' ? undefined : mealType
      };
      const res = await bookingsAPI.getAll(params);
      setBookings(res.data.bookings || []);
      updateStats(res.data.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (bookings) => {
    const total = bookings.length;
    const consumed = bookings.filter(b => b.status === 'consumed').length;
    setStats({
      totalBookings: total,
      consumedBookings: consumed,
      pendingBookings: total - consumed
    });
  };

  const handleMarkAsConsumed = async (bookingId) => {
    try {
      await bookingsAPI.markAsConsumed(bookingId);
      toast.success('Meal marked as consumed!');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to mark as consumed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-background dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Mess Worker Dashboard</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm bg-background dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Meal Type</label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm bg-background dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchBookings} className="btn-primary w-full h-10">
              <Search className="w-4 h-4 mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Consumed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.consumedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Meal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">No bookings found</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.userId?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{booking.userId?.roomNumber || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.mealId?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{booking.mealId?.type || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'consumed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {booking.status === 'consumed' ? 'Consumed' : 'Booked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.status !== 'consumed' && (
                        <button
                          onClick={() => handleMarkAsConsumed(booking._id)}
                          className="btn-primary"
                        >
                          Mark as Consumed
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MessWorkerDashboard; 