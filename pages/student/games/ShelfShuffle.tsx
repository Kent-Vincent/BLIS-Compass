import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  Trophy, 
  RotateCcw,
  ArrowRight,
  Tags,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { SHELF_SHUFFLE_LEVELS, ShelfBook, ShelfShuffleLevel } from '../data/shelfShuffleData';

export default function ShelfShuffle() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentLevel = SHELF_SHUFFLE_LEVELS[currentLevelIndex];

  useEffect(() => {
    if (gameState === 'playing') {
      // Shuffle books for the level
      const shuffled = [...currentLevel.books].sort(() => Math.random() - 0.5);
      setBooks(shuffled);
      setShowFeedback(false);
    }
  }, [gameState, currentLevelIndex]);

  const checkOrder = () => {
    const correctOrder = [...currentLevel.books].sort((a, b) => {
      // Basic sorting logic for Dewey call numbers
      const aVal = parseFloat(a.callNumber.line1);
      const bVal = parseFloat(b.callNumber.line1);
      if (aVal !== bVal) return aVal - bVal;
      return a.callNumber.line2.localeCompare(b.callNumber.line2);
    });

    const userOrderIds = books.map(b => b.id);
    const correctOrderIds = correctOrder.map(b => b.id);

    const correct = JSON.stringify(userOrderIds) === JSON.stringify(correctOrderIds);
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) {
      setScore(prev => prev + 100);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < SHELF_SHUFFLE_LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setShowFeedback(false);
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
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Tags className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Shelf Shuffle</h1>
          <p className="text-slate-600 mb-8">
            Arrange the books in the correct order based on their call numbers!
          </p>
          <button
            onClick={() => setGameState('playing')}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors"
          >
            Start Sorting
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
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Excellent Work!</h2>
          <p className="text-xl text-slate-600 mb-8">Final Score: {score}</p>
          <button
            onClick={() => {
              setGameState('start');
              setCurrentLevelIndex(0);
              setScore(0);
            }}
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-slate-700">Score: {score}</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <span className="font-bold text-slate-700">Level: {currentLevelIndex + 1}/{SHELF_SHUFFLE_LEVELS.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-2 mb-6 text-slate-600">
          <Info size={18} />
          <p className="text-sm font-medium">Drag the books to reorder them correctly.</p>
        </div>

        <Reorder.Group axis="x" values={books} onReorder={setBooks} className="flex gap-4 overflow-x-auto pb-4">
          {books.map((book) => (
            <Reorder.Item
              key={book.id}
              value={book}
              className="flex-shrink-0 w-32 h-48 bg-white rounded-xl shadow-md border-2 border-slate-200 cursor-grab active:cursor-grabbing p-4 flex flex-col justify-center items-center text-center group hover:border-blue-400 transition-colors"
            >
              <div className="w-full h-1 bg-slate-200 rounded-full mb-4"></div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Call Number</p>
                <p className="text-lg font-black text-slate-800 leading-tight">{book.callNumber.line1}</p>
                <p className="text-sm font-bold text-slate-600">{book.callNumber.line2}</p>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-4"></div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <div className="flex justify-center">
        {!showFeedback ? (
          <button
            onClick={checkOrder}
            className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Check Order
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className={`p-6 rounded-2xl border-2 mb-6 flex items-center gap-4 ${
              isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {isCorrect ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />}
              <div>
                <p className="font-bold">{isCorrect ? 'Perfectly Sorted!' : 'Not quite right yet.'}</p>
                <p className="text-sm opacity-80">{isCorrect ? 'You have a great eye for organization!' : 'Review the call numbers and try again.'}</p>
              </div>
            </div>
            
            <button
              onClick={isCorrect ? nextLevel : () => setShowFeedback(false)}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                isCorrect ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-white hover:bg-slate-900'
              }`}
            >
              {isCorrect ? (
                <>
                  {currentLevelIndex === SHELF_SHUFFLE_LEVELS.length - 1 ? 'Finish Game' : 'Next Level'}
                  <ArrowRight size={20} />
                </>
              ) : (
                <>
                  <RotateCcw size={20} />
                  Try Again
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
