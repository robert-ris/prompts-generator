'use client';

import {useState, useEffect, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Save,
  Copy,
  Trash2,
  Star,
  Calendar,
  Tag,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import {PromptTemplate as DatabasePromptTemplate} from '@/types/database';

interface PromptViewerProps {
  promptId: string;
}

export function PromptViewer({promptId}: PromptViewerProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<DatabasePromptTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [coreSettings, setCoreSettings] = useState<Record<string, any>>({});
  const [advancedSettings, setAdvancedSettings] = useState<Record<string, any>>({});

  // Load prompt data
  useEffect(() => {
    loadPrompt();
  }, [promptId]);

  const loadPrompt = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/prompts/${promptId}`);
      if (!response.ok) {
        throw new Error('Failed to load prompt');
      }

      const data = await response.json();
      const promptData: DatabasePromptTemplate = data.prompt;

      setPrompt(promptData);
      setTitle(promptData.title);
      setDescription(promptData.description || '');
      setContent(promptData.template_content || promptData.content);
      setCategory(promptData.category || 'custom');
      setTags(promptData.tags || []);
      setIsPublic(promptData.is_public || false);
      setCoreSettings(promptData.core_settings || {});
      setAdvancedSettings(promptData.advanced_settings || {});
    } catch (err) {
      console.error('Error loading prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prompt');
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setSaveError('Title is required');
      return;
    }

    if (!content.trim()) {
      setSaveError('Content is required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          templateContent: content.trim(),
          category: category || 'custom',
          coreSettings: coreSettings,
          advancedSettings: advancedSettings,
          tags: tags,
          isPublic: isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prompt');
      }

      const data = await response.json();
      setPrompt(data.prompt);
      setIsEditing(false);
      setSaveSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving prompt:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  }, [promptId, title, description, content, category, tags, isPublic, coreSettings, advancedSettings]);

  const handleCopy = useCallback(async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        // TODO: Show toast notification
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [content]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      // Redirect back to library
      router.push('/dashboard/library');
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  }, [promptId, router]);

  const handleToggleFavorite = useCallback(async () => {
    if (!prompt) return;

    try {
      const newMetadata = {
        ...prompt.metadata,
        isFavorite: !prompt.metadata?.isFavorite,
      };

      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: prompt.title,
          description: prompt.description,
          templateContent: prompt.template_content || prompt.content,
          category: prompt.category,
          coreSettings: coreSettings,
          advancedSettings: advancedSettings,
          tags: prompt.tags,
          isPublic: prompt.is_public,
          metadata: newMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }

      const data = await response.json();
      setPrompt(data.prompt);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to update favorite status');
    }
  }, [promptId, prompt]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading prompt...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Error Loading Prompt
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Prompt not found'}
            </p>
            <Button onClick={() => router.push('/dashboard/library')}>
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Prompt' : 'View Prompt'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditing ? 'Make changes to your prompt' : 'View and manage your prompt'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button
                variant="outline"
                onClick={handleToggleFavorite}
                className="flex items-center gap-2"
              >
                <Star className={`h-4 w-4 ${prompt.metadata?.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                {prompt.metadata?.isFavorite ? 'Favorited' : 'Add to Favorites'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !title.trim() || !content.trim()}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Prompt updated successfully!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {saveError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {saveError}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-500" />
                Title
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter prompt title..."
                  className="text-lg font-semibold"
                />
              ) : (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {prompt.title}
                </h2>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter prompt description..."
                  rows={3}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  {prompt.description || 'No description provided'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-green-500" />
                Prompt Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your prompt content..."
                  rows={10}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {prompt.template_content || prompt.content}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Created: {new Date(prompt.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Used: {prompt.usage_count || 0} times
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {prompt.category || 'custom'}
                </Badge>
                {prompt.is_public && (
                  <Badge variant="secondary">Public</Badge>
                )}
                {prompt.metadata?.isFavorite && (
                  <Badge variant="default" className="bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Favorite
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {(prompt.tags || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(prompt.tags || []).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Core Settings */}
          {prompt.core_settings && Object.keys(prompt.core_settings).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Core Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(prompt.core_settings).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Settings */}
          {prompt.advanced_settings && Object.keys(prompt.advanced_settings).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(prompt.advanced_settings).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {Array.isArray(value) ? value.join(', ') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
