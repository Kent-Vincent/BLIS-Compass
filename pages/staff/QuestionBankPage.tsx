
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
  ChevronLeft,
  Database,
  Grid,
  List as ListIcon,
  Tag,
  CheckCircle2,
  X,
  AlertCircle,
  MoreVertical,
  Download,
  Upload,
  Layers,
  ArrowRight,
  Save
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { PracticeSubject, PracticeQuestion, MockExamItem } from '../../types';
import GlassCard from '../../components/GlassCard';
import { createPortal } from 'react-dom';

const QuestionBankPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'practice' | 'exam'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterSubject, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [filterType, filterSubject, searchQuery, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: subData } = await supabase.from('practice_subjects').select('*');
      setSubjects(subData || []);

      let pCount = 0;
      let eCount = 0;

      // 1. Fetch Counts
      if (filterType === 'all' || filterType === 'practice') {
        let query = supabase.from('practice_questions').select('*', { count: 'exact', head: true }).neq('question', '');
        if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
        if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
        const { count } = await query;
        pCount = count || 0;
      }

      if (filterType === 'all' || filterType === 'exam') {
        let query = supabase.from('mock_exam_items').select('*', { count: 'exact', head: true }).neq('question', '');
        if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
        if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
        const { count } = await query;
        eCount = count || 0;
      }

      setPracticeCount(pCount);
      setExamCount(eCount);
      const total = pCount + eCount;
      setTotalCount(total);

      // 2. Fetch Data with Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let allQuestions: any[] = [];

      if (filterType === 'practice') {
        let query = supabase.from('practice_questions').select('*').neq('question', '');
        if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
        if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
        const { data } = await query.order('created_at', { ascending: false }).range(from, to);
        allQuestions = (data || []).map(q => ({ ...q, type: 'practice' }));
      } else if (filterType === 'exam') {
        let query = supabase.from('mock_exam_items').select('*').neq('question', '');
        if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
        if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
        const { data } = await query.order('created_at', { ascending: false }).range(from, to);
        allQuestions = (data || []).map(q => ({ ...q, type: 'exam' }));
      } else {
        // "all" type logic: combine ranges
        let pData: any[] = [];
        let eData: any[] = [];

        // Determine how many practice questions to skip and how many to take
        if (from < pCount) {
          const pTo = Math.min(to, pCount - 1);
          let query = supabase.from('practice_questions').select('*').neq('question', '');
          if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
          if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
          const { data } = await query.order('created_at', { ascending: false }).range(from, pTo);
          pData = (data || []).map(q => ({ ...q, type: 'practice' }));
        }

        // Determine how many exam questions to skip and how many to take
        const eFrom = Math.max(0, from - pCount);
        const eTo = Math.max(-1, to - pCount);
        
        if (eTo >= 0 && eFrom <= eCount - 1) {
          let query = supabase.from('mock_exam_items').select('*').neq('question', '');
          if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
          if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
          const { data } = await query.order('created_at', { ascending: false }).range(eFrom, eTo);
          eData = (data || []).map(q => ({ ...q, type: 'exam' }));
        }

        allQuestions = [...pData, ...eData];
      }

      setQuestions(allQuestions);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    setSaving(true);
    try {
      const { type, ...rest } = editingQuestion;
      const table = type === 'practice' ? 'practice_questions' : 'mock_exam_items';
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dataToSave: any = {
        ...rest
      };

      if (type === 'practice') {
        dataToSave.updated_at = new Date().toISOString();
        if (!dataToSave.id) {
          dataToSave.created_by = user.id;
        }
      } else {
        // Exam items don't have updated_at or created_by in schema
        // Ensure they have exam_id if new? But normally we only edit existing ones here.
        if (!dataToSave.id && !dataToSave.exam_id) {
          throw new Error("Exam ID is required for new Exam questions. Please add questions through the Exam Builder.");
        }
      }
      
      let result;
      if (dataToSave.id) {
        // Remove fields that shouldn't be updated or cause errors
        const { created_at, updated_at, ...updateData } = dataToSave;
        if (type === 'practice') {
          updateData.updated_at = new Date().toISOString();
        }
        result = await supabase.from(table).update(updateData).eq('id', dataToSave.id);
      } else {
        result = await supabase.from(table).insert([dataToSave]);
      }

      if (result.error) throw result.error;

      setIsEditorOpen(false);
      setEditingQuestion(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: any) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const table = q.type === 'practice' ? 'practice_questions' : 'mock_exam_items';
      const { error } = await supabase.from(table).delete().eq('id', q.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question');
    }
  };

  const openEditor = (q: any = null) => {
    if (q) {
      setEditingQuestion({ ...q });
    } else {
      setEditingQuestion({
        type: 'practice',
        subject_id: subjects[0]?.id || '',
        question: '',
        choice_a: '',
        choice_b: '',
        choice_c: '',
        choice_d: '',
        correct_answer: 'a',
        explanation: '',
        part: 1
      });
    }
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Database className="text-indigo-600" />
            Question Bank
          </h1>
          <p className="text-slate-500 mt-1">Manage all practice and examination questions in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
            <Upload size={16} />
            Import
          </button>
          <button 
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

      <GlassCard className="p-4 border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search questions by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              All Types
            </button>
            <button 
              onClick={() => setFilterType('practice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'practice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Practice
            </button>
            <button 
              onClick={() => setFilterType('exam')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'exam' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Exams
            </button>
          </div>
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 border-l border-slate-200 pl-4 ml-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <p className="text-slate-500 font-medium">Indexing question repository...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">No questions found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">
                {totalCount} total questions
              </span>
              <span className="text-xs text-slate-400">
                (Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount)})
              </span>
            </div>
          </div>
          
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
            {questions.map((q, i) => (
              <motion.div
                key={`${q.type}-${q.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <GlassCard className="p-5 hover:border-indigo-200 hover:shadow-lg transition-all group border-slate-200 bg-white">
                  {/* Fixed Card Header Labeling */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 mr-1">
                        {((currentPage - 1) * pageSize) + i + 1}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        q.type === 'practice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {q.type}
                      </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
                      {subjects.find(s => s.id === q.subject_id)?.name || 'General'}
                    </span>
                    {q.type === 'practice' && q.part && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
                        Part {q.part}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditor(q)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(q)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h4 className="text-slate-800 font-bold mb-4 line-clamp-3 leading-relaxed text-sm">
                  {q.question || <span className="text-slate-300 italic font-medium">Empty question content</span>}
                </h4>

                <div className="space-y-2 mb-6">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const choiceText = q[`choice_${opt}`];
                    return (
                      <div key={opt} className={`flex items-center gap-3 p-2 rounded-lg text-[10px] ${q.correct_answer === opt ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-transparent'}`}>
                        <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${q.correct_answer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 font-black'}`}>
                          {opt.toUpperCase()}
                        </span>
                        <span className={`line-clamp-1 ${!choiceText ? 'text-slate-300 italic' : ''}`}>
                          {choiceText || `Choice ${opt.toUpperCase()} not set`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1.5">
                    <Tag size={12} />
                    ID: {q.id.slice(0, 8)}...
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                       <span className="text-[8px] font-black text-slate-300 uppercase">Created</span>
                       <span className="text-[10px] font-bold text-slate-400">
                        {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500">
            Page <span className="text-slate-800">{currentPage}</span> of <span className="text-slate-800">{Math.ceil(totalCount / pageSize)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                const pageNum = i + 1;
                // Basic logic to show pages around current if needed, but let's keep it simple for now
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {Math.ceil(totalCount / pageSize) > 5 && <span className="px-2 text-slate-400">...</span>}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </>
    )}

      {/* Question Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && editingQuestion && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-20"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {editingQuestion.id ? 'Edit Question' : 'Add New Question'}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      {editingQuestion.id ? `Database Entry: ${editingQuestion.id}` : 'Create a fresh entry in the bank'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Context & Placement</label>
                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                           <span className="text-[9px] font-bold text-slate-400 ml-1">Source Type</span>
                           <select 
                            value={editingQuestion.type}
                            onChange={(e) => setEditingQuestion({...editingQuestion, type: e.target.value as any})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          >
                            <option value="practice">Practice Set</option>
                            <option value="exam">Official Exam Content</option>
                          </select>
                         </div>
                         <div className="space-y-1">
                           <span className="text-[9px] font-bold text-slate-400 ml-1">Subject Area</span>
                           <select 
                            value={editingQuestion.subject_id}
                            onChange={(e) => setEditingQuestion({...editingQuestion, subject_id: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          >
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                         </div>
                       </div>
                    </div>

                    {editingQuestion.type === 'practice' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Practice Part</label>
                        <select 
                          value={editingQuestion.part}
                          onChange={(e) => setEditingQuestion({...editingQuestion, part: parseInt(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Part {p}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Content</label>
                       <textarea 
                        value={editingQuestion.question}
                        onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                        rows={6}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
                        placeholder="Define the problem or question..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choices & Correct Answer</label>
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <div key={opt} className="relative group/opt">
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl transition-all ${editingQuestion.correct_answer === opt ? 'bg-emerald-500' : 'bg-slate-100 group-hover/opt:bg-slate-200'}`} />
                          <div className="flex items-center gap-3 pl-4">
                            <span className={`w-10 h-11 rounded-xl flex items-center justify-center font-black text-sm uppercase transition-all ${editingQuestion.correct_answer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {opt}
                            </span>
                            <div className="flex-1 relative">
                              <input 
                                type="text"
                                value={editingQuestion[`choice_${opt}`]}
                                onChange={(e) => setEditingQuestion({...editingQuestion, [`choice_${opt}`]: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-11 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder={`Label for option ${opt.toUpperCase()}...`}
                              />
                              <button 
                                onClick={() => setEditingQuestion({...editingQuestion, correct_answer: opt})}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                  editingQuestion.correct_answer === opt
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-slate-400 border border-slate-100 hover:text-emerald-500 hover:border-emerald-200 shadow-sm'
                                }`}
                              >
                                Correct
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rationale / Explanation</label>
                       <textarea 
                        value={editingQuestion.explanation || ''}
                        onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
                        placeholder="Explain the logic behind the correct answer..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <AlertCircle size={16} />
                  Validation passed
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsEditorOpen(false)}
                    className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:text-slate-800 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {editingQuestion.id ? 'Update Question' : 'Seal in Bank'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionBankPage;
