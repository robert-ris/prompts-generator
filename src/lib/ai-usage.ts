/**
 * Utility functions for AI usage tracking and quota management
 */

import { createClient } from '@/lib/supabase/client';

export interface AIUsageStats {
  used: number;
  limit: number;
  resetDate: Date;
  remaining: number;
  percentageUsed: number;
}

export interface AIUsageLog {
  userId: string;
  operationType: 'tighten' | 'expand';
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Get current user's AI usage statistics
 */
export async function getUserAIUsage(): Promise<AIUsageStats | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_quotas')
      .select('ai_improve_calls_used, ai_improve_calls_limit, quota_reset_date')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching AI usage:', error);
      return null;
    }

    const used = data.ai_improve_calls_used;
    const limit = data.ai_improve_calls_limit;
    const resetDate = new Date(data.quota_reset_date);

    return {
      used,
      limit,
      resetDate,
      remaining: Math.max(0, limit - used),
      percentageUsed: limit > 0 ? (used / limit) * 100 : 0,
    };
  } catch (error) {
    console.error('Error getting AI usage:', error);
    return null;
  }
}

/**
 * Log AI usage to the database
 */
export async function logAIUsage(log: AIUsageLog): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from('ai_usage_logs').insert({
      user_id: log.userId,
      operation_type: log.operationType,
      input_tokens: log.inputTokens,
      output_tokens: log.outputTokens,
      success: log.success,
      error_message: log.errorMessage,
    });

    if (error) {
      console.error('Error logging AI usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging AI usage:', error);
    return false;
  }
}

/**
 * Update user quota after AI usage
 */
export async function updateUserQuota(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('user_quotas')
      .update({
        ai_improve_calls_used: supabase.rpc('increment_ai_calls_used'),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user quota:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating user quota:', error);
    return false;
  }
}

/**
 * Check if user has exceeded their AI usage limit
 */
export async function hasExceededAILimit(): Promise<boolean> {
  const usage = await getUserAIUsage();
  return usage ? usage.used >= usage.limit : false;
}

/**
 * Get formatted time until quota reset
 */
export function getTimeUntilReset(resetDate: Date): string {
  const now = new Date();
  const diff = resetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Reset now';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  } else {
    return 'Less than 1 hour remaining';
  }
}

/**
 * Estimate token count from text (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}
