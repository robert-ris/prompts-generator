-- =====================================================
-- ESSENTIAL SUPABASE TABLES MIGRATION
-- Run this script to create the core tables for your app
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Add trigger to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON profiles 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. PROMPT TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  variables JSONB,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger to prompt_templates table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_prompt_templates_updated_at') THEN
    CREATE TRIGGER update_prompt_templates_updated_at 
      BEFORE UPDATE ON prompt_templates 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for prompt_templates
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_public ON prompt_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_is_featured ON prompt_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_created_at ON prompt_templates(created_at);

-- Enable Row Level Security
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_templates
DROP POLICY IF EXISTS "Users can view their own templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can view public templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON prompt_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON prompt_templates;

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

-- =====================================================
-- 3. AI USAGE LOGS TABLE
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

-- Create indexes for ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_template_id ON ai_usage_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_operation_type ON ai_usage_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- Enable Row Level Security
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_logs
DROP POLICY IF EXISTS "Users can view their own usage logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "Users can insert their own usage logs" ON ai_usage_logs;

CREATE POLICY "Users can view their own usage logs" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. USER QUOTAS TABLE
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

-- Add trigger to user_quotas table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_quotas_updated_at') THEN
    CREATE TRIGGER update_user_quotas_updated_at 
      BEFORE UPDATE ON user_quotas 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for user_quotas
CREATE INDEX IF NOT EXISTS idx_user_quotas_quota_reset_date ON user_quotas(quota_reset_date);

-- Enable Row Level Security
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_quotas
DROP POLICY IF EXISTS "Users can view their own quotas" ON user_quotas;
DROP POLICY IF EXISTS "Users can update their own quotas" ON user_quotas;
DROP POLICY IF EXISTS "Users can insert their own quotas" ON user_quotas;

CREATE POLICY "Users can view their own quotas" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas" ON user_quotas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotas" ON user_quotas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- Add trigger to ai_provider_configs table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_provider_configs_updated_at') THEN
    CREATE TRIGGER update_ai_provider_configs_updated_at 
      BEFORE UPDATE ON ai_provider_configs 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_provider_configs
DROP POLICY IF EXISTS "Authenticated users can view provider configs" ON ai_provider_configs;

CREATE POLICY "Authenticated users can view provider configs" ON ai_provider_configs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert default AI provider configurations
INSERT INTO ai_provider_configs (provider_name, model_name, input_cost_per_1k_tokens, output_cost_per_1k_tokens, max_tokens_per_request) VALUES
('openai', 'gpt-4', 30, 60, 8192),
('openai', 'gpt-4-turbo', 10, 30, 128000),
('openai', 'gpt-3.5-turbo', 2, 2, 16385),
('anthropic', 'claude-3-opus', 150, 750, 200000),
('anthropic', 'claude-3-sonnet', 30, 150, 200000),
('anthropic', 'claude-3-haiku', 3, 15, 200000)
ON CONFLICT (provider_name) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
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
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Essential tables created successfully!' as status;
