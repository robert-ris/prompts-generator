'use client';

import {useState, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Copy, Check} from 'lucide-react';
import {PromptVariables} from '@/lib/prompt-processing';

interface LivePreviewProps {
  processedTemplate: string;
  variables: PromptVariables;
}

export function LivePreview({processedTemplate, variables}: LivePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(processedTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = processedTemplate;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [processedTemplate]);

  const hasVariables = Object.values(variables).some(value => value.trim() !== '');

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Preview</CardTitle>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preview Area */}
          <div className="min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
              {processedTemplate}
            </div>
          </div>

          {/* Variable Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Variable Status
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(variables).map(([key, value]) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 p-2 rounded ${value.trim()
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${value.trim() ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                  />
                  <span className="capitalize">{key}:</span>
                  <span className="truncate">
                    {value.trim() || `[${key}]`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {!hasVariables && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Fill in the variables on the left to see your prompt come to life!
              </p>
            </div>
          )}

          {/* Character Count */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {processedTemplate.length} characters
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
