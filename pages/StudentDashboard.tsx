
import React from 'react';
import { motion } from 'motion/react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { GameCard, MockExam } from '../types';
import { useAuth } from '../context/AuthContext';
import MockExamsPage from './student/MockExamsPage';
import TakeExamPage from './student/TakeExamPage';
import PracticeSetsTab from './student/PracticeSetsTab';
import PracticePlayer from './student/PracticePlayer';
import Logo from '../components/Logo';
import { 
  Home, 
  Gamepad2, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Loader2,
  BookOpen,
  Flame, 
  Star, 
  Compass,
  CheckCircle2,
  Medal,
  ArrowRight,
  GraduationCap,
  Tags,
  Mountain,
  Search,
  Network,
  Info,
  Building2,
  Indent
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GAMES: GameCard[] = [
  { id: '1', title: 'Cataloging Blitz', description: 'Correctly assign MARC tags in this fast-paced challenge.', category: '', icon: 'Tags', difficulty: 'Beginner' },
  { id: '2', title: 'DDC Climber', description: 'Scale the mountain by correctly identifying class numbers.', category: '', icon: 'Mountain', difficulty: 'Beginner' },
  { id: '3', title: 'Reference Quest', description: 'Find the right sources for complex user inquiries.', category: '', icon: 'Search', difficulty: 'Beginner' },
  { id: '4', title: 'Indexing Maze', description: 'Connect related terms using controlled vocabulary.', category: '', icon: 'Network', difficulty: 'Beginner' },
];

const PROGRESS_DATA = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 72 },
  { day: 'Wed', score: 68 },
  { day: 'Thu', score: 85 },
  { day: 'Fri', score: 82 },
  { day: 'Sat', score: 90 },
  { day: 'Sun', score: 95 },
];

