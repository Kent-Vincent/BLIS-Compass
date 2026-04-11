
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Shield, 
  GraduationCap,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../src/lib/supabase';
import { UserRole } from '../../types';
import GlassCard from '../../components/GlassCard';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../context/AuthContext';

// Secondary client for creating users without logging out the current admin
// Using the same validated URL and Key from the main supabase lib
const secondarySupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

interface Profile {
  id: string;
  full_name: string;
  email?: string;
  role: UserRole;
  updated_at: string;
}

const AccountManager: React.FC = () => {
  const { profile: currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: UserRole.FACULTY
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try fetching with updated_at since created_at might be missing
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, role, updated_at')
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching profiles with updated_at:', fetchError);
        // Fallback to no ordering if updated_at also fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, full_name, role');
        
        if (fallbackError) throw fallbackError;
        setProfiles(fallbackData || []);
      } else {
        setProfiles(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      setError(err.message || 'Failed to load accounts. Please check your database permissions (RLS).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      // 1. Sign up the user using the secondary client
      const { data: authData, error: authError } = await secondarySupabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // 2. Profile is usually created via trigger, but let's wait a bit or manually check
      // In many Supabase setups, a trigger handles profile creation.
      // If not, we'd insert here. Assuming trigger exists based on existing app logic.
      
      setCreateSuccess(true);
      setFormData({ email: '', password: '', fullName: '', role: UserRole.FACULTY });
      fetchProfiles();
      
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error creating staff account:', err);
      setCreateError(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    // Role-based visibility
    if (!isAdmin && p.role !== UserRole.STUDENT) return false;
    
    const matchesSearch = 
      (p.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-wider">Admin</span>;
      case UserRole.FACULTY:
        return <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider">Faculty/Staff</span>;
      case UserRole.STUDENT:
        return <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Student</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {isAdmin ? 'Manage Accounts' : 'Manage Students'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isAdmin 
              ? 'View and manage all user accounts in the system.' 
              : 'View and manage student accounts.'}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <UserPlus size={20} />
            Create Staff Account
          </button>
        )}
      </div>

      <GlassCard className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={isAdmin ? "Search by name or email..." : "Search students..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <Filter size={18} className="text-slate-400" />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-transparent focus:outline-none text-sm font-medium text-slate-600"
              >
                <option value="all">All Roles</option>
                <option value={UserRole.STUDENT}>Students</option>
                <option value={UserRole.FACULTY}>Faculty/Staff</option>
                <option value={UserRole.ADMIN}>Admins</option>
              </select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="pb-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] px-4">User</th>
                <th className="pb-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] px-4">Role</th>
                <th className="pb-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] px-4">Last Updated</th>
                <th className="pb-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600 mb-2" size={32} />
                    <p className="text-slate-400 text-sm">Loading accounts...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                    <p className="text-red-600 font-bold mb-2">Error Loading Accounts</p>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
                    <button 
                      onClick={fetchProfiles}
                      className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all"
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Users className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-medium">No accounts found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                          {profile.full_name?.charAt(0) || profile.email?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{profile.full_name || 'No Name'}</p>
                          {profile.email && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail size={12} />
                              {profile.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getRoleBadge(profile.role)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500">
                      {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Create Staff Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Create Staff Account</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
                {createError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-3">
                    <AlertCircle size={18} />
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    Staff account created successfully!
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="staff@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                  >
                    <option value={UserRole.FACULTY}>Faculty/Staff</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={creating || createSuccess}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                    {creating ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountManager;
