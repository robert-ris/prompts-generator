'use client';

import {useState, useCallback, useEffect} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {AIImprove} from './AIImprove';
import {AIUsageDisplay} from './AIUsageDisplay';
import {PromptTemplate} from '@/types';
import {PromptTemplate as DatabasePromptTemplate, CoreSettings, AdvancedSettings} from '@/types/database';
import {CoreSettingsPanel, AdvancedSettingsPanel} from './SettingsPanels';
import {useUserQuota} from '@/hooks/useUserQuota';
import {Sparkles, Save, Users, User, AlertCircle, CheckCircle, Settings, Plus, Trash2, ChevronDown, ChevronRight} from 'lucide-react';

interface PromptBuilderProps {
  onSave?: (prompt: PromptTemplate) => void;
}

type SaveLocation = 'personal' | 'community';

export function PromptBuilder({onSave}: PromptBuilderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('edit');

  // Step 1: Initial prompt idea
  const [promptIdea, setPromptIdea] = useState('');

  // Step 2: AI improvement
  const [showAIImprove, setShowAIImprove] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState('');

  // Step 3: Save form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saveLocation, setSaveLocation] = useState<SaveLocation>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Advanced options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [coreSettings, setCoreSettings] = useState<CoreSettings>({});
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({});

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get user quota
  const {quota, refreshQuota} = useUserQuota();

  // Load prompt for editing
  useEffect(() => {
    if (editId) {
      loadPromptForEdit(editId);
    }
  }, [editId]);

  const loadPromptForEdit = useCallback(async (promptId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prompts/${promptId}`);
      if (!response.ok) {
        throw new Error('Failed to load prompt');
      }

      const data = await response.json();
      const prompt: DatabasePromptTemplate = data.prompt;

      // Populate form with existing data
      setTitle(prompt.title);
      setDescription(prompt.description || '');
      setImprovedPrompt(prompt.template_content || prompt.content);
      setCoreSettings(prompt.core_settings || {});
      setAdvancedSettings(prompt.advanced_settings || {});
      setSaveLocation(prompt.is_public ? 'community' : 'personal');
      setIsEditMode(true);
    } catch (error) {
      console.error('Error loading prompt:', error);
      setSaveError('Failed to load prompt for editing');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle AI improvement directly
  const handleDirectAIImprove = useCallback(async () => {
    if (!promptIdea.trim()) {
      setSaveError('Please enter a prompt idea first');
      return;
    }

    // Check quota
    if (quota && quota.used >= quota.limit) {
      setSaveError('You have reached your monthly AI improvement limit. Please upgrade to continue.');
      return;
    }

    setIsSaving(true); // Reuse loading state
    setSaveError(null);

    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptIdea,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve prompt');
      }

      const data = await response.json();
      refreshQuota(); // Refresh quota after successful improvement

      // Redirect to review page with the improved prompt data
      const reviewData = {
        promptIdea,
        improvedPrompt: data.improvedPrompt,
        coreSettings,
        advancedSettings,
        editId: editId || null
      };

      // Store data in sessionStorage for the review page
      sessionStorage.setItem('promptReviewData', JSON.stringify(reviewData));

      // Redirect to review page immediately
      router.push('/dashboard/builder/review');
    } catch (error) {
      console.error('Error improving prompt:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to improve prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [promptIdea, quota, refreshQuota]);

  // Check if required fields are completed for Improve Prompt button
  const isImprovePromptEnabled = useCallback(() => {
    return promptIdea.trim() &&
      coreSettings.role &&
      coreSettings.niche &&
      coreSettings.taskType;
  }, [promptIdea, coreSettings]);

  const handleAICancel = useCallback(() => {
    setShowAIImprove(false);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setSaveError('Please enter a title for your prompt');
      return;
    }

    if (!improvedPrompt.trim()) {
      setSaveError('Please improve your prompt with AI before saving');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const url = isEditMode ? `/api/prompts/${editId}` : '/api/prompts';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          templateContent: improvedPrompt,
          category: 'custom',
          coreSettings: coreSettings,
          advancedSettings: advancedSettings,
          tags: [],
          isPublic: saveLocation === 'community',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'save'} prompt`);
      }

      const data = await response.json();

      if (onSave) {
        onSave(data.prompt);
      }

      // Reset form after successful save
      if (!isEditMode) {
        setTitle('');
        setDescription('');
        setImprovedPrompt('');
        setPromptIdea('');
      }
      setSaveSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving prompt:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, improvedPrompt, saveLocation, coreSettings, advancedSettings, onSave, isEditMode, editId]);

  // Reset form
  const handleReset = useCallback(() => {
    setPromptIdea('');
    setImprovedPrompt('');
    setTitle('');
    setDescription('');
    setSaveLocation('personal');
    setSaveError(null);
    setSaveSuccess(false);
    setShowAdvancedOptions(false);
    setCoreSettings({});
    setAdvancedSettings({});
  }, []);

  // Clear error when user makes changes
  useEffect(() => {
    if (saveError) {
      setSaveError(null);
    }
  }, [promptIdea, coreSettings, advancedSettings]);

  return (
    <div className="space-y-6">
      {/* Loading state for edit mode */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading prompt for editing...</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Prompt Idea Input */}
      {!showAIImprove && !improvedPrompt && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Start with Your Prompt Idea
            </CardTitle>
            <CardDescription>
              Describe what you want your AI prompt to do. Be as specific or general as you'd like - our AI will help refine it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="prompt-idea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Prompt Idea
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Textarea
                id="prompt-idea"
                value={promptIdea}
                onChange={(e) => setPromptIdea(e.target.value)}
                placeholder="e.g., 'I want a prompt that helps me write professional emails' or 'Create a prompt for generating creative story ideas'"
                className="min-h-[120px]"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {promptIdea.length} characters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Improvement */}
      {showAIImprove && !isLoading && (
        <AIImprove
          prompt={promptIdea}
          onImproved={(improved: string) => {
            setImprovedPrompt(improved);
            setShowAIImprove(false);
            refreshQuota();
          }}
          onCancel={handleAICancel}
          userQuota={quota ? {used: quota.used, limit: quota.limit} : undefined}
        />
      )}

      {/* Settings Panels - Always Visible */}
      <div className="space-y-4">
        <CoreSettingsPanel
          settings={coreSettings}
          onChange={setCoreSettings}
        />
        <AdvancedSettingsPanel
          settings={advancedSettings}
          onChange={setAdvancedSettings}
        >
          {/* Improve Prompt Button - Always Visible */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleDirectAIImprove}
              disabled={!isImprovePromptEnabled() || isSaving}
              size="lg"
              className="px-8"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Improve Prompt with AI
                </>
              )}
            </Button>
          </div>

          {/* Required Fields Info */}
          {!isImprovePromptEnabled() && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete all required fields to enable AI improvement:
              </p>
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {!promptIdea.trim() && <span className="block">• Prompt Idea</span>}
                {!coreSettings.role && <span className="block">• Role</span>}
                {!coreSettings.niche && <span className="block">• Niche / Domain</span>}
                {!coreSettings.taskType && <span className="block">• Task Type</span>}
              </div>
            </div>
          )}

          {/* AI Improvement Error Display */}
          {saveError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
              </div>
            </div>
          )}
        </AdvancedSettingsPanel>
      </div>

      {/* Step 3: Improved Prompt Display and Save Form - Only in Edit Mode */}
      {improvedPrompt && !showAIImprove && !isLoading && isEditMode && (
        <div className="space-y-6">
          {/* Improved Prompt Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Improved Prompt
              </CardTitle>
              <CardDescription>
                Review and edit your AI-improved prompt before saving it to your library.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="improved-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt Content
                  </label>
                  <Textarea
                    id="improved-prompt"
                    value={improvedPrompt}
                    onChange={(e) => setImprovedPrompt(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {improvedPrompt.length} characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAIImprove(true)}
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Improve Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-blue-500" />
                Save Your Prompt
              </CardTitle>
              <CardDescription>
                Add details and choose where to save your prompt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prompt-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt Title *
                  </label>
                  <Input
                    id="prompt-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Professional Email Writer"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="prompt-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <Input
                    id="prompt-description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of what this prompt does"
                  />
                </div>
              </div>

              {/* Save Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Save Location
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSaveLocation('personal')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${saveLocation === 'personal'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Personal Library</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Save privately for your own use
                    </p>
                  </button>

                  <button
                    onClick={() => setSaveLocation('community')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${saveLocation === 'community'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Community Library</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share with other users
                    </p>
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {saveError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
                  </div>
                </div>
              )}

              {/* Success Display */}
              {saveSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Prompt saved successfully!
                    </p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving || !title.trim() || !improvedPrompt.trim()}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Prompt' : 'Save Prompt'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Usage Display */}
      <div className="mt-6">
        <AIUsageDisplay />
      </div>
    </div>
  );
}