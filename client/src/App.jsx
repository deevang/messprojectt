import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ManageMealsPage from './pages/ManageMealsPage';
import ManageStudentsPage from './pages/ManageStudentsPage';
import ManagePaymentsPage from './pages/ManagePaymentsPage';
import ManageFeedbackPage from './pages/ManageFeedbackPage';
import StudentFeedbackPage from './pages/StudentFeedbackPage';
import MessWorkerDashboard from './pages/MessWorkerDashboard';
import MealsPage from './pages/MealsPage';
import StudentsPage from './pages/StudentsPage';
import ProfilePage from './pages/ProfilePage';
import HeadStaffDashboard from './pages/HeadStaffDashboard';
import RoleSelectionPage from './pages/RoleSelectionPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" replace /> : <RegisterPage />
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/meals" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageMealsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageStudentsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManagePaymentsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/feedback" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageFeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/manage-feedback" element={
          <ProtectedRoute allowedRoles={['admin', 'staff_head']}>
            <ManageFeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/student-feedback" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentFeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/mess-staff" element={
          <ProtectedRoute allowedRoles={['admin', 'staff_head']}>
            <MessWorkerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/meals" element={
          <ProtectedRoute>
            <MealsPage />
          </ProtectedRoute>
        } />
        <Route path="/students" element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/head-staff" element={
          <ProtectedRoute allowedRoles={['staff_head']}>
            <HeadStaffDashboard />
          </ProtectedRoute>
        } />
        <Route path="/role-selection" element={<RoleSelectionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
