
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText,
  DoorOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  Loader2,
  Compass,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';

const StaffSidebar: React.FC = () => {
  const { profile, signOut, signingOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/staff/overview' },
    { icon: Users, label: isAdmin ? 'Manage Accounts' : 'Manage Students', path: '/staff/accounts' },
    { icon: BookOpen, label: 'Practice Sets', path: '/staff/practice' },
    { icon: FileText, label: 'Mock Exams', path: '/staff/mock-exams' },
    { icon: Database, label: 'Question Bank', path: '/staff/question-bank' },
    { icon: DoorOpen, label: 'Mockboard Rooms', path: '/staff/rooms' },
    { icon: BarChart3, label: 'Reports/Analytics', path: '/staff/analytics' },
    { icon: Settings, label: 'Settings', path: '/staff/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-50">
        <Logo showText size={40} />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
              ${isActive 
                ? 'bg-indigo-50 text-indigo-600' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
            `}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <button
          onClick={signOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
        >
          {signingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
          {signingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default StaffSidebar;
