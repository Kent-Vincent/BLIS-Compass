import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Upload,
  Download
} from 'lucide-react';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import { supabase } from '../../src/lib/supabase';
import { MockExam, MockExamItem, PracticeSubject } from '../../types';
import GlassCard from '../../components/GlassCard';

const ExamBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [items, setItems] = useState<MockExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [subjects, setSubjects] = useState<PracticeSubject[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showNavigator, setShowNavigator] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'empty'>('all');
  const [bulkRange, setBulkRange] = useState<{start: number | '', end: number | '', subjectId: string}>({ start: 1, end: 100, subjectId: '' });
  const [showBulkTool, setShowBulkTool] = useState(false);
  const [activeSection, setActiveSection] = useState(0); // 0 = 1-100, 1 = 101-200, etc.
  const [jumpInput, setJumpInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentItem = items[selectedIndex];
  const sectionSize = 100;
  const sections = Array.from({ length: 6 }, (_, i) => ({
    label: `${i * sectionSize + 1}-${(i + 1) * sectionSize}`,
    start: i * sectionSize,
    end: (i + 1) * sectionSize
  }));

  useEffect(() => {
    fetchSubjects();
    if (id) {
      fetchExamData();
    }
  }, [id]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput);
    if (!isNaN(num) && num >= 1 && num <= 600) {
      setSelectedIndex(num - 1);
      setActiveSection(Math.floor((num - 1) / sectionSize));
      setJumpInput('');
    }
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('practice_subjects').select('*').order('name');
    setSubjects(data || []);
  };

  const fetchExamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Exam
      const { data: examData, error: examError } = await supabase
        .from('mock_exams')
        .select('*')
        .eq('id', id)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // 2. Fetch Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('mock_exam_items')
        .select('*')
        .eq('exam_id', id)
        .order('item_no', { ascending: true });

      if (itemsError) throw itemsError;
      
      // If no items, initialize with 600 empty ones
      if (!itemsData || itemsData.length === 0) {
        const initialItems = Array.from({ length: 600 }, (_, i) => ({
          exam_id: id!,
          item_no: i + 1,
          question: '',
          choice_a: '',
          choice_b: '',
          choice_c: '',
          choice_d: '',
          correct_answer: 'a',
        } as MockExamItem));
        setItems(initialItems);
      } else {
        // Ensure we have 600 items
        const fullItems = [...itemsData];
        if (fullItems.length < 600) {
          for (let i = fullItems.length; i < 600; i++) {
            fullItems.push({
              exam_id: id!,
              item_no: i + 1,
              question: '',
              choice_a: '',
              choice_b: '',
              choice_c: '',
              choice_d: '',
              correct_answer: 'a',
            } as MockExamItem);
          }
        }
        setItems(fullItems);
      }
    } catch (err: any) {
      console.error('Error fetching exam data:', err);
      setError(err.message || 'Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<MockExamItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
    setHasUnsavedChanges(true);
  };

  const handleBulkAssign = () => {
    if (!bulkRange.subjectId) return;
    const start = Number(bulkRange.start) || 1;
    const end = Number(bulkRange.end) || 600;
    const newItems = [...items];
    for (let i = start - 1; i < end; i++) {
      if (newItems[i]) {
        newItems[i] = { ...newItems[i], subject_id: bulkRange.subjectId };
      }
    }
    setItems(newItems);
    setHasUnsavedChanges(true);
    setShowBulkTool(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let rawData: any[] = [];

      if (extension === 'csv') {
        rawData = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
          });
        });
      } else if (extension === 'json') {
        const text = await file.text();
        rawData = JSON.parse(text);
      } else if (extension === 'xml') {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const items = xmlDoc.getElementsByTagName("item");
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const getVal = (tag: string) => item.getElementsByTagName(tag)[0]?.textContent || '';
          
          // Handle nested choices structure: <choices><choice letter="A">...</choice></choices>
          let choiceA = getVal('choice_a');
          let choiceB = getVal('choice_b');
          let choiceC = getVal('choice_c');
          let choiceD = getVal('choice_d');
          
          if (!choiceA) {
            const choices = item.getElementsByTagName("choice");
            for (let j = 0; j < choices.length; j++) {
              const c = choices[j];
              const letter = c.getAttribute("letter")?.toUpperCase();
              if (letter === 'A') choiceA = c.textContent || '';
              else if (letter === 'B') choiceB = c.textContent || '';
              else if (letter === 'C') choiceC = c.textContent || '';
              else if (letter === 'D') choiceD = c.textContent || '';
            }
          }

          rawData.push({
            number: getVal('number'),
            question: getVal('question'),
            choice_a: choiceA,
            choice_b: choiceB,
            choice_c: choiceC,
            choice_d: choiceD,
            correct_answer: getVal('correct_answer'),
            subject_name: getVal('subject_name') || getVal('subject')
          });
        }
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        
        // Improved Regex Parser for Docx
        // Matches "1. ", "1) ", " 1. ", etc. at start of line or start of text
        // We use a lookahead to keep the number if we want, but here we just split
        // and handle the first element which might be empty if file starts with a number.
        const questionBlocks = text.split(/(?:\r?\n|^)\s*\d+[\.\)]\s+/).filter(b => b.trim());
        
        if (questionBlocks.length === 0) {
          throw new Error('No questions found. Ensure your DOCX uses "1. Question" or "1) Question" format.');
        }

        rawData = questionBlocks.map(block => {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l);
          const question = lines[0] || '';
          
          // Find choices with more flexible regex
          const choiceA = lines.find(l => l.match(/^[A][\.\)]/i))?.replace(/^[A][\.\)]\s*/i, '') || '';
          const choiceB = lines.find(l => l.match(/^[B][\.\)]/i))?.replace(/^[B][\.\)]\s*/i, '') || '';
          const choiceC = lines.find(l => l.match(/^[C][\.\)]/i))?.replace(/^[C][\.\)]\s*/i, '') || '';
          const choiceD = lines.find(l => l.match(/^[D][\.\)]/i))?.replace(/^[D][\.\)]\s*/i, '') || '';
          
          // Find answer with more flexible regex
          const ansMatch = block.match(/(?:Ans|Answer|Correct|Key):\s*([A-D])/i);
          const correctAns = ansMatch ? ansMatch[1].toLowerCase() : 'a';
          
          return {
            question,
            choice_a: choiceA,
            choice_b: choiceB,
            choice_c: choiceC,
            choice_d: choiceD,
            correct_answer: correctAns
          };
        });
      } else {
        throw new Error(`Unsupported file format (.${extension}). Please use CSV, JSON, XML, or DOCX.`);
      }

      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error(`The ${extension.toUpperCase()} file was parsed but no questions were found. Check the file structure.`);
      }

      const importedItems = rawData.slice(0, 600).map((row, idx) => {
        // Highly Robust Subject Matching (Fuzzy + Word-based)
        let subjectId = undefined;
        const sInputRaw = (row.subject_name || row.subject || row.category || '').toLowerCase().trim();
        
        if (sInputRaw) {
          const normalize = (str: string) => str.replace(/&/g, 'and').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
          const nInput = normalize(sInputRaw);
          
          // 1. Try exact match on normalized strings
          let match = subjects.find(s => normalize(s.name.toLowerCase()) === nInput);
          
          // 2. Try includes match on normalized strings
          if (!match) {
            match = subjects.find(s => {
              const nName = normalize(s.name.toLowerCase());
              return nName.includes(nInput) || nInput.includes(nName);
            });
          }

          // 3. Word-based match (at least 1 significant word match)
          if (!match) {
            const stopWords = ['and', 'the', 'for', 'with', 'from', 'abstraction', 'abstracting'];
            const inputWords = nInput.split(/\s+/).filter(w => w.length > 3 && !stopWords.includes(w));
            
            // Special case for "Indexing"
            const isIndexing = nInput.includes('indexing');
            const isSelection = nInput.includes('selection');
            
            match = subjects.find(s => {
              const nName = normalize(s.name.toLowerCase());
              const nNameWords = nName.split(/\s+/);
              
              if (isIndexing && nName.includes('indexing')) return true;
              if (isSelection && nName.includes('selection')) return true;
              
              return inputWords.some(word => nNameWords.includes(word));
            });
          }
          
          if (match) subjectId = match.id;
        }

        return {
          exam_id: id!,
          item_no: parseInt(row.number || row.item_no || row.no) || idx + 1,
          question: row.question || '',
          choice_a: row.choice_a || row.a || '',
          choice_b: row.choice_b || row.b || '',
          choice_c: row.choice_c || row.c || '',
          choice_d: row.choice_d || row.d || '',
          correct_answer: (row.correct_answer || row.answer || 'a').toLowerCase().trim().charAt(0),
          subject_id: subjectId
        } as MockExamItem;
      });

      // Fill remaining with empty if less than 600
      const finalItems = [...importedItems];
      if (finalItems.length < 600) {
        for (let i = finalItems.length; i < 600; i++) {
          finalItems.push({
            exam_id: id!,
            item_no: i + 1,
            question: '',
            choice_a: '',
            choice_b: '',
            choice_c: '',
            choice_d: '',
            correct_answer: 'a',
          } as MockExamItem);
        }
      }

      setItems(finalItems);
      setSelectedIndex(0);
      setHasUnsavedChanges(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import file');
    }
  };

  const downloadTemplate = () => {
    const csvContent = "question,choice_a,choice_b,choice_c,choice_d,correct_answer,subject_name\nSample Question?,Option A,Option B,Option C,Option D,A,General";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "exam_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!id || !exam) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // 1. Delete all existing items for this exam
      const { error: deleteError } = await supabase
        .from('mock_exam_items')
        .delete()
        .eq('exam_id', id);

      if (deleteError) throw deleteError;

      // 2. Insert new items in batches of 100 to avoid payload limits
      const batchSize = 100;
      const dataToInsert = items.map(({ id: _id, created_at: _ca, ...rest }) => rest);
      
      for (let i = 0; i < dataToInsert.length; i += batchSize) {
        const batch = dataToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('mock_exam_items')
          .insert(batch);

        if (insertError) throw insertError;
      }

      // 3. Update total_items in mock_exams
      const { error: updateError } = await supabase
        .from('mock_exams')
        .update({ total_items: items.length })
        .eq('id', id);

      if (updateError) throw updateError;

      setHasUnsavedChanges(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving exam:', err);
      setError(err.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  // Prevent accidental navigation
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleBack = (e: React.MouseEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      setShowExitConfirm(true);
    }
  };

  const filteredItems = items.filter((item, idx) => {
    const isComplete = item.question && item.choice_a && item.choice_b && item.choice_c && item.choice_d;
    const matchesSubject = filterSubject === 'all' || item.subject_id === filterSubject;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'complete' && isComplete) || 
                         (filterStatus === 'empty' && !isComplete);
    return matchesSubject && matchesStatus;
  });

  const getSubjectInitials = (subjectId?: string) => {
    if (!subjectId) return '';
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return '';
    // Get first letter of each word, max 3 letters
    return subject.name
      .split(/[\s-]+/)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-3xl text-center">
        <AlertCircle size={48} className="mx-auto mb-4" />
        <p className="font-bold text-lg mb-4">{error}</p>
        <button onClick={() => navigate('/staff/mock-exams')} className="text-indigo-600 font-bold hover:underline">
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -mx-4 -mt-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border-b border-slate-200 px-8 py-4 z-20">
        <div className="flex items-center gap-4">
          <Link 
            to="/staff/mock-exams" 
            onClick={handleBack}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{exam?.title}</h1>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 flex items-center gap-1">
                <ShieldCheck size={10} />
                Mock Board
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400">
              {items.filter(i => i.question && i.choice_a).length} / 600 Questions Completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportFile} 
            accept=".csv,.json,.xml,.docx" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-sm"
            title="Import from CSV, JSON, XML, or DOCX"
          >
            <Upload size={18} />
            <span className="hidden md:inline">Import File</span>
          </button>
          <button 
            onClick={downloadTemplate}
            className="p-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-sm"
            title="Download CSV Template"
          >
            <Download size={18} />
            <span className="hidden md:inline">Template</span>
          </button>
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full"
              >
                <CheckCircle2 size={14} />
                Saved
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigator */}
        <AnimatePresence initial={false}>
          {showNavigator && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-r border-slate-200 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Question List</h3>
                  <button 
                    onClick={() => setShowNavigator(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                </div>

                {/* Jump to Question */}
                <form onSubmit={handleJump} className="relative">
                  <input 
                    type="text" 
                    placeholder="Jump to # (e.g. 450)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
                    value={jumpInput}
                    onChange={e => setJumpInput(e.target.value)}
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 font-bold text-[10px] uppercase">Go</button>
                </form>
                
                <div className="space-y-2">
                  <select 
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  
                  <div className="flex gap-1">
                    {(['all', 'complete', 'empty'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all capitalize ${
                          filterStatus === status 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setShowBulkTool(!showBulkTool)}
                    className={`w-full py-2 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                      showBulkTool ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck size={12} />
                    Bulk Subject Assign
                  </button>

                  <AnimatePresence>
                    {showBulkTool && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-2 pt-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">From</label>
                            <input 
                              type="number" 
                              min="1"
                              max="600"
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={bulkRange.start}
                              onKeyDown={(e) => {
                                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                              }}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '') {
                                  setBulkRange({ ...bulkRange, start: '' });
                                  return;
                                }
                                const num = parseInt(val);
                                if (!isNaN(num)) {
                                  setBulkRange({ ...bulkRange, start: Math.min(Math.max(num, 1), 600) });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">To</label>
                            <input 
                              type="number" 
                              min="1"
                              max="600"
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={bulkRange.end}
                              onKeyDown={(e) => {
                                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                              }}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '') {
                                  setBulkRange({ ...bulkRange, end: '' });
                                  return;
                                }
                                const num = parseInt(val);
                                if (!isNaN(num)) {
                                  setBulkRange({ ...bulkRange, end: Math.min(Math.max(num, 1), 600) });
                                }
                              }}
                            />
                          </div>
                        </div>
                        <select 
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none bg-white"
                          value={bulkRange.subjectId}
                          onChange={e => setBulkRange({ ...bulkRange, subjectId: e.target.value })}
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                          <button 
                            onClick={handleBulkAssign}
                            disabled={!bulkRange.subjectId || bulkRange.start === '' || bulkRange.end === ''}
                            className="w-full py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                          >
                            Apply to {(Number(bulkRange.end) || 0) - (Number(bulkRange.start) || 0) + 1} Questions
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 p-1 gap-1 custom-scrollbar">
                {sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSection(idx)}
                    className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold rounded-md transition-all ${
                      activeSection === idx 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-5 gap-3">
                  {items.slice(sections[activeSection].start, sections[activeSection].end).map((item, localIdx) => {
                    const idx = sections[activeSection].start + localIdx;
                    const isComplete = item.question && item.choice_a && item.choice_b && item.choice_c && item.choice_d;
                    const isSelected = selectedIndex === idx;
                    const isFiltered = filteredItems.includes(item);
                    
                    if (!isFiltered) return null;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        className={`aspect-square rounded-2xl transition-all flex flex-col items-center justify-center border relative overflow-hidden group ${
                          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 z-10' : ''
                        } ${
                          isComplete 
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' 
                            : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        {/* Subject Initial in Corner */}
                        {item.subject_id && (
                          <span className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-tighter opacity-60 ${
                            isComplete ? 'text-emerald-100' : 'text-slate-400'
                          }`}>
                            {getSubjectInitials(item.subject_id)}
                          </span>
                        )}

                        {/* Large Number */}
                        <span className={`text-xl font-bold ${isSelected ? 'scale-110' : ''} transition-transform`}>
                          {idx + 1}
                        </span>

                        {/* Completion indicator dot */}
                        {isComplete && (
                          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            {!showNavigator && (
              <button 
                onClick={() => setShowNavigator(true)}
                className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all mb-4"
              >
                <FileText size={18} />
                Show Question List
              </button>
            )}

            {currentItem ? (
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <GlassCard className="p-8 border-slate-200">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-slate-200">
                        {selectedIndex + 1}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">Question Editor</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mock Board Item {selectedIndex + 1} of 600</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                        disabled={selectedIndex === 0}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-20"
                      >
                        <ChevronUp className="-rotate-90" size={24} />
                      </button>
                      <button 
                        onClick={() => setSelectedIndex(prev => Math.min(items.length - 1, prev + 1))}
                        disabled={selectedIndex === items.length - 1}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-20"
                      >
                        <ChevronDown className="-rotate-90" size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Subject / Category</label>
                      <select 
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-700 font-medium"
                        value={currentItem.subject_id || ''}
                        onChange={e => handleUpdateItem(selectedIndex, { subject_id: e.target.value })}
                      >
                        <option value="">Select Subject (Optional)</option>
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Question Text</label>
                      <textarea 
                        rows={5}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-lg leading-relaxed text-slate-800"
                        placeholder="Enter the question here..."
                        value={currentItem.question}
                        onChange={e => handleUpdateItem(selectedIndex, { question: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { key: 'choice_a', label: 'Choice A', id: 'a' },
                        { key: 'choice_b', label: 'Choice B', id: 'b' },
                        { key: 'choice_c', label: 'Choice C', id: 'c' },
                        { key: 'choice_d', label: 'Choice D', id: 'd' },
                      ].map((choice) => (
                        <div key={choice.key} className="relative group">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${
                              currentItem.correct_answer === choice.id 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}>
                              {choice.id.toUpperCase()}
                            </div>
                            <input 
                              type="text" 
                              className={`flex-1 px-5 py-4 rounded-2xl border outline-none transition-all text-slate-700 font-medium ${
                                currentItem.correct_answer === choice.id 
                                  ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500' 
                                  : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'
                              }`}
                              placeholder={`Enter ${choice.label}...`}
                              value={(currentItem as any)[choice.key]}
                              onChange={e => handleUpdateItem(selectedIndex, { [choice.key]: e.target.value })}
                            />
                            <button 
                              onClick={() => handleUpdateItem(selectedIndex, { correct_answer: choice.id })}
                              className={`px-4 py-4 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                                currentItem.correct_answer === choice.id 
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                  : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {currentItem.correct_answer === choice.id ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                              <span className="hidden sm:inline">Correct</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                <div className="flex justify-between items-center p-4">
                  <button 
                    onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-20"
                  >
                    <ChevronUp className="-rotate-90" size={20} />
                    Previous Question
                  </button>
                  <button 
                    onClick={() => setSelectedIndex(prev => Math.min(items.length - 1, prev + 1))}
                    disabled={selectedIndex === items.length - 1}
                    className="flex items-center gap-2 px-8 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm active:scale-95 disabled:opacity-20"
                  >
                    Next Question
                    <ChevronDown className="-rotate-90" size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">Select a question from the sidebar to start editing.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Unsaved Changes</h2>
              <p className="text-slate-500 text-center mb-8">
                You have imported or modified questions. If you leave now, these changes will be lost. Are you sure you want to exit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Stay & Edit
                </button>
                <button
                  onClick={() => {
                    setHasUnsavedChanges(false);
                    navigate('/staff/mock-exams');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  Exit Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
;

export default ExamBuilderPage;
