#!/bin/bash

echo "=== SUPABASE MIGRATION EXECUTION SCRIPT ==="
echo ""
echo "This script will help you run all migrations in order."
echo "Copy each migration content to your Supabase SQL Editor."
echo ""

# Function to display migration info
show_migration() {
    local file=$1
    local name=$2
    echo "=== $name ==="
    echo "File: $file"
    echo "Copy the content below to Supabase SQL Editor:"
    echo ""
    cat "$file"
    echo ""
    echo "Press Enter to continue to next migration..."
    read -r
    echo ""
}

# Run migrations in order
show_migration "supabase/migrations/001_initial_schema.sql" "MIGRATION 001: Initial Schema"
show_migration "supabase/migrations/002_prompt_templates.sql" "MIGRATION 002: Prompt Templates"
show_migration "supabase/migrations/003_ai_usage_quotas.sql" "MIGRATION 003: AI Usage Quotas"
show_migration "supabase/migrations/004_subscription_management.sql" "MIGRATION 004: Subscription Management"
show_migration "supabase/migrations/005_community_tables.sql" "MIGRATION 005: Community Tables"
show_migration "supabase/migrations/006_enhanced_rls_policies.sql" "MIGRATION 006: Enhanced RLS Policies"
show_migration "supabase/migrations/007_performance_optimization.sql" "MIGRATION 007: Performance Optimization"
show_migration "supabase/migrations/008_realtime_setup.sql" "MIGRATION 008: Real-time Setup"
show_migration "supabase/migrations/009_auto_create_profiles.sql" "MIGRATION 009: Auto-create Profiles"

echo "=== ALL MIGRATIONS COMPLETED ==="
echo "Your Supabase database is now fully set up!"
echo ""
echo "Next steps:"
echo "1. Verify all tables were created"
echo "2. Test the database functions"
echo "3. Configure your environment variables"
