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
