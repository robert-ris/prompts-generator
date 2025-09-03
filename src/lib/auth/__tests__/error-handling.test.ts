import {
  mapAuthError,
  getErrorMessage,
  getErrorAction,
  AUTH_ERRORS,
  type AuthError,
} from '@/lib/auth/error-handling';

describe('Error Handling Utilities', () => {
  describe('AUTH_ERRORS', () => {
    it('should contain all expected error types', () => {
      expect(AUTH_ERRORS).toHaveProperty('INVALID_CREDENTIALS');
      expect(AUTH_ERRORS).toHaveProperty('EMAIL_NOT_CONFIRMED');
      expect(AUTH_ERRORS).toHaveProperty('WEAK_PASSWORD');
      expect(AUTH_ERRORS).toHaveProperty('EMAIL_ALREADY_IN_USE');
      expect(AUTH_ERRORS).toHaveProperty('TOO_MANY_REQUESTS');
      expect(AUTH_ERRORS).toHaveProperty('NETWORK_ERROR');
      expect(AUTH_ERRORS).toHaveProperty('OAUTH_ERROR');
      expect(AUTH_ERRORS).toHaveProperty('SESSION_EXPIRED');
      expect(AUTH_ERRORS).toHaveProperty('INVALID_TOKEN');
      expect(AUTH_ERRORS).toHaveProperty('UNKNOWN_ERROR');
    });

    it('should have proper structure for each error', () => {
      Object.values(AUTH_ERRORS).forEach(error => {
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('action');
        expect(typeof error.message).toBe('string');
        expect(typeof error.code).toBe('string');
        expect(typeof error.action).toBe('string');
      });
    });
  });

  describe('mapAuthError', () => {
    it('should map invalid credentials error', () => {
      const supabaseError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.INVALID_CREDENTIALS.message,
        code: 'INVALID_CREDENTIALS',
        action: AUTH_ERRORS.INVALID_CREDENTIALS.action,
      });
    });

    it('should map email not confirmed error', () => {
      const supabaseError = {
        message: 'Email not confirmed',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.EMAIL_NOT_CONFIRMED.message,
        code: 'EMAIL_NOT_CONFIRMED',
        action: AUTH_ERRORS.EMAIL_NOT_CONFIRMED.action,
      });
    });

    it('should map weak password error', () => {
      const supabaseError = {
        message: 'Password should be at least 6 characters',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.WEAK_PASSWORD.message,
        code: 'WEAK_PASSWORD',
        action: AUTH_ERRORS.WEAK_PASSWORD.action,
      });
    });

    it('should map email already in use error', () => {
      const supabaseError = {
        message: 'User already registered',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.EMAIL_ALREADY_IN_USE.message,
        code: 'EMAIL_ALREADY_IN_USE',
        action: AUTH_ERRORS.EMAIL_ALREADY_IN_USE.action,
      });
    });

    it('should map too many requests error', () => {
      const supabaseError = {
        message: 'Too many requests',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.TOO_MANY_REQUESTS.message,
        code: 'TOO_MANY_REQUESTS',
        action: AUTH_ERRORS.TOO_MANY_REQUESTS.action,
      });
    });

    it('should map network error', () => {
      const supabaseError = {
        message: 'Network error',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.NETWORK_ERROR.message,
        code: 'NETWORK_ERROR',
        action: AUTH_ERRORS.NETWORK_ERROR.action,
      });
    });

    it('should map OAuth error', () => {
      const supabaseError = {
        message: 'OAuth provider not configured',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.OAUTH_ERROR.message,
        code: 'OAUTH_ERROR',
        action: AUTH_ERRORS.OAUTH_ERROR.action,
      });
    });

    it('should map session expired error', () => {
      const supabaseError = {
        message: 'JWT expired',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.SESSION_EXPIRED.message,
        code: 'SESSION_EXPIRED',
        action: AUTH_ERRORS.SESSION_EXPIRED.action,
      });
    });

    it('should map invalid token error', () => {
      const supabaseError = {
        message: 'Invalid JWT',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.INVALID_TOKEN.message,
        code: 'INVALID_TOKEN',
        action: AUTH_ERRORS.INVALID_TOKEN.action,
      });
    });

    it('should map unknown error for unrecognized error messages', () => {
      const supabaseError = {
        message: 'Some random error message',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result).toEqual({
        message: AUTH_ERRORS.UNKNOWN_ERROR.message,
        code: 'UNKNOWN_ERROR',
        action: AUTH_ERRORS.UNKNOWN_ERROR.action,
      });
    });

    it('should handle non-Supabase errors', () => {
      const genericError = new Error('Generic error');

      const result = mapAuthError(genericError);

      expect(result).toEqual({
        message: AUTH_ERRORS.UNKNOWN_ERROR.message,
        code: 'UNKNOWN_ERROR',
        action: AUTH_ERRORS.UNKNOWN_ERROR.action,
      });
    });

    it('should handle null/undefined errors', () => {
      const result = mapAuthError(null);

      expect(result).toEqual({
        message: AUTH_ERRORS.UNKNOWN_ERROR.message,
        code: 'UNKNOWN_ERROR',
        action: AUTH_ERRORS.UNKNOWN_ERROR.action,
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message from AuthError object', () => {
      const authError: AuthError = {
        message: 'Custom error message',
        code: 'CUSTOM_ERROR',
        action: 'Try again',
      };

      const result = getErrorMessage(authError);

      expect(result).toBe('Custom error message');
    });

    it('should return message from Supabase error', () => {
      const supabaseError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
      };

      const result = getErrorMessage(supabaseError);

      expect(result).toBe(AUTH_ERRORS.INVALID_CREDENTIALS.message);
    });

    it('should return unknown error message for unrecognized errors', () => {
      const genericError = new Error('Random error');

      const result = getErrorMessage(genericError);

      expect(result).toBe(AUTH_ERRORS.UNKNOWN_ERROR.message);
    });

    it('should handle null/undefined errors', () => {
      const result = getErrorMessage(null);

      expect(result).toBe(AUTH_ERRORS.UNKNOWN_ERROR.message);
    });
  });

  describe('getErrorAction', () => {
    it('should return error action from AuthError object', () => {
      const authError: AuthError = {
        message: 'Custom error message',
        code: 'CUSTOM_ERROR',
        action: 'Try again',
      };

      const result = getErrorAction(authError);

      expect(result).toBe('Try again');
    });

    it('should return action from Supabase error', () => {
      const supabaseError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
      };

      const result = getErrorAction(supabaseError);

      expect(result).toBe(AUTH_ERRORS.INVALID_CREDENTIALS.action);
    });

    it('should return unknown error action for unrecognized errors', () => {
      const genericError = new Error('Random error');

      const result = getErrorAction(genericError);

      expect(result).toBe(AUTH_ERRORS.UNKNOWN_ERROR.action);
    });

    it('should handle null/undefined errors', () => {
      const result = getErrorAction(null);

      expect(result).toBe(AUTH_ERRORS.UNKNOWN_ERROR.action);
    });
  });

  describe('Error message patterns', () => {
    it('should handle case-insensitive error matching', () => {
      const supabaseError = {
        message: 'INVALID LOGIN CREDENTIALS',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle partial error message matching', () => {
      const supabaseError = {
        message: 'User already registered with this email',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result.code).toBe('EMAIL_ALREADY_IN_USE');
    });

    it('should handle error messages with extra text', () => {
      const supabaseError = {
        message: 'Error: Password should be at least 6 characters long',
        name: 'AuthApiError',
      };

      const result = mapAuthError(supabaseError);

      expect(result.code).toBe('WEAK_PASSWORD');
    });
  });
});
