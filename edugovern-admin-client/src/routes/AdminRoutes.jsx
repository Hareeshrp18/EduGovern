import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../pages/auth/AdminLogin.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import AdminDashboard from '../pages/dashboard/AdminDashboard.jsx';
import AdminStudents from '../pages/students/AdminStudents.jsx';
import AdminAnnouncements from '../pages/announcements/AdminAnnouncements.jsx';
import AdminFaculty from '../pages/faculty/AdminFaculty.jsx';
import AdminTransport from '../pages/transport/AdminTransport.jsx';
import AdminMessages from '../pages/messages/AdminMessages.jsx';
import AdminReport from '../pages/reports/AdminReport.jsx';
import AdminRequests from '../pages/requests/AdminRequests.jsx';
import AdminAcademicSetup from '../pages/academicSetup/AdminAcademicSetup.jsx';
import AdminStudentProgress from '../pages/studentProgress/AdminStudentProgress.jsx';
import { isAuthenticated } from '../utils/auth.js';

/*Protected Route ComponentRedirects to login if not authenticated*/
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

/* Admin Routes Configuration*/
const AdminRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />
    
      {/* Protected routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute>
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute>
            <AdminAnnouncements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faculty"
        element={
          <ProtectedRoute>
            <AdminFaculty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transport"
        element={
          <ProtectedRoute>
            <AdminTransport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute>
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <AdminReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute>
            <AdminRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/academic-setup"
        element={
          <ProtectedRoute>
            <AdminAcademicSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/student-progress"
        element={
          <ProtectedRoute>
            <AdminStudentProgress />
          </ProtectedRoute>
        }
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

export default AdminRoutes;


