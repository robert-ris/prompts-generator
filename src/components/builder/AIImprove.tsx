'use client';

import {useState, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Loader2, Sparkles, Minimize, Expand} from 'lucide-react';

interface AIImproveProps {
  prompt: string;
  onImproved: (improvedPrompt: string) => void;
  onCancel: () => void;
  userQuota?: {
    used: number;
    limit: number;
  };
}

type ImprovementMode = 'tighten' | 'expand';

export function AIImprove({prompt, onImproved, onCancel, userQuota}: AIImproveProps) {
  const [mode, setMode] = useState<ImprovementMode>('tighten');
  const [isProcessing, setIsProcessing] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const getModeDescription = (selectedMode: ImprovementMode) => {
    return selectedMode === 'tighten'
      ? 'Make the prompt more concise and focused'
      : 'Expand the prompt with more detail and context';
  };

  const getModeIcon = (selectedMode: ImprovementMode) => {
    return selectedMode === 'tighten' ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Improvement
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
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                AI Improvements Used
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {userQuota.used} / {userQuota.limit}
                </span>
                <Badge variant={userQuota.used >= userQuota.limit ? 'destructive' : 'secondary'}>
                  {userQuota.used >= userQuota.limit ? 'Limit Reached' : 'Available'}
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleImprove}
              disabled={isProcessing || !prompt.trim()}
              className="flex-1"
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
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleApply}>
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
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-right">
              {improvedPrompt.length} characters
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
