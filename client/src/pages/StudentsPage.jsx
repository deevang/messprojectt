import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { bookingsAPI, studentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const StudentsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]); // for mess staff
  const [students, setStudents] = useState([]); // for students
  const [search, setSearch] = useState('');
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    if (user.role === 'mess_staff') {
      // Get today's bookings
      const today = new Date().toISOString().slice(0, 10);
      bookingsAPI.getByDate(today)
        .then(res => setBookings(res.data.bookings || res.data))
        .catch(() => setError('Failed to load bookings'))
        .finally(() => setLoading(false));
    } else if (user.role === 'student') {
      studentsAPI.getAll({ search })
        .then(res => setStudents(res.data.students || res.data))
        .catch(() => setError('Failed to load students'))
        .finally(() => setLoading(false));
    }
  }, [user, search]);

  const handleMarkConsumed = async (bookingId) => {
    setMarking(bookingId);
    try {
      await bookingsAPI.markAsConsumed(bookingId);
      toast.success('Marked as consumed!');
      // Refresh bookings
      const today = new Date().toISOString().slice(0, 10);
      const res = await bookingsAPI.getByDate(today);
      setBookings(res.data.bookings || res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark as consumed');
    } finally {
      setMarking(null);
    }
  };

  if (!user) return <div className="p-8 text-center">Please log in to view students.</div>;
  if (user.role === 'admin') return <Navigate to="/admin/students" replace />;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  if (user.role === 'mess_staff') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Students with Bookings Today</h1>
        {bookings.length === 0 ? (
          <div>No bookings for today.</div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b._id} className="bg-white shadow rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{b.userId?.name} ({b.userId?.roomNumber})</div>
                  <div className="text-gray-600 text-sm">{b.userId?.email}</div>
                  <div className="text-xs text-gray-500">Meal: {b.mealType} | Status: {b.status}</div>
                </div>
                <div className="mt-2 md:mt-0 flex flex-col items-end">
                  {b.status === 'booked' ? (
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      onClick={() => handleMarkConsumed(b._id)}
                      disabled={marking === b._id}
                    >
                      {marking === b._id ? 'Marking...' : 'Mark as Consumed'}
                    </button>
                  ) : (
                    <span className="text-green-700 font-semibold">Consumed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (user.role === 'student') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Student Directory</h1>
        <input
          type="text"
          placeholder="Search by name, email, or room..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 w-full border border-gray-300 rounded px-3 py-2"
        />
        {students.length === 0 ? (
          <div>No students found.</div>
        ) : (
          <div className="space-y-4">
            {students.map(s => (
              <div key={s._id} className="bg-white shadow rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{s.name} ({s.roomNumber})</div>
                  <div className="text-gray-600 text-sm">{s.email}</div>
                  <div className="text-xs text-gray-500">Plan: {s.messPlan} | Status: {s.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default StudentsPage; 