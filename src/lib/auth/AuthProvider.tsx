'use client';

import {createContext, useContext, useEffect, useState} from 'react';
import {User, Session} from '@supabase/supabase-js';
import {supabase} from '../supabase/client';
import {
  signInWithEmail as signInWithEmailUtil,
  signUpWithEmail as signUpWithEmailUtil,
  signInWithGoogle as signInWithGoogleUtil,
  signOut as signOutUtil,
  resetPassword as resetPasswordUtil,
  updatePassword as updatePasswordUtil,
} from './auth-utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error: string | null; success: boolean}>;
  signUp: (email: string, password: string) => Promise<{error: string | null; success: boolean}>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{error: string | null; success: boolean}>;
  resetPassword: (email: string) => Promise<{error: string | null; success: boolean}>;
  updatePassword: (password: string) => Promise<{error: string | null; success: boolean}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {data: {session}} = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {data: {subscription}} = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, 'user:', session?.user?.email);
        console.log('Previous session:', session, 'Previous user:', user);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('Session and user state updated');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: signIn called with email:', email);
    const result = await signInWithEmailUtil(email, password);
    console.log('AuthProvider: signIn result:', result);
    return {
      error: result.error?.message || null,
      success: result.success,
    };
  };

  const signUp = async (email: string, password: string) => {
    const result = await signUpWithEmailUtil(email, password);
    return {
      error: result.error?.message || null,
      success: result.success,
    };
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');

      // Clear client state immediately to prevent race conditions
      setSession(null);
      setUser(null);

      // Call the enhanced sign-out utility
      const result = await signOutUtil();

      if (!result.success) {
        console.error('Sign out utility failed:', result.error);
      }

      // Call the server-side sign-out endpoint to clear cookies
      try {
        const response = await fetch('/auth/sign-out', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Server-side sign out returned non-OK status:', response.status);
        }
      } catch (error) {
        console.warn('Error calling server-side sign out:', error);
      }

      // Force a hard redirect to ensure fresh state
      if (typeof window !== 'undefined') {
        // Clear any remaining auth-related cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.split('=');
          if (name.trim().startsWith('sb-') ||
            name.trim().includes('supabase') ||
            name.trim().includes('auth')) {
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });

        // Force redirect to home page
        window.location.href = '/';
      }

      console.log('Sign out process completed');
    } catch (error) {
      console.error('Error during sign out process:', error);
      // Even if there's an error, clear the state and redirect
      setSession(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const signInWithGoogle = async () => {
    const result = await signInWithGoogleUtil();
    return {
      error: result.error?.message || null,
      success: result.success,
    };
  };

  const resetPassword = async (email: string) => {
    const result = await resetPasswordUtil(email);
    return {
      error: result.error?.message || null,
      success: result.success,
    };
  };

  const updatePassword = async (password: string) => {
    const result = await updatePasswordUtil(password);
    return {
      error: result.error?.message || null,
      success: result.success,
    };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
