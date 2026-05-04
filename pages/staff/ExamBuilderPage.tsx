
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
  Download,
  Database,
  Search,
  Check,
  X
} from 'lucide-react';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import { supabase } from '../../src/lib/supabase';
import { MOCK_EXAM_SUBJECTS } from '../../src/constants';
import { MockExam, MockExamItem, MockExamSubjectSession, PracticeSubject } from '../../types';
import GlassCard from '../../components/GlassCard';

const ExamBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [session, setSession] = useState<MockExamSubjectSession | null>(null);
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
  const [fixedSubjectId, setFixedSubjectId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentItem = items[selectedIndex];
  const sectionSize = 25;
  const sections = Array.from({ length: Math.ceil(items.length / sectionSize) }, (_, i) => ({
    label: `${i * sectionSize + 1}-${Math.min((i + 1) * sectionSize, items.length)}`,
    start: i * sectionSize,
    end: Math.min((i + 1) * sectionSize, items.length)
  }));

  useEffect(() => {
    fetchSubjects();
    if (id) {
      fetchExamData();
    }
  }, [id]);

  useEffect(() => {
    if (session && subjects.length > 0) {
      // Robust fuzzy matching to find the official subject ID
      const match = subjects.find(s => {
        const sName = s.name.toLowerCase();
        const sessName = session.subject_name.toLowerCase();
        
        // Exact match
        if (sName === sessName) return true;
        
        // Session name contains subject name (e.g. "Library Organization and Management" contains "Library Organization")
        if (sessName.includes(sName)) return true;
        
        // Subject name contains session name
        if (sName.includes(sessName)) return true;

        // Word based check
        const sWords = sName.split(/\s+/).filter(w => w.length > 3);
        const sessWords = sessName.split(/\s+/).filter(w => w.length > 3);
        
        return sWords.some(w => sessWords.includes(w));
      });

      if (match) {
        setFixedSubjectId(match.id);
        setFilterSubject(match.id); // Default filter to this subject
      }
    }
  }, [session, subjects]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpInput);
    if (!isNaN(num) && num >= 1 && num <= items.length) {
      setSelectedIndex(num - 1);
      setActiveSection(Math.floor((num - 1) / sectionSize));
      setJumpInput('');
    } else if (jumpInput.length === 1 && /[a-dA-D]/.test(jumpInput)) {
      // If user types a letter, set the correct answer for current item
      handleUpdateItem(selectedIndex, { correct_answer: jumpInput.toLowerCase() as 'a'|'b'|'c'|'d' });
      setJumpInput('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) {
        handleUpdateItem(selectedIndex, { correct_answer: key as 'a' | 'b' | 'c' | 'd' });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, items.length]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('practice_subjects').select('*').order('name');
    if (data) {
      const sorted = [...data].sort((a, b) => {
        const indexA = MOCK_EXAM_SUBJECTS.indexOf(a.name);
        const indexB = MOCK_EXAM_SUBJECTS.indexOf(b.name);
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setSubjects(sorted);
    }
  };

  const fetchExamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Session
      const { data: sessionData, error: sessionError } = await supabase
        .from('mock_exam_subject_sessions')
        .select(`
          *,
          exam:mock_exams(*)
        `)
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);
      setExam(sessionData.exam);

      // 2. Fetch Items for this session
      const { data: itemsData, error: itemsError } = await supabase
        .from('mock_exam_items')
        .select('*')
        .eq('session_id', id)
        .order('item_no', { ascending: true });

      if (itemsError) throw itemsError;
      
      const targetCount = sessionData.question_limit || 100;
      
      // If no items, initialize with required empty ones
      if (!itemsData || itemsData.length === 0) {
        const initialItems = Array.from({ length: targetCount }, (_, i) => ({
          exam_id: sessionData.exam_id,
          session_id: id!,
          item_no: i + 1,
          question: '',
          choice_a: '',
          choice_b: '',
          choice_c: '',
          choice_d: '',
          correct_answer: 'a',
          subject_id: subjects.find(s => s.name.toLowerCase().includes(sessionData.subject_name.toLowerCase().split(' ')[0]))?.id
        } as MockExamItem));
        setItems(initialItems);
      } else {
        // Ensure we have the target number of items
        const fullItems = [...itemsData];
        if (fullItems.length < targetCount) {
          for (let i = fullItems.length; i < targetCount; i++) {
            fullItems.push({
              exam_id: sessionData.exam_id,
              session_id: id!,
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
        setItems(fullItems.slice(0, targetCount));
      }
    } catch (err: any) {
      console.error('Error fetching session data:', err);
      setError(err.message || 'Failed to load session data');
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
    const end = Number(bulkRange.end) || items.length;
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

      const importedItems = rawData.map((row, idx) => {
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
          exam_id: session?.exam_id || '',
          session_id: id!,
          item_no: parseInt(row.number || row.item_no || row.no) || idx + 1,
          question: row.question || '',
          choice_a: row.choice_a || row.a || '',
          choice_b: row.choice_b || row.b || '',
          choice_c: row.choice_c || row.c || '',
          choice_d: row.choice_d || row.d || '',
          correct_answer: (row.correct_answer || row.answer || 'a').toLowerCase().trim().charAt(0),
          subject_id: fixedSubjectId || subjectId
        } as MockExamItem;
      });

      // Fill remaining with empty if less than target
      const targetCount = session?.question_limit || 100;
      const finalItems = [...importedItems];
      if (finalItems.length < targetCount) {
        for (let i = finalItems.length; i < targetCount; i++) {
          finalItems.push({
            exam_id: session?.exam_id || '',
            session_id: id!,
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
      setItems(finalItems.slice(0, targetCount));
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
    if (!id || !session) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // 1. Delete all existing items for this session
      const { error: deleteError } = await supabase
        .from('mock_exam_items')
        .delete()
        .eq('session_id', id);

      if (deleteError) throw deleteError;

      // 2. Insert new items in batches of 100
      const batchSize = 100;
      const dataToInsert = items.map(({ id: _id, created_at: _ca, ...rest }) => ({
        ...rest,
        session_id: id,
        subject_id: fixedSubjectId || rest.subject_id // Auto-assign session subject
      }));
      
      for (let i = 0; i < dataToInsert.length; i += batchSize) {
        const batch = dataToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('mock_exam_items')
          .insert(batch);

        if (insertError) throw insertError;
      }

      // 3. Update completed_count in mock_exam_subject_sessions
      const completedCount = items.filter(i => i.question && i.choice_a).length;
      const { error: updateError } = await supabase
        .from('mock_exam_subject_sessions')
        .update({ 
          completed_count: completedCount
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 4. Update parent exam completed_count
      const { data: allSessions } = await supabase
        .from('mock_exam_subject_sessions')
        .select('completed_count')
        .eq('exam_id', session.exam_id);
      
      const totalCompleted = (allSessions || []).reduce((sum, s) => sum + (s.completed_count || 0), 0);
      
      await supabase
        .from('mock_exams')
        .update({ completed_count: totalCompleted })
        .eq('id', session.exam_id);

      setHasUnsavedChanges(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving session questions:', err);
      setError(err.message || 'Failed to save session questions');
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
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'complete' && isComplete) || 
                         (filterStatus === 'empty' && !isComplete);
    return matchesStatus;
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border-b border-slate-200 px-8 py-4 [@media(max-height:850px)]:py-2.5 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/staff/mock-exams/${session?.exam_id}/sessions`)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{session?.subject_name}</h1>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 flex items-center gap-1">
                <ShieldCheck size={10} />
                Session
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400">
              {exam?.title} • {items.filter(i => i.question && i.choice_a).length} Questions Completed
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
            onClick={() => setIsBankModalOpen(true)}
            disabled={!fixedSubjectId}
            className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all text-sm disabled:opacity-50"
            title="Import from Question Bank"
          >
            <Database size={18} />
            <span className="hidden md:inline">Bank Import</span>
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
              animate={{ width: window.innerWidth >= 1920 ? 460 : 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-r border-slate-200 flex flex-col overflow-hidden"
            >
              <div className="p-4 [@media(max-height:850px)]:p-3 border-b border-slate-100 space-y-4 [@media(max-height:850px)]:space-y-2.5">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setShowNavigator(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden ml-auto"
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                </div>

                {/* Jump to Question */}
                <form onSubmit={handleJump} className="relative">
                  <input 
                    type="text" 
                    placeholder="Type # or Letter (A-D)"
                    className="w-full px-3 py-2 [@media(max-height:850px)]:py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
                    value={jumpInput}
                    onChange={e => {
                      const val = e.target.value;
                      if (!isNaN(parseInt(val)) && parseInt(val) > items.length) return;
                      setJumpInput(val);
                    }}
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 font-bold text-[10px] uppercase">Go</button>
                </form>
                
                <div className="space-y-2">
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
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 p-1 [@media(max-height:850px)]:p-0.5 gap-1 custom-scrollbar">
                {sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSection(idx)}
                    className={`whitespace-nowrap px-3 py-2 [@media(max-height:850px)]:py-1.5 text-[10px] font-bold rounded-md transition-all ${
                      activeSection === idx 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 [@media(min-width:1920px)]:p-6 custom-scrollbar">
                <div className="grid grid-cols-5 gap-3 [@media(min-width:1920px)]:gap-4">
                  {items.slice(sections[activeSection].start, sections[activeSection].end).map((item, localIdx) => {
                    const idx = sections[activeSection].start + localIdx;
                    const isComplete = item.question && item.choice_a && item.choice_b && item.choice_c && item.choice_d;
                    const isSelected = selectedIndex === idx;
                    const matchesStatus = filterStatus === 'all' || 
                                         (filterStatus === 'complete' && isComplete) || 
                                         (filterStatus === 'empty' && !isComplete);
                    
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
                        } ${!matchesStatus ? 'opacity-30 grayscale-[0.5] scale-90' : 'opacity-100'}`}
                      >
                        {/* Subject Initial in Corner */}
                        {item.subject_id && (
                          <span className={`absolute top-2 left-2 text-[9px] [@media(min-width:1920px)]:text-[11px] font-black uppercase tracking-tighter opacity-60 ${
                            isComplete ? 'text-emerald-100' : 'text-slate-400'
                          }`}>
                            {getSubjectInitials(item.subject_id)}
                          </span>
                        )}

                        {/* Large Number */}
                        <span className={`text-xl [@media(min-width:1920px)]:text-2xl font-bold ${isSelected ? 'scale-110' : ''} transition-transform`}>
                          {idx + 1}
                        </span>

                        {/* Completion indicator dot */}
                        {isComplete && (
                          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 [@media(min-width:1920px)]:w-2 [@media(min-width:1920px)]:h-2 bg-white rounded-full shadow-sm" />
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
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 [@media(max-height:900px)]:p-4 [@media(max-height:850px)]:p-3 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6 [@media(max-height:850px)]:space-y-3">
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
                className="space-y-6 [@media(max-height:850px)]:space-y-3"
              >
                <GlassCard className="p-8 [@media(max-height:900px)]:p-6 [@media(max-height:850px)]:p-4 border-slate-200 shadow-xl shadow-slate-100">
                  <div className="flex justify-between items-center mb-8 [@media(max-height:850px)]:mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 [@media(max-height:850px)]:w-9 [@media(max-height:850px)]:h-9 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-bold text-xl [@media(max-height:850px)]:text-base shadow-lg shadow-slate-200">
                        {selectedIndex + 1}
                      </div>
                      <div>
                        <h2 className="text-lg [@media(max-height:850px)]:text-base font-bold text-slate-800 leading-tight">Question Editor</h2>
                        <p className="text-xs [@media(max-height:850px)]:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight mt-0.5">{session?.subject_name} Item {selectedIndex + 1}</p>
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

                  <div className="space-y-6 [@media(max-height:850px)]:space-y-3">
                    {!fixedSubjectId && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 [@media(max-height:850px)]:mb-1.5 ml-1">Subject / Category</label>
                        <select 
                          className="w-full px-4 py-3.5 [@media(max-height:850px)]:py-2 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-700 font-medium"
                          value={currentItem.subject_id || ''}
                          onChange={e => handleUpdateItem(selectedIndex, { subject_id: e.target.value })}
                        >
                          <option value="">Select Subject (Optional)</option>
                          {subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 [@media(max-height:850px)]:mb-1.5 ml-1">Question Text</label>
                      <textarea 
                        rows={1}
                        className="w-full px-5 py-4 [@media(max-height:850px)]:px-4 [@media(max-height:850px)]:py-2.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-lg [@media(max-height:850px)]:text-sm leading-relaxed text-slate-800 min-h-[140px] [@media(max-height:850px)]:min-h-[80px]"
                        placeholder="Enter the question here..."
                        value={currentItem.question}
                        onChange={e => handleUpdateItem(selectedIndex, { question: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 [@media(max-height:850px)]:gap-2.5">
                      {[
                        { key: 'choice_a', label: 'Choice A', id: 'a' },
                        { key: 'choice_b', label: 'Choice B', id: 'b' },
                        { key: 'choice_c', label: 'Choice C', id: 'c' },
                        { key: 'choice_d', label: 'Choice D', id: 'd' },
                      ].map((choice) => (
                        <div key={choice.id} className="relative group">
                          <label className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 [@media(max-height:850px)]:w-7 [@media(max-height:850px)]:h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                            currentItem.correct_answer === choice.id 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                          }`}>
                            {choice.id.toUpperCase()}
                          </label>
                          <input 
                            type="text" 
                            placeholder={choice.label}
                            className={`w-full pl-16 pr-12 py-4 [@media(max-height:850px)]:pl-14 [@media(max-height:850px)]:py-2 rounded-2xl border transition-all outline-none font-medium text-slate-700 [@media(max-height:850px)]:text-sm ${
                              currentItem.correct_answer === choice.id 
                                ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10' 
                                : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 bg-white'
                            }`}
                            value={currentItem[choice.key as keyof MockExamItem] || ''}
                            onChange={e => handleUpdateItem(selectedIndex, { [choice.key]: e.target.value })}
                          />
                          <button 
                            onClick={() => handleUpdateItem(selectedIndex, { correct_answer: choice.id as any })}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                              currentItem.correct_answer === choice.id 
                                ? 'text-emerald-500 bg-emerald-50' 
                                : 'text-slate-300 hover:text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                <div className="flex justify-between items-center p-4 [@media(max-height:850px)]:p-2.5">
                  <button 
                    onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedIndex === 0}
                    className="flex items-center gap-2 px-6 py-3 [@media(max-height:850px)]:px-4 [@media(max-height:850px)]:py-1.5 rounded-xl font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-20 text-sm"
                  >
                    <ChevronUp className="-rotate-90" size={18} />
                    Previous
                  </button>
                  <button 
                    onClick={() => setSelectedIndex(prev => Math.min(items.length - 1, prev + 1))}
                    disabled={selectedIndex === items.length - 1}
                    className="flex items-center gap-2 px-8 py-3 [@media(max-height:850px)]:px-6 [@media(max-height:850px)]:py-1.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm active:scale-95 disabled:opacity-20 text-sm"
                  >
                    Next
                    <ChevronDown className="-rotate-90" size={18} />
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 w-screen h-screen z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Bank Import Modal */}
      <AnimatePresence>
        {isBankModalOpen && (
          <BankImportModal 
            isOpen={isBankModalOpen} 
            onClose={() => setIsBankModalOpen(false)}
            onImport={(selectedQuestions) => {
              const newItems = [...items];
              let currentIdx = selectedIndex;
              
              selectedQuestions.forEach(q => {
                if (currentIdx < newItems.length) {
                  newItems[currentIdx] = {
                    ...newItems[currentIdx],
                    question: q.question,
                    choice_a: q.choice_a,
                    choice_b: q.choice_b,
                    choice_c: q.choice_c,
                    choice_d: q.choice_d,
                    correct_answer: q.correct_answer,
                    subject_id: fixedSubjectId || q.subject_id
                  };
                  currentIdx++;
                }
              });
              
              setItems(newItems);
              setHasUnsavedChanges(true);
              setIsBankModalOpen(false);
            }}
            subjectId={fixedSubjectId || ''}
            subjectName={session?.subject_name || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface BankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: any[]) => void;
  subjectId: string;
  subjectName: string;
}

const BankImportModal: React.FC<BankImportModalProps> = ({ isOpen, onClose, onImport, subjectId, subjectName }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBankQuestions();
  }, [subjectId, searchQuery]);

  const fetchBankQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('mock_exam_items')
        .select('*')
        .eq('subject_id', subjectId)
        .neq('question', '');
        
      if (searchQuery) query = query.ilike('question', `%${searchQuery}%`);
      
      const { data } = await query.limit(100);
      setQuestions(data?.map(d => ({ ...d, type: 'exam' })) || []);
    } catch (err) {
      console.error('Error fetching bank questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleImport = () => {
    const selected = questions.filter(q => selectedIds.has(q.id));
    onImport(selected);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative z-10"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Import from Question Bank</h3>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{subjectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search in bank..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Found</p>
                <p className="text-sm font-black text-slate-700">{questions.length}</p>
             </div>
             <div className="w-[1px] h-4 bg-slate-200" />
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Source</p>
                <p className="text-sm font-black text-slate-700">Exam Items</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching the bank...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20">
              <Database className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-500 font-medium">No questions found for this subject.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div 
                  key={q.id}
                  onClick={() => toggleSelection(q.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    selectedIds.has(q.id) 
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                      : 'bg-white border-slate-100 hover:border-indigo-100'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`mt-1 shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all ${
                      selectedIds.has(q.id) ? 'bg-indigo-600 text-white' : 'border-2 border-slate-200 bg-white group-hover:border-indigo-300'
                    }`}>
                      {selectedIds.has(q.id) && <Check size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          q.type === 'practice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {q.type}
                        </span>
                        {q.explanation && (
                          <span className="text-[10px] font-bold text-slate-400 italic">Has explanation</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed mb-3">{q.question}</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 opacity-60">
                         {['a', 'b', 'c', 'd'].map(opt => (
                           <div key={opt} className={`text-[10px] font-medium flex items-center gap-2 ${q.correct_answer === opt ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                             <span className="uppercase">{opt}.</span>
                             <span className="truncate">{q[`choice_${opt}`]}</span>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400">
            {selectedIds.size} questions selected
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-800 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              disabled={selectedIds.size === 0}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              Import Selection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
;

export default ExamBuilderPage;
