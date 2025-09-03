import React from 'react'
import {render, screen, waitFor, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {AuthProvider, useAuth} from '@/lib/auth/AuthProvider'
import {supabase} from '@/lib/supabase/client'

// Mock the auth utilities
jest.mock('@/lib/auth/auth-utils', () => ({
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
}))

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {subscription: {unsubscribe: jest.fn()}},
      })),
    },
  },
}))

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="user-email">{auth.user?.email || 'No user'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="session">{auth.session ? 'Has session' : 'No session'}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => auth.signUp('test@example.com', 'password')}>
        Sign Up
      </button>
      <button onClick={() => auth.signInWithGoogle()}>
        Sign In with Google
      </button>
      <button onClick={() => auth.signOut()}>
        Sign Out
      </button>
      <button onClick={() => auth.resetPassword('test@example.com')}>
        Reset Password
      </button>
      <button onClick={() => auth.updatePassword('newpassword')}>
        Update Password
      </button>
    </div>
  )
}

describe('AuthProvider Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {session: null},
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    })

    it('should initialize with no user and session', async () => {
      ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {session: null},
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
      expect(screen.getByTestId('session')).toHaveTextContent('No session')
    })

    it('should initialize with existing session', async () => {
      const mockSession = {
        user: {id: '123', email: 'test@example.com'},
        access_token: 'token',
      }

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: mockSession},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('session')).toHaveTextContent('Has session')
    })
  })

  describe('Auth State Changes', () => {
    it('should handle auth state change events', async () => {
      const mockSession = {
        user: {id: '123', email: 'test@example.com'},
        access_token: 'token',
      }

      let authStateChangeCallback: any

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

        ; (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
          authStateChangeCallback = callback
          return {
            data: {subscription: {unsubscribe: jest.fn()}},
          }
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      // Simulate auth state change
      act(() => {
        authStateChangeCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('session')).toHaveTextContent('Has session')
      })
    })

    it('should handle sign out event', async () => {
      const mockSession = {
        user: {id: '123', email: 'test@example.com'},
        access_token: 'token',
      }

      let authStateChangeCallback: any

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: mockSession},
        })

        ; (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
          authStateChangeCallback = callback
          return {
            data: {subscription: {unsubscribe: jest.fn()}},
          }
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      })

      // Simulate sign out
      act(() => {
        authStateChangeCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
        expect(screen.getByTestId('session')).toHaveTextContent('No session')
      })
    })
  })

  describe('Auth Methods', () => {
    it('should call signIn method correctly', async () => {
      const {signInWithEmail} = require('@/lib/auth/auth-utils')
        ; (signInWithEmail as jest.Mock).mockResolvedValue({
          success: true,
          user: {id: '123', email: 'test@example.com'},
        })

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      await user.click(screen.getByText('Sign In'))

      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password')
    })

    it('should call signUp method correctly', async () => {
      const {signUpWithEmail} = require('@/lib/auth/auth-utils')
        ; (signUpWithEmail as jest.Mock).mockResolvedValue({
          success: true,
          user: {id: '123', email: 'test@example.com'},
        })

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      await user.click(screen.getByText('Sign Up'))

      expect(signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password')
    })

    it('should call signInWithGoogle method correctly', async () => {
      const {signInWithGoogle} = require('@/lib/auth/auth-utils')
        ; (signInWithGoogle as jest.Mock).mockResolvedValue({
          success: true,
        })

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      await user.click(screen.getByText('Sign In with Google'))

      expect(signInWithGoogle).toHaveBeenCalled()
    })

    it('should call signOut method correctly', async () => {
      const {signOut} = require('@/lib/auth/auth-utils')
        ; (signOut as jest.Mock).mockResolvedValue({
          success: true,
        })

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      await user.click(screen.getByText('Sign Out'))

      expect(signOut).toHaveBeenCalled()
    })

    it('should call resetPassword method correctly', async () => {
      const {resetPassword} = require('@/lib/auth/auth-utils')
        ; (resetPassword as jest.Mock).mockResolvedValue({
          success: true,
        })

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      await user.click(screen.getByText('Reset Password'))

      expect(resetPassword).toHaveBeenCalledWith('test@example.com')
    })

    it('should call updatePassword method correctly', async () => {
      const {updatePassword} = require('@/lib/auth/auth-utils')
        ; (updatePassword as jest.Mock).mockResolvedValue({
          success: true,
          user: {id: '123', email: 'test@example.com'},
        })

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      await user.click(screen.getByText('Update Password'))

      expect(updatePassword).toHaveBeenCalledWith('newpassword')
    })
  })

  describe('Error Handling', () => {
    it('should handle auth method errors', async () => {
      const {signInWithEmail} = require('@/lib/auth/auth-utils')
        ; (signInWithEmail as jest.Mock).mockResolvedValue({
          success: false,
          error: {message: 'Invalid credentials'},
        })

        ; (supabase.auth.getSession as jest.Mock).mockResolvedValue({
          data: {session: null},
        })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      await user.click(screen.getByText('Sign In'))

      expect(signInWithEmail).toHaveBeenCalled()
    })

    it('should handle session get error', async () => {
      ; (supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Session error')
      )

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
    })
  })

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })
})
