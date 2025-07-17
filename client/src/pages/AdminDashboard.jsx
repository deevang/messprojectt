import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentsAPI, mealsAPI, paymentsAPI, weeklyMealPlanAPI, expenseAPI, bookingsAPI, staffAPI, authAPI } from '../services/api';
import { 
  Users, 
  Utensils, 
  CreditCard, 
  Calendar,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog } from '@headlessui/react';

function getNext7DaysUTC() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [searchBooking, setSearchBooking] = useState("");

  // State for meals chart (read-only)
  const [meals, setMeals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mealsChartLoading, setMealsChartLoading] = useState(false);

  const [pendingHeadStaff, setPendingHeadStaff] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [searchExpense, setSearchExpense] = useState("");

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
    fetchWeeklyMealsChart();
    fetchPendingHeadStaff();
    fetchNotifications();
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
        totalRevenue: paymentStatsRes.data.totalAmount || 0,
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

  // Fetch meals for the weekly chart (read-only)
  const fetchWeeklyMealsChart = async () => {
    if (!user) return;
    setMealsChartLoading(true);
    try {
      const mealsRes = await mealsAPI.getMealsForNext7Days();
      const data = mealsRes.data.meals || mealsRes.data || [];
      console.log('API meals response:', data); // Debug log
      setMeals(data);
      // Remove or comment out any setMeals([]) or setMeals(somethingElse) after this line
    } catch (err) {
      setMeals([]);
      setBookings([]);
    } finally {
      setMealsChartLoading(false);
    }
  };

  const fetchPendingHeadStaff = async () => {
    setPendingLoading(true);
    try {
      const res = await authAPI.getPendingHeadStaff();
      setPendingHeadStaff(res.data || []);
    } catch (err) {
      setPendingHeadStaff([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await authAPI.getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleApproveHeadStaff = async (userId) => {
    try {
      await authAPI.approveHeadStaff(userId);
      toast.success('Head staff approved!');
      fetchPendingHeadStaff();
    } catch (err) {
      toast.error('Failed to approve head staff');
    }
  };

  const handleRejectHeadStaff = async (userId) => {
    const reason = prompt('Enter a reason for rejection (optional):');
    try {
      await authAPI.rejectHeadStaff(userId, reason);
      toast.success('Head staff request rejected!');
      fetchPendingHeadStaff();
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to reject head staff');
    }
  };

  // Helpers for meals chart
  const getDateForDay = (dayName) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const targetDayIdx = daysOfWeek.indexOf(dayName);
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + targetDayIdx);
    return targetDate.toLocaleDateString('en-CA');
  };

  const getBookingsForDay = (dateStr) => bookings.filter(b => b.mealId && b.mealId.date && new Date(b.mealId.date).toLocaleDateString('en-CA') === dateStr);

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

        {/* Pending Head Staff Requests */}
        {pendingHeadStaff.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Head Staff Approvals</h2>
            {pendingLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ul className="space-y-4">
                {pendingHeadStaff.map((pending) => (
                  <li key={pending._id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{pending.name} ({pending.email})</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Requested Head Staff access</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveHeadStaff(pending._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectHeadStaff(pending._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Notification History */}
        {/* <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification History</h2>
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.filter(n => n.status === 'approved' || n.status === 'rejected').length === 0 ? (
            <div className="text-gray-600 dark:text-gray-300">No notification history.</div>
          ) : (
            <ul className="space-y-4">
              {notifications.filter(n => n.status === 'approved' || n.status === 'rejected').map((n) => (
                <li key={n._id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{n.message}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Status: <span className={n.status === 'approved' ? 'text-green-600' : 'text-red-600'}>{n.status}</span>
                      {n.actionedBy && n.actionedAt && (
                        <span> &middot; By Admin at {new Date(n.actionedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div> */}

        {/* Weekly Meals Chart - Read Only for Admin */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Meals Chart</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">View meals managed by Head Staff (Read Only)</p>
          </div>
          
          {mealsChartLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Breakfast</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lunch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dinner</th>
                   
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getNext7DaysUTC().map(dateStr => {
                    // Debug: print what meals are being considered for this date
                    const dayMeals = meals.filter(m => m.date && m.date.slice(0, 10) === dateStr);
                    console.log('Meals for', dateStr, ':', dayMeals);
                    const mealsObj = {
                      breakfast: dayMeals.find(m => m.mealType && m.mealType.toLowerCase() === 'breakfast'),
                      lunch: dayMeals.find(m => m.mealType && m.mealType.toLowerCase() === 'lunch'),
                      dinner: dayMeals.find(m => m.mealType && m.mealType.toLowerCase() === 'dinner'),
                    };
                    return (
                      <tr key={dateStr}>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                          {new Date(dateStr).toLocaleDateString('en-CA', { weekday: 'long' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{dateStr}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          {mealsObj.breakfast ? mealsObj.breakfast.items.map(i => i.name).join(', ') : 'No meal set'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          {mealsObj.lunch ? mealsObj.lunch.items.map(i => i.name).join(', ') : 'No meal set'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          {mealsObj.dinner ? mealsObj.dinner.items.map(i => i.name).join(', ') : 'No meal set'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Bookings (Combined) */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Bookings</h2>
            <div className="flex justify-end">
              <input
                type="text"
                className="w-full md:w-72 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Search by meal day, date, or amount"
                value={searchBooking}
                onChange={e => setSearchBooking(e.target.value)}
              />
            </div>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No recent bookings found.</div>
          ) : (
            <div style={{ maxHeight: '260px', overflowY: 'auto' }} className="space-y-4">
              {/* Group bookings by date and show only one total per day */}
              {Object.entries(
                recentBookings.reduce((acc, booking) => {
                  // Use booking.date as the meal day, fallback to time
                  const mealDateRaw = booking.date || booking.time;
                  const mealDateObj = new Date(mealDateRaw);
                  const mealDate = mealDateObj.toISOString().slice(0, 10); // Always YYYY-MM-DD
                  if (!acc[mealDate]) acc[mealDate] = { ...booking, amount: 0, meals: 0, mealDateRaw, count: 0, bookingTime: booking.time };
                  acc[mealDate].amount += booking.amount;
                  acc[mealDate].meals += booking.meals || 0;
                  acc[mealDate].count += 1;
                  return acc;
                }, {})
              )
                .filter(([mealDate, booking]) => {
                  const dayName = new Date(booking.mealDateRaw).toLocaleDateString('en-US', { weekday: 'long' });
                  const bookingDate = new Date(booking.bookingTime).toISOString().slice(0, 10);
                  const search = searchBooking.toLowerCase();
                  return (
                    dayName.toLowerCase().includes(search) ||
                    mealDate.includes(search) ||
                    bookingDate.includes(search) ||
                    booking.amount.toString().includes(search)
                  );
                })
                .slice(0, 3)
                .map(([mealDate, booking]) => {
                  const dayName = new Date(booking.mealDateRaw).toLocaleDateString('en-US', { weekday: 'long' });
                  const bookingDate = new Date(booking.bookingTime).toISOString().slice(0, 10);
                  return (
                    <div key={mealDate} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Day meal bookings ({dayName}, {mealDate})</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Booking date: {bookingDate} | {booking.meals} meals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">₹{booking.amount}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {/* Status not available, so just a dot */}
                          ●
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow border-2 border-transparent hover:border-blue-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-400 p-6 cursor-pointer hover:shadow-xl transition-all duration-150 transform hover:scale-105 outline-none"
            tabIndex={0}
            onClick={() => setShowExpenseModal(true)}
            title="Click to view expense details"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Expenses</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalExpenses}</span>
            </div>
          </div>
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow border-2 border-transparent hover:border-blue-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-400 p-6 cursor-pointer hover:shadow-xl transition-all duration-150 transform hover:scale-105 outline-none"
            tabIndex={0}
            onClick={() => navigate('/mess-staff')}
            title="Go to Staff Dashboard"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Staff Salary</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalStaffSalary}</span>
            </div>
          </div>
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow border-2 border-transparent hover:border-blue-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-400 p-6 cursor-pointer hover:shadow-xl transition-all duration-150 transform hover:scale-105 outline-none"
            tabIndex={0}
            onClick={() => navigate('/mess-staff')}
            title="Go to Staff Dashboard"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Staff Salary Paid</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalSalaries}</span>
            </div>
          </div>
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow border-2 border-transparent hover:border-blue-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-400 p-6 cursor-pointer hover:shadow-xl transition-all duration-150 transform hover:scale-105 outline-none"
            tabIndex={0}
            onClick={() => navigate('/admin/payments')}
            title="Go to Payments Page"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Student Payments</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Expense Details Modal */}
      <Dialog open={showExpenseModal} onClose={() => setShowExpenseModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black bg-opacity-40" aria-hidden="true" />
          <Dialog.Panel className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 mx-auto flex flex-col border border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 text-center">Expense Details</Dialog.Title>
            {/* Search bar for expenses */}
            <div className="mb-4 flex justify-end">
              <input
                type="text"
                className="w-full md:w-72 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Search by description or amount"
                value={searchExpense}
                onChange={e => setSearchExpense(e.target.value)}
              />
            </div>
            {expenseLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No expenses found.</div>
            ) : (
              <div className="overflow-x-auto max-h-[400px]" style={{overflowY: 'auto'}}>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {expenses.filter(exp => {
                      const search = searchExpense.toLowerCase();
                      return (
                        exp.description?.toLowerCase().includes(search) ||
                        exp.amount.toString().includes(search)
                      );
                    }).map(exp => (
                      <tr key={exp._id}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">{exp.description || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">₹{exp.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              onClick={() => setShowExpenseModal(false)}
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminDashboard; 