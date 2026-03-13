
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Lock, CheckCircle2, ChevronRight, Loader2, Trophy, Zap } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { PracticeSubject, PracticeProgress } from '../../types';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PracticeSetsTab: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [progress, setProgress] = useState<Record<string, PracticeProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async (retryCount = 0) => {
    if (!profile) return;
    setLoading(true);
    try {
      // Wrap the entire fetch process in a timeout
      const results = await Promise.race([
        (async () => {
          // Warm up session
          await supabase.auth.getSession();

          // Fetch subjects and progress
          return await Promise.all([
            supabase
              .from('practice_subjects')
              .select('*')
              .order('name'),
            supabase
              .from('practice_progress')
              .select('*')
              .eq('student_id', profile.id)
          ]);
        })(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 20000))
      ]);
      
      const [subRes, progRes] = results;
      
      if (subRes.error) throw subRes.error;
      if (progRes.error) throw progRes.error;
      
      setSubjects(subRes.data || []);
      
      const progMap: Record<string, PracticeProgress> = {};
      progRes.data?.forEach((p: any) => {
        progMap[p.subject_id] = p;
      });
      setProgress(progMap);
    } catch (err) {
      console.error('Error fetching practice data:', err);
      
      // Retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchData... (Attempt ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 3000));
        return fetchData(retryCount + 1);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Your session has expired. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur-md py-6 -mx-4 px-4 border-b border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Practice Sets</h2>
          <p className="text-slate-500">Master each subject part by part. Score 80% to unlock the next level.</p>
        </div>
        <button 
          onClick={() => fetchData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <Zap size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {subjects.map((subject) => {
          const subProg = progress[subject.id] || {
            highest_unlocked_part: 1,
            best_score_part1: 0,
            best_score_part2: 0,
            best_score_part3: 0,
            best_score_part4: 0,
            best_score_part5: 0
          };

          return (
            <GlassCard key={subject.id} className="p-6 border-white/60">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{subject.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Trophy size={14} className="text-amber-500" />
                    <span>Level {subProg.highest_unlocked_part} / 5</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((part) => {
                  const isLocked = part > subProg.highest_unlocked_part;
                  const bestScore = subProg[`best_score_part${part}` as keyof PracticeProgress] as number || 0;
                  const isPassed = bestScore >= 80;

                  return (
                    <div 
                      key={part}
                      onClick={() => !isLocked && navigate(`/student/practice/${subject.id}/part/${part}`)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isLocked 
                          ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' 
                          : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer group'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isLocked ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {part}
                        </div>
                        <div>
                          <p className={`font-semibold ${isLocked ? 'text-slate-400' : 'text-slate-700'}`}>
                            Part {part}
                          </p>
                          {!isLocked && bestScore > 0 && (
                            <p className="text-xs text-slate-500">Best Score: {bestScore}%</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isPassed && <CheckCircle2 size={18} className="text-emerald-500" />}
                        {isLocked ? (
                          <Lock size={18} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

export default PracticeSetsTab;
