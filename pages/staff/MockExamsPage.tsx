
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, FileText, Clock, ListChecks, Trash2, Edit, ExternalLink, Loader2, ShieldCheck, AlertTriangle, X, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MockExam } from '../../types';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/GlassCard';
import { useNavigate } from 'react-router-dom';

const Toast: React.FC<{ message: string, type: 'success' | 'error', onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-8 left-1/2 z-[10000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] border ${
        type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <span className="font-bold text-sm">{message}</span>
      <button onClick={onClose} className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-all">
        <X size={16} />
      </button>
    </motion.div>
  );
};

const MockExamsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<MockExam | null>(null);
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean, examTitle: string, currentCount: number } | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    duration_minutes: 600,
    total_items: 600,
    randomize_questions: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mock_exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to ensure completed_count is at least 0
      const transformedExams = (data || []).map(exam => ({
        ...exam,
        completed_count: exam.completed_count || 0
      }));
      
      setExams(transformedExams);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      
      if (editingExam) {
        // Update existing exam
        const { error } = await supabase
          .from('mock_exams')
          .update({
            title: formData.title,
            randomize_questions: formData.randomize_questions
          })
          .eq('id', editingExam.id);
          
        if (error) throw error;
        
        setExams(exams.map(e => e.id === editingExam.id ? { ...e, title: formData.title, randomize_questions: formData.randomize_questions } : e));
        setToast({ message: 'Exam settings updated successfully', type: 'success' });
        setIsModalOpen(false);
        setEditingExam(null);
        setFormData({ title: '', duration_minutes: 600, total_items: 600, randomize_questions: false });
      } else {
        // Create new exam
        const { data, error } = await supabase
          .from('mock_exams')
          .insert([
            {
              ...formData,
              created_by: user.id,
              is_published: false, // Start as draft
            },
          ])
          .select()
          .single();

        if (error) throw error;
        
        setIsModalOpen(false);
        setFormData({ title: '', duration_minutes: 600, total_items: 600, randomize_questions: false });
        
        // Navigate to builder
        if (data) {
          navigate(`/staff/mock-exams/${data.id}`);
        }
      }
    } catch (err: any) {
      console.error('Error saving exam:', err);
      setToast({ message: `Failed to ${editingExam ? 'update' : 'create'} exam. Please try again.`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    // Custom confirm modal would be better, but for now let's use toast for the result
    if (!window.confirm('Are you sure you want to delete this exam? This will also delete all questions.')) return;

    try {
      const { error } = await supabase
        .from('mock_exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExams(exams.filter(e => e.id !== id));
      setToast({ message: 'Exam deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Error deleting exam:', err);
      setToast({ message: 'Failed to delete exam', type: 'error' });
    }
  };

  const togglePublish = async (exam: any) => {
    // Check if it has at least 1 question before publishing
    if (!exam.is_published && exam.completed_count < 1) {
      setWarningModal({
        isOpen: true,
        examTitle: exam.title,
        currentCount: exam.completed_count
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('mock_exams')
        .update({ is_published: !exam.is_published })
        .eq('id', exam.id);

      if (error) throw error;
      setExams(exams.map(e => e.id === exam.id ? { ...e, is_published: !exam.is_published } : e));
      setToast({
        message: exam.is_published ? 'Exam unpublished successfully' : 'Exam published successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error('Error toggling publish:', err);
      setToast({ message: 'Failed to update exam status', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Mock Exams</h1>
          <p className="text-slate-500">Create and manage board exam simulations for students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          Create New Exam
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center text-slate-400">
          <FileText size={64} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No mock exams created yet.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-indigo-600 font-bold hover:underline"
          >
            Create your first exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <GlassCard className="p-6 border-slate-200 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${exam.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {exam.is_published ? 'Published' : 'Draft'}
                    </div>
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 flex items-center gap-1">
                      <ShieldCheck size={10} />
                      Mock Board
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingExam(exam);
                        setFormData({
                          title: exam.title,
                          duration_minutes: exam.duration_minutes,
                          total_items: exam.total_items,
                          randomize_questions: exam.randomize_questions || false
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Edit Settings"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => navigate(`/staff/mock-exams/${exam.id}`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Edit Questions"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Exam"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 flex-grow">{exam.title}</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Clock size={16} className="text-slate-400" />
                    <span>{exam.duration_minutes} Minutes</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <ListChecks size={16} className="text-slate-400" />
                    <span className={(exam.completed_count || 0) !== exam.total_items ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                      {exam.completed_count || 0} / {exam.total_items} Questions
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <button 
                    onClick={() => togglePublish(exam)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${exam.is_published ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100'}`}
                  >
                    {exam.is_published ? 'Unpublish' : 'Publish Now'}
                  </button>
                  <button 
                    onClick={() => navigate(`/staff/mock-exams/${exam.id}`)}
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    Builder <ExternalLink size={14} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{editingExam ? 'Edit Exam Settings' : 'New Mock Board Exam'}</h2>
            <form onSubmit={handleCreateExam} className="space-y-5">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
                  <ShieldCheck size={18} />
                  <span>Official Mock Board Format</span>
                </div>
                <p className="text-xs text-indigo-500 font-medium">
                  This exam is automatically configured with 600 questions and a 600-minute time limit.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Exam Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Full Mockboard Simulation A"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Duration (Min)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-700"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Items</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-700"
                    value={formData.total_items}
                    onChange={e => setFormData({...formData, total_items: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Randomize Questions</label>
                    <p className="text-[10px] text-slate-500">Enable to shuffle questions for each student.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, randomize_questions: !formData.randomize_questions })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.randomize_questions ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      animate={{ x: formData.randomize_questions ? 26 : 2 }}
                      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExam(null);
                    setFormData({ title: '', duration_minutes: 600, total_items: 600, randomize_questions: false });
                  }}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (editingExam ? 'Save Changes' : 'Create & Build')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Warning Modal */}
      {warningModal?.isOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Incomplete Exam</h2>
            <p className="text-slate-500 mb-8">
              The exam <span className="font-bold text-slate-700">"{warningModal.examTitle}"</span> cannot be published yet. 
              It requires at least <span className="font-bold text-indigo-600">1 question</span> to be published, but currently has <span className="font-bold text-rose-500">{warningModal.currentCount}</span>.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const exam = exams.find(e => e.title === warningModal.examTitle);
                  if (exam) navigate(`/staff/mock-exams/${exam.id}`);
                  setWarningModal(null);
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Go to Builder
                <ExternalLink size={18} />
              </button>
              <button 
                onClick={() => setWarningModal(null)}
                className="w-full py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockExamsPage;
