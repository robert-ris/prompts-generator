import { supabase } from './client';
import type {
  PromptTemplate,
  PromptTemplateInsert,
  PromptTemplateUpdate,
  TemplateVariables,
} from '@/types/database';

export async function getPromptTemplate(
  templateId: string
): Promise<PromptTemplate | null> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('Error fetching prompt template:', error);
    return null;
  }

  return data;
}

export async function getPromptTemplatesByUser(
  userId: string
): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user prompt templates:', error);
    return [];
  }

  return data || [];
}

export async function getPublicPromptTemplates(
  limit = 20,
  offset = 0
): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching public prompt templates:', error);
    return [];
  }

  return data || [];
}

export async function searchPromptTemplates(
  query: string,
  limit = 20,
  offset = 0
): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .textSearch('title', query, {
      type: 'websearch',
      config: 'english',
    })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error searching prompt templates:', error);
    return [];
  }

  return data || [];
}

export async function createPromptTemplate(
  template: PromptTemplateInsert
): Promise<PromptTemplate | null> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .insert(template)
    .select()
    .single();

  if (error) {
    console.error('Error creating prompt template:', error);
    return null;
  }

  return data;
}

export async function updatePromptTemplate(
  templateId: string,
  updates: PromptTemplateUpdate
): Promise<PromptTemplate | null> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt template:', error);
    return null;
  }

  return data;
}

export async function deletePromptTemplate(
  templateId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('prompt_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('Error deleting prompt template:', error);
    return false;
  }

  return true;
}

export async function incrementTemplateUsage(
  templateId: string
): Promise<boolean> {
  const { error } = await supabase.rpc('increment_template_usage', {
    template_id: templateId,
  });

  if (error) {
    console.error('Error incrementing template usage:', error);
    return false;
  }

  return true;
}

export async function ratePromptTemplate(
  templateId: string,
  rating: number
): Promise<boolean> {
  const { error } = await supabase.rpc('update_template_rating', {
    template_id: templateId,
    new_rating: rating,
  });

  if (error) {
    console.error('Error rating prompt template:', error);
    return false;
  }

  return true;
}

export async function getPromptTemplatesByCategory(
  category: string,
  limit = 20,
  offset = 0
): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('category', category)
    .eq('is_public', true)
    .order('usage_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching templates by category:', error);
    return [];
  }

  return data || [];
}

export async function getFeaturedPromptTemplates(
  limit = 10
): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .eq('is_featured', true)
    .eq('is_public', true)
    .order('rating_average', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured templates:', error);
    return [];
  }

  return data || [];
}

export async function getPromptTemplatesByTags(
  tags: string[],
  limit = 20,
  offset = 0
): Promise<PromptTemplate[]> {
  const { data, error } = await supabase
    .from('prompt_templates')
    .select('*')
    .overlaps('tags', tags)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching templates by tags:', error);
    return [];
  }

  return data || [];
}

// Helper function to extract variables from template content
export function extractTemplateVariables(content: string): TemplateVariables {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: TemplateVariables = {};
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    const variableName = match[1];
    variables[variableName] = '';
  }

  return variables;
}

// Helper function to process template with variables
export function processTemplate(
  content: string,
  variables: TemplateVariables
): string {
  let processedContent = content;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    processedContent = processedContent.replace(regex, value || `[${key}]`);
  });

  return processedContent;
}
