'use client';

import {useState, useEffect, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {
  Gauge,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Info,
  Crown,
  Zap
} from 'lucide-react';
import {useUpgradeModal} from './useUpgradeModal';

interface QuotaMeterProps {
  used: number;
  limit: number;
  resetDate?: Date;
  onUpgrade?: () => void;
  showUpgradePrompt?: boolean;
  className?: string;
  variant?: 'compact' | 'detailed' | 'full';
}

interface UsageTrend {
  date: string;
  usage: number;
}

export function QuotaMeter({
  used,
  limit,
  resetDate,
  onUpgrade,
  showUpgradePrompt = true,
  className = '',
  variant = 'detailed'
}: QuotaMeterProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [usageHistory, setUsageHistory] = useState<UsageTrend[]>([]);
  const {openModal, UpgradeModalComponent} = useUpgradeModal();

  // Calculate usage percentage
  const usagePercentage = Math.min((used / limit) * 100, 100);

  // Determine status and colors
  const getStatusInfo = () => {
    if (usagePercentage >= 90) {
      return {
        status: 'critical',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: AlertTriangle,
        message: 'Critical usage level'
      };
    } else if (usagePercentage >= 75) {
      return {
        status: 'warning',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: AlertTriangle,
        message: 'High usage level'
      };
    } else {
      return {
        status: 'good',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle,
        message: 'Usage within limits'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Calculate time remaining until reset
  useEffect(() => {
    if (!resetDate) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const reset = new Date(resetDate);
      const diff = reset.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Resets soon');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [resetDate]);

  // Generate mock usage history for demo
  useEffect(() => {
    const generateMockHistory = () => {
      const history: UsageTrend[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate realistic usage pattern
        const baseUsage = Math.floor(used / 7); // Distribute current usage
        const randomVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const dailyUsage = Math.max(0, baseUsage + randomVariation);

        history.push({
          date: date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
          usage: dailyUsage
        });
      }

      setUsageHistory(history);
    };

    generateMockHistory();
  }, [used]);

  const handleUpgrade = useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      openModal();
    }
  }, [onUpgrade, openModal]);

  const formatUsage = (value: number) => {
    if (limit === -1) return `${value} used`;
    return `${value} / ${limit}`;
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border ${className}`}>
        <Gauge className={`h-4 w-4 ${statusInfo.color}`} />
        <span className="text-sm font-medium">
          {formatUsage(used)}
        </span>
        <Progress
          value={usagePercentage}
          className="flex-1 h-2"
          indicatorClassName={getProgressColor()}
        />
        {usagePercentage >= 75 && showUpgradePrompt && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUpgrade}
            className="text-xs"
          >
            Upgrade
          </Button>
        )}
      </div>
    );
  }

  // Full variant
  if (variant === 'full') {
    return (
      <>
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-500" />
                <span>AI Usage Quota</span>
              </div>
              <Badge variant={statusInfo.status === 'critical' ? 'destructive' : 'secondary'}>
                {statusInfo.status === 'critical' ? 'Critical' : statusInfo.status === 'warning' ? 'Warning' : 'Good'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Usage Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Usage</span>
                <span className="text-sm font-medium">{formatUsage(used)}</span>
              </div>
              <Progress
                value={usagePercentage}
                className="h-3"
                indicatorClassName={getProgressColor()}
              />
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{Math.round(usagePercentage)}% used</span>
                {resetDate && <span>{timeRemaining}</span>}
              </div>
            </div>

            {/* Usage History Chart */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">Usage History</span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {usageHistory.map((day, index) => {
                  const maxUsage = Math.max(...usageHistory.map(d => d.usage));
                  const height = maxUsage > 0 ? (day.usage / maxUsage) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-200 dark:bg-blue-800 rounded-t"
                        style={{height: `${height}%`}}
                      />
                      <span className="text-xs text-gray-500 mt-1">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Message */}
            <div className={`p-3 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                <span className={`text-sm ${statusInfo.color}`}>{statusInfo.message}</span>
              </div>
            </div>

            {/* Upgrade Prompt */}
            {usagePercentage >= 75 && showUpgradePrompt && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Crown className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">
                      Upgrade to Pro
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Get unlimited AI improvements and advanced features
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <UpgradeModalComponent currentPlan="free" />
      </>
    );
  }

  // Default detailed variant
  return (
    <>
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">AI Usage</span>
              </div>
              <Badge variant={statusInfo.status === 'critical' ? 'destructive' : 'secondary'}>
                {statusInfo.status === 'critical' ? 'Critical' : statusInfo.status === 'warning' ? 'Warning' : 'Good'}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current Usage</span>
                <span className="font-medium">{formatUsage(used)}</span>
              </div>
              <Progress
                value={usagePercentage}
                className="h-2"
                indicatorClassName={getProgressColor()}
              />
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{Math.round(usagePercentage)}% used</span>
                {resetDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeRemaining}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            <div className={`p-2 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                <span className={`text-xs ${statusInfo.color}`}>{statusInfo.message}</span>
              </div>
            </div>

            {/* Upgrade Prompt */}
            {usagePercentage >= 75 && showUpgradePrompt && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-900 dark:text-purple-100">
                      Running low on AI credits?
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Upgrade to Pro for unlimited usage
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  >
                    Upgrade
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <UpgradeModalComponent currentPlan="free" />
    </>
  );
}
