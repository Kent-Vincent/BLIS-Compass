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
  BookOpen
} from 'lucide-react';
import { QUESTIONS, Question } from '../data/sourceQuestions';
import GlassCard from '../../../components/GlassCard';

type GameState = 'menu' | 'instructions' | 'difficulty' | 'sets' | 'playing' | 'feedback' | 'finished' | 'scoreboard';
type Difficulty = 'easy' | 'average' | 'difficult';

export default function SourceDetectives() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [setNumber, setSetNumber] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  // Load high scores
  useEffect(() => {
    const saved = localStorage.getItem('source_detectives_scores');
    if (saved) setHighScores(JSON.parse(saved));
  }, []);

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
    <div className="flex items-center justify-center gap-4 mb-8">
      <Search className="text-blue-500 w-8 h-8" />
      <h1 className="text-4xl md:text-5xl font-black text-amber-400 tracking-tighter uppercase italic">
        Source Detectives
      </h1>
      <Search className="text-blue-500 w-8 h-8" />
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

          <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
            <button
              onClick={() => setGameState('instructions')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold text-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 active:scale-95"
            >
              <Play size={24} fill="currentColor" />
              Play
            </button>
            
            <button
              onClick={() => setGameState('instructions')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold text-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 active:scale-95"
            >
              <Info size={24} />
              How to Play
            </button>

            <button
              onClick={() => setGameState('scoreboard')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold text-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 active:scale-95"
            >
              <ListOrdered size={24} />
              Scoreboard
            </button>

            <button
              onClick={() => navigate('/student/games')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 text-white rounded-2xl font-bold text-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              <Gamepad2 size={24} />
              Main Menu
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Instructions
  if (gameState === 'instructions') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 md:p-8">
        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight uppercase">Player Instructions</h2>
        <GlassCard className="w-full max-w-2xl p-8 md:p-12 border-white/60">
          <ul className="space-y-6 text-slate-700 font-bold text-lg">
            <li className="flex gap-4">
              <span className="text-blue-600">1.</span>
              <p>READ EACH QUESTION CAREFULLY.</p>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600">2.</span>
              <p>CHOOSE ONLY ONE BEST ANSWER FROM THE CHOICES GIVEN.</p>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600">3.</span>
              <p>THE NUMBER OF CHOICES INCREASES AT EACH LEVEL DO NOT ASSUME PATTERNS.</p>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600">4.</span>
              <p>NO SKIPPING OF QUESTIONS.</p>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600">5.</span>
              <p>NO CHANGING OF ANSWERS ONCE SUBMITTED.</p>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600">6.</span>
              <p>EXTERNAL REFERENCES ARE NOT ALLOWED, UNLESS PERMITTED BY THE INSTRUCTOR.</p>
            </li>
          </ul>

          <div className="flex justify-between mt-12">
            <button
              onClick={() => setGameState('menu')}
              className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <button
              onClick={() => setGameState('difficulty')}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95"
            >
              Next
              <ArrowRight size={20} />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Difficulty Selection
  if (gameState === 'difficulty') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 md:p-8">
        <GameTitle />
        <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-widest uppercase">Select Difficulty</h2>
        
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {(['easy', 'average', 'difficult'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => {
                setDifficulty(diff);
                setGameState('sets');
              }}
              className="px-12 py-4 bg-orange-500 text-white rounded-2xl font-bold text-xl hover:bg-orange-600 transition-all shadow-xl active:scale-95 capitalize"
            >
              {diff}
            </button>
          ))}
        </div>

        <button
          onClick={() => setGameState('instructions')}
          className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
          Back
        </button>
      </div>
    );
  }

  // Set Selection
  if (gameState === 'sets') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 md:p-8">
        <GameTitle />
        <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-widest uppercase">
          Select Set - <span className="text-blue-600">{difficulty}</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-12 w-full max-w-4xl">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => startGame(difficulty, num)}
              className="py-6 bg-blue-500 text-white rounded-2xl font-bold text-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95"
            >
              Set {num}
            </button>
          ))}
        </div>

        <button
          onClick={() => setGameState('difficulty')}
          className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
          Back
        </button>
      </div>
    );
  }

  // Playing State
  if (gameState === 'playing') {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <GameTitle />
        
        <GlassCard className="p-8 md:p-12 mb-8 border-white/60 bg-slate-800/50">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-2xl font-black text-white">
              {currentQuestionIndex + 1}. {currentQuestion.scenario}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {currentQuestion.options.map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ y: -8, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionSelect(option.id)}
                className={`p-8 rounded-2xl border-4 transition-all duration-300 flex items-center justify-center text-center min-h-[200px] ${
                  selectedOption === option.id 
                    ? (option.id === currentQuestion.correctId ? 'border-emerald-500 bg-emerald-500/20' : 'border-red-500 bg-red-500/20')
                    : 'border-transparent bg-emerald-700/40 hover:border-blue-500'
                }`}
              >
                <span className="text-xl font-bold text-white leading-tight">
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-black text-white uppercase tracking-widest">Score: {score}</span>
              </div>
              <div className="font-black text-blue-400 uppercase tracking-widest">
                {difficulty} - Set {setNumber}
              </div>
            </div>
            <div className="font-black text-white uppercase tracking-widest">
              Question {currentQuestionIndex + 1}/{questions.length}
            </div>
          </div>
          
          <div className="mt-6 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </GlassCard>
      </div>
    );
  }

  // Feedback State
  if (gameState === 'feedback') {
    const isCorrect = selectedOption === questions[currentQuestionIndex].correctId;

    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <GameTitle />
        <GlassCard className="p-8 md:p-12 border-white/60 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {isCorrect ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
          </div>
          
          <h2 className={`text-4xl font-black mb-4 tracking-tight ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
            {isCorrect ? 'Excellent!' : 'Incorrect'}
          </h2>

          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-8 text-left">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Detective's Insight</p>
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
        <GameTitle />
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
        <GameTitle />
        <GlassCard className="w-full max-w-2xl p-10 border-white/60">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center uppercase tracking-widest">Scoreboard</h2>
          
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
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all active:scale-95"
          >
            Back to Menu
          </button>
        </GlassCard>
      </div>
    );
  }

  return null;
}