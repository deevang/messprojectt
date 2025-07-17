import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Shield, GraduationCap, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import tiffinspaceLogo from '../assets/tiffinspace-logo.png';

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleAuth } = useAuth();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // Clean up URL to prevent redirect loops
    const cleanUrl = window.location.pathname + window.location.search;
    if (window.location.href !== cleanUrl) {
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [token, navigate]);

  const roles = [
    {
      id: 'student',
      name: 'Student',
      description: 'Access to book meals, view payments, and submit feedback',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    {
      id: 'staff_head',
      name: 'Head Staff',
      description: 'Manage meals, view bookings, handle payments, and respond to feedback',
      icon: Shield,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access including user management and system settings',
      icon: User,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700'
    }
  ];

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    if (loading) {
      return; // Prevent multiple calls
    }
    setLoading(true);
    try {
      console.log('Processing role selection for:', selectedRole);
      // Complete Google authentication with selected role
      const result = await handleGoogleAuth(token, selectedRole);
      if (result.success) {
        toast.success(`Welcome as ${selectedRole}!`);
        // Clean up URL before redirecting
        window.history.replaceState({}, document.title, window.location.pathname);
        // If head staff, show modal and block further actions
        if (selectedRole === 'staff_head') {
          setShowPendingModal(true);
        } else {
          // Redirect to home page for all users
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Role selection error:', error);
      toast.error('Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <img src={tiffinspaceLogo} alt="TiffinSpace Logo" className="w-16 h-16 object-contain rounded-2xl" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Choose Your Role
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Select the role that best describes your position in the mess management system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                selectedRole === role.id
                  ? `${role.borderColor} shadow-lg scale-105`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${role.bgColor}`}
            >
              <div className="text-center">
                <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${role.color} mb-4`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {role.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {role.description}
                </p>
              </div>
              {/* Selection indicator */}
              {selectedRole === role.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleRoleSelection}
            disabled={!selectedRole || loading}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedRole && !loading
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Completing Registration...
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200"
          >
            ← Back to Login
          </button>
        </div>
      </div>
      {/* Pending Approval Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Wait for Admin Approval</h3>
            <p className="text-gray-700 dark:text-gray-200 mb-6">
              Your request to become Head Staff has been submitted.<br />
              Please wait until an admin approves your request.<br />
              You will be notified once approved.
            </p>
            <button
              className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              onClick={() => navigate('/')}
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelectionPage; 