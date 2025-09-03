'use client';

import {useState, useEffect} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {LoadingOverlay} from '@/components/ui/loading';
import {useAuth} from '@/lib/auth/AuthProvider';
import {validateEmail, getFieldError, hasFieldError, type ValidationError} from '@/lib/auth/validation';
import {Sparkles, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2} from 'lucide-react';
import {supabase} from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const {signIn, signInWithGoogle, session, loading: authLoading} = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const router = useRouter();

  // Real-time email validation
  useEffect(() => {
    if (touchedFields.has('email') && email) {
      const emailValidation = validateEmail(email);
      setValidationErrors(prev => {
        const filtered = prev.filter(error => error.field !== 'email');
        return [...filtered, ...emailValidation.errors];
      });
    }
  }, [email, touchedFields]);

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError(''); // Clear auth error when user starts typing
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(''); // Clear auth error when user starts typing
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthMethod('email');
    setError('');

    // Validate form before submission
    const emailValidation = validateEmail(email);
    const allErrors = [...emailValidation.errors];

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setLoading(false);
      setAuthMethod(null);
      return;
    }

    const {error, success} = await signIn(email, password);

    console.log('Login result:', {error, success, email});

    if (error) {
      setError(error);
      setLoading(false);
      setAuthMethod(null);
    } else if (success) {
      // Sync session cookies on server, then clean redirect
      try {
        const {data: {session: currentSession}} = await supabase.auth.getSession();
        if (currentSession?.access_token && currentSession?.refresh_token) {
          await fetch('/auth/set-session', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
            }),
          });
        }
      } catch {
        console.warn('Failed to sync session to server, proceeding with redirect');
      } finally {
        setLoading(false);
        setAuthMethod(null);
        router.replace(redirectTo);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthMethod('google');
    setError('');

    const {error, success} = await signInWithGoogle();

    if (error) {
      setError(error);
      setLoading(false);
      setAuthMethod(null);
    } else if (success) {
      // For Google OAuth, the redirect will happen automatically via the OAuth flow
      console.log('Google OAuth initiated successfully');
      setLoading(false);
      setAuthMethod(null);
    }
  };

  // Redirect when session is established (fallback for OAuth)
  useEffect(() => {
    if (session && !authLoading && authMethod === 'google') {
      console.log('Google OAuth session established, redirecting to:', redirectTo);
      setLoading(false);
      setAuthMethod(null);

      // Use absolute URL for the redirect
      const baseUrl = window.location.origin;
      const absoluteUrl = new URL(redirectTo, baseUrl).toString();

      // Add a small delay to ensure cookies are properly set
      setTimeout(() => {
        console.log('Redirecting to absolute URL after delay:', absoluteUrl);
        window.location.href = absoluteUrl;
      }, 500);
    }
  }, [session, authLoading, redirectTo, authMethod]);

  const emailError = getFieldError(validationErrors, 'email');
  const hasEmailError = hasFieldError(validationErrors, 'email');
  const isEmailValid = email && !hasEmailError;
  const isEmailLoading = loading && authMethod === 'email';
  const isGoogleLoading = loading && authMethod === 'google';

  return (
    <LoadingOverlay loading={authLoading} message="Checking authentication...">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative flex items-center justify-center min-h-screen px-4 py-12">
            <div className="w-full max-w-md space-y-8">
              {/* Header */}
              <div className="text-center">
                <Badge variant="gradient" className="mb-6">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Prompt Builder
                </Badge>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Welcome back
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Sign in to your account to continue building
                </p>
              </div>

              <Card variant="elevated" className="backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl">Sign in to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleEmailLogin} className="space-y-6" role="form" aria-label="Sign in form">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onBlur={() => handleFieldBlur('email')}
                          placeholder="Enter your email"
                          disabled={loading}
                          aria-describedby={hasEmailError ? 'email-error' : isEmailValid ? 'email-success' : undefined}
                          aria-invalid={hasEmailError}
                          aria-required="true"
                          className={`pl-10 h-11 ${hasEmailError ? 'border-red-500 focus:border-red-500' :
                            isEmailValid ? 'border-green-500 focus:border-green-500' : ''
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {isEmailValid && !loading && (
                          <CheckCircle
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4"
                            aria-hidden="true"
                            id="email-success"
                          />
                        )}
                        {hasEmailError && !loading && (
                          <AlertCircle
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4"
                            aria-hidden="true"
                            id="email-error"
                          />
                        )}
                        {isEmailLoading && (
                          <Loader2
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin"
                            aria-hidden="true"
                            aria-label="Email validation in progress"
                          />
                        )}
                      </div>
                      {emailError && (
                        <p className="text-red-500 text-sm mt-1" id="email-error" role="alert" aria-live="polite">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          placeholder="Enter your password"
                          disabled={loading}
                          aria-required="true"
                          aria-describedby="password-toggle"
                          className={`pl-10 pr-10 h-11 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showPassword}
                          aria-describedby="password-toggle"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                        </button>
                        <span id="password-toggle" className="sr-only">
                          {showPassword ? 'Password is visible' : 'Password is hidden'}
                        </span>
                      </div>
                    </div>

                    {error && (
                      <div
                        className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-start gap-2"
                        role="alert"
                        aria-live="assertive"
                        aria-describedby="error-message"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span id="error-message">{error}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Link
                        href="/auth/reset-password"
                        className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                        tabIndex={loading ? -1 : 0}
                        aria-label="Reset your password"
                      >
                        Forgot your password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || hasEmailError}
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed relative"
                      aria-describedby={hasEmailError ? 'email-error' : undefined}
                    >
                      {isEmailLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                          <span aria-live="polite">Signing in...</span>
                        </>
                      ) : (
                        <>
                          Sign in
                          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="relative" role="separator" aria-label="Authentication options separator">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleLogin}
                    className="w-full h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed relative"
                    aria-label="Sign in with Google"
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        <span aria-live="polite">Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                    tabIndex={loading ? -1 : 0}
                    aria-label="Create a new account"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoadingOverlay>
  );
}
