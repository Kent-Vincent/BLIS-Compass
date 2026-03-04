
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../src/lib/supabase';
import { User, UserRole } from '../types';

import { Session, User as AuthUser } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUpStudent: (email: string, password: string, fullName: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const profileRef = React.useRef<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep ref in sync with state
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = async (userId: string, email: string, metadata?: any, retryCount = 0): Promise<User | null> => {
    try {
      // 1. Try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // If it's a timeout or lock error, retry once
        if (retryCount < 2 && (error.message.includes('timeout') || error.message.includes('lock'))) {
          console.warn(`Retrying fetchProfile due to: ${error.message}`);
          await new Promise(r => setTimeout(r, 1000));
          return fetchProfile(userId, email, metadata, retryCount + 1);
        }
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          name: data.full_name || 'User',
          email: email,
          role: data.role as UserRole,
          level: data.level || 1,
          exp: data.exp || 0,
          streak: data.streak || 0
        };
      }

      // 2. Profile missing - attempt auto-repair using upsert
      // Upsert is better for "ensure exists" logic
      console.log('Profile missing for user, attempting auto-repair (upsert)...');
      const fullName = metadata?.full_name || metadata?.name || email.split('@')[0] || 'User';
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          role: UserRole.STUDENT,
          level: 1,
          exp: 0,
          streak: 0
        }, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (createError) {
        console.error('Failed to auto-repair profile. Error details:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        });
        return null;
      }

      if (newProfile) {
        console.log('Profile repaired successfully:', newProfile);
        return {
          id: newProfile.id,
          name: newProfile.full_name || fullName,
          email: email,
          role: newProfile.role as UserRole,
          level: newProfile.level || 1,
          exp: newProfile.exp || 0,
          streak: newProfile.streak || 0
        };
      }

      return null;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpStudent = async (email: string, password: string, fullName: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Prioritize the Vercel URL for production redirects, fallback to current origin for dev/preview
        emailRedirectTo: 'https://blis-compass.vercel.app/#/verified'
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // Profile creation is now also handled by auto-repair in fetchProfile, 
      // but we do it here explicitly for immediate feedback during registration.
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: UserRole.STUDENT,
            level: 1,
            exp: 0,
            streak: 0
          }
        ]);

      if (profileError) {
        console.warn('Explicit profile insert failed, will rely on auto-repair:', profileError);
      }
    }
  };

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      const p = await fetchProfile(
        currentSession.user.id, 
        currentSession.user.email || '',
        currentSession.user.user_metadata
      );
      setProfile(p);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Handle specific refresh token error by clearing everything
          if (sessionError.message.includes('Refresh Token Not Found')) {
            console.warn('Stale session detected, clearing auth data...');
            await supabase.auth.signOut();
            if (mounted) {
              setSession(null);
              setAuthUser(null);
              setProfile(null);
            }
            return;
          }
          throw sessionError;
        }

        if (!mounted) return;

        setSession(initialSession);
        setAuthUser(initialSession?.user ?? null);
        
        if (initialSession) {
          const p = await fetchProfile(
            initialSession.user.id, 
            initialSession.user.email || '',
            initialSession.user.user_metadata
          );
          if (mounted) setProfile(p);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      // Only show full-page loading if we don't have a profile yet
      // and we are actually signing in. This prevents the Alt-Tab flicker.
      if (currentSession && event === 'SIGNED_IN' && !profileRef.current) {
        setLoading(true);
      }

      setSession(currentSession);
      setAuthUser(currentSession?.user ?? null);
      
      if (currentSession) {
        const p = await fetchProfile(
          currentSession.user.id, 
          currentSession.user.email || '',
          currentSession.user.user_metadata
        );
        if (mounted) setProfile(p);
      } else {
        if (mounted) setProfile(null);
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      setSession(null);
      setAuthUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: authUser, 
      profile, 
      loading, 
      signOut, 
      signIn, 
      signUpStudent, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
