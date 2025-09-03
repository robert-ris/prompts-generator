import { supabase } from './client';
import type {
  AIUsageLog,
  AIUsageLogInsert,
  UserQuota,
  UserQuotaInsert,
  AIProviderConfig,
} from '@/types/database';

// AI Usage Logs Management
export async function logAIUsage(
  usage: AIUsageLogInsert
): Promise<AIUsageLog | null> {
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .insert(usage)
    .select()
    .single();

  if (error) {
    console.error('Error logging AI usage:', error);
    return null;
  }

  return data;
}

export async function getAIUsageByUser(
  userId: string,
  limit = 50,
  offset = 0
): Promise<AIUsageLog[]> {
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching AI usage logs:', error);
    return [];
  }

  return data || [];
}

export async function getAIUsageByTemplate(
  templateId: string,
  limit = 20,
  offset = 0
): Promise<AIUsageLog[]> {
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching template usage logs:', error);
    return [];
  }

  return data || [];
}

export async function getAIUsageStats(
  userId: string,
  days = 30
): Promise<{
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
  averageResponseTime: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching AI usage stats:', error);
    return {
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      successRate: 0,
      averageResponseTime: 0,
    };
  }

  const logs = data || [];
  const totalCalls = logs.length;
  const totalTokens = logs.reduce(
    (sum, log) => sum + log.input_tokens + log.output_tokens,
    0
  );
  const totalCost = logs.reduce((sum, log) => sum + log.cost_cents, 0);
  const successRate =
    totalCalls > 0
      ? (logs.filter(log => log.success).length / totalCalls) * 100
      : 0;
  const averageResponseTime =
    logs.length > 0
      ? logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) /
        logs.length
      : 0;

  return {
    totalCalls,
    totalTokens,
    totalCost,
    successRate,
    averageResponseTime,
  };
}

// User Quotas Management
export async function getUserQuota(userId: string): Promise<UserQuota | null> {
  const { data, error } = await supabase
    .from('user_quotas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user quota:', error);
    return null;
  }

  return data;
}

export async function createUserQuota(
  quota: UserQuotaInsert
): Promise<UserQuota | null> {
  const { data, error } = await supabase
    .from('user_quotas')
    .insert(quota)
    .select()
    .single();

  if (error) {
    console.error('Error creating user quota:', error);
    return null;
  }

  return data;
}

export async function updateUserQuota(
  userId: string,
  updates: Partial<UserQuota>
): Promise<UserQuota | null> {
  const { data, error } = await supabase
    .from('user_quotas')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user quota:', error);
    return null;
  }

  return data;
}

export async function checkAndIncrementQuota(
  userId: string,
  operationType: 'tighten' | 'expand' | 'improve' | 'generate',
  inputTokens: number,
  outputTokens: number,
  costCents: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('increment_quota_usage', {
    user_uuid: userId,
    operation_type: operationType,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_cents: costCents,
  });

  if (error) {
    console.error('Error checking/incrementing quota:', error);
    return false;
  }

  return data;
}

export async function getUserQuotaStatus(userId: string): Promise<{
  user_id: string;
  ai_improve_calls_used: number;
  ai_improve_calls_limit: number;
  ai_generate_calls_used: number;
  ai_generate_calls_limit: number;
  total_tokens_used: number;
  total_tokens_limit: number;
  total_cost_cents: number;
  quota_reset_date: string;
  can_use_improve: boolean;
  can_use_generate: boolean;
  can_use_tokens: boolean;
} | null> {
  const { data, error } = await supabase.rpc('get_user_quota_status', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching user quota status:', error);
    return null;
  }

  return data?.[0] || null;
}

// AI Provider Configs Management
export async function getAIProviderConfigs(): Promise<AIProviderConfig[]> {
  const { data, error } = await supabase
    .from('ai_provider_configs')
    .select('*')
    .eq('is_active', true)
    .order('provider_name', { ascending: true });

  if (error) {
    console.error('Error fetching AI provider configs:', error);
    return [];
  }

  return data || [];
}

export async function getAIProviderConfig(
  providerName: string,
  modelName: string
): Promise<AIProviderConfig | null> {
  const { data, error } = await supabase
    .from('ai_provider_configs')
    .select('*')
    .eq('provider_name', providerName)
    .eq('model_name', modelName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching AI provider config:', error);
    return null;
  }

  return data;
}

// Cost calculation utilities
export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  inputCostPer1k: number,
  outputCostPer1k: number
): number {
  const inputCost = (inputTokens / 1000) * inputCostPer1k;
  const outputCost = (outputTokens / 1000) * outputCostPer1k;
  return Math.round(inputCost + outputCost);
}

export function formatCost(costCents: number): string {
  return `$${(costCents / 100).toFixed(4)}`;
}

// Quota validation utilities
export function canUseAIImprove(
  quotaStatus: NonNullable<Awaited<ReturnType<typeof getUserQuotaStatus>>>
): boolean {
  return quotaStatus.can_use_improve && quotaStatus.can_use_tokens;
}

export function canUseAIGenerate(
  quotaStatus: NonNullable<Awaited<ReturnType<typeof getUserQuotaStatus>>>
): boolean {
  return quotaStatus.can_use_generate && quotaStatus.can_use_tokens;
}

export function getQuotaUsagePercentage(
  quotaStatus: NonNullable<Awaited<ReturnType<typeof getUserQuotaStatus>>>
): {
  improve: number;
  generate: number;
  tokens: number;
} {
  return {
    improve:
      (quotaStatus.ai_improve_calls_used / quotaStatus.ai_improve_calls_limit) *
      100,
    generate:
      (quotaStatus.ai_generate_calls_used /
        quotaStatus.ai_generate_calls_limit) *
      100,
    tokens:
      (quotaStatus.total_tokens_used / quotaStatus.total_tokens_limit) * 100,
  };
}

// Reset quota utilities
export async function resetUserQuota(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_quotas')
    .update({
      ai_improve_calls_used: 0,
      ai_generate_calls_used: 0,
      total_tokens_used: 0,
      total_cost_cents: 0,
      quota_reset_date: new Date().toISOString().split('T')[0],
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error resetting user quota:', error);
    return false;
  }

  return true;
}
