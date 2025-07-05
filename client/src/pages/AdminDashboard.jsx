import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentsAPI, mealsAPI, paymentsAPI, weeklyMealPlanAPI, expenseAPI, bookingsAPI, staffAPI } from '../services/api';
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

  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [totalSalaries, setTotalSalaries] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalStaffSalary, setTotalStaffSalary] = useState(0);

  const [recentBookings, setRecentBookings] = useState([]);

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
    fetchWeeklyPlan();
    fetchExpenses();
    fetchStaff();
    fetchRecentBookingsWithPayments();
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

  const fetchExpenses = async () => {
    setExpenseLoading(true);
    try {
      const res = await expenseAPI.getExpenses({ all: true });
      setExpenses(res.data || []);
      setTotalExpenses(res.data.reduce((sum, exp) => sum + exp.amount, 0));
    } catch (err) {
      setExpenses([]);
      setTotalExpenses(0);
    } finally {
      setExpenseLoading(false);
    }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      // Fetch all staff using the dedicated staff API
      const res = await staffAPI.getAll();
      const staffList = res.data.staff || res.data || [];
      setStaff(staffList);
      setTotalSalaries(staffList.reduce((sum, s) => sum + (s.salaryPaid || 0), 0));
      setTotalStaffSalary(staffList.reduce((sum, s) => sum + (s.salary || 0), 0));
    } catch (err) {
      setStaff([]);
      setTotalSalaries(0);
      setTotalStaffSalary(0);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchRecentBookingsWithPayments = async () => {
    try {
      const res = await bookingsAPI.getRecentWithPayments();
      setRecentBookings(res.data || []);
    } catch (err) {
      setRecentBookings([]);
    }
  };

  useEffect(() => {
    setTotalProfit(stats.totalRevenue - (totalExpenses + totalSalaries));
  }, [stats.totalRevenue, totalExpenses, totalSalaries]);

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

        {/* Recent Bookings (Combined) */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">No. of Meals</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {recentBookings.length === 0 ? (
                  <tr><td colSpan="4" className="text-center">No recent bookings found.</td></tr>
                ) : recentBookings.map((booking, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{booking.student}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{booking.meals}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">₹{booking.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{new Date(booking.time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
            This table shows the recent bookings made by each student, including payment info.
          </p>
        </div>

        {/* Weekly Standard Meals */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Standard Meals</h2>
          {planLoading ? (
            <div>Loading...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mb-4">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Breakfast</th>
                  <th className="px-4 py-2">Lunch</th>
                  <th className="px-4 py-2">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {weeklyPlan.map(day => (
                  <tr key={day.day}>
                    <td className="px-4 py-2 font-bold">{day.day}</td>
                    <td className="px-4 py-2">{day.breakfast}</td>
                    <td className="px-4 py-2">{day.lunch}</td>
                    <td className="px-4 py-2">{day.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Expenses</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalExpenses}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Staff Salary</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalStaffSalary}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Staff Salary Paid</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalSalaries}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Student Payments</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 