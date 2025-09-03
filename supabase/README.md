# Database Schema Documentation

## Overview

This document describes the database schema for the AI Prompt Builder application using Supabase (PostgreSQL).

## Tables

### profiles

The main user profiles table that extends Supabase Auth users with additional profile information.

**Columns:**

- `id` (UUID, PRIMARY KEY) - References auth.users(id) with CASCADE delete
- `email` (TEXT, UNIQUE, NOT NULL) - User's email address
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - URL to user's avatar image
- `bio` (TEXT) - User's biography
- `website_url` (TEXT) - User's website URL
- `location` (TEXT) - User's location
- `subscription_tier` (TEXT) - Subscription level ('free' or 'pro')
- `subscription_status` (TEXT) - Subscription status ('active', 'canceled', 'past_due', 'unpaid')
- `stripe_customer_id` (TEXT, UNIQUE) - Stripe customer ID for billing
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record last update timestamp

**Constraints:**

- `subscription_tier` must be 'free' or 'pro'
- `subscription_status` must be 'active', 'canceled', 'past_due', or 'unpaid'

**Indexes:**

- `idx_profiles_email` - For fast email lookups
- `idx_profiles_subscription_tier` - For filtering by subscription tier
- `idx_profiles_created_at` - For sorting by creation date

**Row Level Security (RLS):**

- Users can only view their own profile
- Users can only update their own profile
- Users can only insert their own profile

**Triggers:**

- `update_profiles_updated_at` - Automatically updates `updated_at` on record changes

### prompt_templates

The prompt templates table for storing user-created prompts with full-text search capabilities.

**Columns:**

- `id` (UUID, PRIMARY KEY) - Unique template identifier
- `user_id` (UUID, NOT NULL) - References profiles(id) with CASCADE delete
- `title` (TEXT, NOT NULL) - Template title
- `content` (TEXT, NOT NULL) - Template content with variables like {{role}}, {{topic}}
- `description` (TEXT) - Template description
- `category` (TEXT) - Template category (e.g., 'writing', 'coding', 'creative')
- `tags` (TEXT[]) - Array of tags for categorization
- `variables` (JSONB) - Template variables structure
- `is_public` (BOOLEAN) - Whether template is publicly visible
- `is_featured` (BOOLEAN) - Whether template is featured
- `usage_count` (INTEGER) - Number of times template has been used
- `rating_average` (DECIMAL) - Average rating (0-5)
- `rating_count` (INTEGER) - Number of ratings
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record last update timestamp

**Indexes:**

- `idx_prompt_templates_fts` - Full-text search index on title, description, and content
- `idx_prompt_templates_user_id` - For fast user lookups
- `idx_prompt_templates_category` - For category filtering
- `idx_prompt_templates_is_public` - For public template filtering
- `idx_prompt_templates_is_featured` - For featured template filtering
- `idx_prompt_templates_created_at` - For sorting by creation date
- `idx_prompt_templates_usage_count` - For sorting by popularity
- `idx_prompt_templates_rating_average` - For sorting by rating
- `idx_prompt_templates_tags` - GIN index for tag array operations

**Row Level Security (RLS):**

- Users can view their own templates
- Users can view public templates
- Users can create their own templates
- Users can update their own templates
- Users can delete their own templates

**Functions:**

- `increment_template_usage(template_id)` - Increments usage count
- `update_template_rating(template_id, new_rating)` - Updates average rating

### ai_usage_logs

The AI usage logs table for tracking all AI API calls and costs.

**Columns:**

- `id` (UUID, PRIMARY KEY) - Unique log identifier
- `user_id` (UUID, NOT NULL) - References profiles(id) with CASCADE delete
- `template_id` (UUID) - References prompt_templates(id) with SET NULL delete
- `operation_type` (TEXT, NOT NULL) - Type of operation ('tighten', 'expand', 'improve', 'generate')
- `input_tokens` (INTEGER, NOT NULL) - Number of input tokens used
- `output_tokens` (INTEGER, NOT NULL) - Number of output tokens generated
- `cost_cents` (INTEGER, NOT NULL) - Cost in cents for the operation
- `provider` (TEXT, NOT NULL) - AI provider ('openai', 'anthropic', etc.)
- `model` (TEXT, NOT NULL) - Model used ('gpt-4', 'claude-3-sonnet', etc.)
- `success` (BOOLEAN, NOT NULL) - Whether the operation was successful
- `error_message` (TEXT) - Error message if operation failed
- `response_time_ms` (INTEGER) - API response time in milliseconds
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

