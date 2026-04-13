
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Clock, 
  ListChecks, 
  Play, 
  Loader2, 
  AlertCircle, 
  Search,
  Calendar,
  Zap
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MockExam } from '../../types';
import GlassCard from '../../components/GlassCard';
import { useNavigate } from 'react-router-dom';

const MockExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let channel: any = null;
    let mounted = true;

    const subscribe = async () => {
      // Ensure we have a valid session before subscribing
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // If channel already exists and is joined, don't re-subscribe
      if (channel && channel.state === 'joined') {
        return;
      }

      if (channel) {
        await supabase.removeChannel(channel);
      }

      const newChannel = supabase
        .channel(`mock_exams_student_${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mock_exams',
            filter: 'is_published=eq.true'
          },
          (payload) => {
            console.log('Realtime update received:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newExam = payload.new as MockExam;
              setExams(prev => [newExam, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedExam = payload.new as MockExam;
              if (updatedExam.is_published) {
                setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
              } else {
                // If it was unpublished, remove it
                setExams(prev => prev.filter(e => e.id !== updatedExam.id));
              }
            } else if (payload.eventType === 'DELETE') {
              setExams(prev => prev.filter(e => e.id !== payload.old.id));
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime status:', status);
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            // Attempt to re-subscribe after a delay if it closed unexpectedly
            setTimeout(() => {
              if (mounted) subscribe();
            }, 5000);
          }
        });
      
      channel = newChannel;
    };

    fetchExams();
    subscribe();

    // Handle visibility change to re-sync if needed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible, re-syncing exams and realtime...');
        fetchExams();
        // Only re-subscribe if channel is not active
        if (!channel || channel.state !== 'joined') {
          subscribe();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchExams = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Wrap the entire fetch process (session check + data fetch) in a timeout
      const { data, error } = await Promise.race([
        (async () => {
          // Warm up the session
          await supabase.auth.getSession();
          
          // Fetch data
          return await supabase
            .from('mock_exams')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        })(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 20000))
      ]);

      if (error) throw error;
      setExams(data || []);
    } catch (err: any) {
      console.error('Error fetching exams:', err);
      
      // Retry logic for network issues or timeouts
      if (retryCount < 3) {
        console.log(`Retrying fetchExams... (Attempt ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 3000));
        return fetchExams(retryCount + 1);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your session has expired. Please refresh the page to log in again.');
        return;
      }

      const errorMessage = err.message === 'Fetch timeout' 
        ? 'The connection is taking longer than expected. Please check your internet and try again.'
        : 'Failed to load mock exams. Please check your connection and try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section - Sticky */}
      <div className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur-md py-6 -mx-4 px-4 border-b border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Mockboard Simulations</h1>
          <p className="text-slate-500">Practice with real-time updated exam simulations created by your instructors.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchExams()}
            disabled={loading}
            className="p-3 text-slate-500 hover:bg-white hover:text-blue-600 rounded-2xl transition-all border border-transparent hover:border-slate-200 disabled:opacity-50"
            title="Refresh exams"
          >
            <Zap size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search exams..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Realtime Badge */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full uppercase tracking-widest">
        <Zap size={12} className="animate-pulse" />
        Live Updates Enabled
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-center border border-red-100">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="font-bold text-lg">{error}</p>
          <button onClick={() => fetchExams()} className="mt-4 text-blue-600 font-bold hover:underline">
            Try Again
          </button>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center text-slate-400">
          <FileText size={64} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No mock exams available at the moment.</p>
          <p className="text-sm">Check back later or wait for your instructor to publish one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredExams.map((exam) => (
              <motion.div
                key={exam.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <GlassCard hoverEffect className="p-8 border-white/60 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <FileText size={28} />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Calendar size={12} />
                        {new Date(exam.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 flex-grow">{exam.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{exam.duration_minutes}m</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <ListChecks size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Items</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{exam.total_items}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/student/mock-exams/${exam.id}`)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold transition-all hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 group"
                  >
                    Start Simulation
                    <Play size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MockExamsPage;
