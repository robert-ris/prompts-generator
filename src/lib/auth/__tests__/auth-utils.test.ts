import { supabase } from '@/lib/supabase/client';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  resetPassword,
  updatePassword,
  type AuthResult,
  type SimpleAuthError,
} from '@/lib/auth/auth-utils';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockData = { user: mockUser, session: { access_token: 'token' } };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
    });

    it('should return error for invalid credentials', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await signInWithEmail('test@example.com', 'wrongpassword');

      expect(result).toEqual({
        success: false,
        error: {
          message: expect.stringContaining('Invalid'),
          code: 'AuthApiError',
        },
      });
    });

    it('should handle unexpected errors', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result).toEqual({
        success: false,
        error: {
          message: expect.stringContaining('Something went wrong'),
          code: 'UNKNOWN',
        },
      });
    });
  });

  describe('signUpWithEmail', () => {
    it('should successfully sign up with valid credentials', async () => {
      const mockUser = { id: '123', email: 'new@example.com' };
      const mockData = { user: mockUser, session: { access_token: 'token' } };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await signUpWithEmail('new@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
    });

    it('should return error for existing email', async () => {
      const mockError = {
        message: 'User already registered',
        name: 'AuthApiError',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await signUpWithEmail(
        'existing@example.com',
        'password123'
      );

      expect(result).toEqual({
        success: false,
        error: {
          message: expect.stringContaining('already registered'),
          code: 'AuthApiError',
        },
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('should successfully initiate Google OAuth', async () => {
      const mockData = { url: 'https://google.com/oauth' };

      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await signInWithGoogle();

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      });
      expect(result).toEqual({
        success: true,
        user: undefined,
      });
    });

    it('should return error for OAuth failure', async () => {
      const mockError = {
        message: 'OAuth provider not configured',
        name: 'AuthApiError',
      };

      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await signInWithGoogle();

      expect(result).toEqual({
        success: false,
        error: {
          message: expect.stringContaining('OAuth'),
          code: 'AuthApiError',
        },
      });
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        user: undefined,
      });
    });

    it('should handle sign out error', async () => {
      const mockError = {
        message: 'Sign out failed',
        name: 'AuthApiError',
      };

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      const result = await signOut();

      expect(result).toEqual({
        success: false,
        error: {
          message: expect.stringContaining('Sign out'),
          code: 'AuthApiError',
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('should successfully send reset password email', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(result).toEqual({
        success: true,
        user: undefined,
      });
    });

    it('should handle reset password error', async () => {
      const mockError = {
        message: 'Email not found',
        name: 'AuthApiError',
      };

      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      const result = await resetPassword('nonexistent@example.com');

      expect(result).toEqual({
        success: false,
        error: {
          message: expect.stringContaining('Email'),
          code: 'AuthApiError',
        },
      });
    });
  });

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };

      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await updatePassword('newpassword123');

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
    });

    it('should handle password update error', async () => {
      const mockError = {
        message: 'Password too weak',
        name: 'AuthApiError',
      };

      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await updatePassword('weak');

      expect(result).toEqual({
        success: false,
        error: {
          message: expect.stringContaining('Password'),
          code: 'AuthApiError',
        },
      });
    });
  });
});
