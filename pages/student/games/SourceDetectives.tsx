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
  Search,
  FileText,
  Star,
  Gamepad2,
  BookOpen,
  Lock
} from 'lucide-react';
import { QUESTIONS, Question } from '../data/sourceQuestions';
import GlassCard from '../../../components/GlassCard';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../context/AuthContext';

type GameState = 'menu' | 'instructions' | 'difficulty' | 'sets' | 'playing' | 'feedback' | 'finished' | 'scoreboard';
type Difficulty = 'easy' | 'average' | 'difficult';

export default function SourceDetectives() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [setNumber, setSetNumber] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Load high scores and progress
  useEffect(() => {
    const saved = localStorage.getItem('source_detectives_scores');
    if (saved) setHighScores(JSON.parse(saved));

    if (user) {
      const localKey = `source-detectives-progress-${user.id}`;
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
        .eq('game_id', 'source-detectives')
        .single();

      if (data) {
        const onlineLevels = data.completed_levels || [];
        const localKey = `source-detectives-progress-${user.id}`;
        const localData = localStorage.getItem(localKey);
        const localLevels = localData ? JSON.parse(localData) : [];
        
        // Merge online and local progress
        const mergedLevels = [...new Set([...onlineLevels, ...localLevels])];
        
        setCompletedLevels(mergedLevels);
        localStorage.setItem(localKey, JSON.stringify(mergedLevels));
      } else if (error && error.code === 'PGRST116') {
        // No record found, sync local to cloud if it exists
        const localKey = `source-detectives-progress-${user.id}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          const localLevels = JSON.parse(localData);
          if (localLevels.length > 0) {
            await supabase.from('game_progress').upsert({
              user_id: user.id,
              game_id: 'source-detectives',
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
    const localKey = `source-detectives-progress-${user.id}`;
    localStorage.setItem(localKey, JSON.stringify(newCompleted));
    setCompletedLevels(newCompleted);
    
    // Update Supabase
    try {
      await supabase
        .from('game_progress')
        .upsert({
          user_id: user.id,
          game_id: 'source-detectives',
          completed_levels: newCompleted
        });
    } catch (err) {
      console.error('Error saving progress to cloud:', err);
    }
  };

  const startGame = (diff: Difficulty, setNum: number) => {
    setDifficulty(diff);
    setSetNumber(setNum);
    const selectedQuestions = QUESTIONS[diff][setNum] || QUESTIONS[diff][1];
    setQuestions(selectedQuestions);
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
      const scoreKey = `${difficulty}_set${setNumber}`;
      const newScores = { ...highScores, [scoreKey]: Math.max(highScores[scoreKey] || 0, score) };
      setHighScores(newScores);
      localStorage.setItem('source_detectives_scores', JSON.stringify(newScores));
      
      // Save progress if score is high enough (80%)
      const percentage = (score / questions.length) * 100;
      if (percentage >= 80) {
        saveProgress(`${difficulty}_set${setNumber}`);
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

  const GameTitle = () => (
    <div className="flex flex-col items-center justify-center gap-4 mb-12">
      <div className="relative mb-4">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3">
          <Search size={40} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg -rotate-12">
          <Star size={16} fill="currentColor" />
        </div>
      </div>
      <h1 className="text-5xl font-black text-slate-900 tracking-tight">
        Source <span className="text-blue-600">Detectives</span>
      </h1>
    </div>
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
          <GameTitle />
          
          <p className="text-slate-500 text-lg mb-12 max-w-md mx-auto leading-relaxed">
            Become a library detective! Identify primary, secondary, and tertiary sources across various research scenarios.
          </p>

          <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
            <button
              onClick={() => setGameState('instructions')}
              className="group flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
              Start Investigation
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGameState('instructions')}
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

  // Instructions
  if (gameState === 'instructions') {
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
          <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight uppercase">Detective Handbook</h2>
          <GlassCard className="w-full max-w-2xl p-8 md:p-12 border-white/60">
            <ul className="space-y-6 text-slate-700 font-medium text-lg">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <p>READ EACH QUESTION CAREFULLY.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <p>CHOOSE ONLY ONE BEST ANSWER FROM THE CHOICES GIVEN.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <p>THE NUMBER OF CHOICES INCREASES AT EACH LEVEL DO NOT ASSUME PATTERNS.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <p>NO SKIPPING OF QUESTIONS.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">5</div>
                <p>NO CHANGING OF ANSWERS ONCE SUBMITTED.</p>
              </li>
            </ul>

            <div className="mt-12">
              <button
                onClick={() => setGameState('difficulty')}
                className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                Understood
                <ArrowRight size={24} />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Difficulty Selection
  if (gameState === 'difficulty') {
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
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Select Difficulty</h2>
          <p className="text-slate-500 mb-12">Choose your detective rank to begin.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {(['easy', 'average', 'difficult'] as const).map((diff) => {
              const easySetsCompleted = completedLevels.filter(l => l.startsWith('easy_set')).length;
              const averageSetsCompleted = completedLevels.filter(l => l.startsWith('average_set')).length;

              const isLocked = diff === 'average' ? easySetsCompleted < 10 :
                               diff === 'difficult' ? averageSetsCompleted < 10 :
                               false;

              const progressText = diff === 'average' ? `${easySetsCompleted}/10 Easy Sets` :
                                   diff === 'difficult' ? `${averageSetsCompleted}/10 Medium Sets` :
                                   '';

              return (
                <GlassCard 
                  key={diff} 
                  hoverEffect={!isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    setDifficulty(diff);
                    setGameState('sets');
                  }}
                  className={`p-8 text-center cursor-pointer group border-white/60 flex flex-col items-center relative min-h-[320px] ${
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
                  
                  <div className="mt-auto flex flex-col items-center gap-3">
                    <div className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${
                      isLocked ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white group-hover:bg-blue-600'
                    }`}>
                      {isLocked ? 'Locked' : 'Select'}
                    </div>
                    {isLocked && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {progressText}
                      </span>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Set Selection
  if (gameState === 'sets') {
    return (
      <div className="min-h-[70vh] flex flex-col p-4 md:p-8">
        <div className="mb-12">
          <button
            onClick={() => setGameState('difficulty')}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-semibold group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Difficulty
          </button>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Select Case Set</h2>
          <p className="text-slate-500 mb-12 capitalize">{difficulty} Level</p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full max-w-4xl">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
              const levelKey = `${difficulty}_set${num}`;
              const isCompleted = completedLevels.includes(levelKey);
              
              // A set is unlocked if it's Set 1 OR if the previous set is completed
              const isLocked = num > 1 && !completedLevels.includes(`${difficulty}_set${num - 1}`);
              
              return (
                <button
                  key={num}
                  disabled={isLocked}
                  onClick={() => !isLocked && startGame(difficulty, num)}
                  className={`py-6 border rounded-2xl font-bold text-xl transition-all shadow-sm relative overflow-hidden ${
                    isLocked 
                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                      : isCompleted 
                        ? 'bg-blue-50 border-blue-200 text-blue-600 active:scale-95' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95'
                  }`}
                >
                  {isLocked ? (
                    <div className="flex flex-col items-center gap-1">
                      <Lock size={16} className="opacity-50" />
                      <span className="text-xs uppercase tracking-wider opacity-50">Set {num}</span>
                    </div>
                  ) : (
                    <>
                      {isCompleted && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 size={14} className="text-blue-600" />
                        </div>
                      )}
                      Set {num}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Playing State
  if (gameState === 'playing') {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setGameState('menu')}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ChevronLeft size={20} />
            Quit Case
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
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Case Scenario</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-12 leading-relaxed">
            "{currentQuestion.scenario}"
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ x: 8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOptionSelect(option.id)}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                  selectedOption === option.id 
                    ? (option.id === currentQuestion.correctId ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50')
                    : 'border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  selectedOption === option.id
                    ? (option.id === currentQuestion.correctId ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {option.id}
                </div>
                <span className="text-xl font-bold text-slate-700">
                  {option.label}
                </span>
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
    const isCorrect = selectedOption === questions[currentQuestionIndex].correctId;

    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <GlassCard className="p-8 md:p-12 border-white/60 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {isCorrect ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
          </div>
          
          <h2 className={`text-4xl font-black mb-4 tracking-tight ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
            {isCorrect ? 'Brilliant!' : 'Not Quite'}
          </h2>

          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-8 text-left">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">The Reason</p>
            <p className="text-slate-700 text-lg leading-relaxed font-medium">
              {questions[currentQuestionIndex].explanation}
            </p>
          </div>

          <button
            onClick={nextQuestion}
            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Case' : 'Next Clue'}
            <ArrowRight size={24} />
          </button>
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
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Case Closed!</h2>
          <p className="text-slate-500 mb-12">You've completed {difficulty} - Set {setNumber}.</p>
          
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
              onClick={() => setGameState('sets')}
              className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              <RotateCcw size={20} />
              Try Another Set
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
              Back to Game Menu
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Scoreboard
  if (gameState === 'scoreboard') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <GlassCard className="w-full max-w-md p-10 border-white/60">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">Scoreboard</h2>
          
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 mb-10 custom-scrollbar">
            {Object.keys(highScores).length > 0 ? (
              Object.entries(highScores).sort().map(([key, s]) => (
                <div key={key} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-slate-700 font-bold capitalize">{key.replace('_', ' ')}</span>
                  <span className="text-blue-600 font-black text-2xl">{s}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-12 font-medium italic">No cases solved yet, detective!</p>
            )}
          </div>

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
