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
  const [bulkRange, setBulkRange] = useState({ start: 1, end: 100, subjectId: '' });
  const [showBulkTool, setShowBulkTool] = useState(false);
  const [activeSection, setActiveSection] = useState(0); // 0 = 1-100, 1 = 101-200, etc.
  const [jumpInput, setJumpInput] = useState('');
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
        .eq(id ? 'id' : '', id || '')
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
  };

  const handleBulkAssign = () => {
    if (!bulkRange.subjectId) return;
    const newItems = [...items];
    for (let i = bulkRange.start - 1; i < bulkRange.end; i++) {
      if (newItems[i]) {
        newItems[i] = { ...newItems[i], subject_id: bulkRange.subjectId };
      }
    }
    setItems(newItems);
    setShowBulkTool(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        if (data.length === 0) {
          setError('The CSV file is empty.');
          return;
        }

        // Validate required columns
        const requiredCols = ['question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer'];
        const headers = Object.keys(data[0]).map(h => h.toLowerCase());
        const missing = requiredCols.filter(col => !headers.includes(col));

        if (missing.length > 0) {
          setError(`Missing columns: ${missing.join(', ')}. Please use the template.`);
          return;
        }

        const importedItems = data.slice(0, 600).map((row, idx) => {
          // Find subject ID by name if provided
          let subjectId = undefined;
          if (row.subject_name || row.subject) {
            const sName = (row.subject_name || row.subject).toLowerCase().trim();
            const match = subjects.find(s => s.name.toLowerCase() === sName);
            if (match) subjectId = match.id;
          }

          return {
            exam_id: id!,
            item_no: idx + 1,
            question: row.question || '',
            choice_a: row.choice_a || '',
            choice_b: row.choice_b || '',
            choice_c: row.choice_c || '',
            choice_d: row.choice_d || '',
            correct_answer: (row.correct_answer || 'a').toLowerCase().trim(),
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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      }
    });
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

      // 2. Insert new items (only those that have content, or all 600?)
      // Usually we want all 600 for a mock board.
      // Batch insert to avoid payload size limits if needed, but 600 is small enough.
      const { error: insertError } = await supabase
        .from('mock_exam_items')
        .insert(items.map(({ id: _id, created_at: _ca, ...rest }) => rest));

      if (insertError) throw insertError;

      // 3. Update total_items in mock_exams
      const { error: updateError } = await supabase
        .from('mock_exams')
        .update({ total_items: items.length })
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving exam:', err);
      setError(err.message || 'Failed to save exam');
    } finally {
      setSaving(false);
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
          <Link to="/staff/mock-exams" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
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
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-sm"
            title="Import from CSV"
          >
            <Upload size={18} />
            <span className="hidden md:inline">Import CSV</span>
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
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none"
                              value={bulkRange.start}
                              onChange={e => setBulkRange({ ...bulkRange, start: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">To</label>
                            <input 
                              type="number" 
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 outline-none"
                              value={bulkRange.end}
                              onChange={e => setBulkRange({ ...bulkRange, end: parseInt(e.target.value) || 600 })}
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
                          disabled={!bulkRange.subjectId}
                          className="w-full py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                        >
                          Apply to {bulkRange.end - bulkRange.start + 1} Questions
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
    </div>
  );
};
;

export default ExamBuilderPage;
