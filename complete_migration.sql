-- =====================================================
-- COMPLETE SUPABASE DATABASE MIGRATION
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- MIGRATION 001: Initial Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create user profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  location TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to profiles table
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- MIGRATION 002: Prompt Templates
-- Create prompt_templates table with full-text search
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  variables JSONB, -- Store template variables like {{role}}, {{topic}}, etc.
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create full-text search index
CREATE INDEX idx_prompt_templates_fts ON prompt_templates 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content));

-- Create indexes for performance
CREATE INDEX idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_is_public ON prompt_templates(is_public);
CREATE INDEX idx_prompt_templates_is_featured ON prompt_templates(is_featured);
CREATE INDEX idx_prompt_templates_created_at ON prompt_templates(created_at);
CREATE INDEX idx_prompt_templates_usage_count ON prompt_templates(usage_count);
CREATE INDEX idx_prompt_templates_rating_average ON prompt_templates(rating_average);
CREATE INDEX idx_prompt_templates_tags ON prompt_templates USING gin(tags);

-- Add trigger to prompt_templates table
CREATE TRIGGER update_prompt_templates_updated_at 
  BEFORE UPDATE ON prompt_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_templates
CREATE POLICY "Users can view their own templates" ON prompt_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON prompt_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own templates" ON prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON prompt_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON prompt_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prompt_templates 
  SET usage_count = usage_count + 1 
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update rating
CREATE OR REPLACE FUNCTION update_template_rating(
  template_id UUID,
  new_rating INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE prompt_templates 
  SET 
    rating_average = (
      (rating_average * rating_count + new_rating) / (rating_count + 1)
    ),
    rating_count = rating_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- MIGRATION 003: AI Usage Quotas
-- Create ai_usage_logs table for tracking AI API calls
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('tighten', 'expand', 'improve', 'generate')),
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL, -- Track actual API costs in cents
  provider TEXT NOT NULL, -- 'openai', 'anthropic', etc.
  model TEXT NOT NULL, -- 'gpt-4', 'claude-3-sonnet', etc.
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  response_time_ms INTEGER, -- Track API response time
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_quotas table for quota management
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ai_improve_calls_used INTEGER DEFAULT 0,
  ai_improve_calls_limit INTEGER DEFAULT 10,
  ai_generate_calls_used INTEGER DEFAULT 0,
  ai_generate_calls_limit INTEGER DEFAULT 5,
  total_tokens_used INTEGER DEFAULT 0,
  total_tokens_limit INTEGER DEFAULT 10000,
  total_cost_cents INTEGER DEFAULT 0,
  quota_reset_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 month',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_provider_configs table for provider settings
CREATE TABLE ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  input_cost_per_1k_tokens INTEGER NOT NULL, -- Cost in cents per 1k input tokens
  output_cost_per_1k_tokens INTEGER NOT NULL, -- Cost in cents per 1k output tokens
  max_tokens_per_request INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_template_id ON ai_usage_logs(template_id);
CREATE INDEX idx_ai_usage_logs_operation_type ON ai_usage_logs(operation_type);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX idx_ai_usage_logs_success ON ai_usage_logs(success);

CREATE INDEX idx_user_quotas_quota_reset_date ON user_quotas(quota_reset_date);

-- Add triggers for updated_at
CREATE TRIGGER update_user_quotas_updated_at 
  BEFORE UPDATE ON user_quotas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_provider_configs_updated_at 
  BEFORE UPDATE ON ai_provider_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view their own usage logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_quotas
