import { supabase } from './client';
import type { Database } from '@/types/database';

// ============================================================================
// RLS POLICY UTILITIES
// ============================================================================

/**
 * Check if the current user can publish to community
 * @param userId - The user ID to check
 * @returns Promise<boolean> - Whether the user can publish
 */
export async function canPublishToCommunity(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_publish_to_community', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error checking community publish permission:', error);
    return false;
  }

  return data || false;
}

/**
 * Check if the current user can access premium features
 * @param userId - The user ID to check
 * @returns Promise<boolean> - Whether the user has premium access
 */
export async function canAccessPremiumFeatures(
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_access_premium_features', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error checking premium feature access:', error);
    return false;
  }

  return data || false;
}

/**
 * Get the user's subscription tier
 * @param userId - The user ID to check
 * @returns Promise<string> - The subscription tier ('free', 'pro', etc.)
 */
export async function getUserSubscriptionTier(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_user_subscription_tier', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error getting user subscription tier:', error);
    return 'free';
  }

  return data || 'free';
}

/**
 * Check if the current user is an admin (placeholder for future admin features)
 * @param userId - The user ID to check
 * @returns Promise<boolean> - Whether the user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return data || false;
}

/**
 * Check if the current user is within rate limits for an operation
 * @param userId - The user ID to check
 * @param operationType - The type of operation ('improve', 'generate', etc.)
 * @param timeWindowMinutes - The time window in minutes (default: 60)
 * @returns Promise<boolean> - Whether the user is within rate limits
 */
export async function checkRateLimit(
  userId: string,
  operationType: string,
  timeWindowMinutes: number = 60
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    user_uuid: userId,
    operation_type: operationType,
    time_window_minutes: timeWindowMinutes,
  });

  if (error) {
    console.error('Error checking rate limit:', error);
    return false;
  }

  return data || false;
}

// ============================================================================
// SECURITY CONTEXT UTILITIES
// ============================================================================

/**
 * Security context for checking permissions
 */
export interface SecurityContext {
  userId: string;
  subscriptionTier: string;
  canAccessPremium: boolean;
  canPublishToCommunity: boolean;
  isAdmin: boolean;
}

/**
 * Get the complete security context for a user
 * @param userId - The user ID to get context for
 * @returns Promise<SecurityContext> - The security context
 */
export async function getSecurityContext(
  userId: string
): Promise<SecurityContext> {
  const [
    subscriptionTier,
    canAccessPremium,
    canPublishToCommunityResult,
    isAdminStatus,
  ] = await Promise.all([
    getUserSubscriptionTier(userId),
    canAccessPremiumFeatures(userId),
    canPublishToCommunity(userId),
    isAdmin(userId),
  ]);

  return {
    userId,
    subscriptionTier,
    canAccessPremium,
    canPublishToCommunity: canPublishToCommunityResult,
    isAdmin: isAdminStatus,
  };
}

// ============================================================================
// FEATURE GATING UTILITIES
// ============================================================================

/**
 * Feature gate configuration
 */
export interface FeatureGate {
  name: string;
  requiredTier: string;
  requirePremium: boolean;
  requireCommunityPublish: boolean;
  requireAdmin: boolean;
}

/**
 * Check if a user has access to a specific feature
 * @param userId - The user ID to check
 * @param featureGate - The feature gate configuration
 * @returns Promise<boolean> - Whether the user has access
 */
export async function hasFeatureAccess(
  userId: string,
  featureGate: FeatureGate
): Promise<boolean> {
  const context = await getSecurityContext(userId);

  // Check admin requirement
  if (featureGate.requireAdmin && !context.isAdmin) {
    return false;
  }

  // Check subscription tier requirement
  if (featureGate.requiredTier !== 'free') {
    const tierOrder = ['free', 'pro', 'enterprise'];
    const userTierIndex = tierOrder.indexOf(context.subscriptionTier);
    const requiredTierIndex = tierOrder.indexOf(featureGate.requiredTier);

    if (userTierIndex < requiredTierIndex) {
      return false;
    }
  }

  // Check premium requirement
  if (featureGate.requirePremium && !context.canAccessPremium) {
    return false;
  }

  // Check community publish requirement
  if (featureGate.requireCommunityPublish && !context.canPublishToCommunity) {
    return false;
  }

  return true;
}

