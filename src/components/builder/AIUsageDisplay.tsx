'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Sparkles, Clock, AlertTriangle} from 'lucide-react';
import {useUserQuota} from '@/hooks/useUserQuota';

interface AIUsageDisplayProps {
  className?: string;
}

export function AIUsageDisplay({className}: AIUsageDisplayProps) {
  const {quota, loading, error} = useUserQuota();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quota) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Unable to load usage data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentageUsed = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
  const remaining = Math.max(0, quota.limit - quota.used);
  const isNearLimit = percentageUsed >= 80;
  const isAtLimit = quota.used >= quota.limit;

  const getTimeUntilReset = () => {
    const now = new Date();
    const diff = quota.resetDate.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Reset now';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 hour remaining';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI Improvements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Usage Stats */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Used this month
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {quota.used} / {quota.limit}
            </span>
            <Badge
              variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'default'}
              className="text-xs"
            >
              {isAtLimit ? 'Limit Reached' : isNearLimit ? 'Near Limit' : 'Available'}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress
            value={percentageUsed}
            className="h-2"
            style={{
              '--progress-background': isAtLimit
                ? 'hsl(var(--destructive))'
                : isNearLimit
                  ? 'hsl(var(--warning))'
                  : 'hsl(var(--primary))'
            } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{quota.used} used</span>
            <span>{remaining} remaining</span>
          </div>
        </div>

        {/* Reset Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Resets in {getTimeUntilReset()}</span>
        </div>

        {/* Upgrade Prompt */}
        {isNearLimit && (
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {isAtLimit
                ? 'You\'ve reached your monthly limit. Upgrade to Pro for unlimited AI improvements!'
                : 'You\'re approaching your monthly limit. Consider upgrading to Pro for unlimited access!'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
