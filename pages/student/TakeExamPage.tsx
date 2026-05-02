
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
  Download,
  Lock,
  X
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MOCK_EXAM_SUBJECTS } from '../../src/constants';
import { useAuth } from '../../context/AuthContext';
import { MockExam, MockExamItem, MockExamAttempt, PracticeSubject, MockExamSubjectSession } from '../../types';
import GlassCard from '../../components/GlassCard';

const TakeExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [exam, setExam] = useState<MockExam | null>(null);
  const [session, setSession] = useState<MockExamSubjectSession | null>(null);
  const [items, setItems] = useState<MockExamItem[]>([]);
  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [allSessionsFinished, setAllSessionsFinished] = useState(false);
  const [comprehensiveResult, setComprehensiveResult] = useState<any | null>(null);
  const [score, setScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showNav, setShowNav] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Pagination for Form Layout
  const perPage = profile?.questions_per_page || 10;
  const currentPage = Math.floor(currentIndex / perPage);
  const totalPages = Math.ceil(items.length / perPage);

  // Hide nav by default on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1536) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
    };
    
    // Initial check
    handleResize();
    
    // We don't really need a listener if we want them to stay in the state they toggled,
    // but the user said "keep it visible on large screens, but hide it by default on smaller screens".
  }, []);

  // Derived state for counters
  const flaggedTotal = Object.values(flagged).filter(Boolean).length;
  const answeredTotal = Object.keys(answers).length;
  const unansweredTotal = items.length - answeredTotal;

    const sectionSize = 100;
  const sections = [
    {
      label: `Session items 1-${items.length}`,
      start: 0,
      end: items.length,
      isComplete: items.length > 0 && items.every(item => answers[item.id]),
      isLocked: false
    }
  ];

  const fetchExamData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Seeded random for stable shuffling
      const seededRandom = (seed: number) => {
        return () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
      };

      const seededShuffle = (array: MockExamItem[], seedStr: string) => {
        let seed = 0;
        for (let i = 0; i < seedStr.length; i++) {
          seed = (seed << 5) - seed + seedStr.charCodeAt(i);
          seed |= 0;
        }
        const rng = seededRandom(Math.abs(seed));
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Wrap the entire fetch process in a timeout
      const results = await Promise.race([
        (async () => {
          // 1. Fetch Session with its parent exam
          const { data: sessionData, error: sessionError } = await supabase
            .from('mock_exam_subject_sessions')
            .select(`
              *,
              exam:mock_exams(*)
            `)
            .eq('id', id)
            .single();

          if (sessionError) throw sessionError;

          // 2. Fetch Items for this session
          const { data: itemsData, error: itemsError } = await supabase
            .from('mock_exam_items')
            .select('*')
            .eq('session_id', id)
            .order('item_no', { ascending: true });

          if (itemsError) throw itemsError;

          // 3. Fetch Subjects and Attempt
          const [subjectsRes, attemptRes] = await Promise.all([
            supabase.from('practice_subjects').select('*'),
            supabase
              .from('mock_exam_attempts')
              .select('*')
              .eq('session_id', id)
              .eq('student_id', user.id)
              .eq('is_submitted', false)
              .maybeSingle()
          ]);

          return [sessionData, itemsData, subjectsRes.data, attemptRes.data];
        })(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 20000))
      ]);

      const [sessionData, rawItemsData, subjectsData, attemptData] = results;

      const examData = sessionData.exam as MockExam;
      let itemsToUse = rawItemsData || [];

      // Apply randomization if enabled
      if (examData.randomize_questions && user.id) {
        itemsToUse = seededShuffle(itemsToUse, `${user.id}-${id}`);
      }

      setExam(examData);
      setSession(sessionData);
      setItems(itemsToUse);
      setSubjects(subjectsData || []);

      // Check if all sessions for this exam are finished by this student
      const { data: allExamSessions } = await supabase
        .from('mock_exam_subject_sessions')
        .select('id')
        .eq('exam_id', examData.id);
      
      const { data: userSubmittedAttempts } = await supabase
        .from('mock_exam_attempts')
        .select('session_id')
        .eq('exam_id', examData.id)
        .eq('student_id', user.id)
        .eq('is_submitted', true);

      const totalSessions = allExamSessions?.length || 0;
      const submittedSessions = userSubmittedAttempts?.length || 0;
      
      // If we are currently loading an already submitted attempt
      const { data: currentSessionAttempt } = await supabase
        .from('mock_exam_attempts')
        .select('is_submitted')
        .eq('session_id', id)
        .eq('student_id', user.id)
        .maybeSingle();

      const isCurrentSubmitted = currentSessionAttempt?.is_submitted || false;
      
      setAllSessionsFinished(submittedSessions >= totalSessions);
      
      if (submittedSessions >= totalSessions) {
        const { data: results } = await supabase
          .from('mock_exam_results')
          .select('*')
          .eq('exam_id', examData.id)
          .eq('student_id', user.id);
        
        if (results && results.length > 0) {
          // Combine results for comprehensive view
          const combinedBreakdown = results
            .flatMap(r => r.category_breakdown || [])
            .sort((a, b) => {
              const indexA = MOCK_EXAM_SUBJECTS.indexOf(a.name);
              const indexB = MOCK_EXAM_SUBJECTS.indexOf(b.name);
              return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });
          const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
          const totalItems = results.reduce((acc, curr) => acc + curr.total_items, 0);
          
          // Recalculate GWA based on weights
          let totalGWA = 0;
          combinedBreakdown.forEach(item => {
            if (item.contribution) {
              totalGWA += parseFloat(item.contribution);
            }
          });

          setComprehensiveResult({
            score: totalScore,
            totalItems: totalItems,
            percentage: parseFloat(totalGWA.toFixed(2)),
            breakdown: combinedBreakdown,
            passed: totalGWA >= 75
          });
        }
      }
      
      if (isCurrentSubmitted) {
        setIsFinished(true);
      }

      if (attemptData) {
        setAttemptId(attemptData.id);
        setAnswers(attemptData.answers || {});
        setFlagged(attemptData.flagged || {});
        setTimeLeft(attemptData.time_left_seconds);
        setCurrentIndex(attemptData.current_index || 0);
      } else {
        setTimeLeft(sessionData.duration_minutes * 60);
      }
    } catch (err: any) {
      console.error('Error fetching session data:', err);
      
      if (retryCount < 3) {
        await new Promise(r => setTimeout(r, 3000));
        return fetchExamData(retryCount + 1);
      }

      setError(err.message || 'Failed to load simulation data');
    } finally {
      setLoading(false);
    }
  }, [id, profile]);

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
      exam_id: exam.id,
      session_id: id,
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

  const handleSelectAnswer = (itemId: string, choice: string) => {
    if (isFinished) return;
    setAnswers({
      ...answers,
      [itemId]: choice
    });
  };

  const toggleFlag = (targetItemId?: string) => {
    const itemId = targetItemId || items[currentIndex].id;
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

    // Refresh allSessionsFinished status after submission
    if (exam && id && profile) {
      const { data: allExamSessions } = await supabase
        .from('mock_exam_subject_sessions')
        .select('id')
        .eq('exam_id', exam.id);
      
      const { data: userSubmittedAttempts } = await supabase
        .from('mock_exam_attempts')
        .select('session_id')
        .eq('exam_id', exam.id)
        .eq('student_id', profile.id)
        .eq('is_submitted', true);

      if (allExamSessions && userSubmittedAttempts) {
        const isAllDone = userSubmittedAttempts.length >= allExamSessions.length;
        setAllSessionsFinished(isAllDone);

        if (isAllDone) {
          const { data: results } = await supabase
            .from('mock_exam_results')
            .select('*')
            .eq('exam_id', exam.id)
            .eq('student_id', profile.id);
          
          if (results && results.length > 0) {
            const combinedBreakdown = results
              .flatMap(r => r.category_breakdown || [])
              .sort((a, b) => {
                const indexA = MOCK_EXAM_SUBJECTS.indexOf(a.name);
                const indexB = MOCK_EXAM_SUBJECTS.indexOf(b.name);
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
              });
            const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
            const totalItems = results.reduce((acc, curr) => acc + curr.total_items, 0);
            
            let totalGWA = 0;
            combinedBreakdown.forEach(item => {
              if (item.contribution) {
                totalGWA += parseFloat(item.contribution);
              }
            });

            setComprehensiveResult({
              score: totalScore,
              totalItems: totalItems,
              percentage: parseFloat(totalGWA.toFixed(2)),
              breakdown: combinedBreakdown,
              passed: totalGWA >= 75
            });
          }
        }
      }
    }
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
    const isSessionAttempt = !!attemptId;
    
    let totalGWA = 0;
    let actualBreakdown = [];

    if (items.length > 0) {
      // Calculate results for the session
      const correct = items.filter(item => answers[item.id] === item.correct_answer).length;
      const scorePercentage = (correct / items.length) * 100;
      
      actualBreakdown = [{
        name: session?.subject_name || 'Subject Session',
        score: correct,
        total: items.length,
        rating: scorePercentage.toFixed(2),
        passed: scorePercentage >= 75
      }];
      
      totalGWA = scorePercentage;
    }

    const finalResultScore = parseFloat(totalGWA.toFixed(2));
    const passed = finalResultScore >= 75;

    return (
      <div className="max-w-5xl mx-auto py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
        >
          <div className={`p-10 text-center ${passed ? 'bg-emerald-600' : 'bg-rose-600'} text-white relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-inner">
                {passed ? <Trophy size={40} /> : <XCircle size={40} />}
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">
                {allSessionsFinished ? 'EXAM COMPLETION RESULT' : 'SESSION SUBMITTED'}
              </h2>
              <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs">
                {session?.subject_name || 'Subject Session'}
              </p>
            </div>
          </div>

          <div className="p-8 md:p-12" ref={reportRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 pb-8 border-b border-slate-100">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Name of Student</p>
                  <p className="text-xl font-bold text-slate-800">{profile?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Exam Title</p>
                  <p className="text-lg font-bold text-slate-700">{exam?.title}</p>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end justify-center">
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {allSessionsFinished ? 'Final Rating (GWA)' : 'Session Status'}
                  </p>
                  {allSessionsFinished ? (
                    <p className={`text-6xl font-black ${comprehensiveResult?.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comprehensiveResult?.percentage || finalResultScore}%
                    </p>
                  ) : (
                    <div className="flex flex-col items-center md:items-end">
                      <p className="text-3xl font-black text-indigo-600">SUBMITTED</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Pending Exam Completion</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden mb-12 p-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-4">
                     <h3 className="font-bold text-slate-800 text-lg">
                       {allSessionsFinished ? 'Detailed Performance Breakdown' : 'Performance Summary'}
                     </h3>
                     {allSessionsFinished ? (
                       <div className="space-y-6">
                         <p className="text-slate-500 text-sm">
                           Congratulations on completing the entire mock board examination! Below is your weighted performance across all subjects.
                         </p>
                         <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                           <table className="w-full text-left border-collapse">
                             <thead>
                               <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                 <th className="py-3 px-4">Subject</th>
                                 <th className="py-3 px-2 text-center">Score</th>
                                 <th className="py-3 px-2 text-center">Rating</th>
                                 <th className="py-3 px-4 text-right">GWA Cont.</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                               {comprehensiveResult?.breakdown?.map((item: any, idx: number) => (
                                 <tr key={idx} className="text-[11px]">
                                   <td className="py-3 px-4 font-bold text-slate-700 leading-tight">{item.name}</td>
                                   <td className="py-3 px-2 text-center text-slate-500">{item.score}/{item.total}</td>
                                   <td className="py-3 px-2 text-center font-bold text-slate-700">{item.rating}%</td>
                                   <td className="py-3 px-4 text-right font-black text-indigo-600">{item.contribution}%</td>
                                 </tr>
                               ))}
                               <tr className="bg-indigo-50/50 font-black text-xs">
                                 <td className="py-4 px-4 text-indigo-900 uppercase">General Weighted Average</td>
                                 <td className="py-4 px-2 text-center text-indigo-900">{comprehensiveResult?.score}/{comprehensiveResult?.totalItems}</td>
                                 <td className="py-4 px-2 text-center text-indigo-900">-</td>
                                 <td className="py-4 px-4 text-right text-indigo-700 text-lg">{comprehensiveResult?.percentage}%</td>
                               </tr>
                             </tbody>
                           </table>
                         </div>
                       </div>
                     ) : (
                       <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-3 text-indigo-600 mb-3">
                           <CheckCircle2 size={24} />
                           <h4 className="font-bold uppercase tracking-wider">Submission Received</h4>
                         </div>
                         <p className="text-slate-500 text-sm leading-relaxed">
                           Your answers for <strong>{session?.subject_name}</strong> have been successfully recorded. 
                           To maintain the integrity of the mock board exam, individual session scores are hidden until all subjects have been completed.
                         </p>
                         <p className="text-slate-400 text-xs mt-4 font-medium italic">
                           Finish all remaining subjects to view your comprehensive rating and performance analytics.
                         </p>
                       </div>
                     )}
                  </div>
                  {allSessionsFinished && (
                    <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center shrink-0 ${comprehensiveResult?.passed ? 'border-emerald-100 text-emerald-600' : 'border-rose-100 text-rose-600'}`}>
                       <span className="text-2xl font-black">{comprehensiveResult?.percentage}%</span>
                       <span className="text-[8px] font-black uppercase tracking-widest leading-none">Final GWA</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 no-print">
              <button
                onClick={() => navigate(`/student/mock-exams/${exam?.id}`)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Session List
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
    <div className="h-screen w-full bg-slate-50 overflow-hidden flex flex-col p-2 md:p-4 lg:p-6 xl:p-8 [@media(max-height:900px)]:p-3">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full space-y-2 md:space-y-4 lg:space-y-6 [@media(max-height:900px)]:space-y-2">
        {/* Header */}
        <div className="flex justify-between items-center bg-white/90 backdrop-blur-md z-50 py-2 md:py-3 px-3 md:px-5 rounded-2xl md:rounded-[2rem] border border-slate-200/50 shadow-sm shrink-0 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:px-4">
          <div className="flex items-center gap-1.5 md:gap-4">
                 <button 
                  onClick={() => navigate(`/student/mock-exams/${exam?.id}`)}
                  className="p-1 md:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <ArrowLeft size={18} className="md:w-6 md:h-6" />
                </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs md:text-lg xl:text-xl font-bold text-slate-800 line-clamp-1">
                  Mock Board Examination
                </h1>
                <div className="hidden sm:flex px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 items-center gap-1">
                  <ShieldCheck size={10} />
                  Official Format
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px] xl:text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Question {currentIndex + 1} of {items.length}</span>
                {exam && <span className="text-slate-300">|</span>}
                {exam && <span className="text-slate-500 hidden md:inline">{exam.title}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-4">
            <div className="hidden xl:flex items-center gap-3 px-3 border-r border-slate-100 py-1">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-indigo-600 uppercase">Answered</span>
                <span className="text-xs font-bold text-slate-700">{answeredTotal}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-orange-600 uppercase">Flagged</span>
                <span className="text-xs font-bold text-slate-700">{flaggedTotal}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowNav(!showNav)}
              className={`p-1.5 md:p-3 rounded-xl transition-all ${showNav ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'} [@media(max-height:900px)]:p-2`}
              title="Toggle Navigation Grid"
            >
              <LayoutGrid size={16} className="md:w-[20px] md:h-[20px] [@media(max-height:900px)]:w-4 [@media(max-height:900px)]:h-4" />
            </button>
            <div className={`flex items-center gap-1.5 md:gap-3 px-2 md:px-6 py-1.5 md:py-3 rounded-[1rem] md:rounded-[1.25rem] font-mono font-bold text-sm md:text-xl shadow-lg border-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-white text-slate-800 border-white'} [@media(max-height:900px)]:px-4 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:text-base`}>
              <Clock size={14} className="md:w-5 md:h-5 text-indigo-500 [@media(max-height:900px)]:w-4 [@media(max-height:900px)]:h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 xl:gap-8 flex-1 min-h-0 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3 md:space-y-4">
            {/* Progress Bar */}
            <div className="w-full h-1 md:h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0 [@media(max-height:900px)]:h-1">
              <motion.div 
                className="h-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
              />
            </div>

            {profile?.exam_layout === 'form' ? (
              // Form Layout
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6 md:space-y-8 pb-10">
                {items.slice(currentPage * perPage, (currentPage + 1) * perPage).map((item, idx) => {
                  const absoluteIndex = currentPage * perPage + idx;
                  return (
                    <GlassCard 
                      key={item.id} 
                      className={`p-6 md:p-8 border-white/60 relative overflow-hidden group/card shadow-lg transition-all ${currentIndex === absoluteIndex ? 'ring-2 ring-indigo-500 shadow-indigo-100' : ''}`}
                      onClick={() => setCurrentIndex(absoluteIndex)}
                    >
                      <div className="flex-1 flex flex-col">
                        <div className="mb-4 md:mb-6 shrink-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] md:text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 md:px-3 py-0.5 md:py-1.5 rounded-full uppercase tracking-wider">
                                {subjects.find(s => s.id === item.subject_id)?.name || 'General'}
                              </span>
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-white px-2 md:px-3 py-0.5 md:py-1.5 rounded-full uppercase tracking-wider border border-slate-100">
                                Question #{absoluteIndex + 1}
                              </span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFlag(item.id);
                              }}
                              className={`p-2 rounded-lg transition-all ${flagged[item.id] ? 'bg-orange-100 text-orange-600' : 'text-slate-300 hover:text-slate-400 hover:bg-slate-50'}`}
                            >
                              <Flag size={18} fill={flagged[item.id] ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <h2 className="text-base md:text-lg lg:text-xl font-bold text-slate-800 leading-relaxed">
                            {item.question}
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 py-2">
                          {[
                            { id: 'a', text: item.choice_a, label: 'A' },
                            { id: 'b', text: item.choice_b, label: 'B' },
                            { id: 'c', text: item.choice_c, label: 'C' },
                            { id: 'd', text: item.choice_d, label: 'D' },
                          ].map((choice) => (
                            <button
                              key={choice.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAnswer(item.id, choice.id);
                              }}
                              className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 text-left transition-all group shrink-0 ${
                                answers[item.id] === choice.id 
                                  ? 'bg-indigo-50/50 border-indigo-600 ring-1 ring-indigo-600 shadow-sm' 
                                  : 'bg-white border-slate-100/80 hover:border-indigo-200 hover:bg-slate-50/50 hover:shadow-md'
                              }`}
                            >
                              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-bold text-xs md:text-sm transition-all shrink-0 ${
                                answers[item.id] === choice.id 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                              }`}>
                                {choice.label}
                              </div>
                              <span className={`text-xs md:text-sm font-medium break-words py-0.5 ${answers[item.id] === choice.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                {choice.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
                
                {/* Submit button in Form Layout at end of last page */}
                {currentPage === totalPages - 1 && (
                  <div className="pt-8 pb-12 flex justify-center">
                    <button 
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      Submit Exam Results
                      <Send size={24} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Standard Layout
              <div className="flex-1 min-h-0 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0"
                  >
                    <GlassCard className="p-4 md:p-6 lg:p-10 border-white/60 h-full flex flex-col relative overflow-hidden group/card shadow-[0_20px_50px_rgba(0,0,0,0.1)] [@media(max-height:900px)]:p-4 [@media(max-height:900px)]:lg:p-6">
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0 flex flex-col">
                        <div className="my-auto w-full">
                          <div className="mb-6 md:mb-10 lg:mb-12 shrink-0 [@media(max-height:900px)]:mb-3">
                            <div className="flex items-center gap-2 mb-3 md:mb-5 [@media(max-height:900px)]:mb-1.5">
                              <span className="text-[9px] md:text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 md:px-3 py-0.5 md:py-1.5 rounded-full uppercase tracking-wider">
                                {subjects.find(s => s.id === currentItem.subject_id)?.name || 'General'}
                              </span>
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-slate-50 px-2 md:px-3 py-0.5 md:py-1.5 rounded-full uppercase tracking-wider border border-slate-100">
                                Item #{currentIndex + 1}
                              </span>
                            </div>
                            <h2 className="text-sm md:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800 leading-relaxed md:leading-snug [@media(max-height:900px)]:text-base [@media(max-height:900px)]:xl:text-lg">
                              {currentItem.question}
                            </h2>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:gap-4 py-2 [@media(max-height:900px)]:gap-2 [@media(max-height:900px)]:py-1">
                            {[
                              { id: 'a', text: currentItem.choice_a, label: 'A' },
                              { id: 'b', text: currentItem.choice_b, label: 'B' },
                              { id: 'c', text: currentItem.choice_c, label: 'C' },
                              { id: 'd', text: currentItem.choice_d, label: 'D' },
                            ].map((choice) => (
                              <button
                                key={choice.id}
                                onClick={() => handleSelectAnswer(currentItem.id, choice.id)}
                                className={`flex items-start md:items-center gap-3 md:gap-5 p-4 md:p-5 lg:p-6 rounded-xl md:rounded-2xl border-2 text-left transition-all group shrink-0 ${
                                  answers[currentItem.id] === choice.id 
                                    ? 'bg-indigo-50/50 border-indigo-600 ring-1 ring-indigo-600 shadow-md' 
                                    : 'bg-white border-slate-100/80 hover:border-indigo-200 hover:bg-slate-50/50 hover:shadow-lg'
                                } [@media(max-height:900px)]:p-2.5 [@media(max-height:900px)]:md:p-3 [@media(max-height:900px)]:lg:p-3.5`}
                              >
                                <div className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-base transition-all shrink-0 mt-0.5 md:mt-0 ${
                                  answers[currentItem.id] === choice.id 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                } [@media(max-height:900px)]:w-7 [@media(max-height:900px)]:h-7 [@media(max-height:900px)]:text-xs`}>
                                  {choice.label}
                                </div>
                                <span className={`text-xs md:text-sm lg:text-base font-medium break-words py-0.5 ${answers[currentItem.id] === choice.id ? 'text-indigo-900' : 'text-slate-700'} [@media(max-height:900px)]:text-[11px] [@media(max-height:900px)]:md:text-xs [@media(max-height:900px)]:lg:text-sm`}>
                                  {choice.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between items-center py-2 shrink-0 [@media(max-height:900px)]:py-1">
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (profile?.exam_layout === 'form') {
                      const newIndex = Math.max(0, (currentPage - 1) * perPage);
                      setCurrentIndex(newIndex);
                    } else {
                      setCurrentIndex(prev => Math.max(0, prev - 1));
                    }
                  }}
                  disabled={profile?.exam_layout === 'form' ? currentPage === 0 : currentIndex === 0}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all disabled:opacity-30 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:px-4"
                >
                  <ChevronLeft size={16} className="md:w-5 md:h-5 [@media(max-height:900px)]:w-4 [@media(max-height:900px)]:h-4" />
                  <span className="hidden sm:inline">{profile?.exam_layout === 'form' ? 'Previous Page' : 'Previous'}</span>
                </button>
                {profile?.exam_layout !== 'form' && (
                  <button 
                    onClick={() => toggleFlag()}
                    className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-all ${flagged[currentItem.id] ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'text-slate-400 hover:bg-white border border-transparent hover:border-slate-200'} [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:px-4`}
                  >
                    <Flag size={16} className="md:w-5 md:h-5 [@media(max-height:900px)]:w-4 [@media(max-height:900px)]:h-4" fill={flagged[currentItem.id] ? 'currentColor' : 'none'} />
                    {flagged[currentItem.id] ? 'Unflag' : 'Flag'}
                  </button>
                )}
              </div>

              <div className="flex gap-4 items-center">
                {profile?.exam_layout === 'form' ? (
                  <>
                    <span className="text-xs font-bold text-slate-400">Page {currentPage + 1} of {totalPages}</span>
                    {currentPage < totalPages - 1 ? (
                      <button 
                        onClick={() => {
                          const newIndex = Math.min(items.length - 1, (currentPage + 1) * perPage);
                          setCurrentIndex(newIndex);
                          // Scroll to top
                          const container = document.querySelector('.overflow-y-auto');
                          if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex items-center gap-1 md:gap-2 px-6 md:px-10 py-2 md:py-3 bg-indigo-600 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-base shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 [@media(max-height:900px)]:py-2 [@media(max-height:900px)]:px-8"
                      >
                        Next Page
                        <ChevronRight size={16} className="md:w-5 md:h-5 [@media(max-height:900px)]:w-4 [@media(max-height:900px)]:h-4" />
                      </button>
                    ) : null}
                  </>
                ) : (
                  currentIndex === items.length - 1 ? (
                    <button 
                      onClick={handleSubmit}
                      className="flex items-center gap-1 md:gap-2 px-4 md:px-8 py-2 md:py-3 bg-emerald-600 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-base shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:px-6"
                    >
                      Submit Exam
                      <Send size={16} className="md:w-5 md:h-5 [@media(max-height:900px)]:w-4 [@media(max-height:900px)]:h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))}
                      className="flex items-center gap-1 md:gap-2 px-6 md:px-10 py-2 md:py-3 bg-indigo-600 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-base shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 [@media(max-height:900px)]:py-2 [@media(max-height:900px)]:px-8"
                    >
                      Next Question
                      <ChevronRight size={16} className="md:w-5 md:h-5 [@media(max-height:900px)]:w-4 [@media(max-height:900px)]:h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Grid */}
          <AnimatePresence>
            {showNav && (
              <>
                {/* Backdrop for mobile */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNav(false)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] 2xl:hidden"
                />
                
                <motion.div 
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 right-0 z-[70] w-[280px] sm:w-[320px] 2xl:relative 2xl:inset-auto 2xl:z-0 lg:w-[260px] xl:w-[320px] 2xl:w-[320px] shrink-0 h-full flex flex-col pointer-events-auto"
                >
                  <GlassCard className="p-3 md:p-4 xl:p-6 border-slate-200 h-full flex flex-col shadow-xl overflow-hidden bg-white/95 2xl:bg-white/60">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowNav(false)}
                          className="2xl:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <X size={18} />
                        </button>
                        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[9px] md:text-[11px]">Navigation</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                        {answeredTotal} / {items.length}
                      </span>
                    </div>
                
                    <div className="flex xl:hidden items-center justify-between gap-1 mb-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0">
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[7px] font-black text-indigo-600 uppercase">Ans.</span>
                        <span className="text-[11px] font-bold text-slate-700">{answeredTotal}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200" />
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[7px] font-black text-orange-600 uppercase">Flag.</span>
                        <span className="text-[11px] font-bold text-slate-700">{flaggedTotal}</span>
                      </div>
                    </div>
                
                    {/* Pagination Tabs */}
                    <div className="flex flex-wrap gap-1 mb-3 shrink-0">
                      {sections.map((section, idx) => (
                        <button
                          key={idx}
                          disabled={section.isLocked}
                          onClick={() => !section.isLocked && setActiveSection(idx)}
                          className={`relative px-1.5 py-1 text-[8px] md:text-[9px] font-bold rounded-md md:rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                            activeSection === idx 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : section.isLocked
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100 opacity-60'
                                : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200 hover:text-indigo-500'
                          }`}
                          title={section.isLocked ? "Complete all questions in the previous section first" : ""}
                        >
                          {section.label}
                          {section.isLocked && <Lock size={8} />}
                          {section.isComplete && !section.isLocked && (
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white" />
                          )}
                        </button>
                      ))}
                    </div>
                
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-1.5 mb-3 p-1.5 bg-slate-50/50 rounded-lg border border-slate-100 shrink-0">
                      <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-slate-500">
                        <div className="w-2.5 h-2.5 rounded-sm bg-white border border-slate-200" />
                        Unans.
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-slate-500">
                        <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600 shadow-sm" />
                        Ans.
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-slate-500">
                        <div className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-sm" />
                        Flag.
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold text-slate-500">
                        <div className="w-2.5 h-2.5 rounded-sm border-[1.5px] border-indigo-600" />
                        Curr.
                      </div>
                    </div>
                
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-1 auto-rows-min pb-2">
                        {items.slice(sections[activeSection].start, sections[activeSection].end).map((item, localIdx) => {
                          const idx = sections[activeSection].start + localIdx;
                          const isAnswered = !!answers[item.id];
                          const isFlagged = !!flagged[item.id];
                          const isCurrent = currentIndex === idx;
                
                          let bgColor = 'bg-white';
                          let textColor = 'text-slate-400';
                          let borderColor = 'border-slate-100';
                
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
                              className={`aspect-square rounded-md flex items-center justify-center font-bold text-[9px] md:text-[10px] transition-all border relative shadow-sm ${bgColor} ${textColor} ${borderColor} hover:scale-105 active:scale-95`}
                            >
                              {idx + 1}
                              {isFlagged && (
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full border border-white shadow-md z-10" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
  </div>
  );
};

export default TakeExamPage;