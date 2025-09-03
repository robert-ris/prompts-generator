'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {supabase} from '@/lib/supabase/client';
import {Loader2, CheckCircle, AlertCircle, ArrowRight} from 'lucide-react';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const {data: {session}, error} = await supabase.auth.getSession();

        if (error) {
          setStatus('error');
          setError('Authentication failed. Please try again.');
          return;
        }

        if (session) {
          try {
            await fetch('/auth/set-session', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            });
          } catch { }
          setStatus('success');
          const redirectTo = searchParams.get('next') || '/dashboard';

          // Start countdown for redirect
          let count = 3;
          const countdownInterval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
              clearInterval(countdownInterval);
              router.push(redirectTo);
            }
          }, 1000);
        } else {
          setStatus('error');
          setError('No session found. Please try signing in again.');
        }
      } catch {
        setStatus('error');
        setError('An unexpected error occurred. Please try again.');
      }
    };

    processCallback();
  }, [router, searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="main" aria-label="Authentication callback page">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" aria-hidden="true" />
              Processing authentication...
            </CardTitle>
            <CardDescription>
              Please wait while we complete your sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" aria-label="Loading spinner"></div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              This may take a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="main" aria-label="Authentication error page">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
              Authentication failed
            </CardTitle>
            <CardDescription>
              There was an error processing your authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2"
              role="alert"
              aria-live="assertive"
              aria-describedby="error-details"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span id="error-details">{error}</span>
            </div>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
              aria-label="Return to login page"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" role="main" aria-label="Authentication success page">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" aria-hidden="true" />
            Authentication successful!
          </CardTitle>
          <CardDescription>
            You have been successfully signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" aria-hidden="true" />
            </div>
            <p className="text-sm text-gray-600" aria-live="polite">
              Redirecting you to the dashboard in {countdown} seconds...
            </p>
            <div className="flex justify-center" role="status" aria-label="Redirect countdown">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" aria-hidden="true"></div>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
              aria-label="Go to dashboard immediately"
            >
              Go to dashboard now
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
