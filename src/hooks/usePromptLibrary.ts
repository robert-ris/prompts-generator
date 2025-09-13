'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PromptTemplate as DatabasePromptTemplate } from '@/types/database';

export function usePromptLibrary() {
  const [prompts, setPrompts] = useState<DatabasePromptTemplate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setPrompts(data || []);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePrompt = useCallback(async (promptId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', promptId);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setPrompts(prev => prev?.filter(p => p.id !== promptId) || null);
    } catch (err) {
      console.error('Error deleting prompt:', err);
      throw err;
    }
  }, []);

  const toggleFavorite = useCallback(
    async (promptId: string) => {
      try {
        const prompt = prompts?.find(p => p.id === promptId);

        if (!prompt) return;

        const newMetadata = {
          ...prompt.metadata,
          isFavorite: !prompt.metadata?.isFavorite,
        };

        const { error: updateError } = await supabase
          .from('prompt_templates')
          .update({ metadata: newMetadata })
          .eq('id', promptId);

        if (updateError) {
          throw updateError;
        }

        // Update local state
        setPrompts(
          prev =>
            prev?.map(p =>
              p.id === promptId ? { ...p, metadata: newMetadata } : p
            ) || null
        );
      } catch (err) {
        console.error('Error toggling favorite:', err);
        throw err;
      }
    },
    [prompts]
  );

  const duplicatePrompt = useCallback(
    async (promptId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const originalPrompt = prompts?.find(p => p.id === promptId);
        if (!originalPrompt) {
          throw new Error('Prompt not found');
        }

        const duplicatedPrompt = {
          ...originalPrompt,
          id: undefined, // Let Supabase generate new ID
          title: `${originalPrompt.title} (Copy)`,
          created_at: undefined, // Let Supabase set current timestamp
          updated_at: undefined,
          usage_count: 0,
        };

        const { data, error: insertError } = await supabase
          .from('prompt_templates')
          .insert(duplicatedPrompt)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Update local state
        setPrompts(prev => (prev ? [data, ...prev] : [data]));
      } catch (err) {
        console.error('Error duplicating prompt:', err);
        throw err;
      }
    },
    [prompts]
  );

  const updatePromptUsage = useCallback(async (promptId: string) => {
    try {
      // Increment usage count
      const { error: updateError } = await supabase
        .from('prompt_templates')
        .update({
          usage_count: supabase.rpc('increment_usage_count'),
          last_used_at: new Date().toISOString(),
        })
        .eq('id', promptId);

      if (updateError) {
        console.error('Error updating prompt usage:', updateError);
        return;
      }

      // Update local state
      setPrompts(
        prev =>
          prev?.map(p =>
            p.id === promptId
              ? {
                  ...p,
                  usageCount: (p.usageCount || 0) + 1,
                  lastUsedAt: new Date(),
                }
              : p
          ) || null
      );
    } catch (err) {
      console.error('Error updating prompt usage:', err);
    }
  }, []);

  const refreshPrompts = useCallback(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    prompts,
    loading,
    error,
    deletePrompt,
    toggleFavorite,
    duplicatePrompt,
    updatePromptUsage,
    refreshPrompts,
  };
}
