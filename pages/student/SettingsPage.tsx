
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { 
  Settings as SettingsIcon, 
  Layout, 
  ListOrdered, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [layout, setLayout] = useState<'standard' | 'form'>(profile?.exam_layout || 'standard');
  const [perPage, setPerPage] = useState<number>(profile?.questions_per_page || 10);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setLayout(profile.exam_layout || 'standard');
      setPerPage(profile.questions_per_page || 10);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    setStatus(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          exam_layout: layout,
          questions_per_page: perPage
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      await refreshProfile();
      setStatus({ type: 'success', message: 'Settings saved successfully!' });
      
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <GlassCard className="p-6 md:p-10 border-white/60 shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 mb-8 md:mb-12">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Display Preferences</h1>
            <p className="text-slate-500 text-sm">Customize how you interact with mock board exams.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Layout Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Layout size={18} className="text-blue-500" />
              <h3>Exam Layout</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setLayout('standard')}
                className={`p-4 rounded-2xl border-2 text-left transition-all group ${
                  layout === 'standard' 
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' 
                    : 'border-slate-100 bg-white hover:border-blue-200'
                }`}
              >
                <h4 className={`font-bold mb-1 ${layout === 'standard' ? 'text-blue-700' : 'text-slate-700'}`}>Standard Layout</h4>
                <p className="text-xs text-slate-500">Classic point-and-click interface. One question at a time with a dedicated focus area.</p>
              </button>
              
              <button
                onClick={() => setLayout('form')}
                className={`p-4 rounded-2xl border-2 text-left transition-all group ${
                  layout === 'form' 
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' 
                    : 'border-slate-100 bg-white hover:border-blue-200'
                }`}
              >
                <h4 className={`font-bold mb-1 ${layout === 'form' ? 'text-blue-700' : 'text-slate-700'}`}>Form Layout</h4>
                <p className="text-xs text-slate-500">Google Forms style. View multiple questions scrolling vertically on a single page.</p>
              </button>
            </div>
          </section>

          {/* Questions Per Page */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <ListOrdered size={18} className="text-blue-500" />
              <h3>Questions per Page</h3>
            </div>
            <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 space-y-4">
              <p className="text-xs text-slate-500">How many questions do you want to see per page when using the Form Layout?</p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPerPage(num)}
                    className={`py-2 rounded-lg font-bold text-sm transition-all border ${
                      perPage === num 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {status && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 p-4 rounded-xl flex items-center gap-3 ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{status.message}</span>
          </motion.div>
        )}

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Save Settings
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;
