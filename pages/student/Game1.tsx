/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, BookOpen, HelpCircle, ChevronLeft, Play, Info, ListOrdered, Candy } from 'lucide-react';
import { QUESTIONS, Question, Option } from './data/questions';

type Screen = 'START' | 'HOW_TO_PLAY' | 'LEVEL_SELECT' | 'GAME' | 'FEEDBACK' | 'RESULTS' | 'SCOREBOARD';

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
    const savedScores = localStorage.getItem('reference-crush-scores');
    if (savedScores) {
      setScoreboard(JSON.parse(savedScores));
    }
  }, []);

  const saveScore = (finalScore: number) => {
    const newEntry: ScoreEntry = {
      level: level.charAt(0).toUpperCase() + level.slice(1),
      score: finalScore,
      date: new Date().toLocaleDateString(),
    };
    const updatedScoreboard = [...scoreboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    setScoreboard(updatedScoreboard);
    localStorage.setItem('reference-crush-scores', JSON.stringify(updatedScoreboard));
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
      setScore(s => s + 1);
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
      <Candy className="text-red-500 w-8 h-8 rotate-45" />
      <h1 className="text-4xl md:text-5xl font-black text-yellow-400 tracking-tighter uppercase drop-shadow-lg">
        Reference Crush Pro
      </h1>
      <Candy className="text-red-500 w-8 h-8 -rotate-45" />
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
            {renderHeader()}
            <div className="bg-[#242f38] p-8 rounded-3xl shadow-2xl border border-white/5">
              <h2 className="text-3xl font-bold mb-6 text-white">How to Play</h2>
              <ol className="space-y-4 text-lg text-gray-300">
                <li className="flex gap-4">
                  <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</span>
                  Choose a level: Easy, Medium, or Hard.
                </li>
                <li className="flex gap-4">
                  <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</span>
                  Read the scenario-based question carefully.
                </li>
                <li className="flex gap-4">
                  <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</span>
                  Select the correct reference source from the options.
                </li>
                <li className="flex gap-4">
                  <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</span>
                  Correct answers will increase your score.
                </li>
                <li className="flex gap-4">
                  <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">5</span>
                  Complete all 5 questions to finish the level.
                </li>
              </ol>
              <button
                onClick={() => setScreen('START')}
                className="mt-8 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <ChevronLeft /> Back to Menu
              </button>
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
            <h2 className="text-2xl font-bold mb-8">Select Level</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['easy', 'medium', 'hard'].map((l) => (
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
            className="max-w-4xl w-full"
          >
            {renderHeader()}
            <div className="bg-[#242f38] p-6 md:p-10 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="mb-8">
                <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-gray-100">
                  "{currentQuestion.scenario}"
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOptionSelect(option)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg border-2 border-transparent hover:border-orange-500 transition-all"
                  >
                    <img
                      src={option.imageUrl}
                      alt={option.label}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-end p-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/60 px-2 py-1 rounded">
                        {option.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-12 flex items-center justify-between text-gray-400 font-bold">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Score: {score}/{currentQuestions.length}
                </div>
                <div>
                  Question {currentQuestionIndex + 1}/{currentQuestions.length}
                </div>
              </div>

              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
                  className="h-full bg-orange-500"
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
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-orange-500">
                    <img
                      src={currentQuestions[currentQuestionIndex].options.find(o => o.id === currentQuestion.correctId)?.imageUrl}
                      alt="Correct Source"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="w-full md:w-2/3 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-orange-400 mb-2">
                    {currentQuestions[currentQuestionIndex].options.find(o => o.id === currentQuestion.correctId)?.label}
                  </h3>
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-2">Explanation:</h4>
                    <p className="text-xl text-gray-200 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl self-start"
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
              <h2 className="text-4xl font-black mb-2">Level Complete!</h2>
              <p className="text-2xl text-gray-400 mb-8">You scored</p>
              <div className="text-7xl font-black text-orange-500 mb-8">
                {score} / {currentQuestions.length}
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setScreen('LEVEL_SELECT')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setScreen('START')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl"
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
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <ListOrdered className="text-orange-500" /> Scoreboard
              </h2>
              {scoreboard.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-xl">No scores yet. Start playing!</p>
              ) : (
                <div className="space-y-3">
                  {scoreboard.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black text-orange-500 w-8">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-lg">{entry.level}</p>
                          <p className="text-xs text-gray-500">{entry.date}</p>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-white">
                        {entry.score}/5
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setScreen('START')}
                className="mt-8 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
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
