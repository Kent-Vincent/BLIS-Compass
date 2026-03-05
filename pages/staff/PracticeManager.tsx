
import React, { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { PracticeSubject, PracticeQuestion } from '../../types';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';

const PracticeManager: React.FC = () => {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<number>(1);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<PracticeQuestion> | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !profile) return;

    setModalLoading(true);
    try {
      const payload = {
        ...editingQuestion,
        subject_id: editingQuestion.subject_id || selectedSubject,
        part: editingQuestion.part || selectedPart,
        created_by: profile.id,
        updated_at: new Date().toISOString()
      };

      if (editingQuestion.id) {
        const { error } = await supabase
          .from('practice_questions')
          .update(payload)
          .eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('practice_questions')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Failed to save question. Please check all fields.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('practice_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const openAddModal = () => {
    setEditingQuestion({
      subject_id: selectedSubject,
      part: selectedPart,
      question: '',
      choice_a: '',
      choice_b: '',
      choice_c: '',
      choice_d: '',
      correct_answer: 'a',
      explanation: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (q: PracticeQuestion) => {
    setEditingQuestion(q);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Practice Sets Manager</h2>
          <p className="text-slate-500">Create and manage practice questions for each subject and part.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4 border-white/60">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Subject</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Part</label>
            <select 
              value={selectedPart}
              onChange={(e) => setSelectedPart(parseInt(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
            >
              {[1, 2, 3, 4, 5].map(p => (
                <option key={p} value={p}>Part {p}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-600">No questions found</h3>
            <p className="text-slate-400">Start by adding a new question to this part.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <GlassCard key={q.id} className="p-6 border-white/60 hover:border-blue-200 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-50 text-blue-600 text-xs font-black px-2 py-1 rounded-md uppercase">Q{questions.length - idx}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Correct: <span className="text-emerald-600">{q.correct_answer.toUpperCase()}</span>
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 leading-relaxed">{q.question}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {['a', 'b', 'c', 'd'].map(key => (
                      <div key={key} className={`p-3 rounded-xl border flex items-center gap-3 ${
                        q.correct_answer === key ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'
                      }`}>
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                          q.correct_answer === key ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {key.toUpperCase()}
                        </span>
                        {q[`choice_${key}` as keyof PracticeQuestion]}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => openEditModal(q)}
                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingQuestion?.id ? 'Edit Question' : 'Add New Question'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                  <textarea 
                    required
                    rows={3}
                    value={editingQuestion?.question || ''}
                    onChange={(e) => setEditingQuestion({...editingQuestion!, question: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="Enter the question here..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['a', 'b', 'c', 'd'].map(key => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Choice {key.toUpperCase()}</label>
                      <input 
                        required
                        type="text"
                        value={editingQuestion?.[`choice_${key}` as keyof PracticeQuestion] as string || ''}
                        onChange={(e) => setEditingQuestion({...editingQuestion!, [`choice_${key}`]: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        placeholder={`Option ${key.toUpperCase()}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Correct Answer</label>
                    <select 
                      required
                      value={editingQuestion?.correct_answer || 'a'}
                      onChange={(e) => setEditingQuestion({...editingQuestion!, correct_answer: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    >
                      <option value="a">Choice A</option>
                      <option value="b">Choice B</option>
                      <option value="c">Choice C</option>
                      <option value="d">Choice D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Re-assign Part</label>
                    <select 
                      required
                      value={editingQuestion?.part || selectedPart}
                      onChange={(e) => setEditingQuestion({...editingQuestion!, part: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    >
                      {[1, 2, 3, 4, 5].map(p => (
                        <option key={p} value={p}>Part {p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Explanation (Optional)</label>
                  <textarea 
                    rows={2}
                    value={editingQuestion?.explanation || ''}
                    onChange={(e) => setEditingQuestion({...editingQuestion!, explanation: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="Explain why the answer is correct..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Question
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PracticeManager;
