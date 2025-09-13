#!/bin/bash

# Fix Prompt Templates Schema Migration Script
# This script adds the missing columns to the prompt_templates table

echo "🔧 Fixing prompt_templates schema..."

# Check if we're in the right directory
if [ ! -f "fix_schema_migration.sql" ]; then
    echo "❌ Error: fix_schema_migration.sql not found in current directory"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📋 Running schema migration..."
echo "This will add the missing 'metadata' and 'template_content' columns to prompt_templates table"

# Run the migration
# Note: You'll need to replace this with your actual Supabase connection details
# For local development with Supabase CLI:
if command -v supabase &> /dev/null; then
    echo "🚀 Running migration with Supabase CLI..."
    supabase db reset --linked
    echo "✅ Database reset complete. Please run your migrations again."
else
    echo "📝 Manual migration required:"
    echo "1. Copy the contents of fix_schema_migration.sql"
    echo "2. Run it in your Supabase SQL Editor"
    echo "3. Or use your preferred database client"
    echo ""
    echo "Migration SQL:"
    cat fix_schema_migration.sql
fi

echo ""
echo "🎉 Schema fix complete!"
echo "The prompt_templates table now includes:"
echo "  - metadata (JSONB) - for storing additional prompt data"
echo "  - template_content (TEXT) - for the actual prompt content"
