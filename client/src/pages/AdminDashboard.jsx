import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentsAPI, mealsAPI, paymentsAPI } from '../services/api';
import { 
  Users, 
  Utensils, 
  CreditCard, 
  Calendar,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [recentStudents, setRecentStudents] = useState([]);
  const [upcomingMeals, setUpcomingMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMeals: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  // State for editable weekly meals
  const [weeklyMeals, setWeeklyMeals] = useState([
    { day: 'Monday', breakfast: 'Poha', lunch: 'Dal Rice', dinner: 'Paneer Curry' },
    { day: 'Tuesday', breakfast: 'Idli', lunch: 'Rajma Rice', dinner: 'Aloo Gobi' },
    { day: 'Wednesday', breakfast: 'Paratha', lunch: 'Chole Rice', dinner: 'Mix Veg' },
    { day: 'Thursday', breakfast: 'Upma', lunch: 'Sambar Rice', dinner: 'Kofta' },
    { day: 'Friday', breakfast: 'Dosa', lunch: 'Kadhi Rice', dinner: 'Bhindi Masala' },
    { day: 'Saturday', breakfast: 'Sandwich', lunch: 'Veg Pulao', dinner: 'Dal Makhani' },
    { day: 'Sunday', breakfast: 'Puri Bhaji', lunch: 'Paneer Rice', dinner: 'Veg Biryani' },
  ]);
  const [editMealIdx, setEditMealIdx] = useState(null);
  const [editMeal, setEditMeal] = useState({ breakfast: '', lunch: '', dinner: '' });

  const handleEditMeal = (idx) => {
    setEditMealIdx(idx);
    setEditMeal({
      breakfast: weeklyMeals[idx].breakfast,
      lunch: weeklyMeals[idx].lunch,
      dinner: weeklyMeals[idx].dinner,
    });
  };

  const handleDeleteMeal = (idx) => {
    setWeeklyMeals(prev =>
      prev.filter((_, i) => i !== idx)
    );
    if (editMealIdx === idx) setEditMealIdx(null);
  };

  const handleSaveMeal = (e) => {
    e.preventDefault();
    setWeeklyMeals(prev =>
      prev.map((meal, i) =>
        i === editMealIdx ? { ...meal, ...editMeal } : meal
      )
    );
    setEditMealIdx(null);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [studentStatsRes, mealStatsRes, paymentStatsRes, recentStudentsRes, upcomingMealsRes] = await Promise.all([
        studentsAPI.getStats(),
        mealsAPI.getStats(),
        paymentsAPI.getStats(),
        studentsAPI.getAll({ limit: 5, sort: '-joinDate' }),
        mealsAPI.getAll({ limit: 5, sort: 'date' })
      ]);

      setStats({
        totalStudents: studentStatsRes.data.totalStudents || 0,
        totalMeals: mealStatsRes.data.totalMeals || 0,
        totalBookings: mealStatsRes.data.totalBookings || 0,
        totalRevenue: paymentStatsRes.data.totalRevenue || 0,
      });

      setRecentStudents(recentStudentsRes.data.students || []);
      setUpcomingMeals(upcomingMealsRes.data.meals || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome back, {user?.name}!</p>
        </div>

        {/* Quick Actions - moved to top */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/students" className="flex items-center justify-center p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              <Users className="w-5 h-5 mr-2" />
              Manage Students
            </Link>
            <Link to="/admin/meals" className="flex items-center justify-center p-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <Utensils className="w-5 h-5 mr-2" />
              Add Meal
            </Link>
            <Link to="/admin/payments" className="flex items-center justify-center p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
              <CreditCard className="w-5 h-5 mr-2" />
              View Payments
            </Link>
            <Link to="/admin/feedback" className="flex items-center justify-center p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              <MessageSquare className="w-5 h-5 mr-2" />
              View Feedback
            </Link>
          </div>
        </div>

        {/* Weekly Standard Meals */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Standard Meals</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Breakfast</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Lunch</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Dinner</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { day: 'Monday', breakfast: 'Poha', lunch: 'Dal Rice', dinner: 'Paneer Curry' },
                  { day: 'Tuesday', breakfast: 'Idli', lunch: 'Rajma Rice', dinner: 'Aloo Gobi' },
                  { day: 'Wednesday', breakfast: 'Paratha', lunch: 'Chole Rice', dinner: 'Mix Veg' },
                  { day: 'Thursday', breakfast: 'Upma', lunch: 'Sambar Rice', dinner: 'Kofta' },
                  { day: 'Friday', breakfast: 'Dosa', lunch: 'Kadhi Rice', dinner: 'Bhindi Masala' },
                  { day: 'Saturday', breakfast: 'Sandwich', lunch: 'Veg Pulao', dinner: 'Dal Makhani' },
                  { day: 'Sunday', breakfast: 'Puri Bhaji', lunch: 'Paneer Rice', dinner: 'Veg Biryani' },
                ].map((meal) => (
                  <tr key={meal.day}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{meal.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{meal.breakfast}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{meal.lunch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{meal.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
            Students can select their preferred meals for the week from this standard menu.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Meals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMeals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Weekly Standard Meals */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Standard Meals</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Breakfast</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lunch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinner</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {weeklyMeals.map((meal, idx) => (
                  <tr key={meal.day}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{meal.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{meal.breakfast}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{meal.lunch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{meal.dinner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        className="mr-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700"
                        onClick={() => handleEditMeal(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700"
                        onClick={() => handleDeleteMeal(idx)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
            Students can select their preferred meals for the week from this standard menu.
          </p>
        </div>

        {/* Edit Meal Modal */}
        {editMealIdx !== null && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Meal for {weeklyMeals[editMealIdx].day}</h3>
              <form
                onSubmit={handleSaveMeal}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Breakfast</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md p-2"
                    value={editMeal.breakfast}
                    onChange={e => setEditMeal({ ...editMeal, breakfast: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lunch</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md p-2"
                    value={editMeal.lunch}
                    onChange={e => setEditMeal({ ...editMeal, lunch: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dinner</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md p-2"
                    value={editMeal.dinner}
                    onChange={e => setEditMeal({ ...editMeal, dinner: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setEditMealIdx(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-800 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 