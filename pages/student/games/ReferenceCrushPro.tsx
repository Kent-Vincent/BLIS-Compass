import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  RotateCcw,
  Play,
  Info,
  ListOrdered,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Gamepad2,
  Star,
  Lock
} from 'lucide-react';
import { QUESTIONS, Question } from '../data/questions';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../context/AuthContext';

type GameState = 'menu' | 'levels' | 'playing' | 'feedback' | 'finished' | 'how-to-play' | 'scoreboard';
type Difficulty = 'easy' | 'average' | 'difficult';

export default function ReferenceCrushPro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Load progress
  useEffect(() => {
    if (user) {
      const localKey = `reference-crush-progress-${user.id}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            setCompletedLevels(parsed);
          }
        } catch (e) {
          console.error('Error parsing local progress:', e);
        }
      }
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('completed_levels')
        .eq('user_id', user.id)
        .eq('game_id', 'reference-crush')
        .single();

      if (data) {
        const onlineLevels = data.completed_levels || [];
        const localKey = `reference-crush-progress-${user.id}`;
        const localData = localStorage.getItem(localKey);
        const localLevels = localData ? JSON.parse(localData) : [];
        
        // Merge online and local progress
        const mergedLevels = [...new Set([...onlineLevels, ...localLevels])];
        
        setCompletedLevels(mergedLevels);
        localStorage.setItem(localKey, JSON.stringify(mergedLevels));
      } else if (error && error.code === 'PGRST116') {
        // No record found, sync local to cloud if it exists
        const localKey = `reference-crush-progress-${user.id}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          const localLevels = JSON.parse(localData);
          if (localLevels.length > 0) {
            await supabase.from('game_progress').upsert({
              user_id: user.id,
              game_id: 'reference-crush',
              completed_levels: localLevels
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const saveProgress = async (level: string) => {
    if (!user) return;
    
    const newCompleted = [...new Set([...completedLevels, level])];
    
    // Update local storage first for immediate feedback
    const localKey = `reference-crush-progress-${user.id}`;
    localStorage.setItem(localKey, JSON.stringify(newCompleted));
    setCompletedLevels(newCompleted);
    
    // Update Supabase
    try {
      await supabase
        .from('game_progress')
        .upsert({
          user_id: user.id,
          game_id: 'reference-crush',
          completed_levels: newCompleted
        });
    } catch (err) {
      console.error('Error saving progress to cloud:', err);
    }
  };
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>({
    easy: 0,
    average: 0,
    difficult: 0
  });

  // Load high scores
  useEffect(() => {
    const saved = localStorage.getItem('reference_crush_scores');
    if (saved) setHighScores(JSON.parse(saved));
  }, []);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    const shuffled = [...QUESTIONS[diff]].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
  };

  const handleOptionSelect = (optionId: string) => {
    if (selectedOption) return;
    setSelectedOption(optionId);
    if (optionId === questions[currentQuestionIndex].correctId) {
      setScore((prev) => prev + 1);
    }
    setTimeout(() => {
      setGameState('feedback');
    }, 200);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setGameState('playing');
    } else {
      const newScores = { ...highScores, [difficulty]: Math.max(highScores[difficulty], score) };
      setHighScores(newScores);
      localStorage.setItem('reference_crush_scores', JSON.stringify(newScores));
      
      // Save progress if score is high enough (80%)
      const percentage = (score / questions.length) * 100;
      if (percentage >= 80) {
        saveProgress(difficulty);
      }
      
      setGameState('finished');
    }
  };

  const BackToDashboard = () => (
    <button
      onClick={() => navigate('/student/games')}
      className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold group"
    >
      <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      Back to Games
    </button>
  );

  // Main Menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-[70vh] flex flex-col p-4 md:p-8">
        <div className="mb-12">
          <BackToDashboard />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-grow flex flex-col items-center justify-center text-center"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3">
              <BookOpen size={48} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg -rotate-12">
              <Star size={16} fill="currentColor" />
            </div>
          </div>

          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Reference <span className="text-blue-600">Crush</span> Pro
          </h1>
          <p className="text-slate-500 text-lg mb-12 max-w-md mx-auto leading-relaxed">
            Challenge your library knowledge! Identify the right reference sources in this interactive image-based quiz.
          </p>

          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            <button
              onClick={() => setGameState('levels')}
              className="group flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              Start Challenge
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGameState('how-to-play')}
                className="flex items-center justify-center gap-2 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                <Info size={20} className="text-blue-500" />
                How to Play
              </button>
              <button
                onClick={() => setGameState('scoreboard')}
                className="flex items-center justify-center gap-2 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                <ListOrdered size={20} className="text-blue-500" />
                Scoreboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Level Selection
  if (gameState === 'levels') {
    return (
      <div className="min-h-[70vh] flex flex-col p-4 md:p-8">
        <div className="mb-12">
          <button
            onClick={() => setGameState('menu')}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Menu
          </button>
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Choose Your Challenge</h2>
          <p className="text-slate-500 mb-12">Select a difficulty level to begin the reference quiz.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {(['easy', 'average', 'difficult'] as const).map((diff) => {
              const isLocked = diff === 'average' ? !completedLevels.includes('easy') :
                               diff === 'difficult' ? !completedLevels.includes('average') :
                               false;

              return (
                <GlassCard 
                  key={diff} 
                  hoverEffect={!isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    startGame(diff);
                  }}
                  className={`p-8 text-center cursor-pointer group border-white/60 flex flex-col items-center relative ${
                    isLocked ? 'opacity-75 grayscale-[0.5]' : ''
                  }`}
                >
                  {isLocked && (
                    <div className="absolute top-4 right-4 text-slate-400">
                      <Lock size={20} />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all ${!isLocked ? 'group-hover:scale-110' : ''} ${
                    diff === 'easy' ? 'bg-emerald-100 text-emerald-600' :
                    diff === 'average' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <Star size={32} fill="currentColor" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 capitalize mb-2">
                    {diff === 'average' ? 'Medium' : diff === 'difficult' ? 'Hard' : 'Easy'}
                  </h3>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                    {diff === 'easy' ? 'Perfect for beginners starting their library journey.' : 
                     diff === 'average' ? 'A balanced challenge for intermediate learners.' : 
                     'Test your expertise with complex library scenarios.'}
                  </p>
                  <div className={`mt-auto px-6 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isLocked ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white group-hover:bg-blue-600'
                  }`}>
                    {isLocked ? 'Locked' : 'Select Level'}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Playing State
  if (gameState === 'playing') {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setGameState('menu')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ChevronLeft size={20} />
            Quit Game
          </button>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-slate-700">Score: {score}</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <span className="font-bold text-slate-700">Q: {currentQuestionIndex + 1}/{questions.length}</span>
            </div>
          </div>
        </div>

        <GlassCard className="p-8 md:p-12 mb-8 border-white/60">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-12 text-center leading-relaxed">
            "{questions[currentQuestionIndex].scenario}"
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {questions[currentQuestionIndex].options.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ y: -8, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionSelect(option.id)}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border-4 transition-all duration-300 ${
                  selectedOption === option.id 
                    ? (option.id === questions[currentQuestionIndex].correctId ? 'border-emerald-500 ring-4 ring-emerald-100' : 'border-red-500 ring-4 ring-red-100')
                    : 'border-white hover:border-blue-500 shadow-sm'
                }`}
              >
                <img 
                  src={option.image} 
                  alt={option.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <span className="inline-block text-[10px] font-black text-white bg-blue-600 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    {option.label}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </GlassCard>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Feedback State
  if (gameState === 'feedback') {
    const selected = questions[currentQuestionIndex].options.find(o => o.id === selectedOption);
    const isCorrect = selectedOption === questions[currentQuestionIndex].correctId;

    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <GlassCard className="p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center border-white/60">
          <div className="w-full md:w-1/2 max-w-xs">
            <div className={`aspect-[3/4] rounded-3xl overflow-hidden border-8 shadow-2xl ${isCorrect ? 'border-emerald-500' : 'border-red-500'}`}>
              <img 
                src={selected?.image} 
                alt={selected?.label}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="w-full md:w-1/2 space-y-8">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <h2 className={`text-4xl font-black tracking-tight ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                {isCorrect ? 'Brilliant!' : 'Not Quite'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Choice</p>
                <h3 className="text-2xl font-bold text-slate-800">{selected?.label}</h3>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">The Reason</p>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {questions[currentQuestionIndex].explanation}
                </p>
              </div>
            </div>

            <button
              onClick={nextQuestion}
              className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
              <ArrowRight size={24} />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Finished State
  if (gameState === 'finished') {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 shadow-2xl border border-slate-100 text-center max-w-lg w-full"
        >
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Challenge Complete!</h2>
          <p className="text-slate-500 mb-12">You've mastered the {difficulty} level.</p>
          
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Final Score</span>
              <span className="text-4xl font-black text-blue-600">{score}/{questions.length}</span>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Accuracy</span>
              <span className="text-4xl font-black text-blue-600">{Math.round(percentage)}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setGameState('menu')}
              className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <RotateCcw size={20} />
              Play Again
            </button>
            <button
              onClick={() => navigate('/student/games')}
              className="py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
              Exit to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Scoreboard, How to Play (Simplified for brevity, matching system style)
  if (gameState === 'scoreboard' || gameState === 'how-to-play') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <GlassCard className="w-full max-w-md p-10 border-white/60">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">
            {gameState === 'scoreboard' ? 'High Scores' : 'How to Play'}
          </h2>
          
          {gameState === 'scoreboard' ? (
            <div className="space-y-4 mb-10">
              {Object.entries(highScores).map(([diff, s]) => (
                <div key={diff} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-700 font-bold capitalize">{diff}</span>
                  <span className="text-blue-600 font-black text-2xl">{s}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6 mb-10 text-slate-600 font-medium">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <p>Read the library reference scenario carefully.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <p>Identify the correct source from the four images.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <p>Earn points and unlock higher difficulties!</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setGameState('menu')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
          >
            Back to Menu
          </button>
        </GlassCard>
      </div>
    );
  }

  return null;
}