**Constraints:**

- `operation_type` must be 'tighten', 'expand', 'improve', or 'generate'

**Indexes:**

- `idx_ai_usage_logs_user_id` - For fast user lookups
- `idx_ai_usage_logs_template_id` - For template usage analysis
- `idx_ai_usage_logs_operation_type` - For operation type filtering
- `idx_ai_usage_logs_created_at` - For time-based queries
- `idx_ai_usage_logs_provider` - For provider-based analysis
- `idx_ai_usage_logs_success` - For success/failure analysis

**Row Level Security (RLS):**

- Users can view their own usage logs
- Users can insert their own usage logs

### user_quotas

The user quotas table for managing AI usage limits and tracking.

**Columns:**

- `user_id` (UUID, PRIMARY KEY) - References profiles(id) with CASCADE delete
- `ai_improve_calls_used` (INTEGER) - Number of AI improve calls used
- `ai_improve_calls_limit` (INTEGER) - Limit for AI improve calls
- `ai_generate_calls_used` (INTEGER) - Number of AI generate calls used
- `ai_generate_calls_limit` (INTEGER) - Limit for AI generate calls
- `total_tokens_used` (INTEGER) - Total tokens used across all operations
- `total_tokens_limit` (INTEGER) - Total token limit
- `total_cost_cents` (INTEGER) - Total cost in cents
- `quota_reset_date` (DATE) - Date when quotas reset
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record last update timestamp

**Indexes:**

- `idx_user_quotas_quota_reset_date` - For quota reset date queries

**Row Level Security (RLS):**

- Users can view their own quotas
- Users can update their own quotas
- Users can insert their own quotas

**Triggers:**

- `update_user_quotas_updated_at` - Automatically updates `updated_at` on record changes

**Functions:**

- `increment_quota_usage(user_uuid, operation_type, input_tokens, output_tokens, cost_cents)` - Increments quota usage and checks limits
- `get_user_quota_status(user_uuid)` - Returns comprehensive quota status with boolean flags

### ai_provider_configs

The AI provider configurations table for managing provider settings and costs.

**Columns:**

- `id` (UUID, PRIMARY KEY) - Unique config identifier
- `provider_name` (TEXT, UNIQUE, NOT NULL) - Provider name ('openai', 'anthropic', etc.)
- `model_name` (TEXT, NOT NULL) - Model name ('gpt-4', 'claude-3-sonnet', etc.)
- `input_cost_per_1k_tokens` (INTEGER, NOT NULL) - Cost in cents per 1k input tokens
- `output_cost_per_1k_tokens` (INTEGER, NOT NULL) - Cost in cents per 1k output tokens
- `max_tokens_per_request` (INTEGER, NOT NULL) - Maximum tokens per request
- `is_active` (BOOLEAN) - Whether this config is active
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record last update timestamp

**Indexes:**

- No additional indexes needed (small table, primary key sufficient)

**Row Level Security (RLS):**

- Authenticated users can view provider configs (read-only)

**Triggers:**

- `update_ai_provider_configs_updated_at` - Automatically updates `updated_at` on record changes

### subscriptions

The subscriptions table for managing user subscriptions and billing.

**Columns:**

- `id` (UUID, PRIMARY KEY) - Unique subscription identifier
- `user_id` (UUID, NOT NULL) - References profiles(id) with CASCADE delete
- `stripe_subscription_id` (TEXT, UNIQUE, NOT NULL) - Stripe subscription ID
- `stripe_customer_id` (TEXT, NOT NULL) - Stripe customer ID
- `status` (TEXT, NOT NULL) - Subscription status ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired')
- `plan_id` (TEXT, NOT NULL) - References subscription_plans(id)
- `current_period_start` (TIMESTAMPTZ, NOT NULL) - Current billing period start
- `current_period_end` (TIMESTAMPTZ, NOT NULL) - Current billing period end
- `cancel_at_period_end` (BOOLEAN) - Whether subscription will cancel at period end
- `canceled_at` (TIMESTAMPTZ) - When subscription was canceled
- `trial_start` (TIMESTAMPTZ) - Trial period start
- `trial_end` (TIMESTAMPTZ) - Trial period end
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record last update timestamp

**Constraints:**

- `status` must be one of the valid subscription statuses

**Indexes:**

