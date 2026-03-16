import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw,
  ArrowRight,
  Tags,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { MARC_TAGS, MARC_QUESTIONS, MARCQuestion } from '../data/marcMatchData';

export default function MarcMatch() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  const currentQuestion = MARC_QUESTIONS[currentQuestionIndex];

  useEffect(() => {
    if (gameState === 'playing') {
      // Generate 4 options: 1 correct + 3 random
      const correct = currentQuestion.correctTag;
      const others = MARC_TAGS
        .filter(t => t.tag !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(t => t.tag);
      
      setOptions([...others, correct].sort(() => Math.random() - 0.5));
      setSelectedTag(null);
      setShowFeedback(false);
    }
  }, [gameState, currentQuestionIndex]);

  const handleSelect = (tag: string) => {
    if (showFeedback) return;
    setSelectedTag(tag);
    setShowFeedback(true);
    if (tag === currentQuestion.correctTag) {
      setScore(prev => prev + 100);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < MARC_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameState('finished');
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
          <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Tags className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">MARC Match</h1>
          <p className="text-slate-600 mb-8">
            Match the bibliographic data to the correct MARC tag!
          </p>
          <button
            onClick={() => setGameState('playing')}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-colors"
          >
            Start Matching
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
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Great Job!</h2>
          <p className="text-xl text-slate-600 mb-8">Final Score: {score}</p>
          <button
            onClick={() => {
              setGameState('start');
              setCurrentQuestionIndex(0);
              setScore(0);
            }}
            className="flex items-center justify-center gap-2 w-full py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-colors"
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
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <span className="font-bold text-slate-700">Q: {currentQuestionIndex + 1}/{MARC_QUESTIONS.length}</span>
          </div>
        </div>
      </div>

      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mb-8"
      >
        <div className="flex items-center gap-2 text-purple-600 mb-4">
          <HelpCircle size={20} />
          <span className="text-sm font-bold uppercase tracking-wider">Identify the MARC Tag</span>
        </div>
        <h3 className="text-3xl font-bold text-slate-800 mb-8 p-6 bg-slate-50 rounded-2xl border-l-4 border-purple-500 italic">
          "{currentQuestion.content}"
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {options.map((tag) => {
            const tagInfo = MARC_TAGS.find(t => t.tag === tag);
            const isSelected = selectedTag === tag;
            const isCorrect = tag === currentQuestion.correctTag;
            
            let btnClass = "p-6 rounded-2xl border-2 text-left transition-all flex flex-col ";
            if (!showFeedback) {
              btnClass += "border-slate-100 hover:border-purple-500 hover:bg-purple-50";
            } else {
              if (isCorrect) {
                btnClass += "border-emerald-500 bg-emerald-50";
              } else if (isSelected) {
                btnClass += "border-red-500 bg-red-50";
              } else {
                btnClass += "border-slate-50 opacity-50";
              }
            }

            return (
              <button
                key={tag}
                onClick={() => handleSelect(tag)}
                disabled={showFeedback}
                className={btnClass}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-black ${
                    !showFeedback ? 'text-slate-800' : isCorrect ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {tag}
                  </span>
                  {showFeedback && isCorrect && <CheckCircle2 className="text-emerald-500" />}
                  {showFeedback && isSelected && !isCorrect && <XCircle className="text-red-500" />}
                </div>
                <span className="text-sm font-medium text-slate-500">{tagInfo?.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="bg-slate-800 text-white p-6 rounded-2xl mb-6 w-full">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Tag Description</p>
              <p className="text-lg font-medium">
                {MARC_TAGS.find(t => t.tag === currentQuestion.correctTag)?.description}
              </p>
            </div>
            
            <button
              onClick={nextQuestion}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
            >
              {currentQuestionIndex === MARC_QUESTIONS.length - 1 ? 'Finish Game' : 'Next Question'}
              <ArrowRight size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
