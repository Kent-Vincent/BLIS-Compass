
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Loader2, Send, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { supabase } from '../src/lib/supabase';

const EmailVerifiedPage: React.FC = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      // 1. Check for error parameters in the URL hash (Supabase sends errors here)
      const hash = window.location.hash;
      if (hash && hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1)); // remove the #
        const errorCode = params.get('error_code');
        const errorDesc = params.get('error_description');

        if (errorCode === 'otp_expired') {
          setError('This confirmation link has expired or has already been used. Please try logging in or request a new link.');
        } else {
          setError(errorDesc || 'An error occurred during verification.');
        }
        setVerifying(false);
        return;
      }

      // 2. Check if we have a session (successful verification)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setVerifying(false);
      } else {
        // Fallback: if no session and no error, wait a bit
        setTimeout(() => {
          setVerifying(false);
        }, 1500);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${error ? 'bg-red-50' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100 via-emerald-50 to-white'}`}>
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-8 text-center border-white/40">
            {verifying ? (
              <div className="py-12">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-800">Verifying your email...</h2>
              </div>
            ) : error ? (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6 shadow-lg shadow-red-100">
                  <div className="text-3xl font-bold">!</div>
                </div>
                
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Verification Issue</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  {error}
                </p>

                <div className="space-y-4">
                  <Link 
                    to="/resend-verification" 
                    className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Resend Verification Link
                  </Link>
                  
                  <Link 
                    to="/" 
                    className="w-full py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-lg shadow-emerald-100">
                  <CheckCircle2 size={40} />
                </div>
                
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Email Verified!</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Your account has been successfully verified. You can now access all the features of ComPASS.
                </p>

                <Link 
                  to="/" 
                  className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group"
                >
                  Go to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerifiedPage;
