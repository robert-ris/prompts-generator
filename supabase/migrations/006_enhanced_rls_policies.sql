-- Enhanced Row Level Security Policies
-- This migration enhances existing RLS policies and adds more sophisticated security controls

-- ============================================================================
-- PROFILES TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Enhanced RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PROMPT TEMPLATES TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can view public templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON prompt_templates;

-- Enhanced RLS Policies for prompt_templates
CREATE POLICY "Users can view their own templates" ON prompt_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON prompt_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view featured templates" ON prompt_templates
  FOR SELECT USING (is_featured = true);

CREATE POLICY "Users can create their own templates" ON prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON prompt_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON prompt_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to manage all templates (for admin operations)
CREATE POLICY "Service role can manage all templates" ON prompt_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- AI USAGE LOGS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own usage logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "Users can insert their own usage logs" ON ai_usage_logs;

-- Enhanced RLS Policies for ai_usage_logs
CREATE POLICY "Users can view their own usage logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prevent users from updating or deleting their own logs (audit trail)
CREATE POLICY "Users cannot modify usage logs" ON ai_usage_logs
  FOR UPDATE USING (false);

CREATE POLICY "Users cannot delete usage logs" ON ai_usage_logs
  FOR DELETE USING (false);

-- Allow service role to manage all usage logs (for admin operations)
CREATE POLICY "Service role can manage all usage logs" ON ai_usage_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- USER QUOTAS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own quotas" ON user_quotas;
DROP POLICY IF EXISTS "Users can update their own quotas" ON user_quotas;
DROP POLICY IF EXISTS "Users can insert their own quotas" ON user_quotas;

-- Enhanced RLS Policies for user_quotas
CREATE POLICY "Users can view their own quotas" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" ON user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotas" ON user_quotas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prevent users from deleting their quota records
CREATE POLICY "Users cannot delete quota records" ON user_quotas
  FOR DELETE USING (false);

-- Allow service role to manage all quotas (for admin operations)
CREATE POLICY "Service role can manage all quotas" ON user_quotas
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- AI PROVIDER CONFIGS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Authenticated users can view provider configs" ON ai_provider_configs;

-- Enhanced RLS Policies for ai_provider_configs
CREATE POLICY "Authenticated users can view active provider configs" ON ai_provider_configs
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Only service role can manage provider configs
CREATE POLICY "Service role can manage all provider configs" ON ai_provider_configs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SUBSCRIPTIONS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;

-- Enhanced RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Prevent users from deleting their subscription records
CREATE POLICY "Users cannot delete subscription records" ON subscriptions
  FOR DELETE USING (false);

-- Allow service role to manage all subscriptions (for admin operations)
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Authenticated users can view subscription plans" ON subscription_plans;

-- Enhanced RLS Policies for subscription_plans
CREATE POLICY "Authenticated users can view active subscription plans" ON subscription_plans
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Only service role can manage subscription plans
CREATE POLICY "Service role can manage all subscription plans" ON subscription_plans
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FEATURE ENTITLEMENTS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own entitlements" ON feature_entitlements;
DROP POLICY IF EXISTS "Users can insert their own entitlements" ON feature_entitlements;
DROP POLICY IF EXISTS "Users can update their own entitlements" ON feature_entitlements;

-- Enhanced RLS Policies for feature_entitlements
CREATE POLICY "Users can view their own entitlements" ON feature_entitlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entitlements" ON feature_entitlements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entitlements" ON feature_entitlements
  FOR UPDATE USING (auth.uid() = user_id);

-- Prevent users from deleting their entitlement records
CREATE POLICY "Users cannot delete entitlement records" ON feature_entitlements
  FOR DELETE USING (false);

-- Allow service role to manage all entitlements (for admin operations)
CREATE POLICY "Service role can manage all entitlements" ON feature_entitlements
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- BILLING EVENTS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view their own billing events" ON billing_events;
DROP POLICY IF EXISTS "Users can insert their own billing events" ON billing_events;

-- Enhanced RLS Policies for billing_events
CREATE POLICY "Users can view their own billing events" ON billing_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing events" ON billing_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prevent users from updating or deleting billing events (audit trail)
CREATE POLICY "Users cannot modify billing events" ON billing_events
  FOR UPDATE USING (false);

CREATE POLICY "Users cannot delete billing events" ON billing_events
  FOR DELETE USING (false);

-- Allow service role to manage all billing events (for admin operations)
CREATE POLICY "Service role can manage all billing events" ON billing_events
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- COMMUNITY TABLES ENHANCEMENTS
-- ============================================================================

-- Drop existing policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can view approved community prompts" ON community_prompts;
DROP POLICY IF EXISTS "Users can create their own community prompts" ON community_prompts;
DROP POLICY IF EXISTS "Users can update their own community prompts" ON community_prompts;
DROP POLICY IF EXISTS "Users can delete their own community prompts" ON community_prompts;

