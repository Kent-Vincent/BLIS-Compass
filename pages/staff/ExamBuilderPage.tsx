
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
  FileText
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { MockExam, MockExamItem } from '../../types';
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

  useEffect(() => {
    if (id) {
      fetchExamData();
    }
  }, [id]);

  const fetchExamData = async () => {
    try {
      if (!loading) setLoading(true);;
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
      setItems(itemsData || []);
    } catch (err: any) {
      console.error('Error fetching exam data:', err);
      setError(err.message || 'Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: Partial<MockExamItem> = {
      exam_id: id!,
      item_no: items.length + 1,
      question: '',
      choice_a: '',
      choice_b: '',
      choice_c: '',
      choice_d: '',
      correct_answer: 'a',
    };
    setItems([...items, newItem as MockExamItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Re-index
    const reindexedItems = newItems.map((item, i) => ({ ...item, item_no: i + 1 }));
    setItems(reindexedItems);
  };

  const handleUpdateItem = (index: number, updates: Partial<MockExamItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!id || !exam) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // 1. Delete all existing items for this exam (simple approach)
      const { error: deleteError } = await supabase
        .from('mock_exam_items')
        .delete()
        .eq('exam_id', id);

      if (deleteError) throw deleteError;

      // 2. Insert new items
      if (items.length > 0) {
        const { error: insertError } = await supabase
          .from('mock_exam_items')
          .insert(items.map(({ id: _id, created_at: _ca, ...rest }) => rest));

        if (insertError) throw insertError;
      }

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 py-4 -mx-4 px-4">
        <div className="flex items-center gap-4">
          <Link to="/staff/mock-exams" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{exam?.title}</h1>
            <p className="text-sm text-slate-500">Exam Builder • {items.length} Questions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-full"
              >
                <CheckCircle2 size={16} />
                Saved Successfully
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {items.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium mb-4">No questions added yet.</p>
            <button 
              onClick={handleAddItem}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all"
            >
              Add First Question
            </button>
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-8 border-slate-200">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Question Item</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove Question"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Question Text</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      placeholder="Enter the question here..."
                      value={item.question}
                      onChange={e => handleUpdateItem(index, { question: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'choice_a', label: 'Choice A', id: 'a' },
                      { key: 'choice_b', label: 'Choice B', id: 'b' },
                      { key: 'choice_c', label: 'Choice C', id: 'c' },
                      { key: 'choice_d', label: 'Choice D', id: 'd' },
                    ].map((choice) => (
                      <div key={choice.key} className="relative group">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{choice.label}</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-all ${item.correct_answer === choice.id ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
                            placeholder={`Enter ${choice.label}...`}
                            value={(item as any)[choice.key]}
                            onChange={e => handleUpdateItem(index, { [choice.key]: e.target.value })}
                          />
                          <button 
                            onClick={() => handleUpdateItem(index, { correct_answer: choice.id })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.correct_answer === choice.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            title="Mark as Correct Answer"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}

        <button 
          onClick={handleAddItem}
          className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold flex items-center justify-center gap-3 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all group"
        >
          <Plus size={24} className="group-hover:scale-110 transition-transform" />
          Add New Question
        </button>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-center pt-8 pb-20">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
        >
          {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          Save All Questions
        </button>
      </div>
    </div>
  );
};

export default ExamBuilderPage;
