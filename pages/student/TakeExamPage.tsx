
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Send,
  Trophy,
  XCircle,
  Flag,
  LayoutGrid,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MockExam, MockExamItem, ExamType, MockExamAttempt, PracticeSubject } from '../../types';
import GlassCard from '../../components/GlassCard';

const TakeExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<MockExam | null>(null);
  const [items, setItems] = useState<MockExamItem[]>([]);
  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showNav, setShowNav] = useState(true);

  const fetchExamData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Wrap the entire fetch process in a timeout
      const results = await Promise.race([
        (async () => {
          // Warm up session
          await supabase.auth.getSession();

          // Fetch Exam, Items, Subjects, and Attempt
          return await Promise.all([
            supabase
              .from('mock_exams')
              .select('*')
              .eq('id', id)
              .eq('is_published', true)
              .single(),
            supabase
              .from('mock_exam_items')
              .select('*')
              .eq('exam_id', id)
              .order('item_no', { ascending: true }),
            supabase
              .from('practice_subjects')
              .select('*'),
            supabase
              .from('mock_exam_attempts')
              .select('*')
              .eq('exam_id', id)
              .eq('is_submitted', false)
              .maybeSingle()
          ]);
        })(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 20000))
      ]);

      const [examRes, itemsRes, subjectsRes, attemptRes] = results;

      if (examRes.error) throw examRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setExam(examRes.data);
      setItems(itemsRes.data || []);
      setSubjects(subjectsRes.data || []);

      if (attemptRes.data) {
        const attempt = attemptRes.data as MockExamAttempt;
        setAttemptId(attempt.id);
        setAnswers(attempt.answers || {});
        setFlagged(attempt.flagged || {});
        setTimeLeft(attempt.time_left_seconds);
        setCurrentIndex(attempt.current_index || 0);
      } else {
        setTimeLeft(examRes.data.duration_minutes * 60);
      }
    } catch (err: any) {
      console.error('Error fetching exam data:', err);
      
      // Retry logic for network issues or timeouts
      if (retryCount < 3) {
        console.log(`Retrying fetchExamData... (Attempt ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 3000));
        return fetchExamData(retryCount + 1);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your session has expired. Please refresh the page to continue.');
        return;
      }

      const msg = err.message === 'Fetch timeout'
        ? 'The connection is taking longer than expected. Please check your internet and try again.'
        : (err.message || 'Failed to load exam data. Please check your connection.');
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchExamData();
    }
  }, [id, fetchExamData]);

  // Timer logic
  useEffect(() => {
    if (loading || isFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isFinished, timeLeft]);

  const saveProgress = useCallback(async (isSubmitting = false, finalScore = 0) => {
    if (!exam || !id || isFinished) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const attemptData = {
      student_id: user.id,
      exam_id: id,
      answers,
      flagged,
      time_left_seconds: timeLeft,
      current_index: currentIndex,
      is_submitted: isSubmitting,
      score: finalScore,
      total_items: items.length,
      updated_at: new Date().toISOString()
    };

    if (attemptId) {
      await supabase
        .from('mock_exam_attempts')
        .update(attemptData)
        .eq('id', attemptId);
    } else {
      const { data } = await supabase
        .from('mock_exam_attempts')
        .insert([attemptData])
        .select()
        .single();
      if (data) setAttemptId(data.id);
    }
  }, [exam, id, answers, flagged, timeLeft, currentIndex, isFinished, attemptId, items.length]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (loading || isFinished || !exam) return;
    const interval = setInterval(() => {
      saveProgress();
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, isFinished, exam, saveProgress]);

  // Save on answer or flag change (debounced or immediate)
  useEffect(() => {
    if (loading || isFinished || !exam) return;
    const timeout = setTimeout(() => {
      saveProgress();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [answers, flagged, currentIndex, loading, isFinished, exam, saveProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (choice: string) => {
    if (isFinished) return;
    setAnswers({
      ...answers,
      [items[currentIndex].id]: choice
    });
  };

  const toggleFlag = () => {
    const itemId = items[currentIndex].id;
    setFlagged(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSubmit = async () => {
    if (isFinished) return;
    
    if (!window.confirm('Are you sure you want to submit your answers?')) return;

    let correctCount = 0;
    items.forEach(item => {
      if (answers[item.id] === item.correct_answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsFinished(true);
    await saveProgress(true, correctCount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-center">
        <AlertCircle size={48} className="mx-auto mb-4" />
        <p className="font-bold text-lg mb-4">{error}</p>
        <button onClick={() => navigate('/student/mock-exams')} className="text-blue-600 font-bold hover:underline">
          Back to list
        </button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / items.length) * 100);
    const passed = percentage >= 75;

    // Calculate category breakdown
    const breakdown = subjects.map(sub => {
      const subItems = items.filter(item => item.subject_id === sub.id);
      if (subItems.length === 0) return null;
      const correct = subItems.filter(item => answers[item.id] === item.correct_answer).length;
      return {
        name: sub.name,
        score: correct,
        total: subItems.length,
        percentage: Math.round((correct / subItems.length) * 100)
      };
    }).filter(Boolean);

    return (
      <div className="max-w-3xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard className="p-12 text-center border-white/60">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {passed ? <Trophy size={48} /> : <XCircle size={48} />}
            </div>
            
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Exam Result</h2>
            <p className="text-slate-500 mb-8 font-medium">Simulation Complete</p>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
                <p className="text-3xl font-bold text-slate-800">{score} / {items.length}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                <p className="text-3xl font-bold text-slate-800">{percentage}%</p>
              </div>
            </div>

            {breakdown.length > 0 && (
              <div className="mb-10 text-left">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Category Breakdown</h3>
                <div className="space-y-3">
                  {breakdown.map((item: any) => (
                    <div key={item.name} className="bg-white border border-slate-100 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        <span className="text-sm font-bold text-slate-900">{item.score} / {item.total} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${item.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`p-6 rounded-2xl mb-10 font-bold ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {passed 
                ? "Excellent! You've passed the simulation. Keep up the great work!" 
                : "Don't give up! Review your weak spots and try again to improve your score."}
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => navigate('/student/mock-exams')}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Back to Mock Exams
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                Retake Exam
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const isMockBoard = exam?.exam_type === ExamType.MOCK_BOARD;

  return (
    <div className={`${isMockBoard ? 'max-w-[1600px]' : 'max-w-4xl'} mx-auto space-y-8 pb-20`}>
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-slate-50/90 backdrop-blur-md z-50 py-4 -mx-4 px-4 border-b border-slate-200/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.confirm('Exit exam? Your progress will be saved.') && navigate('/student/mock-exams')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 line-clamp-1">
                {isMockBoard ? 'Mock Board Examination' : exam?.title}
              </h1>
              {isMockBoard && (
                <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 flex items-center gap-1">
                  <ShieldCheck size={10} />
                  Official Format
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Question {currentIndex + 1} of {items.length}</span>
              {isMockBoard && exam && <span className="text-slate-300">|</span>}
              {isMockBoard && exam && <span className="text-slate-500">{exam.title}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isMockBoard && (
            <button 
              onClick={() => setShowNav(!showNav)}
              className={`p-3 rounded-xl transition-all ${showNav ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
              title="Toggle Navigation Grid"
            >
              <LayoutGrid size={20} />
            </button>
          )}
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-mono font-bold text-xl shadow-lg border-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-white text-slate-800 border-white'}`}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className={`flex flex-col ${isMockBoard ? 'lg:flex-row' : ''} gap-8`}>
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="p-10 border-white/60 min-h-[450px] flex flex-col relative overflow-hidden">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                      {subjects.find(s => s.id === currentItem.subject_id)?.name || 'General'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-relaxed">
                    {currentItem.question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-auto">
                  {[
                    { id: 'a', text: currentItem.choice_a, label: 'A' },
                    { id: 'b', text: currentItem.choice_b, label: 'B' },
                    { id: 'c', text: currentItem.choice_c, label: 'C' },
                    { id: 'd', text: currentItem.choice_d, label: 'D' },
                  ].map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleSelectAnswer(choice.id)}
                      className={`flex items-center gap-6 p-6 rounded-2xl border-2 text-left transition-all group ${
                        answers[currentItem.id] === choice.id 
                          ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600' 
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                        answers[currentItem.id] === choice.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                      }`}>
                        {choice.label}
                      </div>
                      <span className={`text-lg font-medium ${answers[currentItem.id] === choice.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {choice.text}
                      </span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-3">
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <button 
                onClick={toggleFlag}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${flagged[currentItem.id] ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Flag size={20} fill={flagged[currentItem.id] ? 'currentColor' : 'none'} />
                {flagged[currentItem.id] ? 'Unflag' : 'Flag Question'}
              </button>
            </div>

            {currentIndex === items.length - 1 ? (
              <button 
                onClick={handleSubmit}
                className="flex items-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Submit Exam
                <Send size={20} />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Next Question
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Navigation Grid */}
        {isMockBoard && showNav && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-96 space-y-6"
          >
            <GlassCard className="p-6 border-slate-200 sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Question Navigation</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  {Object.keys(answers).length} / {items.length} Answered
                </span>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <div className="w-3 h-3 rounded-sm bg-white border border-slate-200" />
                  Unanswered
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <div className="w-3 h-3 rounded-sm bg-indigo-600" />
                  Answered
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <div className="w-3 h-3 rounded-sm bg-orange-500" />
                  Flagged
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <div className="w-3 h-3 rounded-sm border-2 border-indigo-600" />
                  Current
                </div>
              </div>

              <div className="h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-5 gap-2">
                  {items.map((item, idx) => {
                    const isAnswered = !!answers[item.id];
                    const isFlagged = !!flagged[item.id];
                    const isCurrent = currentIndex === idx;

                    let bgColor = 'bg-white';
                    let textColor = 'text-slate-400';
                    let borderColor = 'border-slate-200';

                    if (isAnswered) {
                      bgColor = 'bg-indigo-600';
                      textColor = 'text-white';
                      borderColor = 'border-indigo-600';
                    }

                    if (isFlagged) {
                      bgColor = isAnswered ? 'bg-indigo-600' : 'bg-orange-500';
                      textColor = 'text-white';
                      borderColor = isAnswered ? 'border-orange-400 border-2' : 'border-orange-500';
                    }

                    if (isCurrent) {
                      borderColor = isFlagged ? 'border-orange-500 border-2' : 'border-indigo-600 border-2';
                      if (!isAnswered && !isFlagged) {
                        textColor = 'text-indigo-600';
                      }
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`aspect-square rounded-lg flex items-center justify-center font-bold text-[10px] transition-all border relative ${bgColor} ${textColor} ${borderColor} hover:scale-105 active:scale-95`}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Question Grid (Quick Jump) for non-mock board */}
      {!isMockBoard && (
        <div className="pt-12 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Question Overview</h4>
          <div className="flex flex-wrap justify-center gap-3">
            {items.map((item, idx) => {
              const isFlagged = !!flagged[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all relative ${
                    currentIndex === idx 
                      ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100' 
                      : answers[item.id] 
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'
                  } ${isFlagged ? 'border-orange-500 border-2' : ''}`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExamPage;
