'use client';

import {useState, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Copy,
  Trash2,
  Star,
  Calendar,
  Tag,
  MoreHorizontal
} from 'lucide-react';
import {PromptTemplate as DatabasePromptTemplate} from '@/types/database';
import {usePromptLibrary} from '@/hooks/usePromptLibrary';

type SortOption = 'newest' | 'oldest' | 'name' | 'usage';
type FilterOption = 'all' | 'custom' | 'community' | 'favorites';

export function PromptLibrary() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const {
    prompts,
    loading,
    error,
    deletePrompt,
    toggleFavorite,
    duplicatePrompt,
    refreshPrompts
  } = usePromptLibrary();

  // Filter and sort prompts
  const filteredAndSortedPrompts = useCallback(() => {
    if (!prompts) return [];

    const filtered = prompts.filter(prompt => {
      // Search filter
      const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prompt.template_content || prompt.content).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prompt.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = filterBy === 'all' ||
        (filterBy === 'custom' && prompt.category === 'custom') ||
        (filterBy === 'community' && prompt.category === 'community') ||
        (filterBy === 'favorites' && prompt.metadata?.isFavorite);

      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'usage':
          return (b.usage_count || 0) - (a.usage_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [prompts, searchQuery, sortBy, filterBy]);

  const handleSelectPrompt = useCallback((promptId: string) => {
    setSelectedPrompts(prev =>
      prev.includes(promptId)
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredAndSortedPrompts().map(p => p.id);
    setSelectedPrompts(prev =>
      prev.length === allIds.length ? [] : allIds
    );
  }, [filteredAndSortedPrompts]);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedPrompts.length) return;

    if (confirm(`Are you sure you want to delete ${selectedPrompts.length} prompt(s)?`)) {
      await Promise.all(selectedPrompts.map(id => deletePrompt(id)));
      setSelectedPrompts([]);
      refreshPrompts();
    }
  }, [selectedPrompts, deletePrompt, refreshPrompts]);

  const handleCopyPrompt = useCallback(async (prompt: PromptTemplate) => {
    try {
      await navigator.clipboard.writeText(prompt.templateContent);
      // TODO: Show toast notification
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  }, []);

  const handleCreateNewPrompt = useCallback(() => {
    router.push('/dashboard/builder');
  }, [router]);

  const handleOpenPrompt = useCallback((promptId: string) => {
    router.push(`/dashboard/prompts/${promptId}`);
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">Error loading prompts: {error}</p>
          <Button onClick={refreshPrompts} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayPrompts = filteredAndSortedPrompts();

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>

            {/* New Prompt */}
            <Button
              className="flex items-center gap-2"
              onClick={handleCreateNewPrompt}
            >
              <Plus className="h-4 w-4" />
              New Prompt
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="all">All Categories</option>
                    <option value="custom">Custom</option>
                    <option value="community">Community</option>
                    <option value="favorites">Favorites</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="usage">Most Used</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPrompts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedPrompts.length} prompt(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedPrompts.length === displayPrompts.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts Grid */}
      {displayPrompts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Tag className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No prompts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first prompt to get started'
              }
            </p>
            {!searchQuery && filterBy === 'all' && (
              <Button onClick={handleCreateNewPrompt}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Prompt
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              isSelected={selectedPrompts.includes(prompt.id)}
              onSelect={handleSelectPrompt}
              onOpen={handleOpenPrompt}
              onDelete={deletePrompt}
              onDuplicate={duplicatePrompt}
              onToggleFavorite={toggleFavorite}
              onCopy={handleCopyPrompt}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {displayPrompts.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {displayPrompts.length} of {prompts?.length || 0} prompts
        </div>
      )}
    </div>
  );
}

interface PromptCardProps {
  prompt: DatabasePromptTemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onCopy: (prompt: DatabasePromptTemplate) => Promise<void>;
}

function PromptCard({
  prompt,
  isSelected,
  onSelect,
  onOpen,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onCopy
}: PromptCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      await onDelete(prompt.id);
    }
  };

  const handleDuplicate = async () => {
    await onDuplicate(prompt.id);
  };

  return (
    <Card
      className={`relative transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onOpen(prompt.id)}
    >
      {/* Selection Checkbox */}
      <div
        className="absolute top-3 left-3 z-10 p-1 -m-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(prompt.id);
          }}
          className="h-4 w-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
        />
      </div>

      <CardHeader className="pb-3 pl-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {prompt.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {prompt.category}
              </Badge>
              {prompt.metadata?.isFavorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onOpen(prompt.id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Open/Edit
                  </button>
                  <button
                    onClick={() => {
                      onToggleFavorite(prompt.id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    {prompt.metadata?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                  <button
                    onClick={() => {
                      onCopy(prompt);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Prompt
                  </button>
                  <button
                    onClick={() => {
                      handleDuplicate();
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Prompt Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {prompt.template_content || prompt.content}
          </p>
        </div>

        {/* Tags */}
        {(prompt.tags || []).length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {(prompt.tags || []).slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {(prompt.tags || []).length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{(prompt.tags || []).length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(prompt.created_at).toLocaleDateString()}
            </span>
            <span>Used {prompt.usage_count || 0} times</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