- `idx_subscriptions_user_id` - For fast user lookups
- `idx_subscriptions_status` - For status filtering
- `idx_subscriptions_plan_id` - For plan filtering
- `idx_subscriptions_current_period_end` - For renewal queries
- `idx_subscriptions_stripe_subscription_id` - For Stripe integration

**Row Level Security (RLS):**

- Users can view their own subscriptions
- Users can insert their own subscriptions
- Users can update their own subscriptions

**Triggers:**

- `update_subscriptions_updated_at` - Automatically updates `updated_at` on record changes

### subscription_plans

The subscription plans table for defining available plans and their features.

**Columns:**

- `id` (TEXT, PRIMARY KEY) - Plan identifier ('free', 'pro', 'enterprise')
- `name` (TEXT, NOT NULL) - Plan display name
- `description` (TEXT) - Plan description
- `price_cents` (INTEGER, NOT NULL) - Monthly price in cents
- `interval` (TEXT, NOT NULL) - Billing interval ('month' or 'year')
- `stripe_price_id` (TEXT, UNIQUE) - Stripe price ID for billing
- `features` (JSONB, NOT NULL) - Plan features and limits
- `is_active` (BOOLEAN) - Whether plan is available
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record last update timestamp

**Constraints:**

- `interval` must be 'month' or 'year'

**Indexes:**

- `idx_subscription_plans_is_active` - For active plan filtering
- `idx_subscription_plans_stripe_price_id` - For Stripe integration

**Row Level Security (RLS):**

- Authenticated users can view subscription plans (read-only)

**Triggers:**

- `update_subscription_plans_updated_at` - Automatically updates `updated_at` on record changes

### feature_entitlements

The feature entitlements table for granular feature access control.

**Columns:**

- `id` (UUID, PRIMARY KEY) - Unique entitlement identifier
- `user_id` (UUID, NOT NULL) - References profiles(id) with CASCADE delete
- `feature_name` (TEXT, NOT NULL) - Feature name ('ai_improve', 'ai_generate', 'community_publish', etc.)
- `is_enabled` (BOOLEAN) - Whether feature is enabled
- `usage_limit` (INTEGER) - Usage limit (NULL means unlimited)
- `usage_count` (INTEGER) - Current usage count
- `reset_frequency` (TEXT) - How often usage resets ('never', 'daily', 'weekly', 'monthly')
- `last_reset_date` (DATE) - Last reset date
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Record last update timestamp

**Constraints:**

- `reset_frequency` must be 'never', 'daily', 'weekly', or 'monthly'
- Unique constraint on `(user_id, feature_name)`

**Indexes:**

- `idx_feature_entitlements_user_id` - For fast user lookups
- `idx_feature_entitlements_feature_name` - For feature filtering
- `idx_feature_entitlements_is_enabled` - For enabled feature filtering

**Row Level Security (RLS):**

- Users can view their own entitlements
- Users can insert their own entitlements
- Users can update their own entitlements

**Triggers:**

- `update_feature_entitlements_updated_at` - Automatically updates `updated_at` on record changes

### billing_events

The billing events table for tracking all billing-related events.

**Columns:**

- `id` (UUID, PRIMARY KEY) - Unique event identifier
- `user_id` (UUID, NOT NULL) - References profiles(id) with CASCADE delete
- `subscription_id` (UUID) - References subscriptions(id) with CASCADE delete
- `stripe_event_id` (TEXT, UNIQUE) - Stripe event ID
- `event_type` (TEXT, NOT NULL) - Event type ('invoice.payment_succeeded', 'invoice.payment_failed', etc.)
- `amount_cents` (INTEGER) - Event amount in cents
- `currency` (TEXT) - Currency code (default: 'usd')
- `status` (TEXT, NOT NULL) - Event status
- `metadata` (JSONB) - Additional event data
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

**Indexes:**

- `idx_billing_events_user_id` - For fast user lookups
- `idx_billing_events_subscription_id` - For subscription filtering
- `idx_billing_events_event_type` - For event type filtering
- `idx_billing_events_created_at` - For time-based queries

**Row Level Security (RLS):**

- Users can view their own billing events
- Users can insert their own billing events

## Extensions

- `uuid-ossp` - For UUID generation
- `pg_trgm` - For trigram matching (future full-text search)

## Usage

### Client-side (Browser)

