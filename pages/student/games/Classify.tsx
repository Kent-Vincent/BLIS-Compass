import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Book,
  Tag,
  Hash,
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  MAIN_CLASSES, 
  SUBCLASSES_600, 
  CLASSIFY_LEVELS, 
  ClassifyLevel 
} from '../data/classifyData';

export default function Game3() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selections, setSelections] = useState({
    mainClass: '',
    subclass: '',
    authorNumber: ''
  });
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const currentLevel = CLASSIFY_LEVELS[currentLevelIndex];

  const handleSelection = (value: string) => {
    if (showFeedback) return;

    if (step === 1) {
      if (value === currentLevel.correctMainClassId) {
        setSelections({ ...selections, mainClass: value });
        setShowFeedback('correct');
        setTimeout(() => {
          setShowFeedback(null);
          setStep(2);
        }, 1000);
      } else {
        setShowFeedback('incorrect');
        setTimeout(() => setShowFeedback(null), 1000);
      }
    } else if (step === 2) {
      if (value === currentLevel.correctSubclassId) {
        setSelections({ ...selections, subclass: value });
        setShowFeedback('correct');
        setTimeout(() => {
          setShowFeedback(null);
          setStep(3);
        }, 1000);
      } else {
        setShowFeedback('incorrect');
        setTimeout(() => setShowFeedback(null), 1000);
      }
    }
  };

  const handleAuthorNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selections.authorNumber.toUpperCase() === currentLevel.correctAuthorNumber) {
      setScore(score + 1);
      setShowFeedback('correct');
      setTimeout(() => {
        setShowFeedback(null);
        if (currentLevelIndex < CLASSIFY_LEVELS.length - 1) {
          setCurrentLevelIndex(currentLevelIndex + 1);
          setStep(1);
          setSelections({ mainClass: '', subclass: '', authorNumber: '' });
        } else {
          setGameState('finished');
        }
      }, 1500);
    } else {
      setShowFeedback('incorrect');
      setTimeout(() => setShowFeedback(null), 1000);
    }
  };

  if (gameState === 'start') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Tag className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Classify It!</h1>
          <p className="text-slate-600 mb-8">
            Master the Dewey Decimal System and Cutter Numbers by classifying real books!
          </p>
          <button
            onClick={() => setGameState('playing')}
            className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
          >
            Start Classifying
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'finished') {
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
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Master Cataloger!</h2>
          <p className="text-xl text-slate-600 mb-8">You classified all books correctly!</p>
          <button
            onClick={() => {
              setGameState('start');
              setCurrentLevelIndex(0);
              setScore(0);
              setStep(1);
              setSelections({ mainClass: '', subclass: '', authorNumber: '' });
            }}
            className="flex items-center justify-center gap-2 w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Book Info Panel */}
        <div className="lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 sticky top-8"
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-6 bg-slate-100 relative group">
              <img 
                src={currentLevel.book.imageUrl} 
                alt={currentLevel.book.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h3 className="text-xl font-bold leading-tight">{currentLevel.book.title}</h3>
                  <p className="text-white/80 text-sm">by {currentLevel.book.author}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keywords</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentLevel.book.keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Current Call Number</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xl font-bold text-slate-900">
                  <span className={step > 1 ? 'text-amber-600' : 'text-slate-300'}>
                    {selections.mainClass || '000'}
                  </span>
                  <span className="text-slate-300">.</span>
                  <span className={step > 2 ? 'text-amber-600' : 'text-slate-300'}>
                    {selections.subclass.slice(1) || '00'}
                  </span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className={step > 3 ? 'text-amber-600' : 'text-slate-300'}>
                    {selections.authorNumber || 'A00'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Classification Steps Panel */}
        <div className="lg:col-span-8">
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between px-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step === s ? 'bg-amber-600 text-white ring-4 ring-amber-100 scale-110' :
                    step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-20 h-1 mx-2 rounded-full transition-colors duration-300 ${
                      step > s ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
              >
                {step === 1 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Book className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Step 1: Select Main Class</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MAIN_CLASSES.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => handleSelection(cls.id)}
                          className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-amber-600 hover:bg-amber-50 transition-all text-left group"
                        >
                          <div>
                            <span className="block text-xs font-bold text-slate-400 group-hover:text-amber-600">{cls.id}s</span>
                            <span className="font-bold text-slate-700">{cls.label}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Tag className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Step 2: Select Subclass</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUBCLASSES_600.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => handleSelection(cls.id)}
                          className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-amber-600 hover:bg-amber-50 transition-all text-left group"
                        >
                          <div>
                            <span className="block text-xs font-bold text-slate-400 group-hover:text-amber-600">{cls.id}s</span>
                            <span className="font-bold text-slate-700">{cls.label}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Hash className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Step 3: Enter Cutter Number</h3>
                    </div>
                    <p className="text-slate-600 mb-6">
                      Based on the author's name <span className="font-bold text-slate-900">{currentLevel.book.author}</span>, 
                      what is the correct Cutter number? (e.g., D34)
                    </p>
                    <form onSubmit={handleAuthorNumberSubmit} className="space-y-4">
                      <input
                        type="text"
                        value={selections.authorNumber}
                        onChange={(e) => setSelections({ ...selections, authorNumber: e.target.value })}
                        placeholder="Enter Cutter Number"
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-600 focus:ring-0 transition-all font-mono text-2xl text-center uppercase"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-colors"
                      >
                        Verify Classification
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Feedback Overlay */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <div className={`p-8 rounded-full shadow-2xl ${
                    showFeedback === 'correct' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {showFeedback === 'correct' ? (
                      <CheckCircle2 className="w-20 h-20 text-white" />
                    ) : (
                      <XCircle className="w-20 h-20 text-white" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