const OverviewTab: React.FC<{ profile: any, IconMap: any, navigate: any }> = ({ profile, IconMap, navigate }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Main Stats Area */}
    <div className="lg:col-span-2 space-y-8 min-w-0">
      {/* Progress Summary */}
      <GlassCard className="border-white/60">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 text-lg">Performance Trend</h3>
          <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
            +12% from last week
          </span>
        </div>

        <div className="w-full min-w-0 min-h-[160px]">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={PROGRESS_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Cataloging', icon: Tags, color: 'text-blue-600', bg: 'bg-blue-50', path: '/student/practice' },
           { label: 'Admin', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', path: '/student/practice' },
           { label: 'Indexing', icon: Indent, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/student/practice' },
           { label: 'Reference', icon: Info, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/student/practice' },
         ].map((item, idx) => (
           <button 
             key={idx} 
             onClick={() => navigate(item.path)}
             className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-all group"
           >
              <div className={`${item.bg} ${item.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon size={24} />
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{item.label}</span>
           </button>
         ))}
      </div>

      {/* Featured Mini-Game */}
      <div className="grid md:grid-cols-2 gap-6">
         {GAMES.slice(0, 2).map((game) => (
            <GlassCard key={game.id} hoverEffect className="relative overflow-hidden group border-white/60">
               <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    {React.createElement(IconMap[game.icon] || Gamepad2, { size: 24 })}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{game.title}</h4>
                  </div>
               </div>
               <p className="text-sm text-slate-500 mb-6 line-clamp-2">{game.description}</p>
               <button 
                 onClick={() => navigate('/student/games')}
                 className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold transition-all hover:bg-blue-700 shadow-lg shadow-blue-100"
               >
                  Play Now
               </button>
            </GlassCard>
         ))}
      </div>
    </div>

    {/* Sidebar / Profile Area */}
    <div className="space-y-8">
       {/* Today's Goal */}
       <GlassCard className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-xl shadow-blue-100">
          <h3 className="font-bold text-lg mb-2">Today's Goal</h3>
          <p className="text-blue-100 text-sm mb-6">Complete 2 Mockboard Simulations to reach Level 13.</p>
          
          <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider">
            <span>Progress (1/2)</span>
            <span>50%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-6">
            <div className="bg-white h-full" style={{ width: '50%' }}></div>
          </div>
          
          <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold shadow-sm transition-transform active:scale-95">
            View Daily Tasks
          </button>
       </GlassCard>

       {/* Recent Activity */}
       <GlassCard className="border-white/60">
          <h3 className="font-bold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Mock Exam Completed', time: '2h ago', points: '+250 XP', icon: CheckCircle2, color: 'text-emerald-500' },
              { action: 'Cataloging Blitz', time: 'Yesterday', points: '+120 XP', icon: Gamepad2, color: 'text-blue-500' },
              { action: 'Earned "DDC Expert"', time: '2d ago', points: '+500 XP', icon: Medal, color: 'text-amber-500' },
            ].map((act, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`mt-1 ${act.color}`}>
                  <act.icon size={18} />
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-slate-700">{act.action}</p>
                  <p className="text-xs text-slate-400">{act.time}</p>
                </div>
                <span className="text-xs font-bold text-blue-600">{act.points}</span>
              </div>
            ))}
          </div>
       </GlassCard>
    </div>
  </div>
);

const GamesTab: React.FC<{ IconMap: any }> = ({ IconMap }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {GAMES.map((game) => (
      <GlassCard key={game.id} hoverEffect className="flex flex-col border-white/60">
        <div className="flex items-center justify-between mb-4">
           <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              {React.createElement(IconMap[game.icon] || Gamepad2, { size: 28 })}
           </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{game.title}</h3>
        <p className="text-slate-500 text-sm mb-6 flex-grow">{game.description}</p>
        <div className="flex items-center justify-between mt-auto">
           <button className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
             Play
           </button>
        </div>
      </GlassCard>
    ))}
  </div>
);

const StudentDashboard: React.FC = () => {
  const { profile, signOut, loading, signingOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/student/games')) return 'games';
    if (path.includes('/student/mock-exams')) return 'mock-exams';
    if (path.includes('/student/practice')) return 'practice';
    return 'overview';
  };

  const activeTab = getActiveTab();
  const isPlayerActive = location.pathname.includes('/mock-exams/') || location.pathname.includes('/practice/');

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const IconMap: Record<string, any> = {
    Tags, Mountain, Search, Network, Info, Building2, Indent
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      {!isPlayerActive && (
        <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
          <div className="mb-10">
            <Logo showText size={40} />
          </div>

          <nav className="space-y-2 flex-grow">
            <button 
              onClick={() => navigate('/student/overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Home size={20} />
              <span>Overview</span>
            </button>
            <button 
              onClick={() => navigate('/student/games')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'games' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Gamepad2 size={20} />
              <span>Mini-Games</span>
            </button>
            <button 
              onClick={() => navigate('/student/mock-exams')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'mock-exams' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileText size={20} />
              <span>Mock Exams</span>
            </button>
            <button 
              onClick={() => navigate('/student/practice')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'practice' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <BookOpen size={20} />
              <span>Practice Sets</span>
            </button>
            <div className="pt-6 mt-6 border-t border-slate-100">
               <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50">
                  <BarChart3 size={20} />
                  <span>Analytics</span>
               </button>
               <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50">
                  <Settings size={20} />
                  <span>Settings</span>
               </button>
            </div>
          </nav>

          <button 
            onClick={signOut}
            disabled={signingOut}
            className="mt-auto flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium disabled:opacity-50"
          >
            {signingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
            <span>{signingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-grow ${!isPlayerActive ? 'p-4 md:p-8 max-w-7xl mx-auto w-full' : ''}`}>
        {/* Top Header */}
        {!isPlayerActive && (
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Hello, {profile.name.split(' ')[0]}! 👋</h1>
              <p className="text-slate-500">Ready to master the board exams today?</p>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <GlassCard className="px-4 py-2 flex items-center space-x-3 !rounded-full border-white/60">
                 <div className="flex items-center text-orange-500 font-bold gap-2">
                   <Flame size={18} />
                   <span>{profile.streak} Days</span>
                 </div>
                 <div className="h-6 w-px bg-slate-200"></div>
                 <div className="flex items-center text-blue-600 font-bold gap-2">
                   <Star size={18} />
                   <span>LVL {profile.level}</span>
                 </div>
              </GlassCard>
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                  {profile.name.charAt(0)}
              </div>
            </div>
          </header>
        )}

        <Routes>
          <Route path="overview" element={<OverviewTab profile={profile} IconMap={IconMap} navigate={navigate} />} />
          <Route path="games" element={<GamesTab IconMap={IconMap} />} />
          <Route path="mock-exams" element={<MockExamsPage />} />
          <Route path="mock-exams/:id" element={<TakeExamPage />} />
          <Route path="practice" element={<PracticeSetsTab />} />
          <Route path="practice/:subjectId/part/:partNo" element={<PracticePlayer />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default StudentDashboard;
