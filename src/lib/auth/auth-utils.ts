import { supabase } from '../supabase/client';
import type { User } from '@supabase/supabase-js';
import { getErrorMessage } from './error-handling';

// Simple error type
export interface SimpleAuthError {
  message: string;
  code?: string;
}

// Simple result type
export interface AuthResult {
  success: boolean;
  error?: SimpleAuthError;
  user?: User | null;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: getErrorMessage(error),
          code: error.name,
        },
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: getErrorMessage(error),
        code: 'UNKNOWN',
      },
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: getErrorMessage(error),
          code: error.name,
        },
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: getErrorMessage(error),
        code: 'UNKNOWN',
      },
    };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: {
          message: getErrorMessage(error),
          code: error.name,
        },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: getErrorMessage(error),
        code: 'UNKNOWN',
      },
    };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          message: getErrorMessage(error),
          code: error.name,
        },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: getErrorMessage(error),
        code: 'UNKNOWN',
      },
    };
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: getErrorMessage(error),
          code: error.name,
        },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: getErrorMessage(error),
        code: 'UNKNOWN',
      },
    };
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: getErrorMessage(error),
          code: error.name,
        },
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: getErrorMessage(error),
        code: 'UNKNOWN',
      },
    };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: {
          message: getErrorMessage(error),
          code: error.name,
        },
      };
    }

    return {
      success: true,
      user: data.session?.user,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: getErrorMessage(error),
      },
    };
  }
}
