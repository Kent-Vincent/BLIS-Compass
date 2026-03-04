
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import IndexEntry from './pages/IndexEntry';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import RegisterPage from './pages/RegisterPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import ErrorPage from './pages/ErrorPage';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return <Navigate to="/error" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Otherwise redirect to their appropriate dashboard
    const target = profile.role === UserRole.STUDENT ? '/student' : '/staff';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<IndexEntry />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/verified" element={<EmailVerifiedPage />} />
      <Route path="/error" element={<ErrorPage />} />
      
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/staff/*" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.FACULTY, UserRole.ADMIN]}>
            <StaffDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Legacy redirect */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen">
          <AppRoutes />
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
