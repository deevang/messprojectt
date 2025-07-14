import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email });
      setSuccess('If an account with that email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 dark:text-blue-400">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2 font-semibold">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white text-lg shadow-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="Enter your email"
              />
            </div>
          </div>
          {error && <div className="mb-2 text-red-600 text-center font-medium text-base">{error}</div>}
          {success && <div className="mb-2 text-green-600 text-center font-medium text-base">{success}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mt-2"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <button
          className="mt-6 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          onClick={() => navigate('/login')}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 