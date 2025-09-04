'use client';

import {useState, useCallback, useMemo} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {SlotFillers} from './SlotFillers';
import {LivePreview} from './LivePreview';
import {AIImprove} from './AIImprove';
import {AIUsageDisplay} from './AIUsageDisplay';
import {PromptTemplate} from '@/types';
import {processTemplate, validateTemplate, PromptVariables} from '@/lib/prompt-processing';
import {useUserQuota} from '@/hooks/useUserQuota';

interface PromptBuilderProps {
  onSave?: (prompt: PromptTemplate) => void;
  initialTemplate?: string;
}

const DEFAULT_TEMPLATE = `You are a {{role}} expert. Please help me with {{topic}} in a {{tone}} manner. The output should be {{outputType}}.`;

export function PromptBuilder({onSave, initialTemplate = DEFAULT_TEMPLATE}: PromptBuilderProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [variables, setVariables] = useState<PromptVariables>({
    role: '',
    topic: '',
    tone: '',
    outputType: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAIImprove, setShowAIImprove] = useState(false);

  // Get user quota
  const {quota, refreshQuota} = useUserQuota();

  // Process template with variables
  const processedTemplate = useMemo(() => {
    return processTemplate(template, variables);
  }, [template, variables]);

  // Handle variable changes
  const handleVariableChange = useCallback((key: keyof PromptVariables, value: string) => {
    setVariables(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Handle template changes
  const handleTemplateChange = useCallback((newTemplate: string) => {
    setTemplate(newTemplate);
    // Validate template
    const validation = validateTemplate(newTemplate);
    setValidationErrors(validation.errors);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      alert('Please enter a title for your prompt');
      return;
    }

    if (validationErrors.length > 0) {
      alert('Please fix template errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          templateContent: template,
          category: 'custom',
          variables,
          tags: [],
          isPublic: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prompt');
      }

      const data = await response.json();

      if (onSave) {
        onSave(data.prompt);
      }

      // Reset form after successful save
      setTitle('');
      alert('Prompt saved successfully!');
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert(error instanceof Error ? error.message : 'Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [title, template, variables, validationErrors, onSave]);

  // Handle AI improvement
  const handleAIImprove = useCallback((improvedTemplate: string) => {
    setTemplate(improvedTemplate);
    setShowAIImprove(false);
    refreshQuota(); // Refresh quota after successful improvement
  }, [refreshQuota]);

  const handleAICancel = useCallback(() => {
    setShowAIImprove(false);
  }, []);

  return (
    <div className="space-y-6">
      {showAIImprove ? (
        <AIImprove
          prompt={template}
          onImproved={handleAIImprove}
          onCancel={handleAICancel}
          userQuota={quota ? {used: quota.used, limit: quota.limit} : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Builder Interface */}
          <div className="space-y-6">
            {/* Template Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Template Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt Template
                  </label>
                  <textarea
                    id="template"
                    value={template}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className={`w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 ${validationErrors.length > 0
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                      }`}
                    placeholder="Enter your prompt template with variables like {{role}}, {{topic}}, etc."
                  />
                  {validationErrors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {validationErrors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 dark:text-red-400">
                          ⚠️ {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAIImprove(true)}
                    disabled={!template.trim()}
                    className="flex-1"
                  >
                    🤖 AI Improve
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Variable Fillers */}
            <SlotFillers
              variables={variables}
              onVariableChange={handleVariableChange}
            />

            {/* Save Section */}
            <Card>
              <CardHeader>
                <CardTitle>Save Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Enter a title for your prompt"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || validationErrors.length > 0}
                  className="w-full"
                >
                  {isSaving ? 'Saving...' : 'Save to Library'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Preview */}
          <div>
            <LivePreview
              processedTemplate={processedTemplate}
              variables={variables}
            />
            <div className="mt-6">
              <AIUsageDisplay />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
