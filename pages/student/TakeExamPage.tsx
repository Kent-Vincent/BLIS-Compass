
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Send,
  Trophy,
  XCircle,
  Flag,
  LayoutGrid,
  ShieldCheck,
  Download
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MockExam, MockExamItem, MockExamAttempt, PracticeSubject } from '../../types';
import GlassCard from '../../components/GlassCard';

const TakeExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [exam, setExam] = useState<MockExam | null>(null);
  const [items, setItems] = useState<MockExamItem[]>([]);
  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showNav, setShowNav] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const sectionSize = 100;
  const sections = Array.from({ length: 6 }, (_, i) => ({
    label: `${i * sectionSize + 1}-${(i + 1) * sectionSize}`,
    start: i * sectionSize,
    end: (i + 1) * sectionSize
  }));

  const fetchExamData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Wrap the entire fetch process in a timeout
      const results = await Promise.race([
        (async () => {
          // Warm up session
          await supabase.auth.getSession();

          // Fetch Exam, Items, Subjects, and Attempt
          return await Promise.all([
            supabase
              .from('mock_exams')
              .select('*')
              .eq('id', id)
              .eq('is_published', true)
              .single(),
            supabase
              .from('mock_exam_items')
              .select('*')
              .eq('exam_id', id)
              .order('item_no', { ascending: true }),
            supabase
              .from('practice_subjects')
              .select('*'),
            supabase
              .from('mock_exam_attempts')
              .select('*')
              .eq('exam_id', id)
              .eq('is_submitted', false)
              .maybeSingle()
          ]);
        })(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 20000))
      ]);

      const [examRes, itemsRes, subjectsRes, attemptRes] = results;

      if (examRes.error) throw examRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setExam(examRes.data);
      setItems(itemsRes.data || []);
      setSubjects(subjectsRes.data || []);

      if (attemptRes.data) {
        const attempt = attemptRes.data as MockExamAttempt;
        setAttemptId(attempt.id);
        setAnswers(attempt.answers || {});
        setFlagged(attempt.flagged || {});
        setTimeLeft(attempt.time_left_seconds);
        setCurrentIndex(attempt.current_index || 0);
      } else {
        setTimeLeft(examRes.data.duration_minutes * 60);
      }
    } catch (err: any) {
      console.error('Error fetching exam data:', err);
      
      // Retry logic for network issues or timeouts
      if (retryCount < 3) {
        console.log(`Retrying fetchExamData... (Attempt ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 3000));
        return fetchExamData(retryCount + 1);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your session has expired. Please refresh the page to continue.');
        return;
      }

      const msg = err.message === 'Fetch timeout'
        ? 'The connection is taking longer than expected. Please check your internet and try again.'
        : (err.message || 'Failed to load exam data. Please check your connection.');
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchExamData();
    }
  }, [id, fetchExamData]);

  // Timer logic
  useEffect(() => {
    if (loading || isFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isFinished, timeLeft]);

  const SUBJECT_MAPPING: Record<string, { displayName: string, weight: number }> = {
    "Library Organization & Management": {
      displayName: "Library Organization and Management - With Laws, Related Practices, and Trends",
      weight: 20
    },
    "Reference, Bibliography & User Services": {
      displayName: "Reference, Bibliography and User Services",
      weight: 20
    },
    "Indexing & Abstracting": {
      displayName: "Indexing and Abstracting",
      weight: 15
    },
    "Cataloging & Classification": {
      displayName: "Cataloging and Classification",
      weight: 20
    },
    "Selection & Acquisition of Library Materials": {
      displayName: "Selection and Acquisition of Multi-Media Sources of Information",
      weight: 15
    },
    "Information Technology": {
      displayName: "Information Technology",
      weight: 10
    }
  };

  const saveProgress = useCallback(async (isSubmitting = false, finalScore = 0) => {
    if (!exam || !id || isFinished) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const attemptData = {
      student_id: user.id,
      exam_id: id,
      answers,
      flagged,
      time_left_seconds: timeLeft,
      current_index: currentIndex,
      is_submitted: isSubmitting,
      score: finalScore,
      total_items: items.length,
      updated_at: new Date().toISOString()
    };

    let currentAttemptId = attemptId;

    if (currentAttemptId) {
      await supabase
        .from('mock_exam_attempts')
        .update(attemptData)
        .eq('id', currentAttemptId);
    } else {
      const { data } = await supabase
        .from('mock_exam_attempts')
        .insert([attemptData])
        .select()
        .single();
      if (data) {
        setAttemptId(data.id);
        currentAttemptId = data.id;
      }
    }

    // If submitting, also save to mock_exam_results for analytics
    if (isSubmitting && currentAttemptId) {
      let totalGWA = 0;
      const breakdown = subjects.map(sub => {
        const subItems = items.filter(item => item.subject_id === sub.id);
        if (subItems.length === 0) return null;
        
        const correct = subItems.filter(item => answers[item.id] === item.correct_answer).length;
        const mapping = SUBJECT_MAPPING[sub.name] || { displayName: sub.name, weight: 0 };
        
        const rating = (correct / subItems.length) * 100;
        const contribution = (rating * mapping.weight) / 100;
        totalGWA += contribution;
        
        return {
          name: mapping.displayName,
          original_name: sub.name,
          score: correct,
          total: subItems.length,
          weight: mapping.weight,
          rating: rating.toFixed(2),
          contribution: contribution.toFixed(2)
        };
      }).filter(Boolean);

      const finalGWA = parseFloat(totalGWA.toFixed(2));
      const passed = finalGWA >= 75; // Usually 75% is passing for board exams

      await supabase
        .from('mock_exam_results')
        .insert([{
          student_id: user.id,
          exam_id: id,
          attempt_id: currentAttemptId,
          score: finalScore,
          total_items: items.length,
          percentage: finalGWA, // Using GWA as the main percentage
          passed: passed,
          category_breakdown: breakdown
        }]);
    }
  }, [exam, id, answers, flagged, timeLeft, currentIndex, isFinished, attemptId, items, subjects]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (loading || isFinished || !exam) return;
    const interval = setInterval(() => {
      saveProgress();
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, isFinished, exam, saveProgress]);

  // Save on answer or flag change (debounced or immediate)
  useEffect(() => {
    if (loading || isFinished || !exam) return;
    const timeout = setTimeout(() => {
      saveProgress();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [answers, flagged, currentIndex, loading, isFinished, exam, saveProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (choice: string) => {
    if (isFinished) return;
    setAnswers({
      ...answers,
      [items[currentIndex].id]: choice
    });
  };

  const toggleFlag = () => {
    const itemId = items[currentIndex].id;
    setFlagged(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSubmit = async () => {
    if (isFinished) return;
    
    // If not already in review mode, show the review modal first
    if (!showReviewModal) {
      setShowReviewModal(true);
      return;
    }

    let correctCount = 0;
    items.forEach(item => {
      if (answers[item.id] === item.correct_answer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsFinished(true);
    setShowReviewModal(false);
    await saveProgress(true, correctCount);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setIsDownloading(true);
      const element = reportRef.current;
      
      const originalStyle = element.style.cssText;
      element.style.backgroundColor = 'white';
      element.style.width = '800px';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800
      });
      
      element.style.cssText = originalStyle;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MockBoard_Result_${profile?.name?.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-center">
        <AlertCircle size={48} className="mx-auto mb-4" />
        <p className="font-bold text-lg mb-4">{error}</p>
        <button onClick={() => navigate('/student/mock-exams')} className="text-blue-600 font-bold hover:underline">
          Back to list
        </button>
      </div>
    );
  }

  if (isFinished) {
    let totalGWA = 0;
    const breakdown = subjects.map(sub => {
      const subItems = items.filter(item => item.subject_id === sub.id);
      if (subItems.length === 0) return null;
      
      const correct = subItems.filter(item => answers[item.id] === item.correct_answer).length;
      const mapping = SUBJECT_MAPPING[sub.name] || { displayName: sub.name, weight: 0 };
      
      const rating = (correct / subItems.length) * 100;
      const contribution = (rating * mapping.weight) / 100;
      totalGWA += contribution;
      
      return {
        name: mapping.displayName,
        score: correct,
        total: subItems.length,
        weight: mapping.weight,
        rating: rating.toFixed(2),
        contribution: contribution.toFixed(2)
      };
    }).filter(Boolean);

    const finalGWA = parseFloat(totalGWA.toFixed(2));
    const passed = finalGWA >= 75;

    return (
      <div className="max-w-5xl mx-auto py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className={`p-10 text-center ${passed ? 'bg-emerald-600' : 'bg-rose-600'} text-white relative overflow-hidden`}>
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner">
                {passed ? <Trophy size={40} /> : <XCircle size={40} />}
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">
                MOCK BOARD EXAMINATION RESULT
              </h2>
              <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs">
                Academic Year 2025-2026
              </p>
            </div>
          </div>

          <div className="p-8 md:p-12" ref={reportRef}>
            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 pb-8 border-b border-slate-100">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name of Student</p>
                  <p className="text-xl font-bold text-slate-800">{profile?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Course & Year</p>
                  <p className="text-lg font-bold text-slate-700">BLIS-4</p>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end justify-center">
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">General Weighted Average</p>
                  <p className={`text-6xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{finalGWA}%</p>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="py-5 px-6">Subjects</th>
                      <th className="py-5 px-4 text-center">Required Percentile</th>
                      <th className="py-5 px-4 text-center">Actual Score</th>
                      <th className="py-5 px-4 text-center">Rating</th>
                      <th className="py-5 px-6 text-right">Percentile Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakdown.map((item: any, idx) => (
                      <tr key={idx} className="hover:bg-white transition-colors group">
                        <td className="py-5 px-6">
                          <div className="flex items-start gap-3">
                            <span className="text-slate-300 font-black text-xs mt-0.5">{idx + 1}.</span>
                            <span className="text-sm font-bold text-slate-700 leading-snug">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs">{item.weight}%</span>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="text-sm font-bold text-slate-600">{item.score} / {item.total}</span>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className={`text-sm font-black ${parseFloat(item.rating) >= 75 ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {item.rating}%
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <span className="text-sm font-black text-indigo-600">{item.contribution}%</span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-indigo-600 text-white font-black">
                      <td className="py-6 px-6 rounded-bl-3xl">TOTAL:</td>
                      <td className="py-6 px-4 text-center">100%</td>
                      <td className="py-6 px-4 text-center">{score} / {items.length}</td>
                      <td className="py-6 px-4 text-center">-</td>
                      <td className="py-6 px-6 text-right rounded-br-3xl">{finalGWA}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary & Footer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Score:</span>
                    <span className="text-lg font-bold text-slate-800">{score} / {items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">General Weighted Average:</span>
                    <span className="text-lg font-bold text-slate-800">{finalGWA}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rate:</span>
                    <span className={`text-lg font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{finalGWA}%</span>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Remarks:</p>
                    <div className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {passed ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end space-y-12 text-center lg:text-right">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Checked and verified by:</p>
                  <p className="text-sm font-black text-slate-800 uppercase">ISAVAL MAE C. MONTERDE, RL, MLIS</p>
                  <p className="text-[10px] font-bold text-slate-500">LPr2/LIS115 Instructor/ BLIS Coordinator</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Noted by:</p>
                  <p className="text-sm font-black text-slate-800 uppercase">OWEN B. PILONGO, MIT, DBM-IS</p>
                  <p className="text-[10px] font-bold text-slate-500">Dean, CET</p>
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row gap-4 no-print">
              <button
                onClick={() => navigate('/student/mock-exams')}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Exams
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                {isDownloading ? 'Generating PDF...' : 'Download Result (PDF)'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-slate-50/90 backdrop-blur-md z-50 py-4 -mx-4 px-4 border-b border-slate-200/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/student/mock-exams')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 line-clamp-1">
                Mock Board Examination
              </h1>
              <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 flex items-center gap-1">
                <ShieldCheck size={10} />
                Official Format
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Question {currentIndex + 1} of {items.length}</span>
              {exam && <span className="text-slate-300">|</span>}
              {exam && <span className="text-slate-500">{exam.title}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNav(!showNav)}
            className={`p-3 rounded-xl transition-all ${showNav ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
            title="Toggle Navigation Grid"
          >
            <LayoutGrid size={20} />
          </button>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-mono font-bold text-xl shadow-lg border-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-white text-slate-800 border-white'}`}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="p-10 border-white/60 min-h-[450px] flex flex-col relative overflow-hidden">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                      {subjects.find(s => s.id === currentItem.subject_id)?.name || 'General'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-relaxed">
                    {currentItem.question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-auto">
                  {[
                    { id: 'a', text: currentItem.choice_a, label: 'A' },
                    { id: 'b', text: currentItem.choice_b, label: 'B' },
                    { id: 'c', text: currentItem.choice_c, label: 'C' },
                    { id: 'd', text: currentItem.choice_d, label: 'D' },
                  ].map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleSelectAnswer(choice.id)}
                      className={`flex items-center gap-6 p-6 rounded-2xl border-2 text-left transition-all group ${
                        answers[currentItem.id] === choice.id 
                          ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600' 
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                        answers[currentItem.id] === choice.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                      }`}>
                        {choice.label}
                      </div>
                      <span className={`text-lg font-medium ${answers[currentItem.id] === choice.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {choice.text}
                      </span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-3">
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <button 
                onClick={toggleFlag}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${flagged[currentItem.id] ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Flag size={20} fill={flagged[currentItem.id] ? 'currentColor' : 'none'} />
                {flagged[currentItem.id] ? 'Unflag' : 'Flag Question'}
              </button>
            </div>

            {currentIndex === items.length - 1 ? (
              <button 
                onClick={handleSubmit}
                className="flex items-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Submit Exam
                <Send size={20} />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Next Question
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Navigation Grid */}
        {showNav && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[450px] space-y-6"
          >
            <GlassCard className="p-8 border-slate-200 sticky top-28 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Question Navigation</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                  {Object.keys(answers).length} / {items.length} Answered
                </span>
              </div>

              {/* Pagination Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                {sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSection(idx)}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all ${
                      activeSection === idx 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <div className="w-4 h-4 rounded-md bg-white border border-slate-200" />
                  Unanswered
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <div className="w-4 h-4 rounded-md bg-indigo-600 shadow-sm" />
                  Answered
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <div className="w-4 h-4 rounded-md bg-orange-500 shadow-sm" />
                  Flagged
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <div className="w-4 h-4 rounded-md border-2 border-indigo-600" />
                  Current
                </div>
              </div>

              <div className="h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-5 gap-3">
                  {items.slice(sections[activeSection].start, sections[activeSection].end).map((item, localIdx) => {
                    const idx = sections[activeSection].start + localIdx;
                    const isAnswered = !!answers[item.id];
                    const isFlagged = !!flagged[item.id];
                    const isCurrent = currentIndex === idx;

                    let bgColor = 'bg-white';
                    let textColor = 'text-slate-400';
                    let borderColor = 'border-slate-200';

                    if (isAnswered) {
                      bgColor = 'bg-indigo-600';
                      textColor = 'text-white';
                      borderColor = 'border-indigo-600';
                    }

                    if (isFlagged) {
                      bgColor = isAnswered ? 'bg-indigo-600' : 'bg-orange-500';
                      textColor = 'text-white';
                      borderColor = isAnswered ? 'border-orange-400 border-2' : 'border-orange-500';
                    }

                    if (isCurrent) {
                      borderColor = isFlagged ? 'border-orange-500 border-2' : 'border-indigo-600 border-2';
                      if (!isAnswered && !isFlagged) {
                        textColor = 'text-indigo-600';
                      }
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs transition-all border relative shadow-sm ${bgColor} ${textColor} ${borderColor} hover:scale-105 active:scale-95`}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-md" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Review Your Answers</h2>
                  <p className="text-slate-500 text-sm font-medium">
                    Please check for any unanswered questions before submitting.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">
                    {Object.keys(answers).length} / {items.length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions Answered</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Unanswered Section */}
                  <div>
                    <h3 className="flex items-center gap-2 text-rose-600 font-bold uppercase tracking-widest text-xs mb-4">
                      <XCircle size={16} />
                      Unanswered ({items.length - Object.keys(answers).length})
                    </h3>
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                      {items.map((item, idx) => !answers[item.id] && (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setActiveSection(Math.floor(idx / sectionSize));
                            setShowReviewModal(false);
                          }}
                          className="aspect-square rounded-lg border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs hover:bg-rose-100 transition-all"
                        >
                          {idx + 1}
                        </button>
                      ))}
                      {items.length === Object.keys(answers).length && (
                        <div className="col-span-full py-4 text-center text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          All questions answered!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flagged Section */}
                  <div>
                    <h3 className="flex items-center gap-2 text-orange-600 font-bold uppercase tracking-widest text-xs mb-4">
                      <Flag size={16} />
                      Flagged for Review ({Object.keys(flagged).filter(k => flagged[k]).length})
                    </h3>
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                      {items.map((item, idx) => flagged[item.id] && (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setActiveSection(Math.floor(idx / sectionSize));
                            setShowReviewModal(false);
                          }}
                          className="aspect-square rounded-lg border border-orange-200 bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs hover:bg-orange-100 transition-all"
                        >
                          {idx + 1}
                        </button>
                      ))}
                      {Object.keys(flagged).filter(k => flagged[k]).length === 0 && (
                        <div className="col-span-full py-4 text-center text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          No questions flagged.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">Quick Navigation (All Questions)</h3>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 ml-1">{section.label}</div>
                        <div className="flex flex-wrap gap-1">
                          {items.slice(section.start, section.end).map((item, localIdx) => {
                            const globalIdx = section.start + localIdx;
                            const isAnswered = !!answers[item.id];
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setCurrentIndex(globalIdx);
                                  setActiveSection(idx);
                                  setShowReviewModal(false);
                                }}
                                className={`w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                                  isAnswered 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {globalIdx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Back to Exam
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-emerald-600 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  Confirm & Submit
                  <CheckCircle2 size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default TakeExamPage;