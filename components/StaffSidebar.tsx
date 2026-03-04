
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
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

const StaffSidebar: React.FC = () => {
  const { signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/staff/overview' },
    { icon: Users, label: 'Manage Students', path: '/staff/students' },
    { icon: BookOpen, label: 'Manage Questions', path: '/staff/questions' },
    { icon: FileText, label: 'Mock Exams', path: '/staff/mock-exams' },
    { icon: DoorOpen, label: 'Mockboard Rooms', path: '/staff/rooms' },
    { icon: BarChart3, label: 'Reports/Analytics', path: '/staff/analytics' },
    { icon: Settings, label: 'Settings', path: '/staff/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-50">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Compass size={24} />
        </div>
        <span className="font-bold text-slate-800 text-xl tracking-tight">ComPASS</span>
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
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default StaffSidebar;
