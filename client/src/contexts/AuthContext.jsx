import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          // Verify token is still valid
          const response = await authAPI.getProfile();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, clear storage
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Check for Google OAuth token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    // Don't process tokens if we're already on the role selection or set password page
    if (window.location.pathname === '/role-selection' || window.location.pathname === '/set-password') {
      console.log('Already on role selection or set password page, skipping token processing');
      return;
    }
    
    if (tokenFromUrl) {
      console.log('Found token in URL, checking if user needs role selection...');
      
      // Decode JWT to check if user is new (no role assigned yet)
      try {
        const payload = JSON.parse(atob(tokenFromUrl.split('.')[1]));
        console.log('JWT payload:', payload);
        
        // If user has a role, process normally. If not, redirect to role selection
        if (payload.role && payload.role !== 'pending') {
          console.log('User has role, processing Google OAuth login...');
          handleGoogleAuth(tokenFromUrl);
          
          // Clean up URL by removing the token parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          console.log('Cleaned up URL, removed token parameter');
        } else {
          console.log('New user detected, redirecting to role selection...');
          window.location.href = `/role-selection?token=${tokenFromUrl}`;
          return;
        }
      } catch (error) {
        console.error('Error decoding JWT:', error);
        // If we can't decode, assume it's a new user and redirect to role selection
        window.location.href = `/role-selection?token=${tokenFromUrl}`;
      }
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, user: userData } = response.data;

      // Block login for pending head staff
      if (userData.role === 'pending_staff_head') {
        toast.error('Waiting for admin approval');
        logout(false);
        return { success: false, error: 'Waiting for admin approval' };
      }
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const handleGoogleAuth = async (token, selectedRole = null) => {
    try {
      console.log('Processing Google authentication with token...');
      setToken(token);
      localStorage.setItem('token', token);
      
      // Decode JWT to get basic user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT payload:', payload);
      
      // If role is provided, update user role first
      if (selectedRole) {
        console.log('Updating user role to:', selectedRole);
        try {
          await authAPI.updateRole(selectedRole);
          console.log('Role updated successfully');
        } catch (error) {
          console.error('Error updating role:', error);
          // Always show only 'Not allowed' toast for any backend error
          logout(false);
          toast.error('Not allowed');
          return { success: false, error: 'Not allowed' };
        }
      }
      
      // Fetch complete user profile from backend
      console.log('Fetching user profile from backend...');
      const response = await authAPI.getProfile();
      const userData = response.data;
      console.log('User profile fetched:', userData);

      // Block login for pending head staff
      if (userData.role === 'pending_staff_head') {
        toast.error('Waiting for admin approval');
        logout(false);
        return { success: false, error: 'Waiting for admin approval' };
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Google login successful!');
      
      // Only auto-redirect if no role was provided (existing users)
      if (!selectedRole) {
        // Redirect to home page for all users
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google auth error:', error);
      console.error('Error details:', error.response?.data);
      // Clear invalid tokens, but don't show logout toast
      logout(false);
      toast.error('Not allowed');
      return { success: false, error: 'Not allowed' };
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = (showToast = true) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (showToast) {
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isMessStaff = () => user?.role === 'mess_staff' || user?.role === 'admin';
  const isStudent = () => user?.role === 'student';

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    handleGoogleAuth,
    isAdmin,
    isMessStaff,
    isStudent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};