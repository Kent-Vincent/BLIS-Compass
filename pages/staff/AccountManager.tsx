
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  Trash2,
  UserCheck,
  UserMinus,
  KeyRound,
  BarChart3,
  Settings
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
  status?: 'active' | 'suspended';
}

interface ModalShellProps {
  children: React.ReactNode;
  onClose: () => void;
}

const ModalShell: React.FC<ModalShellProps> = ({ children, onClose }) => {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed left-0 top-0 w-screen h-screen z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-h-full overflow-y-auto flex justify-center py-8">
        {children}
      </div>
    </motion.div>,
    document.body
  );
};

const AccountManager: React.FC = () => {
  const navigate = useNavigate();
  const { profile: currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<Profile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
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
      
      // Try fetching with status and updated_at
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, role, updated_at, status')
        .order('updated_at', { ascending: false });

      if (fetchError) {
        // If status column is missing, try without it
        if (fetchError.message.includes('column "status" does not exist')) {
          const { data: noStatusData, error: noStatusError } = await supabase
            .from('profiles')
            .select('id, full_name, role, updated_at')
            .order('updated_at', { ascending: false });
          
          if (noStatusError) throw noStatusError;
          setProfiles(noStatusData || []);
        } else {
          // Fallback for other errors (like missing updated_at)
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, full_name, role, updated_at');
          
          if (fallbackError) throw fallbackError;
          setProfiles((fallbackData as any) || []);
        }
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

  const handleDeleteAccount = async (id: string) => {
    try {
      setActionLoading(id);
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setProfiles(prev => prev.filter(p => p.id !== id));
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgradeToStaff = async (id: string) => {
    try {
      setActionLoading(id);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: UserRole.FACULTY })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: UserRole.FACULTY } : p));
      setActiveMenu(null);
    } catch (err: any) {
      console.error('Error upgrading account:', err);
      alert('Failed to upgrade account: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (id: string, currentStatus?: string) => {
    try {
      setActionLoading(id);
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) {
        if (updateError.message.includes('column "status" does not exist')) {
          throw new Error('The "status" column does not exist in your profiles table. Please add it to enable suspension.');
        }
        throw updateError;
      }
      
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
      setActiveMenu(null);
    } catch (err: any) {
      console.error('Error toggling suspension:', err);
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    try {
      setCreating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          full_name: showEditModal.full_name,
          role: showEditModal.role
        })
        .eq('id', showEditModal.id);

      if (updateError) throw updateError;
      
      setProfiles(prev => prev.map(p => p.id === showEditModal.id ? showEditModal : p));
      setShowEditModal(null);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDemoteToStudent = async (id: string) => {
    try {
      setActionLoading(id);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: UserRole.STUDENT })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: UserRole.STUDENT } : p));
      setActiveMenu(null);
    } catch (err: any) {
      console.error('Error demoting account:', err);
      alert('Failed to demote account: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      if (!email) throw new Error('User email not found');
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      
      alert(`Password reset email sent to ${email}`);
      setActiveMenu(null);
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      alert('Failed to send reset email: ' + err.message);
    }
  };

  useEffect(() => {
  const hasOpenModal = !!showCreateModal || !!showEditModal || !!showDeleteConfirm;

  if (hasOpenModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  return () => {
    document.body.style.overflow = '';
  };
}, [showCreateModal, showEditModal, showDeleteConfirm]);

  const filteredProfiles = profiles.filter(p => {
    // Role-based visibility
    if (!isAdmin && p.role !== UserRole.STUDENT) return false;
    
    const matchesSearch = 
      (p.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole, status?: string) => {
    const isSuspended = status === 'suspended';
    
    if (isSuspended) {
      return <span className="px-2 py-1 rounded-md bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">Suspended</span>;
    }

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
                      {getRoleBadge(profile.role, profile.status)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500">
                      {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-right relative">
                      {profile.id !== currentUser?.id && (
                        <div className="flex justify-end items-center gap-2">
                          <div className="relative">
                            <button 
                              onClick={() => setActiveMenu(activeMenu === profile.id ? null : profile.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                              <MoreVertical size={18} />
                            </button>

                            <AnimatePresence>
                              {activeMenu === profile.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-[60]" 
                                    onClick={() => setActiveMenu(null)}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[70]"
                                  >
                                    <button
                                      onClick={() => {
                                        navigate(`/staff/analytics?studentId=${profile.id}`);
                                        setActiveMenu(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                      <BarChart3 size={16} className="text-blue-500" />
                                      View Performance
                                    </button>

                                    <button
                                      onClick={() => {
                                        setShowEditModal(profile);
                                        setActiveMenu(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                      <Settings size={16} className="text-slate-500" />
                                      Edit Profile
                                    </button>

                                    {profile.role === UserRole.STUDENT && profile.email && (
                                      <button
                                        onClick={() => handleResetPassword(profile.email!)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                      >
                                        <KeyRound size={16} className="text-indigo-500" />
                                        Reset Password
                                      </button>
                                    )}

                                    {isAdmin && (
                                      <>
                                        <div className="h-px bg-slate-100 my-1" />
                                        
                                        {profile.role === UserRole.STUDENT && (
                                          <button
                                            onClick={() => handleUpgradeToStaff(profile.id)}
                                            disabled={actionLoading === profile.id}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                          >
                                            <Shield size={16} className="text-blue-500" />
                                            Upgrade to Staff
                                          </button>
                                        )}

                                        {profile.role === UserRole.FACULTY && (
                                          <button
                                            onClick={() => handleDemoteToStudent(profile.id)}
                                            disabled={actionLoading === profile.id}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                          >
                                            <UserMinus size={16} className="text-orange-500" />
                                            Demote to Student
                                          </button>
                                        )}

                                        <button
                                          onClick={() => handleToggleSuspend(profile.id, profile.status)}
                                          disabled={actionLoading === profile.id}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                          <AlertCircle size={16} className={profile.status === 'suspended' ? 'text-emerald-500' : 'text-amber-500'} />
                                          {profile.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                                        </button>

                                        <button
                                          onClick={() => {
                                            setShowDeleteConfirm(profile.id);
                                            setActiveMenu(null);
                                          }}
                                          disabled={actionLoading === profile.id}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                          <Trash2 size={16} />
                                          Remove Account
                                        </button>
                                      </>
                                    )}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
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
          <ModalShell onClose={() => setShowCreateModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800">Create Staff Account</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4 p-6">
                {createError && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle size={18} />
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600">
                    <CheckCircle2 size={18} />
                    Staff account created successfully!
                  </div>
                )}

                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={UserRole.FACULTY}>Faculty/Staff</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={creating || createSuccess}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creating ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <ModalShell onClose={() => setShowEditModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(null)}
                  className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 p-6">
                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={showEditModal.full_name}
                    onChange={(e) =>
                      setShowEditModal({ ...showEditModal, full_name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {isAdmin && (
                  <div className="space-y-1">
                    <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      Role
                    </label>
                    <select
                      value={showEditModal.role}
                      onChange={(e) =>
                        setShowEditModal({
                          ...showEditModal,
                          role: e.target.value as UserRole,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value={UserRole.STUDENT}>Student</option>
                      <option value={UserRole.FACULTY}>Faculty/Staff</option>
                      <option value={UserRole.ADMIN}>Administrator</option>
                    </select>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creating ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    {creating ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <ModalShell onClose={() => setShowDeleteConfirm(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={32} />
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-800">Remove Account?</h2>
              <p className="mb-8 text-sm text-slate-500">
                This will permanently remove the user's profile. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-600 transition-all hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAccount(showDeleteConfirm)}
                  disabled={!!actionLoading}
                  className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </motion.div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountManager;