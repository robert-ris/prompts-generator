-- Real-time Subscriptions Setup
-- This migration enables real-time subscriptions for all tables and configures real-time settings

-- ============================================================================
-- ENABLE REAL-TIME FOR ALL TABLES
-- ============================================================================

-- Enable real-time for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable real-time for prompt_templates table
ALTER PUBLICATION supabase_realtime ADD TABLE prompt_templates;

-- Enable real-time for ai_usage_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_usage_logs;

-- Enable real-time for user_quotas table
ALTER PUBLICATION supabase_realtime ADD TABLE user_quotas;

-- Enable real-time for ai_provider_configs table
ALTER PUBLICATION supabase_realtime ADD TABLE ai_provider_configs;

-- Enable real-time for subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- Enable real-time for subscription_plans table
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;

-- Enable real-time for feature_entitlements table
ALTER PUBLICATION supabase_realtime ADD TABLE feature_entitlements;

-- Enable real-time for billing_events table
ALTER PUBLICATION supabase_realtime ADD TABLE billing_events;

-- Enable real-time for community_prompts table
ALTER PUBLICATION supabase_realtime ADD TABLE community_prompts;

-- Enable real-time for community_saves table
ALTER PUBLICATION supabase_realtime ADD TABLE community_saves;

-- Enable real-time for community_ratings table
ALTER PUBLICATION supabase_realtime ADD TABLE community_ratings;

-- Enable real-time for community_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;

-- Enable real-time for community_follows table
ALTER PUBLICATION supabase_realtime ADD TABLE community_follows;

-- Enable real-time for community_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE community_notifications;

-- ============================================================================
-- REAL-TIME CONFIGURATION FUNCTIONS
-- ============================================================================

-- Function to get real-time subscription status
CREATE OR REPLACE FUNCTION get_realtime_status()
RETURNS TABLE(
  table_name TEXT,
  is_realtime_enabled BOOLEAN,
  publication_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    EXISTS (
      SELECT 1 FROM pg_publication_tables pt
      JOIN pg_publication p ON pt.pubname = p.pubname
      WHERE pt.tablename = t.table_name
      AND p.pubname = 'supabase_realtime'
    ) AS is_realtime_enabled,
    'supabase_realtime'::TEXT AS publication_name
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable real-time for a specific table
CREATE OR REPLACE FUNCTION enable_realtime_for_table(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable real-time for a specific table
CREATE OR REPLACE FUNCTION disable_realtime_for_table(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %I', table_name);
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REAL-TIME TRIGGERS FOR NOTIFICATIONS
-- ============================================================================

-- Function to create real-time notification
CREATE OR REPLACE FUNCTION create_realtime_notification(
  table_name TEXT,
  operation TEXT,
  record_id UUID,
  user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- This function can be used to create custom real-time notifications
  -- For now, it's a placeholder that can be enhanced later
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REAL-TIME EVENT LOGGING
-- ============================================================================

-- Create real-time event logging table
CREATE TABLE IF NOT EXISTS realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for real-time events
CREATE INDEX IF NOT EXISTS idx_realtime_events_table_name ON realtime_events(table_name);
CREATE INDEX IF NOT EXISTS idx_realtime_events_operation ON realtime_events(operation);
CREATE INDEX IF NOT EXISTS idx_realtime_events_user_id ON realtime_events(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON realtime_events(created_at);

-- Enable real-time for realtime_events table
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_events;

-- Function to log real-time events
CREATE OR REPLACE FUNCTION log_realtime_event(
  p_table_name TEXT,
  p_operation TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_event_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO realtime_events (
    table_name,
    operation,
    record_id,
    user_id,
    event_data
  ) VALUES (
    p_table_name,
    p_operation,
    p_record_id,
    p_user_id,
    p_event_data
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REAL-TIME TRIGGERS FOR SPECIFIC TABLES
-- ============================================================================

-- Trigger function for community notifications
CREATE OR REPLACE FUNCTION trigger_community_notification_realtime()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the real-time event
  PERFORM log_realtime_event(
    'community_notifications',
    TG_OP,
    NEW.id,
    NEW.user_id,
    jsonb_build_object(
      'type', NEW.type,
      'title', NEW.title,
      'is_read', NEW.is_read
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for community notifications
CREATE TRIGGER community_notifications_realtime_trigger
  AFTER INSERT OR UPDATE ON community_notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_community_notification_realtime();

-- Trigger function for community comments
CREATE OR REPLACE FUNCTION trigger_community_comment_realtime()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the real-time event
  PERFORM log_realtime_event(
    'community_comments',
    TG_OP,
    NEW.id,
    NEW.user_id,
    jsonb_build_object(
      'community_prompt_id', NEW.community_prompt_id,
      'parent_comment_id', NEW.parent_comment_id,
      'content', NEW.content
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for community comments
CREATE TRIGGER community_comments_realtime_trigger
  AFTER INSERT OR UPDATE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_community_comment_realtime();

-- Trigger function for community ratings
CREATE OR REPLACE FUNCTION trigger_community_rating_realtime()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the real-time event
  PERFORM log_realtime_event(
    'community_ratings',
    TG_OP,
    NEW.id,
    NEW.user_id,
    jsonb_build_object(
      'community_prompt_id', NEW.community_prompt_id,
      'rating', NEW.rating,
      'review', NEW.review
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for community ratings
CREATE TRIGGER community_ratings_realtime_trigger
  AFTER INSERT OR UPDATE ON community_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_community_rating_realtime();

-- Trigger function for community follows
CREATE OR REPLACE FUNCTION trigger_community_follow_realtime()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the real-time event
  PERFORM log_realtime_event(
    'community_follows',
    TG_OP,
    NEW.id,
    NEW.follower_id,
    jsonb_build_object(
      'following_id', NEW.following_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for community follows
CREATE TRIGGER community_follows_realtime_trigger
  AFTER INSERT OR DELETE ON community_follows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_community_follow_realtime();

-- ============================================================================
-- REAL-TIME CHANNEL MANAGEMENT
-- ============================================================================

-- Function to get available real-time channels
CREATE OR REPLACE FUNCTION get_realtime_channels()
RETURNS TABLE(
  channel_name TEXT,
  table_name TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    'profiles'::TEXT,
    'User profile updates'::TEXT
  UNION ALL
  SELECT 
    'prompt_templates'::TEXT,
    'prompt_templates'::TEXT,
    'Prompt template changes'::TEXT
  UNION ALL
  SELECT 
    'ai_usage_logs'::TEXT,
    'ai_usage_logs'::TEXT,
    'AI usage tracking'::TEXT
  UNION ALL
  SELECT 
    'user_quotas'::TEXT,
    'user_quotas'::TEXT,
    'User quota updates'::TEXT
  UNION ALL
  SELECT 
    'subscriptions'::TEXT,
    'subscriptions'::TEXT,
    'Subscription changes'::TEXT
  UNION ALL
  SELECT 
    'community_prompts'::TEXT,
    'community_prompts'::TEXT,
    'Community prompt updates'::TEXT
  UNION ALL
  SELECT 
    'community_notifications'::TEXT,
    'community_notifications'::TEXT,
    'User notifications'::TEXT
  UNION ALL
  SELECT 
    'community_comments'::TEXT,
    'community_comments'::TEXT,
    'Comment updates'::TEXT
  UNION ALL
  SELECT 
    'community_ratings'::TEXT,
    'community_ratings'::TEXT,
    'Rating updates'::TEXT
  UNION ALL
  SELECT 
    'community_follows'::TEXT,
    'community_follows'::TEXT,
    'Follow/unfollow events'::TEXT
  UNION ALL
  SELECT 
    'realtime_events'::TEXT,
    'realtime_events'::TEXT,
    'Real-time event logging'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REAL-TIME PERFORMANCE MONITORING
-- ============================================================================

-- Function to get real-time performance metrics
CREATE OR REPLACE FUNCTION get_realtime_performance_metrics()
RETURNS TABLE(
  metric_name TEXT,
  metric_value NUMERIC,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_realtime_events'::TEXT,
    (SELECT COUNT(*) FROM realtime_events)::NUMERIC,
    'Total real-time events logged'::TEXT
  UNION ALL
  SELECT 
    'events_last_24h'::TEXT,
    (SELECT COUNT(*) FROM realtime_events WHERE created_at >= NOW() - INTERVAL '24 hours')::NUMERIC,
    'Events in last 24 hours'::TEXT
  UNION ALL
  SELECT 
    'events_last_hour'::TEXT,
    (SELECT COUNT(*) FROM realtime_events WHERE created_at >= NOW() - INTERVAL '1 hour')::NUMERIC,
    'Events in last hour'::TEXT
  UNION ALL
  SELECT 
    'avg_events_per_hour'::TEXT,
    (SELECT AVG(event_count) FROM (
      SELECT COUNT(*) as event_count 
      FROM realtime_events 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY date_trunc('hour', created_at)
    ) hourly_counts)::NUMERIC,
    'Average events per hour'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REAL-TIME CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to clean up old real-time events
CREATE OR REPLACE FUNCTION cleanup_old_realtime_events(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM realtime_events 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REAL-TIME CONFIGURATION DOCUMENTATION
-- ============================================================================

-- Function to get real-time configuration summary
CREATE OR REPLACE FUNCTION get_realtime_config_summary()
RETURNS TABLE(
  setting_name TEXT,
  setting_value TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'enabled_tables'::TEXT,
    (SELECT COUNT(*)::TEXT FROM get_realtime_status() WHERE is_realtime_enabled = true),
    'Number of tables with real-time enabled'::TEXT
  UNION ALL
  SELECT 
    'total_channels'::TEXT,
    (SELECT COUNT(*)::TEXT FROM get_realtime_channels()),
    'Number of available real-time channels'::TEXT
  UNION ALL
  SELECT 
    'events_logged'::TEXT,
    (SELECT COUNT(*)::TEXT FROM realtime_events),
    'Total real-time events logged'::TEXT
  UNION ALL
  SELECT 
    'publication_name'::TEXT,
    'supabase_realtime'::TEXT,
    'Real-time publication name'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
