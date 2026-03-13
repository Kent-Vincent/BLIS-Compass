
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUpStudent } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUpStudent(formData.email, formData.password, formData.name);
      // Redirect to confirmation page instead of dashboard
      navigate('/confirm-email', { state: { email: formData.email } });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-8 transition-colors gap-2 font-medium">
          <ArrowLeft size={18} /> Back to Home
        </Link>
        
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Join ComPASS</h2>
            <p className="text-slate-500">Start your journey to LIS mastery</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Dewey Decimal"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="dewey@lis.edu"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                disabled={loading}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white bg-blue-600 shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500">Already have an account?</p>
            <Link to="/" className="text-blue-600 font-semibold hover:underline">Log in here</Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default RegisterPage;