```typescript
import { supabase } from '@/lib/supabase/client';
import {
  getProfile,
  createProfile,
  updateProfile,
} from '@/lib/supabase/profiles';
import {
  getPromptTemplate,
  createPromptTemplate,
  searchPromptTemplates,
} from '@/lib/supabase/prompt-templates';
import {
  logAIUsage,
  getUserQuotaStatus,
  checkAndIncrementQuota,
  getAIUsageStats,
} from '@/lib/supabase/ai-usage';
import {
  getUserSubscription,
  getSubscriptionPlans,
  checkFeatureEntitlement,
  useFeature,
  logBillingEvent,
} from '@/lib/supabase/subscriptions';

// Get user profile
const profile = await getProfile(userId);

// Create new profile
const newProfile = await createProfile({
  id: userId,
  email: 'user@example.com',
  full_name: 'John Doe',
  subscription_tier: 'free',
});

// Update profile
const updatedProfile = await updateProfile(userId, {
  full_name: 'Jane Doe',
  bio: 'New bio',
});

// Create prompt template
const template = await createPromptTemplate({
  user_id: userId,
  title: 'Blog Post Writer',
  content: 'Write a blog post about {{topic}} in a {{tone}} tone.',
  description: 'Generate engaging blog posts',
  category: 'writing',
  tags: ['blog', 'content', 'writing'],
  variables: { topic: '', tone: '' },
  is_public: true,
});

// Search templates
const searchResults = await searchPromptTemplates('blog post');

// Check quota before AI operation
const quotaStatus = await getUserQuotaStatus(userId);
if (canUseAIImprove(quotaStatus)) {
  // Perform AI operation
  const success = await checkAndIncrementQuota(
    userId,
    'improve',
    100,
    50,
    5 // cost in cents
  );

  if (success) {
    // Log the usage
    await logAIUsage({
      user_id: userId,
      template_id: template.id,
      operation_type: 'improve',
      input_tokens: 100,
      output_tokens: 50,
      cost_cents: 5,
      provider: 'openai',
      model: 'gpt-4',
      success: true,
      response_time_ms: 1500,
    });
  }
}

// Get usage statistics
const stats = await getAIUsageStats(userId, 30); // Last 30 days
console.log(
  `Total calls: ${stats.totalCalls}, Cost: ${formatCost(stats.totalCost)}`
);

// Check subscription and features
const subscription = await getUserSubscription(userId);
const plans = await getSubscriptionPlans();

// Check if user can use a specific feature
const canUseAI = await checkFeatureEntitlement(userId, 'ai_improve');
if (canUseAI) {
  // Use the feature
  const success = await useFeature(userId, 'ai_improve');
  if (success) {
    // Feature used successfully
    console.log('AI improve feature used');
  }
}

// Log billing event
await logBillingEvent({
  user_id: userId,
  subscription_id: subscription?.id,
  stripe_event_id: 'evt_123456789',
  event_type: 'invoice.payment_succeeded',
  amount_cents: 1999,
  currency: 'usd',
  status: 'succeeded',
  metadata: {
    stripe_customer_id: 'cus_123456789',
    invoice_id: 'in_123456789',
  },
});
```

### Server-side (SSR)

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

## Migration Files

- `001_initial_schema.sql` - Initial schema with profiles table
- `002_prompt_templates.sql` - Prompt templates table with full-text search
- `003_ai_usage_quotas.sql` - AI usage logs and quota management tables
- `004_subscription_management.sql` - Subscription and billing management tables

## Security Considerations

1. **Row Level Security (RLS)** is enabled on all tables
2. **Authentication** is handled by Supabase Auth
3. **Authorization** is enforced through RLS policies
4. **Input validation** should be performed at the application level
5. **SQL injection** is prevented by using Supabase's query builder
6. **Cost tracking** prevents abuse and enables billing
7. **Feature entitlements** provide granular access control

## Performance Considerations

1. **Indexes** are created on frequently queried columns
2. **Triggers** automatically maintain `updated_at` timestamps
3. **CASCADE deletes** ensure referential integrity
4. **UNIQUE constraints** prevent duplicate data
5. **Full-text search** provides fast text-based queries
6. **GIN indexes** optimize array and JSONB operations
7. **Quota functions** provide efficient quota checking and updates
8. **Subscription functions** provide efficient subscription management

## Future Enhancements

- Full-text search capabilities using `pg_trgm`
- Additional tables for community features, etc.
- Real-time subscriptions for live updates
- Advanced analytics and reporting
- Team management features
- Custom integrations