/**
 * Predefined feature gates
 */
export const FEATURE_GATES = {
  AI_IMPROVE: {
    name: 'ai_improve',
    requiredTier: 'free',
    requirePremium: false,
    requireCommunityPublish: false,
    requireAdmin: false,
  },
  AI_GENERATE: {
    name: 'ai_generate',
    requiredTier: 'free',
    requirePremium: false,
    requireCommunityPublish: false,
    requireAdmin: false,
  },
  COMMUNITY_PUBLISH: {
    name: 'community_publish',
    requiredTier: 'pro',
    requirePremium: true,
    requireCommunityPublish: true,
    requireAdmin: false,
  },
  ADVANCED_ANALYTICS: {
    name: 'advanced_analytics',
    requiredTier: 'pro',
    requirePremium: true,
    requireCommunityPublish: false,
    requireAdmin: false,
  },
  TEAM_MANAGEMENT: {
    name: 'team_management',
    requiredTier: 'enterprise',
    requirePremium: true,
    requireCommunityPublish: false,
    requireAdmin: false,
  },
  ADMIN_PANEL: {
    name: 'admin_panel',
    requiredTier: 'enterprise',
    requirePremium: true,
    requireCommunityPublish: false,
    requireAdmin: true,
  },
} as const;

// ============================================================================
// RLS POLICY TESTING UTILITIES
// ============================================================================

/**
 * Test RLS policies for a specific user
 * @param userId - The user ID to test
 * @returns Promise<object> - Test results
 */
export async function testRLSPolicies(userId: string): Promise<{
  canViewOwnProfile: boolean;
  canViewOwnTemplates: boolean;
  canViewPublicTemplates: boolean;
  canCreateTemplate: boolean;
  canAccessPremium: boolean;
  canPublishToCommunity: boolean;
  isAdmin: boolean;
}> {
  try {
    // Test profile access
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // Test template access
    const { data: ownTemplates } = await supabase
      .from('prompt_templates')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: publicTemplates } = await supabase
      .from('prompt_templates')
      .select('id')
      .eq('is_public', true)
      .limit(1);

    // Test template creation (this would fail if RLS blocks it)
    const testTemplate = {
      user_id: userId,
      title: 'Test Template',
      content: 'Test content',
    };

    const { error: createError } = await supabase
      .from('prompt_templates')
      .insert(testTemplate);

    // Clean up test template
    if (!createError) {
      await supabase
        .from('prompt_templates')
        .delete()
        .eq('title', 'Test Template')
        .eq('user_id', userId);
    }

    // Get security context
    const context = await getSecurityContext(userId);

    return {
      canViewOwnProfile: !!profileData,
      canViewOwnTemplates: !!ownTemplates?.length,
      canViewPublicTemplates: !!publicTemplates?.length,
      canCreateTemplate: !createError,
      canAccessPremium: context.canAccessPremium,
      canPublishToCommunity: context.canPublishToCommunity,
      isAdmin: context.isAdmin,
    };
  } catch (error) {
    console.error('Error testing RLS policies:', error);
    return {
      canViewOwnProfile: false,
      canViewOwnTemplates: false,
      canViewPublicTemplates: false,
      canCreateTemplate: false,
      canAccessPremium: false,
      canPublishToCommunity: false,
      isAdmin: false,
    };
  }
}

// ============================================================================
// AUDIT LOGGING UTILITIES
// ============================================================================

/**
 * Log a security event (placeholder for future audit logging)
 * @param userId - The user ID
 * @param eventType - The type of event
 * @param tableName - The table name
 * @param recordId - The record ID
 * @param details - Additional details
 */
export async function logSecurityEvent(
  userId: string,
  eventType: string,
  tableName: string,
  recordId: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      user_uuid: userId,
      event_type: eventType,
      table_name: tableName,
      record_id: recordId,
      details: details || null,
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

// Types are already exported above
