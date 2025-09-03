// Simple error handling for authentication
export interface AuthError {
  message: string;
  code?: string;
  action?: string;
}

// Common authentication error messages
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    message:
      'Invalid email or password. Please check your credentials and try again.',
    code: 'INVALID_CREDENTIALS',
    action: 'Check your email and password, then try again.',
  },
  EMAIL_NOT_CONFIRMED: {
    message:
      'Please check your email and click the confirmation link before signing in.',
    code: 'EMAIL_NOT_CONFIRMED',
    action: 'Check your email for a confirmation link.',
  },
  USER_NOT_FOUND: {
    message: 'No account found with this email address.',
    code: 'USER_NOT_FOUND',
    action: 'Check your email or create a new account.',
  },
  EMAIL_ALREADY_EXISTS: {
    message: 'An account with this email already exists.',
    code: 'EMAIL_ALREADY_EXISTS',
    action: 'Sign in instead or use a different email.',
  },
  WEAK_PASSWORD: {
    message: 'Password is too weak. Please choose a stronger password.',
    code: 'WEAK_PASSWORD',
    action: 'Use at least 8 characters with letters and numbers.',
  },
  TOO_MANY_REQUESTS: {
    message:
      'Too many login attempts. Please wait a few minutes before trying again.',
    code: 'TOO_MANY_REQUESTS',
    action: 'Wait a few minutes, then try again.',
  },
  NETWORK_ERROR: {
    message: 'Network connection error. Please check your internet connection.',
    code: 'NETWORK_ERROR',
    action: 'Check your internet connection and try again.',
  },
  OAUTH_ERROR: {
    message: 'OAuth authentication failed. Please try again.',
    code: 'OAUTH_ERROR',
    action: 'Try again or use email/password sign-in.',
  },
  SESSION_EXPIRED: {
    message: 'Your session has expired. Please sign in again.',
    code: 'SESSION_EXPIRED',
    action: 'Sign in again to continue.',
  },
  UNKNOWN_ERROR: {
    message: 'Something went wrong. Please try again.',
    code: 'UNKNOWN_ERROR',
    action: 'Try again or contact support if the problem persists.',
  },
} as const;

/**
 * Map Supabase error to user-friendly message
 */
export function mapAuthError(error: any): AuthError {
  if (!error) {
    return AUTH_ERRORS.UNKNOWN_ERROR;
  }

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // Check for specific error patterns
  if (
    errorMessage.includes('invalid') &&
    errorMessage.includes('credentials')
  ) {
    return AUTH_ERRORS.INVALID_CREDENTIALS;
  }

  if (
    errorMessage.includes('email not confirmed') ||
    errorMessage.includes('email not verified')
  ) {
    return AUTH_ERRORS.EMAIL_NOT_CONFIRMED;
  }

  if (
    errorMessage.includes('user not found') ||
    errorMessage.includes('no user found')
  ) {
    return AUTH_ERRORS.USER_NOT_FOUND;
  }

  if (
    errorMessage.includes('already exists') ||
    errorMessage.includes('already registered')
  ) {
    return AUTH_ERRORS.EMAIL_ALREADY_EXISTS;
  }

  if (
    errorMessage.includes('password') &&
    (errorMessage.includes('weak') || errorMessage.includes('short'))
  ) {
    return AUTH_ERRORS.WEAK_PASSWORD;
  }

  if (
    errorMessage.includes('too many requests') ||
    errorMessage.includes('rate limit')
  ) {
    return AUTH_ERRORS.TOO_MANY_REQUESTS;
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return AUTH_ERRORS.NETWORK_ERROR;
  }

  if (errorMessage.includes('oauth') || errorCode.includes('oauth')) {
    return AUTH_ERRORS.OAUTH_ERROR;
  }

  if (errorMessage.includes('session') && errorMessage.includes('expired')) {
    return AUTH_ERRORS.SESSION_EXPIRED;
  }

  // Return the original error message if no pattern matches
  return {
    message: error.message || 'Something went wrong. Please try again.',
    code: error.code || 'UNKNOWN',
    action: 'Try again or contact support if the problem persists.',
  };
}

/**
 * Get error message for display
 */
export function getErrorMessage(error: any): string {
  const authError = mapAuthError(error);
  return authError.message;
}

/**
 * Get error action for display
 */
export function getErrorAction(error: any): string {
  const authError = mapAuthError(error);
  return authError.action || '';
}
