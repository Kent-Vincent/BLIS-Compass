
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
  Save,
  FileText,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import { supabase } from '../../src/lib/supabase';
import { PracticeSubject, PracticeQuestion, MockExamItem, MockExam } from '../../types';
import GlassCard from '../../components/GlassCard';
import { createPortal } from 'react-dom';

const ModalPortal = ({ 
  children, 
  onClose, 
  className = "w-full max-w-lg" 
}: { 
  children: React.ReactNode; 
  onClose: () => void; 
  className?: string 
}) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen z-[2147483647] isolate flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-0 bg-slate-900/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative z-10 bg-white shadow-2xl rounded-[2rem] overflow-hidden ${className}`}
      >
        {children}
      </motion.div>
    </div>,
    document.body
  );
};

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
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importResults, setImportResults] = useState<{success: number, total: number} | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [importSetup, setImportSetup] = useState<{
    type: 'practice' | 'exam';
    subject_id: string;
    part: number;
  } | null>({
    type: 'practice',
    subject_id: '',
    part: 1
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, item: any | null }>({
    open: false,
    item: null
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [exams, setExams] = useState<MockExam[]>([]);
  
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

      const { data: examData } = await supabase.from('mock_exams').select('*').order('created_at', { ascending: false });
      setExams(examData || []);

      const { data: sessionData } = await supabase.from('mock_exam_items').select('subject_id').limit(1); // Not very useful, I need sessions from mock_exam_items unique combinations or another table
      // Actually, I should probably fetch distinct subject_ids and exam_ids from mock_exam_items to help with selection
      // But better yet, I should have a 'mock_exam_sessions' table if it exists.
      // Based on previous contexts, there might be a mock_exam_sessions table.

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

  const handleImportClick = (type: 'practice' | 'exam') => {
    setImportSetup(prev => ({
      ...prev,
      type,
      subject_id: prev.subject_id || subjects[0]?.id || '',
    }));
  };

  const startFileUpload = () => {
    if (!importSetup?.subject_id) {
      alert('Please select a subject area first.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importSetup) return;

    setImporting(true);
    setImportResults(null);
    
    try {
      let parsedData: any[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        parsedData = result.data;
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        
        const div = document.createElement('div');
        div.innerHTML = value;
        const paragraphs = div.querySelectorAll('p');
        
        let current: any = null;
        paragraphs.forEach(p => {
          const text = p.innerText.trim();
          if (!text) return;

          const qMatch = text.match(/^(\d+)[\.\)]\s*(.*)/i);
          if (qMatch) {
            if (current) parsedData.push(current);
            current = { 
              question: qMatch[2], 
              choice_a: '', choice_b: '', choice_c: '', choice_d: '', 
              correct_answer: 'a'
            };
          } else if (current) {
            const optMatch = text.match(/^([a-d])[\.\)]\s*(.*)/i);
            if (optMatch) {
              current[`choice_${optMatch[1].toLowerCase()}`] = optMatch[2];
            } else if (text.toLowerCase().includes('answer:')) {
              const ans = text.toLowerCase().split('answer:')[1].trim()[0];
              if (['a','b','c','d'].includes(ans)) current.correct_answer = ans;
            }
          }
        });
        if (current) parsedData.push(current);
      }

      if (parsedData.length === 0) {
        throw new Error('No valid questions found in file.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let successCount = 0;
      const table = importSetup.type === 'practice' ? 'practice_questions' : 'mock_exam_items';

      for (const q of parsedData) {
        if (!q.question) continue;
        
        const dataToInsert: any = {
          subject_id: importSetup.subject_id,
          question: q.question,
          choice_a: q.choice_a || q.choice_A || '',
          choice_b: q.choice_b || q.choice_B || '',
          choice_c: q.choice_c || q.choice_C || '',
          choice_d: q.choice_d || q.choice_D || '',
          correct_answer: (q.correct_answer || 'a').toLowerCase(),
          explanation: q.explanation || ''
        };

        if (importSetup.type === 'practice') {
          dataToInsert.created_by = user.id;
          dataToInsert.part = importSetup.part || 1;
        } else {
          // If no specific exam targeted, use the latest one as default container provider
          dataToInsert.exam_id = exams[0]?.id;
        }

        const { error } = await supabase.from(table).insert([dataToInsert]);
        if (!error) successCount++;
        else console.error('Error inserting row:', error);
      }

      setImportResults({ success: successCount, total: parsedData.length });
      setImportSetup(null);
      fetchData();
    } catch (err) {
      console.error('Import failed:', err);
      alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse([{
      question: "Sample Question Text",
      choice_a: "Option A",
      choice_b: "Option B",
      choice_c: "Option C",
      choice_d: "Option D",
      correct_answer: "a",
      explanation: "Why A is correct",
      part: "1"
    }]);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = async () => {
    if (!editingQuestion) return;

    if (!editingQuestion.question || !editingQuestion.choice_a || !editingQuestion.choice_b || !editingQuestion.choice_c || !editingQuestion.choice_d) {
      alert('Please fill out the question and all choices.');
      return;
    }

    setSaving(true);
    try {
      const { type, ...rest } = editingQuestion;
      const table = type === 'practice' ? 'practice_questions' : 'mock_exam_items';
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare data for save
      const dataToSave = { ...rest };
      
      // Remove any helper fields or fields that cause errors
      const fieldsToRemove = ['type', 'created_at'];
      fieldsToRemove.forEach(f => delete (dataToSave as any)[f]);

      if (type === 'practice') {
        (dataToSave as any).updated_at = new Date().toISOString();
        if (!dataToSave.id) {
          (dataToSave as any).created_by = user.id;
        }
      } else {
        if (!dataToSave.id && !dataToSave.exam_id) {
          // Use default exam if creating new exam question from bank
          if (exams.length > 0) {
            (dataToSave as any).exam_id = exams[0].id;
          } else {
            throw new Error("No Mock Exams found to host this question. Please create an Exam first.");
          }
        }
      }
      
      let result;
      if (dataToSave.id) {
        const { id, ...updateData } = dataToSave;
        result = await supabase.from(table).update(updateData).eq('id', id);
      } else {
        result = await supabase.from(table).insert([dataToSave]);
      }

      if (result.error) throw result.error;

      setIsEditorOpen(false);
      setEditingQuestion(null);
      await fetchData();
    } catch (err) {
      console.error('Error saving question:', err);
      alert(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: any) => {
    setDeleteConfirm({
      open: true,
      item
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirm.item) return;
    setSaving(true);
    try {
      const q = deleteConfirm.item;
      const table = q.type === 'practice' ? 'practice_questions' : 'mock_exam_items';
      const { error } = await supabase.from(table).delete().eq('id', q.id);
      
      if (error) throw error;

      setDeleteConfirm({ open: false, item: null });
      await fetchData();
    } catch (err) {
      console.error('Error deleting:', err);
      alert(err instanceof Error ? `Delete failed: ${err.message}` : 'Failed to delete question');
    } finally {
      setSaving(false);
    }
  };

  const openTypeSelector = () => {
    setShowTypeSelector(true);
  };

  const startNewQuestion = (type: 'practice' | 'exam') => {
    setShowTypeSelector(false);
    setEditingQuestion({
      type,
      subject_id: subjects[0]?.id || '',
      exam_id: '',
      question: '',
      choice_a: '',
      choice_b: '',
      choice_c: '',
      choice_d: '',
      correct_answer: 'a',
      explanation: '',
      part: 1
    });
    setIsEditorOpen(true);
  };

  const openEditorForEdit = (q: any) => {
    setEditingQuestion({ ...q });
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
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.docx"
            className="hidden"
          />
          <button 
            onClick={() => setShowImportDialog(true)}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Import
          </button>
          <button 
            onClick={openTypeSelector}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

      <AnimatePresence>
        {importResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="p-4 bg-emerald-50 border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Successfully Imported!</p>
                  <p className="text-xs text-emerald-600 font-medium">
                    {importResults.success} out of {importResults.total} questions were added to the bank.
                  </p>
                </div>
              </div>
              <button onClick={() => setImportResults(null)} className="p-2 text-emerald-400 hover:text-emerald-600 rounded-lg">
                <X size={18} />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

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
            {questions.map((q, i) => {
              return (
              <motion.div
                key={`${q.type}-${q.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <GlassCard 
                  className="p-5 hover:border-indigo-200 hover:shadow-lg transition-all group border-slate-200 bg-white relative"
                >
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
                        onClick={(e) => { e.stopPropagation(); openEditorForEdit(q); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDelete(q); }}
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
            );
          })}
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

      {/* Type Selector Modal */}
      <AnimatePresence>
        {showTypeSelector && (
          <ModalPortal onClose={() => setShowTypeSelector(false)}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-bold text-slate-800">Choose Question Category</h3>
               <button onClick={() => setShowTypeSelector(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                 <X size={20} />
               </button>
            </div>
            <div className="p-8 grid grid-cols-1 gap-4">
              <button 
                onClick={() => startNewQuestion('practice')}
                className="flex items-center gap-4 p-6 rounded-3xl bg-blue-50 border border-blue-100 text-left hover:bg-blue-100 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Practice Question</h4>
                  <p className="text-sm text-blue-600 font-medium">Add to the public practice repository</p>
                </div>
                <ChevronRight className="ml-auto text-blue-400" />
              </button>

              <button 
                onClick={() => startNewQuestion('exam')}
                className="flex items-center gap-4 p-6 rounded-3xl bg-indigo-50 border border-indigo-100 text-left hover:bg-indigo-100 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900">Exam Question</h4>
                  <p className="text-sm text-indigo-600 font-medium">Add content to a specific Mock Exam</p>
                </div>
                <ChevronRight className="ml-auto text-indigo-400" />
              </button>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Import Setup Modal */}
      <AnimatePresence>
        {showImportDialog && importSetup && (
          <ModalPortal onClose={() => setShowImportDialog(false)}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-bold text-slate-800">Setup Import</h3>
               <button onClick={() => setShowImportDialog(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                 <X size={20} />
               </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Question Type</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => handleImportClick('practice')}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${importSetup.type === 'practice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Practice
                  </button>
                  <button 
                    onClick={() => handleImportClick('exam')}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${importSetup.type === 'exam' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Exam
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Subject Area</label>
                <select 
                  value={importSetup.subject_id}
                  onChange={(e) => setImportSetup({...importSetup!, subject_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {importSetup.type === 'practice' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Practice Part</label>
                  <select 
                    value={importSetup.part}
                    onChange={(e) => setImportSetup({...importSetup!, part: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1,2,3,4,5].map(p => <option key={p} value={p}>Part {p}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={downloadTemplate}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Template
                </button>
                <button 
                  disabled={!importSetup.subject_id}
                  onClick={startFileUpload}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  Upload File
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>
      {/* Question Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && editingQuestion && (
          <ModalPortal onClose={() => setIsEditorOpen(false)} className="max-w-4xl max-h-[90vh] rounded-[2.5rem] flex flex-col">
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
                {editingQuestion.type === 'practice' ? (
                  <div className="flex items-center gap-2">
                     <Tag size={12} />
                     <span>Practice Repository Item</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={12} />
                     <span>Official Exam Content</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:text-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {editingQuestion.id ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.open && (
          <ModalPortal onClose={() => setDeleteConfirm({ open: false, item: null })} className="max-w-md p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Delete</h3>
              <p className="text-slate-500 mb-8">
                 Are you sure you want to permanently delete this question? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm({ open: false, item: null })}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  Delete Now
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionBankPage;
