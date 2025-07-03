import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  resetPassword: (email) => api.post('/auth/reset-password', { email }),
};

// Meals API
export const mealsAPI = {
  getAll: (params) => api.get('/meals', { params }),
  getById: (id) => api.get(`/meals/${id}`),
  create: (mealData) => api.post('/meals', mealData),
  update: (id, mealData) => api.put(`/meals/${id}`, mealData),
  delete: (id) => api.delete(`/meals/${id}`),
  getByDate: (date) => api.get(`/meals/date/${date}`),
  getByType: (type) => api.get(`/meals/type/${type}`),
  book: (mealId, bookingData) => api.post(`/meals/book/${mealId}`, bookingData),
  cancelBooking: (bookingId) => api.put(`/meals/cancel-booking/${bookingId}`),
  getMyBookings: () => api.get('/meals/my-bookings'),
  getStats: () => api.get('/meals/stats'),
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getAll: (params) => api.get('/bookings', { params }),
  update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  delete: (id) => api.delete(`/bookings/${id}`),
  getByDate: (date) => api.get(`/bookings/date/${date}`),
  getByUser: () => api.get('/bookings/my-bookings'),
  markAsConsumed: (id) => api.put(`/bookings/${id}/consume`),
};

// Payments API
export const paymentsAPI = {
  create: (paymentData) => api.post('/payments', paymentData),
  getAll: (params) => api.get('/payments', { params }),
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  delete: (id) => api.delete(`/payments/${id}`),
  getByUser: () => api.get('/payments/my-payments'),
  getStats: () => api.get('/payments/stats'),
  process: (paymentData) => api.post('/payments/process', paymentData),
  generateInvoice: (id) => api.get(`/payments/invoice/${id}`),
};

// Feedback API
export const feedbackAPI = {
  create: (feedbackData) => api.post('/feedback', feedbackData),
  getAll: (params) => api.get('/feedback', { params }),
  update: (id, feedbackData) => api.put(`/feedback/${id}`, feedbackData),
  delete: (id) => api.delete(`/feedback/${id}`),
  getByUser: () => api.get('/feedback/my-feedback'),
  getStats: () => api.get('/feedback/stats'),
  respond: (id, response) => api.put(`/feedback/${id}/respond`, { adminResponse: response }),
};

// Students API (Admin only)
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  update: (id, studentData) => api.put(`/students/${id}`, studentData),
  delete: (id) => api.delete(`/students/${id}`),
  getStats: () => api.get('/students/stats'),
  getMeals: (id, params) => api.get(`/students/${id}/meals`, { params }),
  getPayments: (id, params) => api.get(`/students/${id}/payments`, { params }),
  updatePaymentStatus: (id, status) => api.put(`/students/${id}/payment-status`, { paymentStatus: status }),
};

// AI API
export const aiAPI = {
  estimateCalories: (mealName) => api.post('/ai/estimate-calories', { mealName }),
  analyzeSentiment: (feedbackText) => api.post('/ai/analyze-sentiment', { feedbackText }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Staff API (Admin only)
export const staffAPI = {
  getAll: () => api.get('/auth/staff'),
  updateStaff: (id, staffData) => api.put(`/auth/staff/${id}`, staffData),
  markSalaryPaid: (id, amount) => api.post(`/auth/staff/${id}/pay-salary`, { amount }),
  getAttendance: (month, year) => api.get('/auth/staff-attendance', { params: { month, year } }),
  updateAttendance: (id, date, present) => api.patch(`/auth/staff/${id}/attendance`, { date, present }),
  getMyAttendance: (month, year) => api.get('/auth/my-attendance', { params: { month, year } }),
};

export default api;