
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChart3, 
  Search, 
  Calendar, 
  FileText, 
  X, 
  Download, 
  Loader2, 
  Trophy, 
  XCircle,
  TrendingUp,
  Target,
  Medal,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  mock_exams: { title: string };
}

const StudentAnalytics: React.FC = () => {
  const { profile } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      fetchResults();
    }
  }, [profile]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mock_exam_results')
        .select(`
          *,
          mock_exams:exam_id (title)
        `)
        .eq('student_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !selectedResult) return;
    
    try {
      setIsDownloading(true);
      const element = reportRef.current;
      
      const originalStyle = element.style.cssText;
      element.style.backgroundColor = 'white';
      element.style.width = '800px';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800
      });
      
      element.style.cssText = originalStyle;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MockBoard_Result_${profile?.name?.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const chartData = [...results].reverse().map(res => ({
    date: new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: res.percentage
  }));

  const stats = {
    totalExams: results.length,
    avgScore: results.length > 0 ? (results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length).toFixed(1) : 0,
    passRate: results.length > 0 ? ((results.filter(r => r.passed).length / results.length) * 100).toFixed(1) : 0,
    highestScore: results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-medium tracking-wide">Analyzing your performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">My Performance Analytics</h1>
        <p className="text-slate-500">Track your progress and review your mock board exam results.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Exams', value: stats.totalExams, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg. GWA', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Pass Rate', value: `${stats.passRate}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Highest GWA', value: `${stats.highestScore}%`, icon: Medal, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
              <stat.icon size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full border-white/60">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              GWA Progression
            </h3>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                  <BarChart3 size={48} className="mb-4 opacity-20" />
                  <p>No exam data available yet.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Recent Results List */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full border-white/60">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Exams</h3>
            <div className="space-y-4">
              {results.length === 0 ? (
                <p className="text-slate-400 italic text-center py-8">Take an exam to see results here.</p>
              ) : (
                results.slice(0, 5).map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedResult(res)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${res.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {res.passed ? <Trophy size={20} /> : <XCircle size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{res.mock_exams?.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(res.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${res.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{res.percentage}%</p>
                      <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Full Results Table */}
      <GlassCard className="border-white/60 overflow-hidden">
        <div className="p-6 border-b border-white/60">
          <h3 className="text-lg font-bold text-slate-800">Exam History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam Title</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">GWA</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No examination history found.
                  </td>
                </tr>
              ) : (
                results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{res.mock_exams?.title}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-slate-600">{res.score} / {res.total_items}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-black ${res.passed ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {res.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          res.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {res.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Calendar size={14} />
                        {new Date(res.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedResult(res)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="View Detailed Report"
                      >
                        <FileText size={18} />
                      </button>
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

                <div className="p-8 md:p-12" ref={reportRef}>
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">MOCK BOARD EXAMINATION RESULT</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Academic Year 2025-2026</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-100">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name of Student</p>
                        <p className="text-lg font-bold text-slate-800">{profile?.name}</p>
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

                  <div className="mt-10 flex justify-end gap-4 no-print">
                    <button 
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                      {isDownloading ? 'Generating PDF...' : 'Download PDF'}
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

export default StudentAnalytics;
