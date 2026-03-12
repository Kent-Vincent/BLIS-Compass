
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../src/lib/supabase';
import { User, UserRole } from '../types';

import { Session, User as AuthUser } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  signingOut: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUpStudent: (email: string, password: string, fullName: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, _setProfile] = useState<User | null>(null);
  const profileRef = React.useRef<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const isFetchingRef = React.useRef(false);

  // Helper to keep ref and state in sync
  const setProfile = (p: User | null) => {
    _setProfile(p);
    profileRef.current = p;
  };

  const fetchProfile = async (userId: string, email: string, metadata?: any, retryCount = 0): Promise<User | null> => {
    try {
      // 1. Try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // If it's a timeout, lock, or network error, retry once
        const isRetryable = error.message.includes('timeout') || 
                           error.message.includes('lock') || 
                           error.message.includes('Failed to fetch');
                           
        if (retryCount < 2 && isRetryable) {
          console.warn(`Retrying fetchProfile due to: ${error.message}`);
          await new Promise(r => setTimeout(r, 1500));
          return fetchProfile(userId, email, metadata, retryCount + 1);
        }
        console.error('Error fetching profile:', error);
        
        // If we failed to fetch due to network, try to return cached version as a fallback
        const cached = localStorage.getItem(`lis-profile-${userId}`);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {}
        }
        
        return null;
      }

      let profileData: User | null = null;

      if (data) {
        profileData = {
          id: data.id,
          name: data.full_name || 'User',
          email: email,
          role: data.role as UserRole,
          level: data.level || 1,
          exp: data.exp || 0,
          streak: data.streak || 0
        };
      } else {
        // 2. Profile missing - attempt auto-repair using upsert
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
          console.error('Failed to auto-repair profile:', createError.message);
        } else if (newProfile) {
          profileData = {
            id: newProfile.id,
            name: newProfile.full_name || fullName,
            email: email,
            role: newProfile.role as UserRole,
            level: newProfile.level || 1,
            exp: newProfile.exp || 0,
            streak: newProfile.streak || 0
          };
        }
      }

      // Cache the profile if found
      if (profileData) {
        localStorage.setItem(`lis-profile-${userId}`, JSON.stringify(profileData));
      }

      return profileData;
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

    if (!currentSession) {
      setProfile(null);
      return;
    }

    const p = await fetchProfile(
      currentSession.user.id,
      currentSession.user.email || '',
      currentSession.user.user_metadata
    );

    setProfile(p);
  };

  const revalidateSessionAndProfile = async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;

      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        const isFatal =
          error.message.includes('Refresh Token Not Found') ||
          error.message.includes('invalid_grant');

        if (isFatal) {
          console.warn('Fatal session error during revalidation:', error.message);

          try {
            await supabase.auth.signOut();
          } catch (_) {}

          setSession(null);
          setAuthUser(null);
          setProfile(null);
          return;
        }

        if (error.message.includes('Failed to fetch')) {
          console.warn('Network error during session revalidation, keeping current state');
          return;
        }

        console.error('Session revalidation error:', error);
        return;
      }

      setSession(currentSession);
      setAuthUser(currentSession?.user ?? null);

      if (!currentSession) {
        setProfile(null);
        return;
      }

      const freshProfile = await fetchProfile(
        currentSession.user.id,
        currentSession.user.email || '',
        currentSession.user.user_metadata
      );

      setProfile(freshProfile);
    } catch (err) {
      console.error('Unexpected error during session/profile revalidation:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

     const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await revalidateSessionAndProfile();
      }
    };

    const handleWindowFocus = async () => {
      await revalidateSessionAndProfile();
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Handle specific refresh token or invalid grant errors by clearing everything
          // BUT DO NOT clear on "Failed to fetch" - that's just a network issue!
          if (
            sessionError.message.includes('Refresh Token Not Found') || 
            sessionError.message.includes('invalid_grant')
          ) {
            console.warn('Stale session detected, clearing auth data:', sessionError.message);
            
            try {
              await supabase.auth.signOut();
            } catch (e) {
              localStorage.removeItem('lis-compass-auth-token');
            }

            if (mounted) {
              setSession(null);
              setAuthUser(null);
              setProfile(null);
            }
            return;
          }
          
          // If it's just a network error, we keep the current state (which might be null or cached)
          // and don't throw, just log it.
          if (sessionError.message.includes('Failed to fetch')) {
            console.warn('Network unreachable during auth init, will retry later');
          } else {
            throw sessionError;
          }
        }

        if (!mounted) return;

        setSession(initialSession);
        setAuthUser(initialSession?.user ?? null);
        
        if (initialSession) {
          // Try to get from cache first for immediate UI
          const cached = localStorage.getItem(`lis-profile-${initialSession.user.id}`);
          if (cached) {
            try {
              setProfile(JSON.parse(cached));
            } catch (e) {
              console.error('Failed to parse cached profile');
            }
          }

          const p = await Promise.race([
            fetchProfile(
              initialSession.user.id, 
              initialSession.user.email || '',
              initialSession.user.user_metadata
            ),
            new Promise<undefined>((resolve) => setTimeout(() => {
              console.warn('Initial profile fetch timed out');
              resolve(undefined);
            }, 45000))
          ]);
          
          if (mounted && p !== undefined) {
            setProfile(p);
          }
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
      
      try {
        setSession(currentSession);
        setAuthUser(currentSession?.user ?? null);

        if (currentSession) {
          // 1. Check for cached profile if we don't have one in memory
          const cachedProfile = localStorage.getItem(`lis-profile-${currentSession.user.id}`);
          if (!profileRef.current && cachedProfile) {
            try {
              const p = JSON.parse(cachedProfile);
              setProfile(p);
              // If we have a cached profile, we can stop the full-page loading immediately
              if (mounted) setLoading(false);
            } catch (e) {}
          }

          // 2. Decide if we need to fetch a fresh profile
          const shouldFetch = (!profileRef.current || event === 'SIGNED_IN' || event === 'USER_UPDATED') && !isFetchingRef.current;

          if (shouldFetch) {
            isFetchingRef.current = true;
            
            // Fetch fresh profile data
            const p = await Promise.race([
              fetchProfile(
                currentSession.user.id, 
                currentSession.user.email || '',
                currentSession.user.user_metadata
              ),
              new Promise<undefined>((resolve) => setTimeout(() => {
                // Silent timeout if we already have a profile (background refresh)
                if (!profileRef.current) {
                  console.warn('Initial profile fetch timed out');
                }
                resolve(undefined);
              }, 45000))
            ]);
            
            if (mounted && p !== undefined) {
              setProfile(p);
              // Ensure loading is false once we have a fresh profile
              setLoading(false);
            }
            isFetchingRef.current = false;
          } else {
            // If we didn't fetch but have a session, ensure loading is false
            if (mounted) setLoading(false);
          }
        } else {
          // No session
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (err: any) {
        // If we get a "Failed to fetch" here, it's a network error
        if (err?.message?.includes('Failed to fetch')) {
          console.warn('Network error during auth change, relying on cache');
          // We don't need to do much else as the session/user are already set
          // and the profile fallback logic above handles the rest
        } else {
          console.error('Error in onAuthStateChange:', err);
        }
        isFetchingRef.current = false;
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    try {
      setSigningOut(true);
      
      // We use a timeout because sometimes signOut can hang if the network is unstable 
      // or the session is in a weird state after tab switching/inactivity.
      // We race the Supabase signOut against a 3-second timeout.
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 3000))
      ]);
    } catch (err) {
      console.error('Error or timeout during sign out:', err);
    } finally {
      // Clear all cached data
      if (authUser) {
        localStorage.removeItem(`lis-profile-${authUser.id}`);
      }
      localStorage.removeItem('lis-compass-auth-token');

      // Force clear local state regardless of whether the server call succeeded
      setSession(null);
      setAuthUser(null);
      setProfile(null);
      setSigningOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: authUser, 
      profile, 
      loading, 
      signingOut,
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
