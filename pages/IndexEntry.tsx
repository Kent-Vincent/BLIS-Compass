
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ShieldCheck, ArrowRight, Loader2, Compass, Send } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import GlassCard from '../components/GlassCard';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const IndexEntry: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session, profile, signIn } = useAuth();

  // Redirect if already logged in or handle hash errors
  React.useEffect(() => {
    // Check for hash errors (e.g. expired email link)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error_code');
      if (errorCode === 'otp_expired') {
        setError('Your email confirmation link has expired or has already been used. Please log in if you have already verified, or request a new link below.');
      } else {
        setError(params.get('error_description') || 'An error occurred during verification.');
      }
      // Clear the hash to avoid showing the error again on refresh
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    if (session && profile) {
      if (profile.role === 'student') navigate('/student');
      else if (profile.role === 'faculty' || profile.role === 'admin') navigate('/staff');
    } else if (session && !profile) {
      // If session exists but profile doesn't, go to error page
      navigate('/error');
    }
  }, [session, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      // Auth change listener in AuthContext will handle redirection
    } catch (err: any) {
      let msg = err.message || 'Failed to sign in';
      if (msg.includes('Failed to fetch')) {
        msg = 'Connection error: Unable to reach the server. Please check your internet or ensure the Supabase project is active.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-indigo-50 to-white flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
            <Compass size={40} />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-slate-800 mb-4 tracking-tight">LIS ComPASS</h1>
        <p className="text-slate-600 max-w-md mx-auto text-lg">
          Your path to Library and Information Science success.
        </p>
      </motion.div>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <GlassCard className="p-8 border-white/40">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-500 mb-8 text-sm">
              Sign in to access your dashboard.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">⚠️</div>
                  <p>{error}</p>
                </div>
                {error.includes('expired') && (
                  <Link 
                    to="/resend-verification" 
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1"
                  >
                    <Send size={14} />
                    Resend Verification Link
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-blue-600 shadow-blue-200 hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm mb-2">Are you a student?</p>
              <Link to="/register" className="text-blue-600 font-bold hover:underline">Create Student Account</Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <footer className="mt-16 text-slate-400 text-xs uppercase tracking-widest font-medium">
        © 2024 LIS ComPASS • Powered by Gemini AI
      </footer>
    </div>
  );
};

export default IndexEntry;
