
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Clock, 
  ListChecks, 
  Play, 
  Loader2, 
  AlertCircle, 
  Lock, 
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Timer,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MockExam, MockExamSubjectSession, MockExamAttempt } from '../../types';
import { MOCK_EXAM_SUBJECTS } from '../../src/constants';
import GlassCard from '../../components/GlassCard';

const SubjectAccordionItem: React.FC<{
  session: MockExamSubjectSession;
  index: number;
  attempt?: MockExamAttempt;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  onNavigate: () => void;
}> = ({ session, index, attempt, status, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const openAt = new Date(session.open_at);

  useEffect(() => {
    if (status !== 'locked') return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = openAt.getTime() - now;

      if (distance < 0) {
        setTimeLeft('Available Now');
        clearInterval(timer);
        // We could trigger a re-fetch here but status is passed from parent
        return;
      }

      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`Starts in ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, openAt]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} />
            Completed
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/50 text-orange-600 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            Ongoing
          </div>
        );
      case 'locked':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Lock size={12} />
            Locked
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
            Available
          </div>
        );
    }
  };

  return (
    <div className="group">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 [@media(max-height:850px)]:p-3 cursor-pointer transition-all border-b border-slate-100 hover:bg-slate-50/50 ${
          isExpanded ? 'bg-slate-50/80 shadow-sm' : ''
        }`}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
            status === 'in_progress' ? 'bg-orange-100 text-orange-600' :
            status === 'locked' ? 'bg-slate-100 text-slate-400' :
            'bg-indigo-100 text-indigo-600'
          }`}>
            {index + 1}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight [@media(max-height:850px)]:text-sm">{session.subject_name}</h3>
            <div className="flex items-center gap-3 mt-1 [@media(max-height:850px)]:mt-0.5">
               <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider [@media(max-height:850px)]:text-[9px]">
                  <Clock size={12} />
                  <span>{session.duration_minutes}m</span>
               </div>
               <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider [@media(max-height:850px)]:text-[9px]">
                  <ListChecks size={12} />
                  <span>{session.question_limit} Qs</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 [@media(max-height:850px)]:mb-0.5 [@media(max-height:850px)]:text-[9px]">Schedule</span>
            <span className="text-xs font-semibold text-slate-600 [@media(max-height:850px)]:text-[11px]">
              {openAt.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {openAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex flex-col items-end text-right min-w-[120px] [@media(max-height:850px)]:min-w-[100px]">
            {status === 'locked' ? (
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest [@media(max-height:850px)]:text-[10px]">
                {timeLeft || 'Locked'}
              </span>
            ) : status === 'available' ? (
              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest [@media(max-height:850px)]:text-[10px]">Available Now</span>
            ) : (
              getStatusDisplay()
            )}
          </div>

          <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-300 group-hover:text-slate-400'}`}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/30 border-b border-slate-100"
          >
            <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex flex-wrap gap-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                        <Timer size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Allocated Time</p>
                        <p className="font-bold text-slate-700">{session.duration_minutes} Minutes</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                        <FileText size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Items</p>
                        <p className="font-bold text-slate-700">{session.question_limit} Items</p>
                     </div>
                  </div>
               </div>

               <div className="w-full md:w-auto">
                  {status === 'completed' ? (
                    <div className="flex flex-col items-end gap-2">
                       <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-widest mb-1">
                          <CheckCircle2 size={14} /> session completed
                       </span>
                       <button disabled className="px-8 py-3 bg-emerald-100 text-emerald-600 rounded-xl font-bold opacity-70 cursor-not-allowed text-sm">
                          Submitted Successfully
                       </button>
                    </div>
                  ) : status === 'locked' ? (
                    <div className="flex flex-col items-end gap-2">
                       <div className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold flex items-center gap-2 border border-slate-200 text-sm">
                          <Lock size={16} />
                          Currently Locked
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unlocks {openAt.toLocaleString()}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={onNavigate}
                      className={`px-10 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3 text-sm ${
                        status === 'in_progress'
                          ? 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-700'
                          : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                      }`}
                    >
                      {status === 'in_progress' ? (
                        <>Continue Session <ChevronRight size={18} /></>
                      ) : (
                        <>Start Subject <Play size={16} /></>
                      )}
                    </button>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MockExamLobby: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [sessions, setSessions] = useState<MockExamSubjectSession[]>([]);
  const [attempts, setAttempts] = useState<MockExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchExamAndSessions();
    }
  }, [id]);

  const fetchExamAndSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Exam
      const { data: examData, error: examError } = await supabase
        .from('mock_exams')
        .select('*')
        .eq('id', id)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // 2. Fetch Sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mock_exam_subject_sessions')
        .select('*')
        .eq('exam_id', id);

      if (sessionsError) throw sessionsError;
      
      const sortedSessions = (sessionsData || []).sort((a, b) => {
        const indexA = MOCK_EXAM_SUBJECTS.indexOf(a.subject_name);
        const indexB = MOCK_EXAM_SUBJECTS.indexOf(b.subject_name);
        const finalA = indexA === -1 ? 999 : indexA;
        const finalB = indexB === -1 ? 999 : indexB;
        return finalA - finalB;
      });

      setSessions(sortedSessions);

      // 3. Fetch Student Attempts for these sessions
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('mock_exam_attempts')
          .select('*')
          .eq('exam_id', id)
          .eq('student_id', user.id);

        if (!attemptsError) {
          setAttempts(attemptsData || []);
        }
      }

    } catch (err: any) {
      console.error('Error fetching exam lobby:', err);
      setError(err.message || 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const getSessionStatus = (session: MockExamSubjectSession) => {
    const now = new Date();
    const openAt = new Date(session.open_at);
    const attempt = attempts.find(a => a.session_id === session.id);

    if (attempt?.is_submitted) return 'completed';
    if (attempt && !attempt.is_submitted) return 'in_progress';
    if (now < openAt) return 'locked';
    return 'available';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-500 font-medium">Preparing your board simulation...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-center border border-red-100 max-w-2xl mx-auto mt-10">
        <AlertCircle size={48} className="mx-auto mb-4" />
        <p className="font-bold text-lg">{error || 'Exam not found'}</p>
        <button onClick={() => navigate('/student/mock-exams')} className="mt-4 text-blue-600 font-bold hover:underline flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft size={18} />
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center py-8 md:py-12 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 [@media(max-height:850px)]:gap-2 px-2">
        <div className="flex items-start gap-3 md:gap-5">
          <button 
            onClick={() => navigate('/student/mock-exams')}
            className="p-2 md:p-3 text-slate-400 hover:text-slate-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 mt-1"
          >
            <ArrowLeft size={window.innerHeight < 850 ? 20 : 24} />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-800 leading-tight [@media(max-height:850px)]:text-lg">{exam.title}</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">Select a subject to begin or continue your mock board simulation.</p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center text-slate-400">
          <FileText size={64} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No subjects found for this exam.</p>
          <p className="text-sm">Please wait for the instructor to configure the sessions.</p>
        </div>
      ) : (
        <GlassCard className="overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/50">
          <div className="bg-white/50 border-b border-slate-100 p-4 [@media(max-height:850px)]:p-3">
             <div className="flex items-center justify-between">
                <h2 className="font-black text-slate-800 text-[10px] md:text-xs uppercase tracking-[0.2em]">Board Exam Schedule</h2>
                <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                   <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                      <span>{sessions.length} Subjects Total</span>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {sessions.map((session, idx) => {
              const status = getSessionStatus(session);
              const attempt = attempts.find(a => a.session_id === session.id);

              return (
                <SubjectAccordionItem 
                  key={session.id}
                  session={session}
                  index={idx}
                  attempt={attempt}
                  status={status}
                  onNavigate={() => navigate(`/student/mock-exams/session/${session.id}`)}
                />
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default MockExamLobby;
