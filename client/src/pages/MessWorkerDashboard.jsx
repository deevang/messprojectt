import { useState, useEffect } from 'react';
import { staffAPI, authAPI, paymentsAPI, bookingsAPI, weeklyMealPlanAPI } from '../services/api';
import toast from 'react-hot-toast';
import { User, Phone, Briefcase, IndianRupee, Edit2, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

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
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', phoneNumber: '', position: '', idProofType: '', idProofNumber: '', role: 'mess_staff' });
  const [addLoading, setAddLoading] = useState(false);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [editWeeklyPlan, setEditWeeklyPlan] = useState([]);
  const [editingPlan, setEditingPlan] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({ totalAmount: 0 });

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
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await authAPI.register({ ...addForm });
      toast.success('Staff member added');
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', phoneNumber: '', position: '', idProofType: '', idProofNumber: '', role: 'mess_staff' });
      fetchStaff();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center py-12 px-2">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2 select-none">
            <User className="w-8 h-8 text-blue-600" />
            All Staff Members
          </h1>
          {user?.role === 'staff_head' && (
            <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-1 shadow-sm" onClick={() => setShowAddModal(true)}>
              + Add Staff Member
            </button>
          )}
        </div>
        {staffLoading ? (
          <div className="text-center text-lg text-gray-500 py-12 animate-pulse">Loading staff...</div>
        ) : user?.role === 'admin' ? (
          staff.length === 0 ? (
            <div className="text-center text-lg text-gray-500 py-12">No staff members found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow">
              <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden shadow-lg">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><User className="inline w-4 h-4 text-blue-500" />Name</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><Briefcase className="inline w-4 h-4 text-purple-500" />Position</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><Phone className="inline w-4 h-4 text-green-500" />Phone</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><IndianRupee className="inline w-4 h-4 text-blue-700" />Salary</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><CheckCircle2 className="inline w-4 h-4 text-green-700" />Salary Paid</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><IndianRupee className="inline w-4 h-4 text-red-700" />Outstanding</span></th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {staff.map((member) => (
                    <tr key={member._id} className="hover:bg-blue-50 transition group align-middle">
                      <td className="px-4 py-3 whitespace-nowrap text-base font-semibold text-gray-900 flex items-center gap-2 select-none">
                        <User className="w-5 h-5 text-blue-400 group-hover:text-blue-600 transition" />
                        {member.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 select-none">{member.position || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 select-none">{member.phoneNumber || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 select-none">{member.role === 'staff_head' ? 'Staff Head' : 'Staff'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-blue-700 font-bold select-none">₹{member.salary?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-green-700 font-bold select-none">₹{member.salaryPaid?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-red-700 font-bold select-none">₹{member.outstandingSalary?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base flex items-center justify-center gap-2 select-none">
                        <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-1 shadow-sm" onClick={() => openEditModal(member)}>
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center gap-1 shadow-sm" onClick={() => openSalaryModal(member)}>
                          <CheckCircle2 className="w-4 h-4" /> Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : user?.role === 'staff_head' ? (
          staff.length === 0 ? (
            <div className="text-center text-lg text-gray-500 py-12">No staff members found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow">
              <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden shadow-lg">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><User className="inline w-4 h-4 text-blue-500" />Name</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><Briefcase className="inline w-4 h-4 text-purple-500" />Position</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><Phone className="inline w-4 h-4 text-green-500" />Phone</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><IndianRupee className="inline w-4 h-4 text-blue-700" />Salary</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><CheckCircle2 className="inline w-4 h-4 text-green-700" />Salary Paid</span></th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider select-none whitespace-nowrap"><span className="flex items-center gap-1"><IndianRupee className="inline w-4 h-4 text-red-700" />Outstanding</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {staff.map((member) => (
                    <tr key={member._id} className="hover:bg-blue-50 transition group align-middle">
                      <td className="px-4 py-3 whitespace-nowrap text-base font-semibold text-gray-900 flex items-center gap-2 select-none">
                        <User className="w-5 h-5 text-blue-400 group-hover:text-blue-600 transition" />
                        {member.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 select-none">{member.position || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 select-none">{member.phoneNumber || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-blue-700 font-bold select-none">₹{member.salary?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-green-700 font-bold select-none">₹{member.salaryPaid?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-red-700 font-bold select-none">₹{member.outstandingSalary?.toLocaleString() || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {/* Attendance Section */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-4">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
            <input
              type="month"
              value={attendanceMonth}
              onChange={e => setAttendanceMonth(e.target.value)}
              className="ml-auto border rounded px-3 py-1 text-gray-700 focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {user?.role === 'admin' ? (
            // Admin: show read-only attendance table (no checkboxes, just icons)
            attendance.length === 0 ? (
              <div className="text-center text-lg text-gray-500 py-8">No attendance data found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow mt-4">
                <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden shadow-lg text-xs">
                  <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Present</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Absent</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Paid Leaves Used</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Unpaid Absences</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Payable Salary</th>
                      {Array.from({ length: getDaysInMonth(Number(attendanceMonth.split('-')[0]), Number(attendanceMonth.split('-')[1]) - 1) }, (_, i) => (
                        <th key={i} className="px-1 py-2 text-center font-bold text-gray-500">{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {attendance.map(staff => {
                      const year = Number(attendanceMonth.split('-')[0]);
                      const month = Number(attendanceMonth.split('-')[1]) - 1;
                      const daysInMonth = getDaysInMonth(year, month);
                      const presentDays = (staff.attendance || []).length;
                      const absentDays = daysInMonth - presentDays;
                      const paidLeaves = Math.min(absentDays, 3);
                      const unpaidAbsences = Math.max(absentDays - 3, 0);
                      const dailySalary = staff.salary ? staff.salary / daysInMonth : 0;
                      const payableSalary = Math.round(dailySalary * (presentDays + paidLeaves));
                      const attendanceSet = new Set((staff.attendance || []).map(d => new Date(d).toISOString().slice(0, 10)));
                      return (
                        <tr key={staff._id} className="align-middle hover:bg-blue-50 transition">
                          <td className="px-2 py-2 font-semibold text-gray-900 whitespace-nowrap">{staff.name}</td>
                          <td className="px-2 py-2 text-center text-green-700 font-bold">{presentDays}</td>
                          <td className="px-2 py-2 text-center text-red-700 font-bold">{absentDays}</td>
                          <td className="px-2 py-2 text-center text-yellow-700 font-bold">{paidLeaves}</td>
                          <td className="px-2 py-2 text-center text-red-700 font-bold">{unpaidAbsences}</td>
                          <td className="px-2 py-2 text-center text-blue-700 font-bold">₹{payableSalary.toLocaleString()}</td>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                            const isPresent = attendanceSet.has(dateStr);
                            return (
                              <td key={i} className="px-1 py-2 text-center">
                                <span className={`inline-block w-4 h-4 rounded-full border ${isPresent ? 'bg-green-400 border-green-500' : 'bg-red-200 border-red-300'}`}></span>
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
              <div className="text-center text-lg text-gray-500 py-8">No attendance data found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow mt-4">
                <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden shadow-lg text-xs">
                  <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Present</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Absent</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Paid Leaves Used</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Unpaid Absences</th>
                      <th className="px-2 py-2 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Payable Salary</th>
                      {Array.from({ length: getDaysInMonth(Number(attendanceMonth.split('-')[0]), Number(attendanceMonth.split('-')[1]) - 1) }, (_, i) => (
                        <th key={i} className="px-1 py-2 text-center font-bold text-gray-500">{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {attendance.map(staff => {
                      const year = Number(attendanceMonth.split('-')[0]);
                      const month = Number(attendanceMonth.split('-')[1]) - 1;
                      const daysInMonth = getDaysInMonth(year, month);
                      const presentDays = (staff.attendance || []).length;
                      const absentDays = daysInMonth - presentDays;
                      const paidLeaves = Math.min(absentDays, 3);
                      const unpaidAbsences = Math.max(absentDays - 3, 0);
                      const dailySalary = staff.salary ? staff.salary / daysInMonth : 0;
                      const payableSalary = Math.round(dailySalary * (presentDays + paidLeaves));
                      const attendanceSet = new Set((staff.attendance || []).map(d => new Date(d).toISOString().slice(0, 10)));
                      return (
                        <tr key={staff._id} className="align-middle hover:bg-blue-50 transition">
                          <td className="px-2 py-2 font-semibold text-gray-900 whitespace-nowrap">{staff.name}</td>
                          <td className="px-2 py-2 text-center text-green-700 font-bold">{presentDays}</td>
                          <td className="px-2 py-2 text-center text-red-700 font-bold">{absentDays}</td>
                          <td className="px-2 py-2 text-center text-yellow-700 font-bold">{paidLeaves}</td>
                          <td className="px-2 py-2 text-center text-red-700 font-bold">{unpaidAbsences}</td>
                          <td className="px-2 py-2 text-center text-blue-700 font-bold">₹{payableSalary.toLocaleString()}</td>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                            const isPresent = attendanceSet.has(dateStr);
                            // Allow staff_head to edit only for today
                            const isToday = dateStr === new Date().toISOString().slice(0, 10);
                            const canEdit = user.role === 'staff_head' && isToday;
                            return (
                              <td key={i} className="px-1 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isPresent}
                                  onChange={() => canEdit && handleAttendanceToggle(staff._id, dateStr, !isPresent)}
                                  className="accent-blue-600 w-4 h-4 rounded"
                                  disabled={!canEdit}
                                />
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
          ) : attendanceLoading ? (
            <div className="text-center text-lg text-gray-500 py-8 animate-pulse">Loading attendance...</div>
          ) : null}
        </div>

        {/* Recent Payments Section */}
        {/* {user?.role !== 'staff_head' && recentPayments.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2">Recent Payments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {recentPayments.map(p => (
                    <tr key={p._id}>
                      <td className="px-4 py-2">{p.student?.name || p.studentName || '-'}</td>
                      <td className="px-4 py-2">₹{p.amount || '-'}</td>
                      <td className="px-4 py-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2">
                        {p.status === 'pending_verification' ? (
                          <span className="text-yellow-600 font-bold">Pending Verification</span>
                        ) : p.status === 'paid' || p.status === 'completed' ? (
                          <span className="text-green-600 font-bold">Paid</span>
                        ) : (
                          <span className="text-gray-600">{p.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {p.status === 'pending_verification' && (
                          <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={async () => {
                            await paymentsAPI.update(p._id, { status: 'paid' });
                            fetchRecentPayments();
                          }}>Verify</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )} */}

        {/* Recent Bookings Section */}
        {/* {user?.role !== 'staff_head' && recentBookings.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2">Recent Bookings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Meal</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {recentBookings.map(b => (
                    <tr key={b._id}>
                      <td className="px-4 py-2">{b.student?.name || b.studentName || '-'}</td>
                      <td className="px-4 py-2">{b.mealId?.items?.map(i => i.name).join(', ') || b.mealId?.description || '-'}</td>
                      <td className="px-4 py-2">{b.mealId?.date ? new Date(b.mealId.date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2">₹{b.amount || '-'}</td>
                      <td className="px-4 py-2">
                        {b.status === 'pending_verification' ? (
                          <span className="text-yellow-600 font-bold">Pending Verification</span>
                        ) : b.status === 'paid' || b.status === 'completed' ? (
                          <span className="text-green-600 font-bold">Paid</span>
                        ) : (
                          <span className="text-gray-600">{b.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {b.status === 'pending_verification' && (
                          <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={async () => {
                            await bookingsAPI.update(b._id, { status: 'paid' });
                            fetchRecentBookings();
                          }}>Verify</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )} */}

        {/* Weekly Plan Section */}
        {/* <div className="mt-12">
          <div className="flex items-center gap-4 mb-4">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Weekly Meal Plan</h2>
            <button className="ml-auto px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-1 shadow-sm" onClick={() => setEditingPlan(true)} disabled={planLoading}>
              {planLoading ? 'Loading...' : 'Edit Plan'}
            </button>
          </div>
          {planLoading ? (
            <div className="text-center text-lg text-gray-500 py-8 animate-pulse">Loading meal plan...</div>
          ) : editingPlan ? (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Edit Weekly Meal Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
                {editWeeklyPlan.map((day, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-2 text-blue-600">Day {idx + 1}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Breakfast</label>
                        <input type="text" value={day.breakfast} onChange={(e) => handlePlanChange(idx, 'breakfast', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1 focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Lunch</label>
                        <input type="text" value={day.lunch} onChange={(e) => handlePlanChange(idx, 'lunch', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1 focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Dinner</label>
                        <input type="text" value={day.dinner} onChange={(e) => handlePlanChange(idx, 'dinner', e.target.value)} className="mt-1 block w-full border rounded px-2 py-1 focus:ring-2 focus:ring-blue-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition" onClick={() => setEditingPlan(false)}>Cancel</button>
                <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow" onClick={handleSavePlan} disabled={planLoading}>{planLoading ? 'Saving...' : 'Save Plan'}</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Current Weekly Meal Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
                {weeklyPlan.map((day, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-2 text-blue-600">Day {idx + 1}</h4>
                    <p className="text-base text-gray-800">Breakfast: {day.breakfast || '-'}</p>
                    <p className="text-base text-gray-800">Lunch: {day.lunch || '-'}</p>
                    <p className="text-base text-gray-800">Dinner: {day.dinner || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div> */}

        {/* Edit Staff Modal */}
        {editStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-all">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-blue-200 animate-fadeIn">
              <h3 className="text-2xl font-bold mb-6 text-center text-blue-700 flex items-center justify-center gap-2"><Edit2 className="w-6 h-6" />Edit Staff Info</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className="mt-1 block w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input type="text" name="position" value={editForm.position} onChange={handleEditChange} className="mt-1 block w-full border rounded px-3 py-2 focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="text" name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditChange} className="mt-1 block w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  <input type="number" name="salary" value={editForm.salary} onChange={handleEditChange} className="mt-1 block w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400" min="0" />
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mark Salary as Paid Modal */}
        {salaryModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-all">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-green-200 animate-fadeIn">
              <h3 className="text-2xl font-bold mb-6 text-center text-green-700 flex items-center justify-center gap-2"><CheckCircle2 className="w-6 h-6" />Mark Salary as Paid</h3>
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input type="number" value={salaryModal.amount} onChange={handleSalaryChange} className="mt-1 block w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-400" min="1" required />
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button type="button" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition" onClick={closeSalaryModal}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition shadow" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Mark Paid'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md" onSubmit={handleAddSubmit}>
              <h2 className="text-xl font-bold mb-4">Add Staff Member</h2>
              <input name="name" value={addForm.name} onChange={handleAddChange} placeholder="Name" className="w-full mb-2 p-2 border rounded" required />
              <input name="email" value={addForm.email} onChange={handleAddChange} placeholder="Email" className="w-full mb-2 p-2 border rounded" type="email" />
              <input name="password" value={addForm.password} onChange={handleAddChange} placeholder="Password" className="w-full mb-2 p-2 border rounded" type="password" required />
              <input name="phoneNumber" value={addForm.phoneNumber} onChange={handleAddChange} placeholder="Phone Number" className="w-full mb-2 p-2 border rounded" />
              <select name="idProofType" value={addForm.idProofType} onChange={handleAddChange} className="w-full mb-2 p-2 border rounded" required>
                <option value="">Select ID Proof Type</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
              </select>
              <input name="idProofNumber" value={addForm.idProofNumber} onChange={handleAddChange} placeholder="ID Proof Number" className="w-full mb-2 p-2 border rounded" required />
              <input name="position" value={addForm.position} onChange={handleAddChange} placeholder="Position" className="w-full mb-2 p-2 border rounded" />
              <select name="role" value={addForm.role} onChange={handleAddChange} className="w-full mb-2 p-2 border rounded" required>
                <option value="mess_staff">Mess Staff</option>
                <option value="staff_head">Head Staff</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowAddModal(false)} disabled={addLoading}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={addLoading}>{addLoading ? 'Adding...' : 'Add'}</button>
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
  if (!staff) return <div className="text-center text-lg text-gray-500 py-8">No attendance data found for you.</div>;
  const attendanceSet = new Set((staff.attendance || []).map(d => new Date(d).toISOString().slice(0, 10)));
  const isPresentToday = attendanceSet.has(today);
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-semibold text-gray-900">Your Attendance for {attendanceMonth}</span>
        {!isPresentToday && today.startsWith(attendanceMonth) && (
          <button
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => handleAttendanceToggle(user.userId, today, true)}
          >
            Mark Present for Today
          </button>
        )}
        {isPresentToday && today.startsWith(attendanceMonth) && (
          <span className="ml-auto px-4 py-2 bg-green-100 text-green-700 rounded font-semibold">Present Today</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
          const isPresent = attendanceSet.has(dateStr);
          return (
            <div key={i} className="flex flex-col items-center w-8">
              <span className={`inline-block w-5 h-5 rounded-full border ${isPresent ? 'bg-green-400 border-green-500' : 'bg-red-200 border-red-300'}`}></span>
              <span className="text-xs text-gray-500 mt-1">{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MessWorkerDashboard; 