-- =====================================================
-- SUPABASE MIGRATION VERIFICATION SCRIPT
-- Run this after executing the complete migration
-- =====================================================

-- Check if all tables were created successfully
SELECT 
  'Tables Created' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ SUCCESS'
    ELSE '❌ MISSING TABLES'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'prompt_templates', 'user_quotas', 'ai_usage_logs', 
    'ai_provider_configs', 'subscriptions', 'subscription_plans', 
    'feature_entitlements', 'billing_events'
  );

-- Check if indexes were created
SELECT 
  'Indexes Created' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ SUCCESS'
    ELSE '⚠️ SOME INDEXES MISSING'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check if functions were created
SELECT 
  'Functions Created' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ SUCCESS'
    ELSE '⚠️ SOME FUNCTIONS MISSING'
  END as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'update_updated_at_column', 'increment_template_usage', 
    'update_template_rating', 'increment_quota_usage', 
    'get_user_quota_status', 'check_feature_entitlement',
    'increment_feature_usage', 'get_user_active_subscription'
  );

-- Check if triggers were created
SELECT 
  'Triggers Created' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ SUCCESS'
    ELSE '⚠️ SOME TRIGGERS MISSING'
  END as status
FROM pg_trigger 
WHERE tgname LIKE '%updated_at%';

-- Check if RLS is enabled
SELECT 
  'RLS Enabled' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ SUCCESS'
    ELSE '⚠️ SOME TABLES MISSING RLS'
  END as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN (
    'profiles', 'prompt_templates', 'user_quotas', 'ai_usage_logs', 
    'ai_provider_configs', 'subscriptions', 'subscription_plans', 
    'feature_entitlements', 'billing_events'
  )
  AND c.relrowsecurity = true;

-- Check default data
SELECT 
  'Default Data' as check_type,
  (SELECT COUNT(*) FROM ai_provider_configs) as ai_configs,
  (SELECT COUNT(*) FROM subscription_plans) as subscription_plans,
  CASE 
    WHEN (SELECT COUNT(*) FROM ai_provider_configs) >= 6 
     AND (SELECT COUNT(*) FROM subscription_plans) >= 3 THEN '✅ SUCCESS'
    ELSE '⚠️ MISSING DEFAULT DATA'
  END as status;

-- Test a function
SELECT 
  'Function Test' as check_type,
  CASE 
    WHEN get_user_quota_status('00000000-0000-0000-0000-000000000000'::UUID) IS NOT NULL THEN '✅ SUCCESS'
    ELSE '❌ FUNCTION ERROR'
  END as status;

-- Summary
SELECT 
  '=== MIGRATION SUMMARY ===' as summary,
  'If all checks show ✅ SUCCESS, your database is ready!' as message;
