
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Search, 
  Filter, 
  Download,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  X,
  LayoutGrid,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import GlassCard from '../../components/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ExamResult {
  id: string;
  student_id: string;
  exam_id: string;
  score: number;
  total_items: number;
  percentage: number;
  passed: boolean;
  category_breakdown: any[];
  created_at: string;
  profiles: { full_name: string };
  mock_exams: { title: string };
}

const AnalyticsPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mock_exam_results')
        .select(`
          *,
          profiles:student_id (full_name),
          mock_exams:exam_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error('Error fetching results:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(res => {
    const matchesSearch = res.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         res.mock_exams?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'passed' && res.passed) || 
                         (filterStatus === 'failed' && !res.passed);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalAttempts: results.length,
    avgScore: results.length > 0 ? (results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length).toFixed(1) : 0,
    passRate: results.length > 0 ? ((results.filter(r => r.passed).length / results.length) * 100).toFixed(1) : 0,
    activeStudents: new Set(results.map(r => r.student_id)).size
  };

  // Prepare chart data (last 7 days)
  const chartData = results.slice(0, 10).reverse().map(res => ({
    name: res.profiles?.full_name?.split(' ')[0] || 'User',
    score: res.percentage
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Reports & Analytics</h1>
          <p className="text-slate-500">Monitor student performance and exam statistics.</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
          <Download size={20} />
          Export Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Submissions', value: stats.totalAttempts, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Average Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Overall Pass Rate', value: `${stats.passRate}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Students', value: stats.activeStudents, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
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
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8 border-slate-200 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Performance Trend</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Pass/Fail Distribution */}
        <div>
          <GlassCard className="p-8 border-slate-200 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Result Distribution</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-slate-600">Passed</span>
                  <span className="text-emerald-600 font-bold">{stats.passRate}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${stats.passRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-slate-600">Failed</span>
                  <span className="text-rose-600 font-bold">{results.length > 0 ? (100 - Number(stats.passRate)).toFixed(1) : 0}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${results.length > 0 ? 100 - Number(stats.passRate) : 0}%` }} />
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-3 text-indigo-600 font-bold mb-2">
                <BarChart3 size={20} />
                <span>Quick Insight</span>
              </div>
              <p className="text-sm text-indigo-500 leading-relaxed">
                {Number(stats.passRate) > 70 
                  ? "Students are performing exceptionally well. Consider increasing the difficulty of mock exams."
                  : "Pass rate is below target. You might want to review the 'Cataloging' and 'Reference' sections with students."}
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Results Table */}
      <GlassCard className="border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800">Detailed Submissions</h3>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search student or exam..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Exam Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Percentage</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No results found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {res.profiles?.full_name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{res.profiles?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-medium">{res.mock_exams?.title}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-700">{res.score} / {res.total_items}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-black ${res.passed ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {res.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} />
                        {new Date(res.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          res.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {res.passed ? 'Passed' : 'Failed'}
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedResult(res);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Detailed Report"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Detailed Report Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedResult && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedResult(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                key="modal-content"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl no-print"
              >
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>

                <div className="p-8 md:p-12">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">MOCK BOARD EXAMINATION RESULT</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Academic Year 2025-2026</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name of Student</p>
                        <p className="text-lg font-bold text-slate-800">{selectedResult.profiles?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course & Year</p>
                        <p className="text-md font-bold text-slate-700">BLIS-4</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end justify-center">
                      <div className="text-center md:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">General Weighted Average</p>
                        <p className={`text-5xl font-black ${selectedResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedResult.percentage}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden mb-10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <th className="py-4 px-6">Subjects</th>
                          <th className="py-4 px-4 text-center">Required Percentile</th>
                          <th className="py-4 px-4 text-center">Actual Score</th>
                          <th className="py-4 px-4 text-center">Rating</th>
                          <th className="py-4 px-6 text-right">Percentile Distribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedResult.category_breakdown?.map((item: any, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="py-4 px-6">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-300 font-bold text-xs">{idx + 1}.</span>
                                <span className="font-bold text-slate-700 leading-tight">{item.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center text-slate-500 font-bold">{item.weight}%</td>
                            <td className="py-4 px-4 text-center text-slate-600 font-bold">{item.score} / {item.total}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`font-black ${parseFloat(item.rating) >= 75 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                {item.rating}%
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-indigo-600">{item.contribution}%</td>
                          </tr>
                        ))}
                        <tr className="bg-indigo-600 text-white font-black">
                          <td className="py-5 px-6 rounded-bl-2xl">TOTAL:</td>
                          <td className="py-5 px-4 text-center">100%</td>
                          <td className="py-5 px-4 text-center">{selectedResult.score} / {selectedResult.total_items}</td>
                          <td className="py-5 px-4 text-center">-</td>
                          <td className="py-5 px-6 text-right rounded-br-2xl">{selectedResult.percentage}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Score:</span>
                        <span className="text-md font-bold text-slate-800">{selectedResult.score} / {selectedResult.total_items}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Weighted Average:</span>
                        <span className="text-md font-bold text-slate-800">{selectedResult.percentage}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate:</span>
                        <span className={`text-md font-black ${selectedResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedResult.percentage}%</span>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Remarks:</p>
                        <div className={`text-2xl font-black ${selectedResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {selectedResult.passed ? 'PASSED' : 'FAILED'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end space-y-8 text-center lg:text-right">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Checked and verified by:</p>
                        <p className="text-xs font-black text-slate-800 uppercase">ISAVAL MAE C. MONTERDE, RL, MLIS</p>
                        <p className="text-[10px] font-bold text-slate-500">LPr2/LIS115 Instructor/ BLIS Coordinator</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Noted by:</p>
                        <p className="text-xs font-black text-slate-800 uppercase">OWEN B. PILONGO, MIT, DBM-IS</p>
                        <p className="text-[10px] font-bold text-slate-500">Dean, CET</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end gap-4">
                    <button 
                      onClick={() => window.print()}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Download size={18} />
                      Download PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default AnalyticsPage;
