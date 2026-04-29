
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Loader2, 
  BookOpen, 
  ChevronRight,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { PracticeSubject, PracticeQuestion } from '../../types';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';

const Toast: React.FC<{ message: string; visible: boolean; type?: 'success' | 'error' | 'delete'; onClose: () => void }> = ({ message, visible, type = 'success', onClose }) => {
  const getColors = () => {
    switch(type) {
      case 'delete': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-emerald-500';
    }
  };

  const Icon = type === 'delete' ? Trash2 : (type === 'error' ? AlertCircle : CheckCircle2);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 20, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={`fixed top-0 left-1/2 z-[10000] min-w-[320px] ${getColors()} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4`}
        >
          <div className="bg-white/20 p-2 rounded-xl">
            <Icon size={24} />
          </div>
          <p className="font-bold flex-grow">{message}</p>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-all">
            <X size={20} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface DeleteModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({ visible, onConfirm, onCancel }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 p-8 text-center"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Remove Question?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const PracticeManager: React.FC = () => {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<number>(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Editor state
  const [editingData, setEditingData] = useState<Partial<PracticeQuestion> | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNavigator, setShowNavigator] = useState(true);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined);
  
  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'delete'>('success');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSubjects();
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToastNotification = (message: string, type: 'success' | 'error' | 'delete') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 4000);
  };

  useEffect(() => {
    if (selectedSubject) {
      fetchQuestions();
    }
  }, [selectedSubject, selectedPart]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_subjects')
        .select('*')
        .order('name');
      if (error) throw error;
      setSubjects(data || []);
      if (data && data.length > 0) {
        setSelectedSubject(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('subject_id', selectedSubject)
        .eq('part', selectedPart)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setQuestions(data || []);
      if (data && data.length > 0) {
        setSelectedIndex(0);
        setEditingData(data[0]);
      } else {
        setSelectedIndex(null);
        setEditingData(null);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (index: number) => {
    setSelectedIndex(index);
    setEditingData(questions[index]);
  };

  const handleUpdateEditingData = (updates: Partial<PracticeQuestion>) => {
    if (!editingData) return;
    setEditingData({ ...editingData, ...updates });
  };

  const handleSave = async () => {
    if (!editingData || !profile) {
      showToastNotification('User profile not loaded or invalid data.', 'error');
      return;
    }

    setSaving(true);
    try {
      const { id, created_at, updated_at, ...rest } = editingData as any;
      const dataToSave = {
        ...rest,
        subject_id: selectedSubject,
        part: selectedPart,
        created_by: profile.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (id) {
        result = await supabase
          .from('practice_questions')
          .update(dataToSave)
          .eq('id', id);
      } else {
        result = await supabase
          .from('practice_questions')
          .insert([dataToSave])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      showToastNotification(
        id ? 'Question updated successfully!' : 'Question created successfully!',
        'success'
      );
      
      // Refresh list
      await fetchQuestions();
      
      // If it was a new question, the fetchQuestions will select the first one.
      // If we want to select the one we just saved, we'd need to find its index.
      // But fetchQuestions resets everything for simplicity now.
    } catch (err: any) {
      console.error('Save error:', err);
      showToastNotification(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const id = deletingId;
    setShowDeleteModal(false);
    setDeletingId(undefined);

    if (!id) {
      // Handle draft question removal (unsaved)
      if (selectedIndex === null) return;
      
      const indexToRemove = selectedIndex;
      const updatedQuestions = questions.filter((_, idx) => idx !== indexToRemove);
      
      setQuestions(updatedQuestions);
      
      if (updatedQuestions.length > 0) {
        const newIndex = Math.min(indexToRemove, updatedQuestions.length - 1);
        setSelectedIndex(newIndex);
        setEditingData(updatedQuestions[newIndex]);
      } else {
        setSelectedIndex(null);
        setEditingData(null);
      }
      showToastNotification('Draft question removed', 'delete');
      return;
    }

    try {
      const { error } = await supabase
        .from('practice_questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToastNotification('Question deleted successfully', 'delete');
      await fetchQuestions();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToastNotification(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleDelete = (id?: string) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const addNewQuestion = () => {
    if (questions.length >= 20) {
      showToastNotification('Maximum limit of 20 questions reached for this part.', 'error');
      return;
    }

    const newQ: Partial<PracticeQuestion> = {
      subject_id: selectedSubject,
      part: selectedPart,
      question: '',
      choice_a: '',
      choice_b: '',
      choice_c: '',
      choice_d: '',
      correct_answer: 'a',
      explanation: ''
    };
    
    // UI hack: Add it to the local questions list so it appears in sidebar
    setQuestions([...questions, newQ as PracticeQuestion]);
    setSelectedIndex(questions.length);
    setEditingData(newQ);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div id="practice-manager-header" className="flex justify-between items-center bg-white border-b border-slate-200 px-8 py-4 z-20 [@media(max-height:850px)]:py-2 [@media(max-height:850px)]:px-6">
        <div id="header-title-container" className="flex items-center gap-4">
          <div className="hidden md:block">
            <h1 id="page-title" className="text-xl font-bold text-slate-800 [@media(max-height:850px)]:text-lg">Practice Sets Manager</h1>
            <p id="page-subtitle" className="text-xs font-bold text-slate-400 uppercase tracking-widest [@media(max-height:850px)]:text-[10px]">
              Subject: {subjects.find(s => s.id === selectedSubject)?.name || 'None'} • Part {selectedPart} • <span id="question-counter" className={questions.length >= 20 ? 'text-red-500' : 'text-blue-500'}>{questions.length}/20 Questions</span>
            </p>
          </div>
        </div>
        
        <div id="header-actions" className="flex items-center gap-4">
          <div id="filters-container" className="flex items-center gap-4 mr-4 [@media(max-height:850px)]:mr-2 [@media(max-height:850px)]:gap-2">
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Subject</label>
               <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-10 md:h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer hover:bg-white transition-all min-w-[180px] md:min-w-[220px] [@media(max-height:850px)]:h-9 [@media(max-height:850px)]:text-xs [@media(max-height:850px)]:rounded-xl"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
             </div>
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Part</label>
               <select 
                value={selectedPart}
                onChange={(e) => setSelectedPart(parseInt(e.target.value))}
                className="h-10 md:h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 cursor-pointer hover:bg-white transition-all [@media(max-height:850px)]:h-9 [@media(max-height:850px)]:text-xs [@media(max-height:850px)]:rounded-xl"
              >
                {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Part {p}</option>)}
              </select>
             </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black text-transparent select-none uppercase tracking-widest ml-1 mb-1">Action</label>
            <button 
              id="add-question-btn"
              onClick={addNewQuestion}
              disabled={questions.length >= 20}
              className="h-10 md:h-12 px-6 bg-white text-blue-600 border border-blue-100 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm [@media(max-height:850px)]:h-9 [@media(max-height:850px)]:text-xs [@media(max-height:850px)]:px-4 [@media(max-height:850px)]:rounded-xl"
            >
              <Plus size={18} />
              <span className="hidden lg:inline">Add Question</span>
            </button>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-transparent select-none uppercase tracking-widest ml-1 mb-1">Action</label>
            <button 
              id="save-changes-btn"
              onClick={handleSave}
              disabled={saving || !editingData}
              className="h-10 md:h-12 px-6 md:px-8 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 text-sm md:text-base [@media(max-height:850px)]:h-9 [@media(max-height:850px)]:text-sm [@media(max-height:850px)]:px-6 [@media(max-height:850px)]:rounded-xl"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toast Notification */}
        <Toast 
          visible={showToast} 
          message={toastMessage} 
          type={toastType}
          onClose={() => setShowToast(false)} 
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          visible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingId(undefined);
          }}
        />

        {/* Sidebar Navigator */}
        <AnimatePresence initial={false}>
          {showNavigator && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-slate-100 flex items-center justify-between [@media(max-height:850px)]:p-1.5">
                <h3 className="font-bold text-slate-800 text-[12px] uppercase tracking-widest px-1">Question List</h3>
                <button 
                  onClick={() => setShowNavigator(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  title="Hide List"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar [@media(max-height:850px)]:p-2">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs font-bold text-slate-400">No questions yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {questions.map((q, idx) => {
                      const isSelected = selectedIndex === idx;
                      const isNew = !q.id;
                      
                      return (
                        <button
                          key={q.id || `new-${idx}`}
                          onClick={() => handleSelectQuestion(idx)}
                          className={`aspect-square rounded-2xl transition-all flex items-center justify-center border font-bold text-base relative ${
                            isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-10 box-content' : ''
                          } ${
                            isNew 
                              ? isSelected ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-md' : 'bg-blue-50 border-blue-200 text-blue-400'
                              : isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          {idx + 1}
                          {isNew && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12 custom-scrollbar [@media(max-height:850px)]:p-4 lg:flex lg:flex-col lg:items-center">
          <div className="w-full max-w-[1280px] transition-all duration-300">
            {!showNavigator && (
              <button 
                onClick={() => setShowNavigator(true)}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-2xl transition-all mb-6 bg-white border border-blue-100 shadow-sm"
              >
                <ChevronRight size={18} />
                Show Question List
              </button>
            )}

            {editingData ? (
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 [@media(max-height:850px)]:space-y-2 pb-8 [@media(max-height:850px)]:pb-2"
              >
                <GlassCard className="p-6 md:p-10 border-slate-200 shadow-xl shadow-slate-200/50 [@media(max-height:850px)]:p-6">
                  <div className="flex justify-between items-start mb-8 [@media(max-height:850px)]:mb-4">
                    <div className="flex items-center gap-6 [@media(max-height:850px)]:gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl md:text-3xl shadow-lg [@media(max-height:850px)]:w-10 [@media(max-height:850px)]:h-10 [@media(max-height:850px)]:text-lg">
                        {(selectedIndex || 0) + 1}
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 [@media(max-height:850px)]:text-lg">Question Editor</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest [@media(max-height:850px)]:text-[10px]">
                          {editingData.id ? `Question #${(selectedIndex || 0) + 1}` : 'Draft Question'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(editingData.id)}
                      className="h-9 px-4 text-red-100 bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-100 flex items-center gap-2 text-xs font-bold [@media(max-height:850px)]:h-6 [@media(max-height:850px)]:px-3"
                      title="Remove Question"
                    >
                      <Trash2 size={16} className="[@media(max-height:850px)]:w-3.5" />
                      <span className="hidden sm:inline">Delete Question</span>
                    </button>
                  </div>

                  <div className="space-y-4 [@media(max-height:850px)]:space-y-1.5">
                    <div className="space-y-1.5 [@media(max-height:850px)]:space-y-0.5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 [@media(max-height:850px)]:text-[10px]">Question Content</label>
                      <textarea
                        value={editingData.question || ''}
                        onChange={(e) => handleUpdateEditingData({ question: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 text-sm md:text-xl text-slate-700 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed [@media(max-height:850px)]:py-2 [@media(max-height:850px)]:px-4 [@media(max-height:850px)]:text-sm [@media(max-height:850px)]:rounded-xl [@media(max-height:850px)]:h-[80px]"
                        placeholder="Type your question here..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 [@media(max-height:850px)]:gap-1.5">
                      {(['a', 'b', 'c', 'd'] as const).map((key) => (
                        <div key={key} className="space-y-2 relative group [@media(max-height:850px)]:space-y-1">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 [@media(max-height:850px)]:text-[10px]">Choice {key.toUpperCase()}</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-400 group-focus-within:bg-blue-100 group-focus-within:text-blue-600 transition-colors uppercase [@media(max-height:850px)]:w-7 [@media(max-height:850px)]:h-7 [@media(max-height:850px)]:left-3 [@media(max-height:850px)]:text-xs">
                              {key}
                            </span>
                            <input
                              type="text"
                              value={editingData[`choice_${key}`] || ''}
                              onChange={(e) => handleUpdateEditingData({ [`choice_${key}`]: e.target.value })}
                              className="h-14 md:h-16 w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-36 text-sm md:text-base text-slate-700 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all [@media(max-height:850px)]:h-10 [@media(max-height:850px)]:pl-14 [@media(max-height:850px)]:pr-32 [@media(max-height:850px)]:text-sm [@media(max-height:850px)]:rounded-xl"
                              placeholder={`Option ${key.toUpperCase()}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateEditingData({ correct_answer: key })}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 h-8 md:h-10 px-4 rounded-xl text-[10px] md:text-xs font-bold transition-all flex items-center gap-2 [@media(max-height:850px)]:h-6 [@media(max-height:850px)]:px-1.5 [@media(max-height:850px)]:right-1 [@media(max-height:850px)]:text-[9px] ${
                                editingData.correct_answer === key
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                  : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-300 hover:text-emerald-500 shadow-sm'
                              }`}
                            >
                              {editingData.correct_answer === key && <CheckCircle2 size={14} className="[@media(max-height:850px)]:w-2.5" />}
                              {editingData.correct_answer === key ? 'Correct' : 'Mark'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 [@media(max-height:850px)]:space-y-1.5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 [@media(max-height:850px)]:text-[10px]">Explanation (Optional)</label>
                      <textarea
                        value={editingData.explanation || ''}
                        onChange={(e) => handleUpdateEditingData({ explanation: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm md:text-lg text-slate-700 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none [@media(max-height:850px)]:py-2 [@media(max-height:850px)]:px-4 [@media(max-height:850px)]:text-sm [@media(max-height:850px)]:rounded-xl [@media(max-height:850px)]:h-[60px]"
                        placeholder="Explain why the answer is correct..."
                      />
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-slate-100 [@media(max-height:850px)]:pt-3 [@media(max-height:850px)]:mt-0">
                      <button
                        onClick={() => handleSelectQuestion(selectedIndex! - 1)}
                        disabled={selectedIndex === 0}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm md:text-base text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all [@media(max-height:850px)]:px-4 [@media(max-height:850px)]:py-1.5 [@media(max-height:850px)]:rounded-xl [@media(max-height:850px)]:text-xs"
                      >
                        <ChevronLeft size={20} className="[@media(max-height:850px)]:w-4" />
                        Previous
                      </button>

                      <div className="flex items-center gap-2 md:gap-4">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest [@media(max-height:850px)]:text-[9px]">
                          Q{(selectedIndex || 0) + 1} / {questions.length}
                        </span>
                        <button
                          onClick={() => {
                            if (selectedIndex! < questions.length - 1) {
                              handleSelectQuestion(selectedIndex! + 1);
                            } else {
                              addNewQuestion();
                            }
                          }}
                          className="flex items-center gap-2 h-12 md:h-16 px-6 md:px-10 bg-slate-900 text-white rounded-2xl font-bold text-sm md:text-lg hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] [@media(max-height:850px)]:h-10 [@media(max-height:850px)]:px-6 [@media(max-height:850px)]:text-sm [@media(max-height:850px)]:rounded-xl"
                        >
                          {selectedIndex === questions.length - 1 ? (
                            <>
                              <Plus size={20} className="[@media(max-height:850px)]:w-4" />
                              Add Next
                            </>
                          ) : (
                            <>
                              Next Question
                              <ChevronRight size={24} className="text-slate-400 [@media(max-height:850px)]:w-5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20 px-8">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                  <BookOpen size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No question selected</h3>
                <p className="text-slate-400 max-w-xs mx-auto mb-8 leading-relaxed">
                  Select a question from the list to edit its content or create a new one.
                </p>
                <button 
                  onClick={addNewQuestion}
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-3"
                >
                  <Plus size={24} />
                  Add First Question
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeManager;
