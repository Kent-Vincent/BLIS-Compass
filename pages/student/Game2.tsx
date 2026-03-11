/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Search, HelpCircle, ChevronLeft, Play, Info, ListOrdered } from 'lucide-react';
import { QUESTIONS, Question, Option } from './data/sourceQuestions';

type Screen = 'START' | 'HOW_TO_PLAY' | 'LEVEL_SELECT' | 'SCORING' | 'GAME' | 'FEEDBACK' | 'RESULTS' | 'SCOREBOARD';

interface ScoreEntry {
  level: string;
  score: number;
  date: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('START');
  const [level, setLevel] = useState<string>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const savedScores = localStorage.getItem('source-detective-scores');
    if (savedScores) {
      setScoreboard(JSON.parse(savedScores));
    }
  }, []);

  const getPointsPerCorrect = (l: string) => {
    if (l === 'easy') return 1;
    if (l === 'average') return 2;
    if (l === 'difficult') return 3;
    return 1;
  };

  const saveScore = (finalScore: number) => {
    const newEntry: ScoreEntry = {
      level: level.charAt(0).toUpperCase() + level.slice(1),
      score: finalScore,
      date: new Date().toLocaleDateString(),
    };
    const updatedScoreboard = [...scoreboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    setScoreboard(updatedScoreboard);
    localStorage.setItem('source-detective-scores', JSON.stringify(updatedScoreboard));
  };

  const startGame = (selectedLevel: string) => {
    setLevel(selectedLevel);
    setCurrentQuestionIndex(0);
    setScore(0);
    setScreen('GAME');
  };

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option);
    const currentQuestions = QUESTIONS[level];
    if (option.id === currentQuestions[currentQuestionIndex].correctId) {
      setScore(s => s + getPointsPerCorrect(level));
    }
    setScreen('FEEDBACK');
  };

  const nextQuestion = () => {
    const currentQuestions = QUESTIONS[level];
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setScreen('GAME');
    } else {
      saveScore(score);
      setScreen('RESULTS');
    }
  };

  const currentQuestions = QUESTIONS[level];
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const renderHeader = () => (
    <div className="flex items-center justify-center gap-4 mb-8">
      <div className="relative">
        <Search className="text-blue-400 w-10 h-10" />
        <span className="absolute inset-0 flex items-center justify-center text-green-500 font-bold text-lg">?</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-yellow-400 tracking-tighter uppercase drop-shadow-lg">
        Source Detectives
      </h1>
      <div className="relative">
        <Search className="text-blue-400 w-10 h-10" />
        <span className="absolute inset-0 flex items-center justify-center text-green-500 font-bold text-lg">?</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#333d47] text-white font-sans selection:bg-yellow-400 selection:text-black p-4 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {screen === 'START' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            {renderHeader()}
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              <button
                onClick={() => setScreen('LEVEL_SELECT')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl flex items-center gap-2"
              >
                <Play fill="currentColor" /> Play
              </button>
              <button
                onClick={() => setScreen('HOW_TO_PLAY')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl flex items-center gap-2"
              >
                <Info /> How to Play
              </button>
              <button
                onClick={() => setScreen('SCOREBOARD')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl flex items-center gap-2"
              >
                <ListOrdered /> Scoreboard
              </button>
            </div>
          </motion.div>
        )}

        {screen === 'HOW_TO_PLAY' && (
          <motion.div
            key="how-to-play"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl w-full"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white uppercase tracking-widest">Player Instructions</h2>
            </div>
            <div className="bg-[#444d56] p-8 rounded-3xl shadow-2xl border border-white/5">
              <ol className="space-y-6 text-xl font-bold text-gray-100 uppercase leading-tight">
                <li>1. Read each question carefully.</li>
                <li>2. Choose only one best answer from the choices given.</li>
                <li>3. The number of choices increases at each level do not assume patterns.</li>
                <li>4. No skipping of questions.</li>
                <li>5. No changing of answers once submitted.</li>
                <li>6. External references are not allowed, unless permitted by the instructor.</li>
              </ol>
              <div className="flex justify-between mt-10">
                <button
                  onClick={() => setScreen('START')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <ChevronLeft /> Back to Menu
                </button>
                <button
                  onClick={() => setScreen('SCORING')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  Next <ChevronLeft className="rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'SCORING' && (
          <motion.div
            key="scoring"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl w-full"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white uppercase tracking-widest flex items-center justify-center gap-3">
                <Trophy className="text-yellow-500" /> Scoring System
              </h2>
            </div>
            <div className="bg-[#444d56] p-10 rounded-3xl shadow-2xl border border-white/5">
              <div className="grid grid-cols-2 gap-y-8 text-xl font-bold uppercase">
                <div className="text-gray-300">Level</div>
                <div className="text-gray-300">Points Per Correct Answer</div>
                
                <div className="text-white">Easy</div>
                <div className="text-white">1 Point</div>
                
                <div className="text-white">Average</div>
                <div className="text-white">2 Points</div>
                
                <div className="text-white">Difficult</div>
                <div className="text-white">3 Points</div>
              </div>
              <div className="flex justify-between mt-12">
                <button
                  onClick={() => setScreen('HOW_TO_PLAY')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <ChevronLeft /> Back
                </button>
                <button
                  onClick={() => setScreen('LEVEL_SELECT')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  Play Now <ChevronLeft className="rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'LEVEL_SELECT' && (
          <motion.div
            key="level-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            {renderHeader()}
            <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">Select Level</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['easy', 'average', 'difficult'].map((l) => (
                <button
                  key={l}
                  onClick={() => startGame(l)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl capitalize"
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={() => setScreen('START')}
              className="mt-8 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 mx-auto"
            >
              <ChevronLeft /> Back to Menu
            </button>
          </motion.div>
        )}

        {screen === 'GAME' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl w-full"
          >
            {renderHeader()}
            <div className="bg-[#242f38] p-6 md:p-10 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="mb-10">
                <p className="text-xl md:text-2xl font-bold leading-relaxed text-gray-100">
                  {currentQuestionIndex + 1}. {currentQuestion.scenario}
                </p>
              </div>

              <div className={`grid gap-4 ${
                level === 'easy' ? 'grid-cols-2 md:grid-cols-4' : 
                level === 'average' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 
                'grid-cols-2 md:grid-cols-5'
              }`}>
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOptionSelect(option)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg border-2 border-transparent hover:border-yellow-400 transition-all bg-[#89b36a] flex items-center justify-center p-4 text-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                    <span className="text-lg md:text-xl font-black text-white drop-shadow-md leading-tight">
                      {option.label}
                    </span>
                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-white/30 rounded-full" />
                  </motion.button>
                ))}
              </div>

              <div className="mt-12 flex items-center justify-between text-gray-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Score: {score}
                </div>
                <div>
                  Question {currentQuestionIndex + 1}/{currentQuestions.length}
                </div>
              </div>

              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
                  className="h-full bg-yellow-500"
                />
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'FEEDBACK' && selectedOption && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl w-full"
          >
            {renderHeader()}
            <div className="bg-[#242f38] p-6 md:p-10 rounded-3xl shadow-2xl border border-white/5">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-[#89b36a] flex items-center justify-center p-6 text-center border-4 border-yellow-400">
                    <span className="text-2xl font-black text-white uppercase">
                      {currentQuestions[currentQuestionIndex].options.find(o => o.id === currentQuestion.correctId)?.label}
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-2/3 flex flex-col justify-center">
                  <h3 className={`text-3xl font-black mb-4 uppercase ${selectedOption.id === currentQuestion.correctId ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedOption.id === currentQuestion.correctId ? 'Correct!' : 'Incorrect'}
                  </h3>
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-2">Explanation:</h4>
                    <p className="text-xl text-gray-200 leading-relaxed font-medium">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl self-start uppercase tracking-widest"
                  >
                    {currentQuestionIndex < currentQuestions.length - 1 ? 'Next Question' : 'Finish Level'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'RESULTS' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            {renderHeader()}
            <div className="bg-[#242f38] p-12 rounded-3xl shadow-2xl border border-white/5">
              <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-4xl font-black mb-2 uppercase">Level Complete!</h2>
              <p className="text-2xl text-gray-400 mb-8 uppercase tracking-widest">Final Score</p>
              <div className="text-8xl font-black text-yellow-500 mb-8">
                {score}
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setScreen('LEVEL_SELECT')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl uppercase tracking-widest"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setScreen('START')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl uppercase tracking-widest"
                >
                  Main Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'SCOREBOARD' && (
          <motion.div
            key="scoreboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-2xl w-full"
          >
            {renderHeader()}
            <div className="bg-[#242f38] p-8 rounded-3xl shadow-2xl border border-white/5">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 uppercase tracking-widest">
                <ListOrdered className="text-orange-500" /> Scoreboard
              </h2>
              {scoreboard.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-xl uppercase">No scores yet. Start investigating!</p>
              ) : (
                <div className="space-y-3">
                  {scoreboard.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black text-yellow-500 w-8">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-lg uppercase tracking-wider">{entry.level}</p>
                          <p className="text-xs text-gray-500">{entry.date}</p>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-white">
                        {entry.score} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setScreen('START')}
                className="mt-8 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 uppercase tracking-widest"
              >
                <ChevronLeft /> Back to Menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