DROP POLICY IF EXISTS "Users can view their own saves" ON community_saves;
DROP POLICY IF EXISTS "Users can create their own saves" ON community_saves;
DROP POLICY IF EXISTS "Users can delete their own saves" ON community_saves;

DROP POLICY IF EXISTS "Users can view all ratings" ON community_ratings;
DROP POLICY IF EXISTS "Users can create their own ratings" ON community_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON community_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON community_ratings;

DROP POLICY IF EXISTS "Users can view all comments" ON community_comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON community_comments;

DROP POLICY IF EXISTS "Users can view their own follows" ON community_follows;
DROP POLICY IF EXISTS "Users can create their own follows" ON community_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON community_follows;

DROP POLICY IF EXISTS "Users can view their own notifications" ON community_notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON community_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON community_notifications;

-- Enhanced RLS Policies for community_prompts
CREATE POLICY "Users can view approved community prompts" ON community_prompts
  FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can view featured community prompts" ON community_prompts
  FOR SELECT USING (is_featured = true AND is_approved = true);

CREATE POLICY "Users can create their own community prompts" ON community_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community prompts" ON community_prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community prompts" ON community_prompts
  FOR DELETE USING (auth.uid() = user_id);

-- Enhanced RLS Policies for community_saves
CREATE POLICY "Users can view their own saves" ON community_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saves" ON community_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" ON community_saves
  FOR DELETE USING (auth.uid() = user_id);

-- Enhanced RLS Policies for community_ratings
CREATE POLICY "Users can view all ratings for approved prompts" ON community_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_prompts cp 
      WHERE cp.id = community_ratings.community_prompt_id 
      AND cp.is_approved = true
    )
  );

CREATE POLICY "Users can create their own ratings" ON community_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON community_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON community_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Enhanced RLS Policies for community_comments
CREATE POLICY "Users can view all comments for approved prompts" ON community_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_prompts cp 
      WHERE cp.id = community_comments.community_prompt_id 
      AND cp.is_approved = true
    )
  );

CREATE POLICY "Users can create their own comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON community_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON community_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Enhanced RLS Policies for community_follows
CREATE POLICY "Users can view their own follows" ON community_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create their own follows" ON community_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON community_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Enhanced RLS Policies for community_notifications
CREATE POLICY "Users can view their own notifications" ON community_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" ON community_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON community_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage all community content (for admin operations)
CREATE POLICY "Service role can manage all community content" ON community_prompts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all community saves" ON community_saves
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all community ratings" ON community_ratings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all community comments" ON community_comments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all community follows" ON community_follows
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all community notifications" ON community_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- ============================================================================

-- Function to check if user has permission to publish to community
CREATE OR REPLACE FUNCTION can_publish_to_community(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_entitlement BOOLEAN;
BEGIN
  -- Check if user has community_publish entitlement
  SELECT check_feature_entitlement(user_uuid, 'community_publish') INTO has_entitlement;
  
  RETURN has_entitlement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access premium features
CREATE OR REPLACE FUNCTION can_access_premium_features(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_status TEXT;
BEGIN
  -- Check if user has an active subscription
  SELECT status INTO subscription_status
  FROM subscriptions
  WHERE user_id = user_uuid 
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN subscription_status IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tier TEXT;
BEGIN
  -- Get user's subscription tier from profiles
  SELECT subscription_tier INTO tier
  FROM profiles
  WHERE id = user_uuid;
  
  RETURN COALESCE(tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin (for future admin features)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, return false. This can be enhanced later with admin role checking
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING FUNCTION
-- ============================================================================

-- Function to log security events (for future audit trail)
CREATE OR REPLACE FUNCTION log_security_event(
  user_uuid UUID,
  event_type TEXT,
  table_name TEXT,
  record_id UUID,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- This function can be used to log security events for audit purposes
  -- For now, it's a placeholder that can be enhanced later
  -- You could create an audit_logs table and insert records here
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RATE LIMITING FUNCTION
-- ============================================================================

-- Function to check rate limiting for API operations
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_uuid UUID,
  operation_type TEXT,
  time_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  recent_operations INTEGER;
BEGIN
  -- Count recent operations of the same type
  SELECT COUNT(*) INTO recent_operations
  FROM ai_usage_logs
  WHERE user_id = user_uuid 
    AND operation_type = check_rate_limit.operation_type
    AND created_at > NOW() - INTERVAL '1 minute' * time_window_minutes;
  
  -- Return true if under limit (adjust limits as needed)
  RETURN recent_operations < 100; -- 100 operations per time window
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
