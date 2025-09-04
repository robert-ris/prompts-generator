-- =====================================================
-- SUPABASE DATABASE SETUP SCRIPT
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
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

-- =====================================================
-- 2. PROMPT TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. AI USAGE QUOTAS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_quotas (
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

-- =====================================================
-- 4. AI USAGE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('tighten', 'expand', 'improve', 'generate')),
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_cents INTEGER NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. AI PROVIDER CONFIGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  input_cost_per_1k_tokens INTEGER NOT NULL,
  output_cost_per_1k_tokens INTEGER NOT NULL,
  max_tokens_per_request INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. SUBSCRIPTION MANAGEMENT TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. COMMUNITY TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompt_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

CREATE TABLE IF NOT EXISTS prompt_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES prompt_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Prompt templates indexes
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_public ON prompt_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_featured ON prompt_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_created_at ON prompt_templates(created_at);

-- AI usage indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_template_id ON ai_usage_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_operation_type ON ai_usage_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_success ON ai_usage_logs(success);

CREATE INDEX IF NOT EXISTS idx_user_quotas_quota_reset_date ON user_quotas(quota_reset_date);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON prompt_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_template_id ON prompt_likes(template_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_template_id ON prompt_comments(template_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_user_id ON prompt_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_parent_comment_id ON prompt_comments(parent_comment_id);

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at 
  BEFORE UPDATE ON prompt_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quotas_updated_at 
  BEFORE UPDATE ON user_quotas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_provider_configs_updated_at 
  BEFORE UPDATE ON ai_provider_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_comments_updated_at 
  BEFORE UPDATE ON prompt_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Prompt templates policies
DROP POLICY IF EXISTS "Users can view public templates" ON prompt_templates;
CREATE POLICY "Users can view public templates" ON prompt_templates
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own templates" ON prompt_templates;
CREATE POLICY "Users can manage their own templates" ON prompt_templates
  FOR ALL USING (auth.uid() = user_id);

-- User quotas policies
DROP POLICY IF EXISTS "Users can view their own quotas" ON user_quotas;
CREATE POLICY "Users can view their own quotas" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quotas" ON user_quotas;
CREATE POLICY "Users can update their own quotas" ON user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quotas" ON user_quotas;
CREATE POLICY "Users can insert their own quotas" ON user_quotas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI usage logs policies
DROP POLICY IF EXISTS "Users can view their own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can view their own usage logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can insert their own usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI provider configs policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view provider configs" ON ai_provider_configs;
CREATE POLICY "Authenticated users can view provider configs" ON ai_provider_configs
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default AI provider configurations
INSERT INTO ai_provider_configs (provider_name, model_name, input_cost_per_1k_tokens, output_cost_per_1k_tokens, max_tokens_per_request) 
VALUES
  ('openai', 'gpt-4o-mini', 15, 60, 128000),
  ('openai', 'gpt-4o', 250, 1000, 128000),
  ('openai', 'gpt-3.5-turbo', 50, 150, 16385),
  ('anthropic', 'claude-3-haiku-20240307', 25, 125, 200000),
  ('anthropic', 'claude-3-sonnet-20240229', 300, 1500, 200000),
  ('anthropic', 'claude-3-opus-20240229', 1500, 7500, 200000)
ON CONFLICT (provider_name) DO NOTHING;

-- Insert default prompt categories
INSERT INTO prompt_categories (name, description, icon, color, sort_order) 
VALUES
  ('Writing', 'Writing and content creation prompts', '✍️', '#3B82F6', 1),
  ('Business', 'Business and professional prompts', '💼', '#10B981', 2),
  ('Creative', 'Creative and artistic prompts', '🎨', '#8B5CF6', 3),
  ('Education', 'Educational and learning prompts', '📚', '#F59E0B', 4),
  ('Technology', 'Technology and programming prompts', '💻', '#EF4444', 5),
  ('Marketing', 'Marketing and advertising prompts', '📢', '#EC4899', 6)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to increment quota usage
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

-- Function to get user quota status
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
    ('subscription_events'),
    ('prompt_categories'),
    ('prompt_likes'),
    ('prompt_comments')
) AS t(table_name)
LEFT JOIN information_schema.tables ist ON ist.table_name = t.table_name
WHERE ist.table_schema = 'public';

-- Check if default data was inserted
SELECT 'AI Provider Configs' as table_name, COUNT(*) as record_count FROM ai_provider_configs
UNION ALL
SELECT 'Prompt Categories' as table_name, COUNT(*) as record_count FROM prompt_categories;
