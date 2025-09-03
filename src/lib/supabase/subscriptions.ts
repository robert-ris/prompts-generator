import { supabase } from './client';
import type {
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
  SubscriptionPlan,
  FeatureEntitlement,
  FeatureEntitlementInsert,
  BillingEvent,
  BillingEventInsert,
  PlanFeatures,
} from '@/types/database';

// Subscription Management
export async function getSubscription(
  subscriptionId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }

  return data;
}

export async function createSubscription(
  subscription: SubscriptionInsert
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscription)
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription:', error);
    return null;
  }

  return data;
}

export async function updateSubscription(
  subscriptionId: string,
  updates: SubscriptionUpdate
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating subscription:', error);
    return null;
  }

  return data;
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }

  return true;
}

// Subscription Plans Management
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  if (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }

  return data || [];
}

export async function getSubscriptionPlan(
  planId: string
): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }

  return data;
}

// Feature Entitlements Management
export async function getFeatureEntitlements(
  userId: string
): Promise<FeatureEntitlement[]> {
  const { data, error } = await supabase
    .from('feature_entitlements')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching feature entitlements:', error);
    return [];
  }

  return data || [];
}

export async function getFeatureEntitlement(
  userId: string,
  featureName: string
): Promise<FeatureEntitlement | null> {
  const { data, error } = await supabase
    .from('feature_entitlements')
    .select('*')
    .eq('user_id', userId)
    .eq('feature_name', featureName)
    .single();

  if (error) {
    console.error('Error fetching feature entitlement:', error);
    return null;
  }

  return data;
}

export async function createFeatureEntitlement(
  entitlement: FeatureEntitlementInsert
): Promise<FeatureEntitlement | null> {
  const { data, error } = await supabase
    .from('feature_entitlements')
    .insert(entitlement)
    .select()
    .single();

  if (error) {
    console.error('Error creating feature entitlement:', error);
    return null;
  }

  return data;
}

export async function updateFeatureEntitlement(
  userId: string,
  featureName: string,
  updates: Partial<FeatureEntitlement>
): Promise<FeatureEntitlement | null> {
  const { data, error } = await supabase
    .from('feature_entitlements')
    .update(updates)
    .eq('user_id', userId)
    .eq('feature_name', featureName)
    .select()
    .single();

  if (error) {
    console.error('Error updating feature entitlement:', error);
    return null;
  }

  return data;
}

// Billing Events Management
export async function logBillingEvent(
  event: BillingEventInsert
): Promise<BillingEvent | null> {
  const { data, error } = await supabase
    .from('billing_events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error('Error logging billing event:', error);
    return null;
  }

  return data;
}

export async function getBillingEvents(
  userId: string,
  limit = 50,
  offset = 0
): Promise<BillingEvent[]> {
  const { data, error } = await supabase
    .from('billing_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching billing events:', error);
    return [];
  }

  return data || [];
}

// Database Functions
export async function checkFeatureEntitlement(
  userId: string,
  featureName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_feature_entitlement', {
    user_uuid: userId,
    feature_name: featureName,
  });

  if (error) {
    console.error('Error checking feature entitlement:', error);
    return false;
  }

  return data;
}

export async function incrementFeatureUsage(
  userId: string,
  featureName: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('increment_feature_usage', {
    user_uuid: userId,
    feature_name: featureName,
  });

  if (error) {
    console.error('Error incrementing feature usage:', error);
    return false;
  }

  return data;
}

export async function getUserActiveSubscription(userId: string): Promise<{
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  plan_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan_name: string;
  plan_description: string | null;
  price_cents: number;
  features: PlanFeatures;
} | null> {
  const { data, error } = await supabase.rpc('get_user_active_subscription', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching user active subscription:', error);
    return null;
  }

  return data?.[0] || null;
}

// Utility Functions
export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}

export function isSubscriptionCanceled(status: string): boolean {
  return ['canceled', 'past_due', 'unpaid'].includes(status);
}

export function getDaysUntilRenewal(currentPeriodEnd: string): number {
  const endDate = new Date(currentPeriodEnd);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getTrialDaysRemaining(trialEnd: string): number {
  const endDate = new Date(trialEnd);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Feature checking utilities
export async function canUseFeature(
  userId: string,
  featureName: string
): Promise<boolean> {
  return await checkFeatureEntitlement(userId, featureName);
}

export async function useFeature(
  userId: string,
  featureName: string
): Promise<boolean> {
  return await incrementFeatureUsage(userId, featureName);
}

// Subscription upgrade/downgrade utilities
export async function upgradeSubscription(
  userId: string,
  newPlanId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string
): Promise<Subscription | null> {
  // Cancel current subscription if exists
  const currentSubscription = await getUserSubscription(userId);
  if (currentSubscription) {
    await cancelSubscription(currentSubscription.id);
  }

  // Create new subscription
  const newSubscription = await createSubscription({
    user_id: userId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    status: 'active',
    plan_id: newPlanId,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(), // 30 days
  });

  if (newSubscription) {
    // Update user profile
    await supabase
      .from('profiles')
      .update({ subscription_tier: newPlanId })
      .eq('id', userId);
  }

  return newSubscription;
}

// Billing analytics
export async function getBillingAnalytics(
  userId: string,
  months = 12
): Promise<{
  totalSpent: number;
  averageMonthlySpent: number;
  totalEvents: number;
  successfulPayments: number;
  failedPayments: number;
}> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('billing_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching billing analytics:', error);
    return {
      totalSpent: 0,
      averageMonthlySpent: 0,
      totalEvents: 0,
      successfulPayments: 0,
      failedPayments: 0,
    };
  }

  const events = data || [];
  const totalSpent = events.reduce(
    (sum, event) => sum + (event.amount_cents || 0),
    0
  );
  const successfulPayments = events.filter(
    event => event.status === 'succeeded'
  ).length;
  const failedPayments = events.filter(
    event => event.status === 'failed'
  ).length;

  return {
    totalSpent,
    averageMonthlySpent: totalSpent / months,
    totalEvents: events.length,
    successfulPayments,
    failedPayments,
  };
}
