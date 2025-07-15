import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const SetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isJwt = token && token.split('.').length === 3;
  const isReset = !!token && !isJwt;

  // Store token in localStorage if present and isJwt (Google OAuth)
  useEffect(() => {
    if (token && isJwt) {
      localStorage.setItem('token', token);
    }
  }, [token, isJwt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (isReset) {
        // Password reset flow
        await api.post('/auth/reset-password', { token, password });
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        // Set password after Google OAuth flow
        await api.put('/auth/set-password', { password });
        setSuccess('Password set successfully! Redirecting...');
        setTimeout(() => {
          if (token) {
            navigate(`/role-selection?token=${token}`);
          } else {
            navigate('/role-selection');
          }
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="bg-white/90 dark:bg-gray-900/90 p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-blue-700 dark:text-blue-400 tracking-tight">
          {isReset ? 'Reset Your Password' : 'Set Your Password'}
        </h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2 font-semibold">New Password</label>
            <input
              type="password"
              className="w-full px-5 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-lg shadow-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2 font-semibold">Confirm Password</label>
            <input
              type="password"
              className="w-full px-5 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-lg shadow-sm"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <div className="mb-2 text-red-600 text-center font-medium text-base">{error}</div>}
          {success && <div className="mb-2 text-green-600 text-center font-medium text-base">{success}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mt-2"
            disabled={loading}
          >
            {loading ? (isReset ? 'Resetting...' : 'Setting Password...') : (isReset ? 'Reset Password' : 'Set Password')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordPage; 