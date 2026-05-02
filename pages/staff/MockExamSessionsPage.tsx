
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Loader2, 
  Save, 
  CheckCircle2, 
  FileText,
  ChevronDown,
  ChevronUp,
  History,
  Timer
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MockExam, MockExamSubjectSession } from '../../types';
import { MOCK_EXAM_SUBJECTS } from '../../src/constants';
import GlassCard from '../../components/GlassCard';

const SubjectAccordionItem: React.FC<{
  session: MockExamSubjectSession;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<MockExamSubjectSession>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}> = ({ session, index, isExpanded, onToggle, onUpdate, onSave, saving }) => {
  const navigate = useNavigate();
  const openAt = new Date(session.open_at);
  const now = new Date();
  
  const getStatus = () => {
    if (!session.open_at) return { label: 'Not Set', color: 'text-slate-400 bg-slate-50' };
    if (openAt > now) return { label: 'Scheduled', color: 'text-blue-600 bg-blue-50' };
    return { label: 'Available', color: 'text-emerald-600 bg-emerald-50' };
  };

  const status = getStatus();

  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'bg-indigo-50/30' : 'bg-transparent'}`}>
      {/* Collapsed Row */}
      <div 
        onClick={onToggle}
        className={`flex items-center justify-between p-2 md:p-3 [@media(min-width:1900px)_and_(min-height:1000px)]:p-5 [@media(max-height:850px)]:p-2 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${isExpanded ? 'border-indigo-100' : ''}`}
      >
        <div className="flex items-center gap-3 md:gap-4 [@media(min-width:1900px)_and_(min-height:1000px)]:gap-6 flex-1">
          <div className={`w-8 h-8 [@media(min-width:1900px)_and_(min-height:1000px)]:w-10 [@media(min-width:1900px)_and_(min-height:1000px)]:h-10 rounded-lg flex items-center justify-center font-bold text-xs [@media(min-width:1900px)_and_(min-height:1000px)]:text-sm shrink-0 ${isExpanded ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
            {index + 1}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm md:text-base [@media(min-width:1900px)_and_(min-height:1000px)]:text-xl [@media(max-height:850px)]:text-sm transition-colors group-hover:text-indigo-600">
              {session.subject_name}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
               <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${status.color}`}>
                 {status.label}
               </span>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:flex items-center gap-1">
                 <Calendar size={10} />
                 {openAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-10">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time Limit</span>
            <span className="text-xs font-bold text-slate-700">{session.duration_minutes}m</span>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Questions</span>
            <span className="text-xs font-bold text-slate-700">{session.completed_count || 0}/{session.question_limit}</span>
          </div>
          <div className={`p-1.5 rounded-full transition-all ${isExpanded ? 'bg-white text-indigo-600 shadow-sm rotate-180' : 'text-slate-300'}`}>
             <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border-b border-indigo-100"
          >
            <div className="p-3 md:p-5 [@media(max-height:850px)]:p-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* Schedule Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Opening Date & Time</label>
                    <div className="flex flex-wrap gap-2">
                       <div className="relative group flex-1 min-w-[140px]">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={14} />
                          <input 
                            type="date" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={new Date(session.open_at).toISOString().split('T')[0]}
                            onChange={(e) => {
                              const date = e.target.value;
                              const time = new Date(session.open_at).toTimeString().split(' ')[0];
                              onUpdate({ open_at: new Date(`${date}T${time}`).toISOString() });
                            }}
                          />
                       </div>
                       <div className="relative group flex-1 min-w-[110px]">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={14} />
                          <input 
                            type="time" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={new Date(session.open_at).toTimeString().slice(0, 5)}
                            onChange={(e) => {
                              const date = new Date(session.open_at).toISOString().split('T')[0];
                              const time = e.target.value;
                              onUpdate({ open_at: new Date(`${date}T${time}`).toISOString() });
                            }}
                          />
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Duration (Mins)</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={session.duration_minutes}
                          onChange={(e) => onUpdate({ duration_minutes: parseInt(e.target.value) })}
                        />
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Q. Limit</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={session.question_limit}
                          onChange={(e) => onUpdate({ question_limit: parseInt(e.target.value) })}
                        />
                     </div>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex flex-col justify-end gap-3">
                   <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-around border border-slate-100">
                      <div className="text-center">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Coverage</p>
                         <p className="text-lg font-black text-slate-700">
                            {session.completed_count || 0}<span className="text-xs text-slate-400">/</span>{session.question_limit}
                         </p>
                      </div>
                      <div className="h-8 w-[1px] bg-slate-200" />
                      <div className="text-center">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Allocated</p>
                         <p className="text-lg font-black text-slate-700">
                            {session.duration_minutes}<span className="text-xs text-slate-400">m</span>
                         </p>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <button 
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Schedule
                      </button>
                      <button 
                        onClick={() => navigate(`/staff/mock-exams/sessions/${session.id}`)}
                        className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={18} />
                        Manage Questions
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MockExamSessionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [sessions, setSessions] = useState<MockExamSubjectSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    if (id) fetchExamAndSessions();
  }, [id]);

  const fetchExamAndSessions = async () => {
    try {
      setLoading(true);
      const { data: examData, error: examError } = await supabase
        .from('mock_exams')
        .select('*')
        .eq('id', id)
        .single();

      if (examError) throw examError;
      setExam(examData);

      const { data: sessionData, error: sessionError } = await supabase
        .from('mock_exam_subject_sessions')
        .select('*')
        .eq('exam_id', id);

      if (sessionError) throw sessionError;

      const sortedSessions = (sessionData || []).sort((a, b) => {
        const indexA = MOCK_EXAM_SUBJECTS.indexOf(a.subject_name);
        const indexB = MOCK_EXAM_SUBJECTS.indexOf(b.subject_name);
        const finalA = indexA === -1 ? 999 : indexA;
        const finalB = indexB === -1 ? 999 : indexB;
        return finalA - finalB;
      });

      if (!sessionData || sessionData.length === 0) {
        const newSessions = MOCK_EXAM_SUBJECTS.map(subject => ({
          exam_id: id,
          subject_name: subject,
          open_at: new Date().toISOString(),
          duration_minutes: 120,
          question_limit: 100,
          completed_count: 0
        }));

        const { data: insertedSessions, error: insertError } = await supabase
          .from('mock_exam_subject_sessions')
          .insert(newSessions)
          .select();

        if (insertError) throw insertError;
        setSessions(insertedSessions || []);
      } else {
        setSessions(sortedSessions);
      }
    } catch (err) {
      console.error('Error fetching exam sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIndividual = async (session: MockExamSubjectSession) => {
    try {
      setSaving(true);
      setSuccess(false);

      const { error } = await supabase
        .from('mock_exam_subject_sessions')
        .update({
          open_at: session.open_at,
          duration_minutes: session.duration_minutes,
          question_limit: session.question_limit
        })
        .eq('id', session.id);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving session:', err);
      alert('Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const emergencyReset = async () => {
    if (!window.confirm('WARNING: This will delete ALL current session configurations for this marked exam and recreate them. Questions may be orphaned if subject names change. Continue?')) return;
    
    try {
      setSaving(true);
      await supabase.from('mock_exam_subject_sessions').delete().eq('exam_id', id);
      await fetchExamAndSessions();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error resetting:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 min-h-[50vh] items-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!exam) return <div>Exam not found.</div>;

  return (
    <div className="max-w-4xl [@media(min-width:1900px)_and_(min-height:1000px)]:max-w-6xl mx-auto py-4 md:py-6 [@media(min-width:1900px)_and_(min-height:1000px)]:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-0 overflow-hidden flex flex-col justify-center">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 [@media(min-width:1900px)_and_(min-height:1000px)]:gap-8 px-2 mb-4 [@media(min-width:1900px)_and_(min-height:1000px)]:mb-8">
        <div className="space-y-1 md:space-y-2 [@media(min-width:1900px)_and_(min-height:1000px)]:space-y-3">
          <button 
            onClick={() => navigate('/staff/mock-exams')}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-bold text-xs [@media(min-width:1900px)_and_(min-height:1000px)]:text-sm uppercase tracking-widest mb-1"
          >
            <ArrowLeft size={16} />
            Back to Exams
          </button>
          <h1 className="text-2xl md:text-3xl [@media(min-width:1900px)_and_(min-height:1000px)]:text-5xl font-black text-slate-800 leading-tight">
            {exam.title}
          </h1>
          <p className="text-slate-500 text-sm [@media(min-width:1900px)_and_(min-height:1000px)]:text-base font-medium">Simulation Schedule & Session Management</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {success && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2"
            >
               <CheckCircle2 size={12} />
               Updates Saved!
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            <button 
              onClick={emergencyReset}
              className="p-3 text-slate-300 hover:text-rose-400 transition-colors"
              title="Emergency Reset Schedule"
            >
              <History size={18} />
            </button>
            <GlassCard className="px-5 py-2.5 bg-indigo-50/50 border-indigo-100 flex items-center gap-4">
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subjects</p>
                 <p className="text-sm font-black text-slate-800">{sessions.length}</p>
              </div>
              <div className="w-[1px] h-6 bg-indigo-100" />
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Limit</p>
                 <p className="text-sm font-black text-slate-800">{sessions.length * 100} Qs</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <GlassCard className="overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/50">
        <div className="bg-slate-50/50 border-b border-slate-100 p-3 [@media(min-width:1900px)_and_(min-height:1000px)]:p-5 [@media(max-height:850px)]:p-2.5">
           <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-800 text-[10px] md:text-xs [@media(min-width:1900px)_and_(min-height:1000px)]:text-sm uppercase tracking-[0.2em]">Board Exam Simulation Schedule</h2>
           </div>
        </div>
        
        <div className="divide-y divide-slate-100 [@media(min-width:1900px)_and_(min-height:1000px)]:max-h-[calc(100vh-450px)] [@media(min-width:1900px)_and_(min-height:1000px)]:overflow-y-auto">
          {sessions.map((session, idx) => (
            <SubjectAccordionItem 
              key={session.id}
              session={session}
              index={idx}
              isExpanded={expandedIndex === idx}
              onToggle={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              onUpdate={(updates) => setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...updates } : s))}
              onSave={() => handleSaveIndividual(session)}
              saving={saving}
            />
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default MockExamSessionsPage;
