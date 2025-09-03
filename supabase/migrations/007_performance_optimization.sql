-- Database Performance Optimization
-- This migration adds comprehensive indexes and optimizations for optimal query performance

-- ============================================================================
-- ADDITIONAL INDEXES FOR EXISTING TABLES
-- ============================================================================

-- Profiles table additional indexes
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);

-- Prompt templates additional indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_updated_at ON prompt_templates(updated_at);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_title ON prompt_templates USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_prompt_templates_rating_count ON prompt_templates(rating_count);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_created ON prompt_templates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public_featured ON prompt_templates(is_public, is_featured) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category_rating ON prompt_templates(category, rating_average DESC) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_usage_rating ON prompt_templates(usage_count DESC, rating_average DESC);

-- AI usage logs additional indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider_model ON ai_usage_logs(provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_success_created ON ai_usage_logs(success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_cost_range ON ai_usage_logs(cost_cents) WHERE cost_cents > 0;
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_response_time ON ai_usage_logs(response_time_ms) WHERE response_time_ms IS NOT NULL;

-- User quotas additional indexes
CREATE INDEX IF NOT EXISTS idx_user_quotas_updated_at ON user_quotas(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_quotas_reset_date ON user_quotas(quota_reset_date);
CREATE INDEX IF NOT EXISTS idx_user_quotas_usage_limits ON user_quotas(ai_improve_calls_used, ai_improve_calls_limit, ai_generate_calls_used, ai_generate_calls_limit);

-- AI provider configs additional indexes
CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_model_name ON ai_provider_configs(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_active ON ai_provider_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_provider_configs_cost_range ON ai_provider_configs(input_cost_per_1k_tokens, output_cost_per_1k_tokens);

-- Subscriptions additional indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON subscriptions(plan_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end ON subscriptions(trial_end) WHERE trial_end IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_canceled_at ON subscriptions(canceled_at) WHERE canceled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Subscription plans additional indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_price ON subscription_plans(price_cents);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_interval ON subscription_plans(interval);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active_price ON subscription_plans(is_active, price_cents) WHERE is_active = true;

-- Feature entitlements additional indexes
CREATE INDEX IF NOT EXISTS idx_feature_entitlements_user_feature ON feature_entitlements(user_id, feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_entitlements_enabled ON feature_entitlements(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_feature_entitlements_reset_frequency ON feature_entitlements(reset_frequency);
CREATE INDEX IF NOT EXISTS idx_feature_entitlements_usage_limit ON feature_entitlements(usage_limit) WHERE usage_limit IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feature_entitlements_last_reset ON feature_entitlements(last_reset_date);

-- Billing events additional indexes
CREATE INDEX IF NOT EXISTS idx_billing_events_user_created ON billing_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_type_status ON billing_events(event_type, status);
CREATE INDEX IF NOT EXISTS idx_billing_events_amount_range ON billing_events(amount_cents) WHERE amount_cents > 0;
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event ON billing_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- ============================================================================
-- COMMUNITY TABLES PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Community prompts additional indexes
CREATE INDEX IF NOT EXISTS idx_community_prompts_approval_created ON community_prompts(approval_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_prompts_featured_rating ON community_prompts(is_featured, rating_average DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_community_prompts_category_rating ON community_prompts(category, rating_average DESC) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_prompts_view_save_rating ON community_prompts(view_count DESC, save_count DESC, rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_community_prompts_user_approved ON community_prompts(user_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_community_prompts_title_search ON community_prompts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_community_prompts_content_search ON community_prompts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_community_prompts_description_search ON community_prompts USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Community saves additional indexes
CREATE INDEX IF NOT EXISTS idx_community_saves_prompt_user ON community_saves(community_prompt_id, user_id);
CREATE INDEX IF NOT EXISTS idx_community_saves_user_created ON community_saves(user_id, created_at DESC);

-- Community ratings additional indexes
CREATE INDEX IF NOT EXISTS idx_community_ratings_prompt_rating ON community_ratings(community_prompt_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_community_ratings_user_created ON community_ratings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_ratings_helpful ON community_ratings(is_helpful, helpful_count DESC) WHERE is_helpful = true;
CREATE INDEX IF NOT EXISTS idx_community_ratings_rating_range ON community_ratings(rating) WHERE rating >= 4;

-- Community comments additional indexes
CREATE INDEX IF NOT EXISTS idx_community_comments_prompt_created ON community_comments(community_prompt_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_created ON community_comments(parent_comment_id, created_at ASC) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_comments_user_created ON community_comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_votes ON community_comments(upvotes DESC, downvotes ASC);
CREATE INDEX IF NOT EXISTS idx_community_comments_flagged ON community_comments(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_community_comments_content_search ON community_comments USING gin(to_tsvector('english', content));

-- Community follows additional indexes
CREATE INDEX IF NOT EXISTS idx_community_follows_following_created ON community_follows(following_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_follows_follower_created ON community_follows(follower_id, created_at DESC);

-- Community notifications additional indexes
CREATE INDEX IF NOT EXISTS idx_community_notifications_user_type ON community_notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_community_notifications_user_read ON community_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_notifications_related ON community_notifications(related_id, related_type) WHERE related_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_notifications_type_created ON community_notifications(type, created_at DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Profiles composite indexes
CREATE INDEX IF NOT EXISTS idx_profiles_tier_status ON profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_email_tier ON profiles(email, subscription_tier);

-- Prompt templates composite indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_category ON prompt_templates(user_id, category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public_category ON prompt_templates(is_public, category) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_featured_rating ON prompt_templates(is_featured, rating_average DESC, rating_count DESC) WHERE is_featured = true;

-- AI usage logs composite indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_operation ON ai_usage_logs(user_id, operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider_success ON ai_usage_logs(provider, success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_template_operation ON ai_usage_logs(template_id, operation_type) WHERE template_id IS NOT NULL;

-- Subscriptions composite indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_period ON subscriptions(plan_id, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_status ON subscriptions(trial_end, status) WHERE trial_end IS NOT NULL;

-- Feature entitlements composite indexes
CREATE INDEX IF NOT EXISTS idx_feature_entitlements_user_enabled ON feature_entitlements(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_entitlements_feature_limit ON feature_entitlements(feature_name, usage_limit) WHERE usage_limit IS NOT NULL;

-- Community prompts composite indexes
CREATE INDEX IF NOT EXISTS idx_community_prompts_approved_category ON community_prompts(approval_status, category) WHERE approval_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_community_prompts_featured_category ON community_prompts(is_featured, category, rating_average DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_community_prompts_user_approval ON community_prompts(user_id, approval_status, created_at DESC);

-- ============================================================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- ============================================================================

-- Profiles partial indexes
CREATE INDEX IF NOT EXISTS idx_profiles_pro_tier ON profiles(id) WHERE subscription_tier = 'pro';
CREATE INDEX IF NOT EXISTS idx_profiles_active_status ON profiles(id) WHERE subscription_status = 'active';

-- Prompt templates partial indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public_only ON prompt_templates(id, user_id, title, category, created_at) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_featured_only ON prompt_templates(id, user_id, title, category, rating_average) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_high_rated ON prompt_templates(id, user_id, title, category, rating_average) WHERE rating_average >= 4.0 AND rating_count >= 5;

-- AI usage logs partial indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_successful_ops ON ai_usage_logs(user_id, operation_type, created_at) WHERE success = true;
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_expensive_ops ON ai_usage_logs(user_id, cost_cents, created_at) WHERE cost_cents > 100;

-- Subscriptions partial indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_only ON subscriptions(user_id, plan_id, current_period_end) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_only ON subscriptions(user_id, trial_end) WHERE trial_end IS NOT NULL;

-- Community prompts partial indexes
CREATE INDEX IF NOT EXISTS idx_community_prompts_approved_only ON community_prompts(id, user_id, title, category, rating_average) WHERE approval_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_community_prompts_featured_only ON community_prompts(id, user_id, title, category, rating_average) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_community_prompts_popular ON community_prompts(id, user_id, title, category, view_count) WHERE view_count > 100;

-- ============================================================================
-- FUNCTIONAL INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Full-text search indexes for better text search performance
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles USING gin(to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(bio, '')));

-- Date-based functional indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_date_trunc ON ai_usage_logs(date_trunc('day', created_at));
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_start_date ON subscriptions(date_trunc('day', current_period_start));
CREATE INDEX IF NOT EXISTS idx_community_prompts_created_date ON community_prompts(date_trunc('day', created_at));

-- JSONB indexes for template variables
CREATE INDEX IF NOT EXISTS idx_prompt_templates_variables_gin ON prompt_templates USING gin(variables);
CREATE INDEX IF NOT EXISTS idx_community_prompts_variables_gin ON community_prompts USING gin(variables);

-- ============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
  tablename TEXT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    pg_size_pretty(pg_total_relation_size(t.table_name::regclass))::TEXT,
    pg_size_pretty(pg_indexes_size(t.table_name::regclass))::TEXT,
    pg_size_pretty(pg_total_relation_size(t.table_name::regclass))::TEXT,
    (SELECT reltuples::BIGINT FROM pg_class WHERE relname = t.table_name)
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  ORDER BY pg_total_relation_size(t.table_name::regclass) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE FUNCTION get_slow_queries(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Function to get trending prompts with optimized query
CREATE OR REPLACE FUNCTION get_trending_prompts_optimized(
  days INTEGER DEFAULT 7,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  usage_count INTEGER,
  rating_average DECIMAL(3,2),
  rating_count INTEGER,
  created_at TIMESTAMPTZ,
  trend_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.title,
    pt.description,
    pt.category,
    pt.usage_count,
    pt.rating_average,
    pt.rating_count,
    pt.created_at,
    (
      pt.usage_count * 0.4 + 
      pt.rating_average * pt.rating_count * 0.3 +
      EXTRACT(EPOCH FROM (NOW() - pt.created_at)) / 86400 * 0.3
    ) AS trend_score
  FROM prompt_templates pt
  WHERE pt.is_public = true
    AND pt.created_at >= NOW() - INTERVAL '1 day' * days
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_uuid UUID)
RETURNS TABLE(
  total_templates INTEGER,
  total_usage INTEGER,
  total_cost_cents INTEGER,
  last_activity TIMESTAMPTZ,
  subscription_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM prompt_templates WHERE user_id = user_uuid)::INTEGER,
    (SELECT COUNT(*) FROM ai_usage_logs WHERE user_id = user_uuid)::INTEGER,
    (SELECT COALESCE(SUM(cost_cents), 0) FROM ai_usage_logs WHERE user_id = user_uuid)::INTEGER,
    (SELECT MAX(created_at) FROM ai_usage_logs WHERE user_id = user_uuid),
    (SELECT subscription_status FROM profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS VOID AS $$
BEGIN
  ANALYZE profiles;
  ANALYZE prompt_templates;
  ANALYZE ai_usage_logs;
  ANALYZE user_quotas;
  ANALYZE ai_provider_configs;
  ANALYZE subscriptions;
  ANALYZE subscription_plans;
  ANALYZE feature_entitlements;
  ANALYZE billing_events;
  ANALYZE community_prompts;
  ANALYZE community_saves;
  ANALYZE community_ratings;
  ANALYZE community_comments;
  ANALYZE community_follows;
  ANALYZE community_notifications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_data(
  days_to_keep INTEGER DEFAULT 365
)
RETURNS TABLE(
  table_name TEXT,
  deleted_count BIGINT
) AS $$
DECLARE
  deleted_count BIGINT;
BEGIN
  -- Clean up old AI usage logs (keep for 1 year by default)
  DELETE FROM ai_usage_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'ai_usage_logs'::TEXT, deleted_count;
  
  -- Clean up old billing events (keep for 2 years)
  DELETE FROM billing_events 
  WHERE created_at < NOW() - INTERVAL '1 day' * (days_to_keep * 2);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'billing_events'::TEXT, deleted_count;
  
  -- Clean up old notifications (keep for 6 months)
  DELETE FROM community_notifications 
  WHERE created_at < NOW() - INTERVAL '1 day' * (days_to_keep / 2);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'community_notifications'::TEXT, deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERFORMANCE CONFIGURATION
-- ============================================================================

-- Set work_mem for better sort performance (adjust based on your server capacity)
-- ALTER SYSTEM SET work_mem = '256MB';

-- Set shared_buffers for better caching (adjust based on your server capacity)
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Set effective_cache_size for query planning (adjust based on your server capacity)
-- ALTER SYSTEM SET effective_cache_size = '1GB';

-- Enable parallel query execution
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
-- ALTER SYSTEM SET max_parallel_workers = 4;

-- Note: The above configuration settings are commented out as they require
-- server-level access. Uncomment and adjust values based on your server capacity.
