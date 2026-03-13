
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2, Send, CheckCircle2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { supabase } from '../src/lib/supabase';

const ResendVerificationPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'https://blis-compass.vercel.app/#/verified'
        }
      });

      if (resendError) throw resendError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-indigo-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-8 border-white/40">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 shadow-inner">
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Resend Verification</h2>
              <p className="text-slate-500 text-sm mt-2">
                Enter your email address and we'll send you a new confirmation link.
              </p>
            </div>

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Email Sent!</h3>
                <p className="text-slate-600 text-sm mb-8">
                  Check your inbox (and spam folder) for the new verification link.
                </p>
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
                >
                  <ArrowLeft size={18} />
                  Back to Login
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleResend} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50"
                    placeholder="name@example.com"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-blue-600 shadow-blue-200 hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                  {loading ? 'Sending...' : 'Send New Link'}
                </button>

                <div className="text-center pt-4">
                  <Link to="/" className="text-slate-400 text-sm hover:text-slate-600 transition-colors inline-flex items-center gap-1">
                    <ArrowLeft size={14} />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ResendVerificationPage;
