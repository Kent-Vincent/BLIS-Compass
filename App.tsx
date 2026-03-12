
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import IndexEntry from './pages/IndexEntry';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import RegisterPage from './pages/RegisterPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import TakeExamPage from './pages/student/TakeExamPage';
import PracticePlayer from './pages/student/PracticePlayer';
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
    // If we have a session but no profile, it might be loading or timed out
    // Show a loading state instead of immediately redirecting to error
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-medium">Loading your profile...</p>
        <p className="text-slate-400 text-sm mt-2">If this takes too long, try refreshing the page.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Refresh Page
        </button>
      </div>
    );
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
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
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
        path="/student/mock-exams/:id" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <TakeExamPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/student/practice/:subjectId/part/:partNo" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <PracticePlayer />
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