CREATE POLICY "Users can view their own quotas" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" ON user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotas" ON user_quotas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_provider_configs (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view provider configs" ON ai_provider_configs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to increment quota usage
CREATE OR REPLACE FUNCTION increment_quota_usage(
  user_uuid UUID,
  operation_type TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_cents INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  quota_record user_quotas%ROWTYPE;
  new_quota_reset_date DATE;
BEGIN
  -- Get current quota record
  SELECT * INTO quota_record FROM user_quotas WHERE user_id = user_uuid;
  
  -- If no quota record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_quotas (user_id) VALUES (user_uuid);
    SELECT * INTO quota_record FROM user_quotas WHERE user_id = user_uuid;
  END IF;
  
  -- Check if quota reset is needed
  IF quota_record.quota_reset_date < CURRENT_DATE THEN
    new_quota_reset_date := CURRENT_DATE + INTERVAL '1 month';
    
    UPDATE user_quotas 
    SET 
      ai_improve_calls_used = 0,
      ai_generate_calls_used = 0,
      total_tokens_used = 0,
      total_cost_cents = 0,
      quota_reset_date = new_quota_reset_date,
      updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Refresh quota record
    SELECT * INTO quota_record FROM user_quotas WHERE user_id = user_uuid;
  END IF;
  
  -- Check quota limits based on operation type
  IF operation_type = 'improve' THEN
    IF quota_record.ai_improve_calls_used >= quota_record.ai_improve_calls_limit THEN
      RETURN FALSE; -- Quota exceeded
    END IF;
  ELSIF operation_type = 'generate' THEN
    IF quota_record.ai_generate_calls_used >= quota_record.ai_generate_calls_limit THEN
      RETURN FALSE; -- Quota exceeded
    END IF;
  END IF;
  
  -- Check total tokens limit
  IF quota_record.total_tokens_used + input_tokens + output_tokens > quota_record.total_tokens_limit THEN
    RETURN FALSE; -- Token limit exceeded
  END IF;
  
  -- Update quota usage
  UPDATE user_quotas 
  SET 
    ai_improve_calls_used = CASE 
      WHEN operation_type = 'improve' THEN ai_improve_calls_used + 1 
      ELSE ai_improve_calls_used 
    END,
    ai_generate_calls_used = CASE 
      WHEN operation_type = 'generate' THEN ai_generate_calls_used + 1 
      ELSE ai_generate_calls_used 
    END,
    total_tokens_used = total_tokens_used + input_tokens + output_tokens,
    total_cost_cents = total_cost_cents + cost_cents,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN TRUE; -- Quota update successful
END;
$$ LANGUAGE plpgsql;

-- Create function to get user quota status
CREATE OR REPLACE FUNCTION get_user_quota_status(user_uuid UUID)
RETURNS TABLE(
  user_id UUID,
  ai_improve_calls_used INTEGER,
  ai_improve_calls_limit INTEGER,
  ai_generate_calls_used INTEGER,
  ai_generate_calls_limit INTEGER,
  total_tokens_used INTEGER,
  total_tokens_limit INTEGER,
  total_cost_cents INTEGER,
  quota_reset_date DATE,
  can_use_improve BOOLEAN,
  can_use_generate BOOLEAN,
  can_use_tokens BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uq.user_id,
    uq.ai_improve_calls_used,
    uq.ai_improve_calls_limit,
    uq.ai_generate_calls_used,
    uq.ai_generate_calls_limit,
    uq.total_tokens_used,
    uq.total_tokens_limit,
    uq.total_cost_cents,
    uq.quota_reset_date,
    uq.ai_improve_calls_used < uq.ai_improve_calls_limit AS can_use_improve,
    uq.ai_generate_calls_used < uq.ai_generate_calls_limit AS can_use_generate,
    uq.total_tokens_used < uq.total_tokens_limit AS can_use_tokens
  FROM user_quotas uq
  WHERE uq.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Insert default AI provider configurations
INSERT INTO ai_provider_configs (provider_name, model_name, input_cost_per_1k_tokens, output_cost_per_1k_tokens, max_tokens_per_request) VALUES
('openai', 'gpt-4', 30, 60, 8192),
('openai', 'gpt-4-turbo', 10, 30, 128000),
('openai', 'gpt-3.5-turbo', 2, 2, 16385),
('anthropic', 'claude-3-opus', 150, 750, 200000),
('anthropic', 'claude-3-sonnet', 30, 150, 200000),
('anthropic', 'claude-3-haiku', 3, 15, 200000);

-- MIGRATION 004: Subscription Management
-- Create subscriptions table for managing user subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired')),
  plan_id TEXT NOT NULL, -- 'free', 'pro', 'enterprise'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_plans table for plan definitions
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY, -- 'free', 'pro', 'enterprise'
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL, -- Monthly price in cents
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  stripe_price_id TEXT UNIQUE,
  features JSONB NOT NULL, -- Store feature entitlements
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature_entitlements table for granular feature access
CREATE TABLE feature_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feature_name TEXT NOT NULL, -- 'ai_improve', 'ai_generate', 'community_publish', etc.
  is_enabled BOOLEAN DEFAULT true,
  usage_limit INTEGER, -- NULL means unlimited
  usage_count INTEGER DEFAULT 0,
  reset_frequency TEXT CHECK (reset_frequency IN ('never', 'daily', 'weekly', 'monthly')),
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

-- Create billing_events table for tracking billing history
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL, -- 'invoice.payment_succeeded', 'invoice.payment_failed', etc.
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  metadata JSONB, -- Store additional event data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id);

CREATE INDEX idx_feature_entitlements_user_id ON feature_entitlements(user_id);
CREATE INDEX idx_feature_entitlements_feature_name ON feature_entitlements(feature_name);
CREATE INDEX idx_feature_entitlements_is_enabled ON feature_entitlements(is_enabled);

CREATE INDEX idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX idx_billing_events_subscription_id ON billing_events(subscription_id);
CREATE INDEX idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_created_at ON billing_events(created_at);

-- Add triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON subscription_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_entitlements_updated_at 
  BEFORE UPDATE ON feature_entitlements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for subscription_plans (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view subscription plans" ON subscription_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for feature_entitlements
CREATE POLICY "Users can view their own entitlements" ON feature_entitlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entitlements" ON feature_entitlements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entitlements" ON feature_entitlements
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for billing_events
CREATE POLICY "Users can view their own billing events" ON billing_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing events" ON billing_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to check feature entitlement
CREATE OR REPLACE FUNCTION check_feature_entitlement(
  user_uuid UUID,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  entitlement_record feature_entitlements%ROWTYPE;
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Get user's feature entitlement
  SELECT * INTO entitlement_record 
  FROM feature_entitlements 
  WHERE user_id = user_uuid AND feature_name = check_feature_entitlement.feature_name;
  
  -- If no entitlement record exists, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if feature is enabled
  IF NOT entitlement_record.is_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Check usage limits if applicable
  IF entitlement_record.usage_limit IS NOT NULL THEN
    -- Reset usage count if needed
    IF entitlement_record.reset_frequency = 'daily' AND entitlement_record.last_reset_date < current_date THEN
      UPDATE feature_entitlements 
      SET usage_count = 0, last_reset_date = current_date, updated_at = NOW()
      WHERE id = entitlement_record.id;
      entitlement_record.usage_count = 0;
    ELSIF entitlement_record.reset_frequency = 'weekly' AND entitlement_record.last_reset_date < current_date - INTERVAL '7 days' THEN
      UPDATE feature_entitlements 
      SET usage_count = 0, last_reset_date = current_date, updated_at = NOW()
      WHERE id = entitlement_record.id;
      entitlement_record.usage_count = 0;
    ELSIF entitlement_record.reset_frequency = 'monthly' AND entitlement_record.last_reset_date < current_date - INTERVAL '1 month' THEN
      UPDATE feature_entitlements 
      SET usage_count = 0, last_reset_date = current_date, updated_at = NOW()
      WHERE id = entitlement_record.id;
      entitlement_record.usage_count = 0;
    END IF;
    
    -- Check if usage limit exceeded
    IF entitlement_record.usage_count >= entitlement_record.usage_limit THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(
  user_uuid UUID,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  can_use BOOLEAN;
BEGIN
  -- Check if user can use the feature
  can_use := check_feature_entitlement(user_uuid, feature_name);
  
  IF NOT can_use THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage count
  UPDATE feature_entitlements 
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE user_id = user_uuid AND feature_name = increment_feature_usage.feature_name;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's active subscription
CREATE OR REPLACE FUNCTION get_user_active_subscription(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT,
  plan_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  plan_name TEXT,
  plan_description TEXT,
  price_cents INTEGER,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.stripe_subscription_id,
    s.stripe_customer_id,
    s.status,
    s.plan_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    sp.name,
    sp.description,
    sp.price_cents,
    sp.features
  FROM subscriptions s
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = user_uuid 
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > NOW()
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_cents, interval, features) VALUES
('free', 'Free', 'Basic features for getting started', 0, 'month', '{"ai_improve_calls": 10, "ai_generate_calls": 5, "max_tokens": 10000, "community_access": true, "max_saved_prompts": 20, "max_categories": 3}'),
('pro', 'Pro', 'Advanced features for power users', 1999, 'month', '{"ai_improve_calls": 200, "ai_generate_calls": 100, "max_tokens": 100000, "community_access": true, "community_publish": true, "max_saved_prompts": -1, "max_categories": -1, "priority_support": true, "advanced_analytics": true}'),
('enterprise', 'Enterprise', 'Custom solutions for teams', 9999, 'month', '{"ai_improve_calls": -1, "ai_generate_calls": -1, "max_tokens": -1, "community_access": true, "community_publish": true, "max_saved_prompts": -1, "max_categories": -1, "priority_support": true, "advanced_analytics": true, "team_management": true, "custom_integrations": true}');

-- Insert default feature entitlements for free users
INSERT INTO feature_entitlements (user_id, feature_name, is_enabled, usage_limit, reset_frequency) 
SELECT 
  p.id,
  'ai_improve',
  true,
  10,
  'monthly'
FROM profiles p
WHERE p.subscription_tier = 'free';

INSERT INTO feature_entitlements (user_id, feature_name, is_enabled, usage_limit, reset_frequency) 
SELECT 
  p.id,
  'ai_generate',
  true,
  5,
  'monthly'
FROM profiles p
WHERE p.subscription_tier = 'free';

INSERT INTO feature_entitlements (user_id, feature_name, is_enabled, usage_limit, reset_frequency) 
SELECT 
  p.id,
  'community_publish',
  false,
  NULL,
  'never'
FROM profiles p
WHERE p.subscription_tier = 'free';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM (
  VALUES 
    ('profiles'),
    ('prompt_templates'),
    ('user_quotas'),
    ('ai_usage_logs'),
    ('ai_provider_configs'),
    ('subscriptions'),
    ('subscription_plans'),
    ('feature_entitlements'),
    ('billing_events')
) AS t(table_name)
LEFT JOIN information_schema.tables ist ON ist.table_name = t.table_name
WHERE ist.table_schema = 'public';

-- Check if default data was inserted
SELECT 'AI Provider Configs' as table_name, COUNT(*) as record_count FROM ai_provider_configs
UNION ALL
SELECT 'Subscription Plans' as table_name, COUNT(*) as record_count FROM subscription_plans;
