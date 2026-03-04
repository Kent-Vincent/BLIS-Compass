
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
  XCircle
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MockExam, MockExamItem } from '../../types';
import GlassCard from '../../components/GlassCard';

const TakeExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<MockExam | null>(null);
  const [items, setItems] = useState<MockExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const fetchExamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Exam
      const { data: examData, error: examError } = await supabase
        .from('mock_exams')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (examError) throw examError;
      setExam(examData);
      setTimeLeft(examData.duration_minutes * 60);

      // 2. Fetch Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('mock_exam_items')
        .select('*')
        .eq('exam_id', id)
        .order('item_no', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (err: any) {
      console.error('Error fetching exam data:', err);
      setError(err.message || 'Failed to load exam data');
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

  const handleSubmit = () => {
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

    return (
      <div className="max-w-2xl mx-auto py-12">
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 py-4 -mx-4 px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.confirm('Exit exam? Your progress will not be saved.') && navigate('/student/mock-exams')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 line-clamp-1">{exam?.title}</h1>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Question {currentIndex + 1} of {items.length}</span>
            </div>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-mono font-bold text-xl shadow-lg border-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-white text-slate-800 border-white'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-blue-600"
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
          <GlassCard className="p-10 border-white/60 min-h-[400px] flex flex-col">
            <div className="mb-10">
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
                      ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600' 
                      : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                    answers[currentItem.id] === choice.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }`}>
                    {choice.label}
                  </div>
                  <span className={`text-lg font-medium ${answers[currentItem.id] === choice.id ? 'text-blue-900' : 'text-slate-700'}`}>
                    {choice.text}
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button 
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-30"
        >
          <ChevronLeft size={20} />
          Previous
        </button>

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
            className="flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            Next Question
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Question Grid (Quick Jump) */}
      <div className="pt-12 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Question Overview</h4>
        <div className="flex flex-wrap justify-center gap-3">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                currentIndex === idx 
                  ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' 
                  : answers[item.id] 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TakeExamPage;
