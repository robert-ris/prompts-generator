'use client';

import {useAuth} from '@/lib/auth/AuthProvider';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {AlertCircle, RefreshCw} from 'lucide-react';

/**
 * Session Expiry Notification Component
 * Displays when session is expired and provides options to refresh or sign in
 */
export function SessionExpiryNotification() {
  const {sessionExpired, refreshSession, signOut} = useAuth();

  if (!sessionExpired) return null;

  const handleRefresh = async () => {
    await refreshSession();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <CardTitle>Session Expired</CardTitle>
          </div>
          <CardDescription>
            Your session has expired. Please refresh your session or sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Session
            </Button>
            <Button
              onClick={handleSignOut}
              className="flex-1"
              variant="destructive"
            >
              Sign Out
            </Button>
          </div>
          <p className="text-xs text-slate-500 text-center">
            If refresh doesn't work, please sign out and sign in again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
