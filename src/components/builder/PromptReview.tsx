'use client';

import {useState, useCallback, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {
  Sparkles,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Users,
  RefreshCw,
  Settings,
  Eye,
  Edit3
} from 'lucide-react';
import {CoreSettings, AdvancedSettings} from '@/types/database';
import {useUserQuota} from '@/hooks/useUserQuota';

interface ReviewData {
  promptIdea: string;
  improvedPrompt: string;
  coreSettings: CoreSettings;
  advancedSettings: AdvancedSettings;
  editId: string | null;
}

export function PromptReview() {
  const router = useRouter();
  const {quota, refreshQuota} = useUserQuota();

  // State for review data
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for current prompt
  const [currentPrompt, setCurrentPrompt] = useState('');

  // State for save form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saveLocation, setSaveLocation] = useState<'personal' | 'community'>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for re-improvement
  const [isReImproving, setIsReImproving] = useState(false);
  const [reImproveError, setReImproveError] = useState<string | null>(null);

  // Load review data from sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem('promptReviewData');
    if (data) {
      try {
        const parsedData: ReviewData = JSON.parse(data);
        setReviewData(parsedData);
        setCurrentPrompt(parsedData.improvedPrompt);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing review data:', error);
        router.push('/dashboard/builder');
      }
    } else {
      router.push('/dashboard/builder');
    }
  }, [router]);

  // Handle re-improvement
  const handleReImprove = useCallback(async () => {
    if (!reviewData) return;

    // Check quota
    if (quota && quota.used >= quota.limit) {
      setReImproveError('You have reached your monthly AI improvement limit. Please upgrade to continue.');
      return;
    }

    setIsReImproving(true);
    setReImproveError(null);

    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve prompt');
      }

      const data = await response.json();
      setCurrentPrompt(data.improvedPrompt);
      refreshQuota();
    } catch (error) {
      console.error('Error re-improving prompt:', error);
      setReImproveError(error instanceof Error ? error.message : 'Failed to improve prompt. Please try again.');
    } finally {
      setIsReImproving(false);
    }
  }, [reviewData, currentPrompt, quota, refreshQuota]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setSaveError('Please enter a title for your prompt');
      return;
    }

    if (!currentPrompt.trim()) {
      setSaveError('Please enter prompt content');
      return;
    }

    if (!reviewData) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const url = reviewData.editId ? `/api/prompts/${reviewData.editId}` : '/api/prompts';
      const method = reviewData.editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          templateContent: currentPrompt,
          category: 'custom',
          coreSettings: reviewData.coreSettings,
          advancedSettings: reviewData.advancedSettings,
          tags: [],
          isPublic: saveLocation === 'community',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save prompt error response:', errorData);
        throw new Error(errorData.error || `Failed to ${reviewData.editId ? 'update' : 'save'} prompt`);
      }

      setSaveSuccess(true);

      // Clear sessionStorage and redirect after successful save
      sessionStorage.removeItem('promptReviewData');
      setTimeout(() => {
        router.push('/dashboard/library');
      }, 2000);
    } catch (error) {
      console.error('Error saving prompt:', error);
      console.error('Request data:', {
        url,
        method,
        body: {
          title: title.trim(),
          description: description.trim(),
          templateContent: currentPrompt,
          category: 'custom',
          coreSettings: reviewData.coreSettings,
          advancedSettings: reviewData.advancedSettings,
          tags: [],
          isPublic: saveLocation === 'community',
        }
      });
      setSaveError(error instanceof Error ? error.message : 'Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, currentPrompt, saveLocation, reviewData, router]);

  // Handle back to builder
  const handleBackToBuilder = useCallback(() => {
    sessionStorage.removeItem('promptReviewData');
    router.push('/dashboard/builder');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your improved prompt...</p>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No prompt data found. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleBackToBuilder}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Review Your Improved Prompt
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review, refine, and save your AI-enhanced prompt
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              AI Enhanced
            </Badge>
          </div>
        </div>

        {/* Original Prompt Idea */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="h-5 w-5 text-blue-500" />
              Original Prompt Idea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-gray-900 dark:text-gray-100">{reviewData.promptIdea}</p>
            </div>
          </CardContent>
        </Card>

        {/* Settings Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-purple-500" />
              Applied Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Core Settings */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Core Settings</h4>
                <div className="space-y-1">
                  {reviewData.coreSettings.role && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Role:</span>
                      <span className="font-medium">{reviewData.coreSettings.role}</span>
                    </div>
                  )}
                  {reviewData.coreSettings.niche && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Niche:</span>
                      <span className="font-medium">{reviewData.coreSettings.niche}</span>
                    </div>
                  )}
                  {reviewData.coreSettings.taskType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Task Type:</span>
                      <span className="font-medium">{reviewData.coreSettings.taskType}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Advanced Settings</h4>
                <div className="space-y-1">
                  {reviewData.advancedSettings.perspective && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Perspective:</span>
                      <span className="font-medium">{reviewData.advancedSettings.perspective}</span>
                    </div>
                  )}
                  {reviewData.advancedSettings.creativityLevel && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Creativity:</span>
                      <span className="font-medium">{reviewData.advancedSettings.creativityLevel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Improved Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-500" />
                Improved Prompt
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReImprove}
                  disabled={isReImproving}
                >
                  {isReImproving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Improve Again
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Review and edit your AI-improved prompt. You can make further improvements or save it as is.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                className="min-h-[200px] text-sm"
                placeholder="Your improved prompt will appear here..."
              />
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{currentPrompt.length} characters</span>
                <span>You can edit this prompt directly</span>
              </div>
            </div>

            {/* Re-improvement Error */}
            {reImproveError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-400">{reImproveError}</p>
                </div>
              </div>
            )}
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
              Add a title and description, then choose where to save your prompt.
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
                    Prompt saved successfully! Redirecting to library...
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !currentPrompt.trim()}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {reviewData.editId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {reviewData.editId ? 'Update Prompt' : 'Save Prompt'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
