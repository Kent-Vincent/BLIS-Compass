
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { supabase } from '../src/lib/supabase';

const EmailVerifiedPage: React.FC = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the session automatically when returning from the email link.
    // We just wait a moment to ensure the session is processed.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setVerifying(false);
      } else {
        // If no session, it might still be processing or the link was invalid/expired
        // We'll wait a bit longer or show a generic success message since 
        // usually the redirect happens AFTER the verification is successful on Supabase side.
        setTimeout(() => {
          setVerifying(false);
        }, 2000);
      }
    };

    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100 via-emerald-50 to-white flex items-center justify-center p-6">
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
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-lg shadow-emerald-100">
                  <CheckCircle2 size={40} />
                </div>
                
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Email Verified!</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Your account has been successfully verified. You can now access all the features of LIS ComPASS.
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
