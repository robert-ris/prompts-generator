'use client';

import {useState, useCallback, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Loader2, Sparkles, Minimize, Expand, Info, CheckCircle, AlertCircle, Copy, Zap} from 'lucide-react';
import {QuotaMeter} from '@/components/shared/QuotaMeter';

interface AIImproveProps {
  prompt: string;
  onImproved: (improvedPrompt: string) => void;
  onCancel: () => void;
  userQuota?: {
    used: number;
    limit: number;
    resetDate?: Date;
  };
  onUpgrade?: () => void;
}

interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  provider: string;
  model: string;
  responseTimeMs: number;
  isMockMode?: boolean;
}

type ImprovementMode = 'tighten' | 'expand';

export function AIImprove({prompt, onImproved, onCancel, userQuota, onUpgrade}: AIImproveProps) {
  const [mode, setMode] = useState<ImprovementMode>('tighten');
  const [isProcessing, setIsProcessing] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Auto-hide copied message after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleImprove = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to improve');
      return;
    }

    // Check quota
    if (userQuota && userQuota.used >= userQuota.limit) {
      setError('You have reached your monthly AI improvement limit. Please upgrade to continue.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUsageStats(null);

    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve prompt');
      }

      const data = await response.json();
      setImprovedPrompt(data.improvedPrompt);
      setUsageStats(data.usageStats);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [prompt, mode, userQuota]);

  const handleApply = useCallback(() => {
    if (improvedPrompt.trim()) {
      onImproved(improvedPrompt);
    }
  }, [improvedPrompt, onImproved]);

  const handleReset = useCallback(() => {
    setImprovedPrompt('');
    setError(null);
    setUsageStats(null);
    setShowSuccess(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (improvedPrompt) {
      try {
        await navigator.clipboard.writeText(improvedPrompt);
        setCopied(true);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [improvedPrompt]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to improve
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isProcessing && prompt.trim()) {
        handleImprove();
      }
    }

    // Escape to cancel
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [handleImprove, isProcessing, prompt, onCancel]);

  const getModeDescription = (selectedMode: ImprovementMode) => {
    return selectedMode === 'tighten'
      ? 'Make the prompt more concise and focused'
      : 'Expand the prompt with more detail and context';
  };

  const getModeIcon = (selectedMode: ImprovementMode) => {
    return selectedMode === 'tighten' ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />;
  };

  const formatCost = (costCents: number) => {
    return `$${(costCents / 100).toFixed(4)}`;
  };

  const formatTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Improvement
            <div className="flex items-center gap-1 ml-2">
              <Info className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Ctrl+Enter to improve</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Improvement Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['tighten', 'expand'] as ImprovementMode[]).map((improvementMode) => (
                <button
                  key={improvementMode}
                  onClick={() => setMode(improvementMode)}
                  className={`p-4 rounded-lg border-2 transition-all ${mode === improvementMode
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  aria-label={`Select ${improvementMode} mode`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getModeIcon(improvementMode)}
                    <span className="font-medium capitalize">{improvementMode}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getModeDescription(improvementMode)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quota Display */}
          {userQuota && (
            <QuotaMeter
              used={userQuota.used}
              limit={userQuota.limit}
              resetDate={userQuota.resetDate}
              onUpgrade={onUpgrade}
              variant="compact"
              className="mb-4"
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleImprove}
              disabled={isProcessing || !prompt.trim()}
              className="flex-1"
              aria-label="Improve prompt using AI"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve Prompt
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} aria-label="Cancel improvement">
              Cancel
            </Button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  Prompt improved successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improved Prompt Display */}
      {improvedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Improved Prompt</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  aria-label="Copy improved prompt"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} aria-label="Reset improvement">
                  Reset
                </Button>
                <Button size="sm" onClick={handleApply} aria-label="Apply improved prompt">
                  Apply Changes
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                {improvedPrompt}
              </div>
            </div>

            {/* Usage Statistics */}
            {usageStats && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Usage Statistics
                  </span>
                  {usageStats.isMockMode && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                      🔧 Mock Mode
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                    <span className="ml-2 font-medium">{usageStats.provider}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Model:</span>
                    <span className="ml-2 font-medium">{usageStats.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                    <span className="ml-2 font-medium">
                      {usageStats.inputTokens} → {usageStats.outputTokens}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                    <span className="ml-2 font-medium">{formatCost(usageStats.costCents)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                    <span className="ml-2 font-medium">{formatTime(usageStats.responseTimeMs)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-right">
              {improvedPrompt.length} characters
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
