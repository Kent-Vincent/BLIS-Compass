
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  CheckCircle2, 
  XCircle,
  Trophy,
  Timer,
  Info
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/GlassCard';

interface Question {
  id: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  explanation?: string;
}

interface Result {
  score: number;
  correct_count: number;
  total_items: number;
  passed: boolean;
  next_unlocked_part: number;
}

const PracticePlayer: React.FC = () => {
  const { subjectId, partNo } = useParams<{ subjectId: string, partNo: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    if (subjectId && partNo) {
      fetchData();
    }
  }, [subjectId, partNo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subject name
      const { data: subData } = await supabase
        .from('practice_subjects')
        .select('name')
        .eq('id', subjectId)
        .single();
      
      if (subData) setSubjectName(subData.name);

      // Fetch questions via RPC
      const { data, error } = await supabase.rpc('get_practice_questions', {
        p_subject_id: subjectId,
        p_part: parseInt(partNo!)
      });

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (choice: string) => {
    if (result) return;
    setAnswers({
      ...answers,
      [questions[currentIndex].id]: choice
    });
  };

  const handleSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('grade_practice_attempt', {
        p_subject_id: subjectId,
        p_part: parseInt(partNo!),
        p_answers: answers
      });

      if (error) throw error;
      setResult(data as Result);
    } catch (err) {
      console.error('Error submitting practice:', err);
      alert('Failed to submit practice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Preparing your practice set...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <Info className="text-slate-300 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Questions Found</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">This practice set part doesn't have any questions yet. Please check back later or try another part.</p>
        <button 
          onClick={() => navigate('/student')}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <GlassCard className="p-10 text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
              result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {result.passed ? <Trophy size={48} /> : <XCircle size={48} />}
            </div>

            <h2 className="text-4xl font-bold text-slate-800 mb-2">
              {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h2>
            <p className="text-slate-500 mb-8">
              {result.passed 
                ? `You've mastered Part ${partNo} of ${subjectName}.` 
                : `You need at least 80% to unlock the next part.`}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Score</p>
                <p className="text-3xl font-black text-slate-800">{result.score}%</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Correct</p>
                <p className="text-3xl font-black text-slate-800">{result.correct_count} / {result.total_items}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/student')}
                className="flex-1 py-4 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Retake Practice
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-slate-800 line-clamp-1">{subjectName}</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Part {partNo} • Question {currentIndex + 1} of {questions.length}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-500 bg-slate-100 px-4 py-2 rounded-full text-sm font-bold">
            <Timer size={16} />
            <span>Practice Mode</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-blue-100 w-full">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Player Area */}
      <main className="flex-grow p-6 flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="p-8 md:p-12 border-white/60 shadow-xl">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-10 leading-relaxed">
                  {currentQuestion.question}
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {['a', 'b', 'c', 'd'].map((key) => {
                    const choiceText = currentQuestion[`choice_${key}` as keyof Question] as string;
                    const isSelected = answers[currentQuestion.id] === key;

                    return (
                      <button
                        key={key}
                        onClick={() => handleSelect(key)}
                        className={`group flex items-center p-5 rounded-2xl border-2 transition-all text-left ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-600 shadow-md' 
                            : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg mr-4 transition-all ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          {key.toUpperCase()}
                        </div>
                        <span className={`flex-grow font-medium text-lg ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {choiceText}
                        </span>
                        {isSelected && <CheckCircle2 className="text-blue-600 ml-4" size={24} />}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white transition-all disabled:opacity-30"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="flex items-center gap-2 px-10 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Submit Practice
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 border border-blue-100 transition-all"
              >
                Next Question
                <ChevronRight size={20} />
              </button>
            )}
          </div>
          
          {Object.keys(answers).length < questions.length && currentIndex === questions.length - 1 && (
            <p className="text-center text-slate-400 text-sm mt-4 font-medium italic">
              Please answer all questions before submitting.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default PracticePlayer;
