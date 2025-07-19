import { useState, useEffect } from 'react';
import { staffAPI, authAPI, paymentsAPI, bookingsAPI, weeklyMealPlanAPI } from '../services/api';
import toast from 'react-hot-toast';
import { User, Phone, Briefcase, IndianRupee, Edit2, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const MessWorkerDashboard = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [staffLoading, setStaffLoading] = useState(true);
  const [editStaff, setEditStaff] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [salaryModal, setSalaryModal] = useState({ open: false, staff: null, amount: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phoneNumber: '', position: '', idProofType: '', idProofNumber: '', role: 'mess_staff' });
  const [addLoading, setAddLoading] = useState(false);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [editWeeklyPlan, setEditWeeklyPlan] = useState([]);
  const [editingPlan, setEditingPlan] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({ totalAmount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  // Add separate search states for each section
  const [staffSearch, setStaffSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff_head') {
      fetchStaff();
      fetchAttendance();
    }
    if (user?.role === 'staff_head') {
      fetchMyProfile();
      fetchRecentPayments();
      fetchRecentBookings();
      fetchWeeklyPlan();
    }
  }, [attendanceMonth]);

  useEffect(() => {
    fetchPaymentStats();
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000'); // adjust if backend runs elsewhere
    socket.on('paymentUpdate', () => {
      fetchRecentPayments();
      fetchRecentBookings();
      fetchPaymentStats(); // update stats in real time
    });
    return () => socket.disconnect();
  }, []);

  const fetchStaff = async () => {
    try {
      setStaffLoading(true);
      const res = await staffAPI.getAll();
      console.log('Staff API response:', res);
      setStaff(res.data || []);
      if (!(res.data && res.data.length)) {
        toast.error('No staff members found in API response.');
      }
    } catch (error) {
      setStaff([]);
      console.error('Staff API error:', error);
      toast.error('Failed to load staff data');
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchMyProfile = async () => {
    try {
      setStaffLoading(true);
      const res = await authAPI.getProfile();
      setMyProfile(res.data || null);
    } catch (error) {
      setMyProfile(null);
      toast.error('Failed to load your profile');
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const [year, month] = attendanceMonth.split('-');
      const res = await staffAPI.getAttendance(Number(month) - 1, Number(year));
      setAttendance(res.data || []);
    } catch (err) {
      setAttendance([]);
      toast.error('Failed to load attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const [year, month] = attendanceMonth.split('-');
      const res = await staffAPI.getMyAttendance(Number(month) - 1, Number(year));
      setAttendance(res.data ? [res.data] : []);
    } catch (err) {
      setAttendance([]);
      toast.error('Failed to load your attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleAttendanceToggle = async (staffId, date, present) => {
    try {
      await staffAPI.updateAttendance(staffId, date, present);
      if (user?.role === 'admin') {
        fetchAttendance();
      } else if (user?.role === 'staff_head') {
        fetchAttendance();
      }
    } catch (err) {
      toast.error('Failed to update attendance');
    }
  };

  // Helper: get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Edit staff handlers
  const openEditModal = (member) => {
    setEditStaff(member);
    setEditForm({
      name: member.name || '',
      position: member.position || '',
      phoneNumber: member.phoneNumber || '',
      salary: member.salary || 0,
    });
  };
  const closeEditModal = () => {
    setEditStaff(null);
    setEditForm({});
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await staffAPI.updateStaff(editStaff._id, editForm);
      toast.success('Staff info updated');
      closeEditModal();
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Salary paid handlers
  const openSalaryModal = (member) => setSalaryModal({ open: true, staff: member, amount: '' });
  const closeSalaryModal = () => setSalaryModal({ open: false, staff: null, amount: '' });
  const handleSalaryChange = (e) => setSalaryModal({ ...salaryModal, amount: e.target.value });
  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await staffAPI.markSalaryPaid(salaryModal.staff._id, Number(salaryModal.amount));
      toast.success('Salary marked as paid');
      closeSalaryModal();
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value, error: undefined });
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.password || addForm.password.length < 6) {
      setAddForm(f => ({ ...f, error: 'Password must be at least 6 characters.' }));
      return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      setAddForm(f => ({ ...f, error: 'Passwords do not match.' }));
      return;
    }
    setAddLoading(true);
    try {
      const res = await authAPI.register({ ...addForm, salary: Number(addForm.salary) });
      toast.success('Staff member added');
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', confirmPassword: '', phoneNumber: '', position: '', idProofType: '', idProofNumber: '', role: 'mess_staff' });
      // Optimistically add the new staff member to the list
      setStaff(prev => [
        ...prev,
        {
          ...addForm,
          _id: res?.data?.user?._id || Date.now(),
          salary: Number(addForm.salary),
          role: 'mess_staff',
          name: addForm.name,
          email: addForm.email,
          phoneNumber: addForm.phoneNumber,
          position: addForm.position,
          idProofType: addForm.idProofType,
          idProofNumber: addForm.idProofNumber,
          salaryPaid: 0,
          outstandingSalary: 0,
          attendance: [],
        }
      ]);
      fetchStaff();
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setAddLoading(false);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const res = await paymentsAPI.getAll({ limit: 5, sort: '-createdAt' });
      setRecentPayments(res.data.payments || []);
    } catch (err) {
      setRecentPayments([]);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const res = await bookingsAPI.getRecentWithPayments();
      setRecentBookings(res.data || []);
    } catch (err) {
      setRecentBookings([]);
    }
  };

  const fetchWeeklyPlan = async () => {
    setPlanLoading(true);
    try {
      const res = await weeklyMealPlanAPI.getWeeklyPlan();
      setWeeklyPlan(res.data.meals || []);
      setEditWeeklyPlan(res.data.meals || []);
    } catch (err) {
      setWeeklyPlan([]);
      setEditWeeklyPlan([]);
    } finally {
      setPlanLoading(false);
    }
  };

  const handlePlanChange = (idx, field, value) => {
    setEditWeeklyPlan(prev => prev.map((day, i) => i === idx ? { ...day, [field]: value } : day));
  };

  const handleSavePlan = async () => {
    setPlanLoading(true);
    try {
      await weeklyMealPlanAPI.updateWeeklyPlan(editWeeklyPlan);
      setWeeklyPlan(editWeeklyPlan);
      setEditingPlan(false);
      toast.success('Weekly meal plan updated!');
    } catch (err) {
      toast.error('Failed to update meal plan');
    } finally {
      setPlanLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const res = await paymentsAPI.getStats();
      setPaymentStats(res.data || { totalAmount: 0 });
    } catch {
      setPaymentStats({ totalAmount: 0 });
    }
  };

  const handleDownloadExcel = () => {
    const year = Number(attendanceMonth.split('-')[0]);
    const month = Number(attendanceMonth.split('-')[1]) - 1;
    const daysInMonth = getDaysInMonth(year, month);
    const data = filteredStaff.map(member => {
      const staffAttendance = attendance.find(a => a._id === member._id);
      const presentDays = (staffAttendance?.attendance || []).length;
      const absentDays = daysInMonth - presentDays;
      const paidLeaves = Math.min(absentDays, 3);
      const unpaidAbsences = Math.max(absentDays - 3, 0);
      const dailySalary = member.salary ? member.salary / daysInMonth : 0;
      const payableSalary = Math.round(dailySalary * (presentDays + paidLeaves));
      const outstanding = Math.max(payableSalary - (member.salaryPaid || 0), 0);
      return {
        'Staff Name': member.name,
        'Position': member.position,
        'Salary': member.salary,
        'Salary Payable': payableSalary,
        'Salary Paid': member.salaryPaid || 0,
        'Outstanding': outstanding,
        'Present': presentDays,
        'Absent': absentDays,
        'Paid Leaves': paidLeaves,
        'Unpaid Absences': unpaidAbsences,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');
    const fileName = `Salary_Report_${attendanceMonth}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
    toast.success('Excel downloaded!');
  };

  // Filtered staff for search
  const filteredStaff = staff.filter(member => {
    if (!staffSearch) return true;
    const term = staffSearch.toLowerCase();
    return (
      (member.name && member.name.toLowerCase().includes(term)) ||
      (member.phoneNumber && member.phoneNumber.toLowerCase().includes(term)) ||
      (member.position && member.position.toLowerCase().includes(term))
    );
  });

  const [year, month] = attendanceMonth.split('-');
  const now = new Date();
  const selectedDate = new Date(Number(year), Number(month) - 1);
  const isFutureMonth = selectedDate > new Date(now.getFullYear(), now.getMonth());
  const hasRecords = attendance && attendance.length > 0 && staff && staff.length > 0 && attendance.some(a => a.attendance && a.attendance.length > 0);

  // Filter attendance for search
  const filteredAttendance = attendance.filter(staff => {
    if (!attendanceSearch) return true;
    const term = attendanceSearch.toLowerCase();
    return (
      (staff.name && staff.name.toLowerCase().includes(term)) ||
      (staff.phoneNumber && staff.phoneNumber.toLowerCase().includes(term)) ||
      (staff.position && staff.position.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome back, {user?.name}!</p>
        </div>

        {/* Staff Management Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              All Staff Members
            </h2>
            {(user?.role === 'admin') && (
              <button 
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-sm" 
                onClick={() => setShowAddModal(true)}
              >
                + Add Staff Member
              </button>
            )}
          </div>
          {/* Staff search input for all users */}
          
          
          {staffLoading ? (
            <div className="text-center text-lg text-gray-500 dark:text-gray-400 py-12 animate-pulse">Loading staff...</div>
          ) : user?.role === 'admin' ? (
            staff.length === 0 ? (
              <div className="text-center text-lg text-gray-500 dark:text-gray-400 py-12">No staff members found.</div>
            ) : (
              <>
              {/* Controls above the table */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={attendanceMonth}
                    onChange={e => setAttendanceMonth(e.target.value)}
                    className="border rounded px-3 py-1"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or position"
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                    className="border rounded px-3 py-1 ml-2"
                  />
                </div>
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                >
                  Download Excel
                </button>
              </div>
              {/* Table scrollable container */}
              <div className="overflow-x-auto rounded-xl shadow">
                  {isFutureMonth ? (
                  <div className="text-center text-lg text-gray-500 py-8">No records for future months.</div>
                ) : (
                  <table className="min-w-[1200px] divide-y divide-gray-200 dark:divide-gray-700 rounded-2xl overflow-hidden shadow-lg">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><User className="inline w-4 h-4 text-blue-500" />Name</span>
                      </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><Briefcase className="inline w-4 h-4 text-purple-500" />Position</span>
                      </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><Phone className="inline w-4 h-4 text-green-500" />Phone</span>
                      </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><IndianRupee className="inline w-4 h-4 text-blue-700" />Salary</span>
                      </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700  dark:text-white uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><IndianRupee className="inline w-4 h-4 text-orange-700" />Salary Payable</span></th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><CheckCircle2 className="inline w-4 h-4 text-green-700" />Salary Paid</span>
                      </th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredStaff.map((member) => {
                          const year = Number(attendanceMonth.split('-')[0]);
                          const month = Number(attendanceMonth.split('-')[1]) - 1;
                          const daysInMonth = getDaysInMonth(year, month);
                          const staffAttendance = attendance.find(a => a._id === member._id);
                          const presentDays = staffAttendance ? (staffAttendance.attendance || []).length : 0;
                          const absentDays = staffAttendance ? daysInMonth - presentDays : 0;
                          const paidLeaves = staffAttendance ? Math.min(absentDays, 3) : 0;
                          const dailySalary = member.salary ? member.salary / daysInMonth : 0;
                          const payableSalary = staffAttendance ? Math.round(dailySalary * (presentDays + paidLeaves)) : 0;
                          const outstanding = staffAttendance ? Math.max(payableSalary - (member.salaryPaid || 0), 0) : 0;
                          return (
                            <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group align-middle">
                              <td className="px-4 py-3 whitespace-nowrap text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 select-none">
                                <User className="w-5 h-5 text-blue-400 group-hover:text-blue-600 transition" />
                                {member.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200 select-none">{member.position || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200 select-none">{member.phoneNumber || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200 select-none">{member.role === 'staff_head' ? 'Staff Head' : 'Staff'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-base text-blue-700 dark:text-blue-400 font-bold select-none">₹{member.salary?.toLocaleString() || '0'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-base text-orange-700 font-bold select-none">
                                {staffAttendance ? `₹${payableSalary.toLocaleString()}` : 'No attendance data'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-base text-green-700 dark:text-green-400 font-bold select-none">₹{member.salaryPaid?.toLocaleString() || '0'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-base flex items-center justify-center gap-2 select-none">
                                <button className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-sm" onClick={() => openEditModal(member)}>
                                  <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 transition-colors flex items-center gap-1 shadow-sm" onClick={() => openSalaryModal(member)}>
                                  <CheckCircle2 className="w-4 h-4" /> Mark Paid
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
              </div>
              </>
          )
          ) : user?.role === 'staff_head' ? (
            staff.length === 0 ? (
              <div className="text-center text-lg text-gray-500 dark:text-gray-400 py-12">No staff members found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-2xl overflow-hidden shadow-lg">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><User className="inline w-4 h-4 text-blue-500" />Name</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><Briefcase className="inline w-4 h-4 text-purple-500" />Position</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><Phone className="inline w-4 h-4 text-green-500" />Phone</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><IndianRupee className="inline w-4 h-4 text-blue-700" />Salary</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider select-none whitespace-nowrap">
                        <span className="flex items-center gap-1"><CheckCircle2 className="inline w-4 h-4 text-green-700" />Salary Paid</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {staff.map((member) => (
                      <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group align-middle">
                        <td className="px-4 py-3 whitespace-nowrap text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 select-none">
                          <User className="w-5 h-5 text-blue-400 group-hover:text-blue-600 transition" />
                          {member.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200 select-none">{member.position || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200 select-none">{member.phoneNumber || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-base text-blue-700 dark:text-blue-400 font-bold select-none">₹{member.salary?.toLocaleString() || '0'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-base text-green-700 dark:text-green-400 font-bold select-none">₹{member.salaryPaid?.toLocaleString() || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}
        </div>

        {/* Attendance Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center gap-4 mb-6">
            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h2>
            <input
              type="month"
              value={attendanceMonth}
              onChange={e => setAttendanceMonth(e.target.value)}
              className="ml-auto border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 bg-background dark:bg-gray-800"
            />
          </div>
          {/* Add search input for attendance */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Search by name, phone, or position"
              value={attendanceSearch}
              onChange={e => setAttendanceSearch(e.target.value)}
              className="border rounded px-3 py-1"
            />
          </div>
          
          {user?.role === 'admin' ? (
            // Admin: show read-only attendance table (no checkboxes, just icons)
            attendance.length === 0 ? (
              <div className="text-center text-lg text-gray-500 dark:text-gray-400 py-8">No attendance data found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow mt-4">
                <table className="min-w-[1200px] min-h-[100px] divide-y divide-gray-200 dark:divide-gray-700 rounded-2xl overflow-hidden shadow-lg text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-2 py-2 text-left font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Salary</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Present</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Absent</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Paid Leaves Used</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Unpaid Absences</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Payable Salary</th>
                      {Array.from({ length: getDaysInMonth(Number(attendanceMonth.split('-')[0]), Number(attendanceMonth.split('-')[1]) - 1) }, (_, i) => (
                        <th key={i} className="px-1 py-2 text-center font-bold text-gray-500 dark:text-gray-400">{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAttendance.map(staff => {
                      const year = Number(attendanceMonth.split('-')[0]);
                      const month = Number(attendanceMonth.split('-')[1]) - 1;
                      const daysInMonth = getDaysInMonth(year, month);
                      const today = new Date();
                      const lastDay = (today.getFullYear() === year && today.getMonth() === month)
                        ? today.getDate()
                        : daysInMonth;
                      const presentDays = (staff.attendance || []).filter(date => {
                        const d = new Date(date);
                        return d.getFullYear() === year && d.getMonth() === month && d.getDate() <= lastDay;
                      }).length;
                      const absentDays = lastDay - presentDays;
                      const paidLeaves = Math.min(absentDays, 3);
                      const unpaidAbsences = Math.max(absentDays - 3, 0);
                      const dailySalary = staff.salary ? staff.salary / daysInMonth : 0;
                      const payableSalary = Math.round(dailySalary * (presentDays + paidLeaves));
                      const attendanceSet = new Set((staff.attendance || []).map(d => new Date(d).toISOString().slice(0, 10)));
                      return (
                        <tr key={staff._id} className="align-middle hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-2 py-2 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{staff.name}</td>
                          <td className="px-2 py-2 text-center text-blue-700 dark:text-blue-400 font-bold">₹{staff.salary?.toLocaleString() || '0'}</td>
                          <td className="px-2 py-2 text-center text-green-700 dark:text-green-400 font-bold">{presentDays}</td>
                          <td className="px-2 py-2 text-center text-red-700 dark:text-red-400 font-bold">{absentDays}</td>
                          <td className="px-2 py-2 text-center text-yellow-700 dark:text-yellow-400 font-bold">{paidLeaves}</td>
                          <td className="px-2 py-2 text-center text-red-700 dark:text-red-400 font-bold">{unpaidAbsences}</td>
                          <td className="px-2 py-2 text-center text-blue-700 dark:text-blue-400 font-bold">₹{payableSalary.toLocaleString()}</td>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                            const isPresent = attendanceSet.has(dateStr);
                            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                            const isFuture = new Date(dateStr) > new Date();
                            const canEdit = isToday && (user.role === 'staff_head');
                            return (
                              <td key={i} className="px-1 py-2 text-center">
                                {isFuture ? (
                                  <span className="inline-block w-4 h-4 rounded-full border bg-gray-200 border-gray-300"></span>
                                ) : canEdit ? (
                                  <input
                                    type="checkbox"
                                    checked={isPresent}
                                    onChange={(e) => handleAttendanceToggle(staff._id, dateStr, e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                  />
                                ) : (
                                  <span className={`inline-block w-4 h-4 rounded-full border ${isPresent ? 'bg-green-400 border-green-500' : 'bg-red-200 border-red-300'}`}></span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : user?.role === 'staff_head' ? (
            // Mess staff: show full attendance table with checkboxes for all staff (can edit own row for today)
            attendance.length === 0 ? (
              <div className="text-center text-lg text-gray-500 dark:text-gray-400 py-8">No attendance data found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow mt-4">
                <table className="min-w-[1200px] min-h-[100px] divide-y divide-gray-200 dark:divide-gray-700 rounded-2xl overflow-hidden shadow-lg text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-2 py-2 text-left font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Salary</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Present</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Absent</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Paid Leaves Used</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Unpaid Absences</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 dark:text-white uppercase tracking-wider whitespace-nowrap">Payable Salary</th>
                      {Array.from({ length: getDaysInMonth(Number(attendanceMonth.split('-')[0]), Number(attendanceMonth.split('-')[1]) - 1) }, (_, i) => (
                        <th key={i} className="px-1 py-2 text-center font-bold text-gray-500 dark:text-gray-400">{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAttendance.map(staff => {
                      const year = Number(attendanceMonth.split('-')[0]);
                      const month = Number(attendanceMonth.split('-')[1]) - 1;
                      const daysInMonth = getDaysInMonth(year, month);
                      const today = new Date();
                      const lastDay = (today.getFullYear() === year && today.getMonth() === month)
                        ? today.getDate()
                        : daysInMonth;
                      const presentDays = (staff.attendance || []).filter(date => {
                        const d = new Date(date);
                        return d.getFullYear() === year && d.getMonth() === month && d.getDate() <= lastDay;
                      }).length;
                      const absentDays = lastDay - presentDays;
                      const paidLeaves = Math.min(absentDays, 3);
                      const unpaidAbsences = Math.max(absentDays - 3, 0);
                      const dailySalary = staff.salary ? staff.salary / daysInMonth : 0;
                      const payableSalary = Math.round(dailySalary * (presentDays + paidLeaves));
                      const attendanceSet = new Set((staff.attendance || []).map(d => new Date(d).toISOString().slice(0, 10)));
                      return (
                        <tr key={staff._id} className="align-middle hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-2 py-2 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{staff.name}</td>
                          <td className="px-2 py-2 text-center text-blue-700 dark:text-blue-400 font-bold">₹{staff.salary?.toLocaleString() || '0'}</td>
                          <td className="px-2 py-2 text-center text-green-700 dark:text-green-400 font-bold">{presentDays}</td>
                          <td className="px-2 py-2 text-center text-red-700 dark:text-red-400 font-bold">{absentDays}</td>
                          <td className="px-2 py-2 text-center text-yellow-700 dark:text-yellow-400 font-bold">{paidLeaves}</td>
                          <td className="px-2 py-2 text-center text-red-700 dark:text-red-400 font-bold">{unpaidAbsences}</td>
                          <td className="px-2 py-2 text-center text-blue-700 dark:text-blue-400 font-bold">₹{payableSalary.toLocaleString()}</td>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                            const isPresent = attendanceSet.has(dateStr);
                            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                            const isFuture = new Date(dateStr) > new Date();
                            const canEdit = isToday && (user.role === 'staff_head');
                            return (
                              <td key={i} className="px-1 py-2 text-center">
                                {isFuture ? (
                                  <span className="inline-block w-4 h-4 rounded-full border bg-gray-200 border-gray-300"></span>
                                ) : canEdit ? (
                                  <input
                                    type="checkbox"
                                    checked={isPresent}
                                    onChange={(e) => handleAttendanceToggle(staff._id, dateStr, e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                  />
                                ) : (
                                  <span className={`inline-block w-4 h-4 rounded-full border ${isPresent ? 'bg-green-400 border-green-500' : 'bg-red-200 border-red-300'}`}></span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : null}
        </div>


        {/* Edit Staff Modal */}
        {editStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-all">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-blue-200 dark:border-blue-700 animate-fadeIn transition-colors duration-300">
              <h3 className="text-2xl font-bold mb-6 text-center text-blue-700 dark:text-blue-400 flex items-center justify-center gap-2"><Edit2 className="w-6 h-6" />Edit Staff Info</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Position</label>
                  <input type="text" name="position" value={editForm.position} onChange={handleEditChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-purple-400 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Phone</label>
                  <input type="text" name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-green-400 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Salary</label>
                  <input type="number" name="salary" value={editForm.salary} onChange={handleEditChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" min="0" />
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors shadow" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mark Salary as Paid Modal */}
        {salaryModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-all">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-green-200 dark:border-green-700 animate-fadeIn transition-colors duration-300">
              <h3 className="text-2xl font-bold mb-6 text-center text-green-700 dark:text-green-400 flex items-center justify-center gap-2"><CheckCircle2 className="w-6 h-6" />Mark Salary as Paid</h3>
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Amount</label>
                  <input type="number" value={salaryModal.amount} onChange={handleSalaryChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-green-400 bg-background dark:bg-gray-800 text-gray-900 dark:text-white" min="1" required />
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" onClick={closeSalaryModal}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 transition-colors shadow" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Mark Paid'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md transition-colors duration-300" onSubmit={handleAddSubmit}>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Staff Member</h2>
              <input name="name" value={addForm.name} onChange={handleAddChange} placeholder="Name" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <input name="email" type="email" value={addForm.email} onChange={handleAddChange} placeholder="Email" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <input name="password" type="password" value={addForm.password || ''} onChange={handleAddChange} placeholder="Password (min 6 chars)" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required minLength={6} />
              <input name="confirmPassword" type="password" value={addForm.confirmPassword || ''} onChange={handleAddChange} placeholder="Confirm Password" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required minLength={6} />
              <input name="phoneNumber" value={addForm.phoneNumber} onChange={handleAddChange} placeholder="Phone Number" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
              <select name="idProofType" value={addForm.idProofType} onChange={handleAddChange} className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required>
                <option value="">Select ID Proof Type</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
              </select>
              <input name="idProofNumber" value={addForm.idProofNumber} onChange={handleAddChange} placeholder="ID Proof Number" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <input name="position" value={addForm.position} onChange={handleAddChange} placeholder="Position" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" />
              <input name="salary" type="number" value={addForm.salary || ''} onChange={handleAddChange} placeholder="Salary" className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required />
              <select name="role" value={addForm.role} onChange={handleAddChange} className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-background dark:bg-gray-800 text-gray-900 dark:text-white" required>
                <option value="mess_staff">Mess Staff</option>
              </select>
              {addForm.error && <div className="text-red-600 text-sm mb-2">{addForm.error}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors" onClick={() => setShowAddModal(false)} disabled={addLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors" disabled={addLoading}>{addLoading ? 'Adding...' : 'Add'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for mess_staff self-attendance
function StaffSelfAttendance({ user, attendanceMonth, attendance, handleAttendanceToggle }) {
  const year = Number(attendanceMonth.split('-')[0]);
  const month = Number(attendanceMonth.split('-')[1]) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);
  const staff = attendance.find(s => s._id === user.userId);
  if (!staff) return <div className="text-center text-lg text-gray-500 dark:text-gray-400 py-8">No attendance data found for you.</div>;
  const attendanceSet = new Set((staff.attendance || []).map(d => new Date(d).toISOString().slice(0, 10)));
  const isPresentToday = attendanceSet.has(today);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-semibold text-gray-900 dark:text-white">Your Attendance for {attendanceMonth}</span>
        {!isPresentToday && today.startsWith(attendanceMonth) && (
          <button
            className="ml-auto px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            onClick={() => handleAttendanceToggle(user.userId, today, true)}
          >
            Mark Present for Today
          </button>
        )}
        {isPresentToday && today.startsWith(attendanceMonth) && (
          <span className="ml-auto px-4 py-2 bg-green-100 text-green-700 dark:text-green-400 rounded font-semibold">Present Today</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
          const isPresent = attendanceSet.has(dateStr);
          return (
            <div key={i} className="flex flex-col items-center w-8">
              <span className={`inline-block w-5 h-5 rounded-full border ${isPresent ? 'bg-green-400 border-green-500' : 'bg-red-200 border-red-300'}`}></span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MessWorkerDashboard; 