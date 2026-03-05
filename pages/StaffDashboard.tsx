
import React from 'react';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import MockExamsPage from './staff/MockExamsPage';
import ExamBuilderPage from './staff/ExamBuilderPage';
import PracticeManager from './staff/PracticeManager';
import { motion } from 'motion/react';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Overview: React.FC = () => {
  const stats = [
    { label: 'Total Students', value: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Question Bank', value: '4,520', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Exams', value: '12', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Score', value: '78%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening with your students today.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-4 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Users size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">New student registered</p>
                  <p className="text-xs text-slate-500">Maria Santos just joined the platform.</p>
                </div>
                <span className="text-xs text-slate-400">2 mins ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
              Create New Exam
            </button>
            <button className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
              Add Question
            </button>
            <button className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
              Export Reports
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
    <p className="text-slate-500">This section is currently under development. Check back soon!</p>
    <div className="mt-12 p-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
      <GraduationCap size={64} className="mb-4 opacity-20" />
      <p className="font-medium">Content Placeholder</p>
    </div>
  </motion.div>
);

const StaffDashboard: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StaffSidebar />
      <div className="flex-1 flex flex-col">
        <StaffHeader />
        <main className="p-8">
          <Routes>
            <Route path="overview" element={<Overview />} />
            <Route path="students" element={<PlaceholderPage title="Manage Students" />} />
            <Route path="questions" element={<PlaceholderPage title="Manage Questions" />} />
            <Route path="practice" element={<PracticeManager />} />
            <Route path="mock-exams" element={<MockExamsPage />} />
            <Route path="mock-exams/:id" element={<ExamBuilderPage />} />
            <Route path="rooms" element={<PlaceholderPage title="Mockboard Rooms" />} />
            <Route path="analytics" element={<PlaceholderPage title="Reports & Analytics" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;
