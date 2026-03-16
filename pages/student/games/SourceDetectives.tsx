import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Timer,
  Star,
  Search,
  FileText,
  Library
} from 'lucide-react';
import { QUESTIONS, Question } from '../data/sourceQuestions';

export default function SourceDetectives() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [difficulty, setDifficulty] = useState<'easy' | 'average' | 'difficult'>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0 && !showExplanation) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleOptionSelect('TIMEOUT');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, showExplanation]);

  const startGame = (diff: 'easy' | 'average' | 'difficult') => {
    setDifficulty(diff);
    const shuffled = [...QUESTIONS[diff]].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(30);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  const handleOptionSelect = (optionId: string) => {
    if (selectedOption || showExplanation) return;

    setSelectedOption(optionId);
    if (optionId === questions[currentQuestionIndex].correctId) {
      setScore((prev) => prev + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      setGameState('finished');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (gameState === 'start') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Source Detectives</h1>
          <p className="text-slate-600 mb-8">
            Identify primary, secondary, and tertiary sources in various research scenarios!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['easy', 'average', 'difficult'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => startGame(diff)}
                className="group relative p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all duration-300"
              >
                <span className="block text-lg font-semibold capitalize text-slate-900 group-hover:text-emerald-600">
                  {diff}
                </span>
                <span className="text-xs text-slate-500">
                  {QUESTIONS[diff].length} Questions
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100"
        >
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Great Job!</h2>
          <p className="text-xl text-slate-600 mb-8">You scored {score} out of {questions.length}</p>
          
          <div className="flex justify-center gap-4 mb-8">
            <div className="px-6 py-3 bg-slate-50 rounded-2xl">
              <span className="block text-sm text-slate-500 uppercase font-bold tracking-wider">Accuracy</span>
              <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
            </div>
            <div className="px-6 py-3 bg-slate-50 rounded-2xl">
              <span className="block text-sm text-slate-500 uppercase font-bold tracking-wider">Difficulty</span>
              <span className="text-2xl font-bold text-slate-900 capitalize">{difficulty}</span>
            </div>
          </div>

          <button
            onClick={() => setGameState('start')}
            className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-slate-700">Score: {score}</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Star className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-700">Q: {currentQuestionIndex + 1}/{questions.length}</span>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors ${
          timeLeft <= 10 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-100 text-slate-700'
        }`}>
          <Timer className="w-5 h-5" />
          <span className="font-mono text-xl font-bold">{timeLeft}s</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Scenario</span>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">
            {currentQuestion.scenario}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const isCorrect = option.id === currentQuestion.correctId;
              const showResult = showExplanation;

              let buttonClass = "p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between group ";
              if (!showResult) {
                buttonClass += "border-slate-100 hover:border-emerald-600 hover:bg-emerald-50";
              } else {
                if (isCorrect) {
                  buttonClass += "border-emerald-500 bg-emerald-50 text-emerald-700";
                } else if (isSelected) {
                  buttonClass += "border-red-500 bg-red-50 text-red-700";
                } else {
                  buttonClass += "border-slate-100 opacity-50";
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors ${
                      !showResult ? 'bg-slate-100 text-slate-500 group-hover:bg-emerald-600 group-hover:text-white' :
                      isCorrect ? 'bg-emerald-500 text-white' :
                      isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {option.id}
                    </span>
                    <span className="font-medium text-lg">{option.label}</span>
                  </div>
                  {showResult && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 mb-6"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Library className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 mb-1">Detective's Note</h4>
                <p className="text-emerald-800 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
            
            <button
              onClick={nextQuestion}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Case' : 'Next Clue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
