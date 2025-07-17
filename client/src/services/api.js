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
      // Only redirect if not already on a public page
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
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
  updateRole: (role) => api.put('/auth/update-role', { role }),
  getPendingHeadStaff: () => api.get('/auth/pending-headstaff'),
  approveHeadStaff: (userId) => api.post(`/auth/approve-headstaff/${userId}`),
  rejectHeadStaff: (userId, reason) => api.post(`/auth/reject-headstaff/${userId}`, { reason }),
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
  getMyBookings: () => api.get('/meals/my-bookings'),
  getStats: () => api.get('/meals/stats'),
  createDefaultWeek: () => api.post('/meals/create-default-week'),
  getMealsForNext7Days: () => api.get('/meals/next-7-days'),
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  createDayBooking: (date, specialRequests) => api.post('/bookings/day', { date, specialRequests }),
  getAll: (params) => api.get('/bookings', { params }),
  update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  delete: (id) => api.delete(`/bookings/${id}`),
  getByDate: (date) => api.get(`/bookings/date/${date}`),
  getByUser: () => api.get('/bookings/my-bookings'),
  getDayBookingsByUser: () => api.get('/bookings/my-day-bookings'),
  markAsConsumed: (id) => api.put(`/bookings/${id}/consume`),
  bookTodayFromPlan: () => api.post('/bookings/book-today-from-plan'),
  bookWeekFromPlan: () => api.post('/bookings/book-week-from-plan'),
  getRecentWithPayments: () => api.get('/bookings/recent-with-payments'),
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
  createMealPayment: (data) => api.post('/payments', data),
};

// Feedback API
export const feedbackAPI = {
  create: (feedbackData) => api.post('/feedback', feedbackData),
  getAll: (params) => api.get('/feedback', { params }),
  update: (id, feedbackData) => api.put(`/feedback/${id}`, feedbackData),
  delete: (id) => api.delete(`/feedback/${id}`),
  getByUser: () => api.get('/feedback/my-feedback'),
  getStats: () => api.get('/feedback/stats'),
  respond: (id, responseData) => api.put(`/feedback/${id}/respond`, responseData),
  
  // Admin endpoints
  getUnreadCountAdmin: () => api.get('/feedback/unread-count-admin'),
  markAsReadAdmin: (id) => api.put(`/feedback/${id}/mark-read-admin`),
  markMultipleAsReadAdmin: (feedbackIds) => api.post('/feedback/mark-multiple-read-admin', { feedbackIds }),
  
  // Staff endpoints
  getAllStaff: (params) => api.get('/feedback/staff', { params }),
  getStatsStaff: () => api.get('/feedback/staff/stats'),
  getUnreadCountStaff: () => api.get('/feedback/unread-count-staff'),
  respondStaff: (id, responseData) => api.put(`/feedback/staff/${id}/respond`, responseData),
  markAsReadStaff: (id) => api.put(`/feedback/staff/${id}/mark-read-staff`),
  markMultipleAsReadStaff: (feedbackIds) => api.post('/feedback/staff/mark-multiple-read-staff', { feedbackIds }),
  
  // Student endpoints
  getUnreadCountStudent: () => api.get('/feedback/unread-count-student'),
  markAsReadStudent: (id) => api.put(`/feedback/${id}/mark-read-student`)
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

export const weeklyMealPlanAPI = {
  getWeeklyPlan: () => api.get('/meals/weekly-plan'),
  updateWeeklyPlan: (meals) => api.put('/meals/weekly-plan', { meals }),
};

export const expenseAPI = {
  addExpense: (data) => api.post('/meals/expenses', data),
  getExpenses: (params) => api.get('/meals/expenses', { params }),
};

export default api;