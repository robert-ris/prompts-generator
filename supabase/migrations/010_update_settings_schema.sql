-- Migration to update prompt_templates table schema
-- Replace variables field with core_settings and advanced_settings

-- First, add the new columns
ALTER TABLE prompt_templates 
ADD COLUMN core_settings JSONB,
ADD COLUMN advanced_settings JSONB;

-- Migrate existing variables data to core_settings (if any)
-- This is a basic migration - you may need to customize based on your existing data structure
UPDATE prompt_templates 
SET core_settings = COALESCE(variables, '{}'::jsonb)
WHERE variables IS NOT NULL;

-- Drop the old variables column
ALTER TABLE prompt_templates DROP COLUMN variables;

-- Add indexes for the new JSONB columns for better performance
CREATE INDEX idx_prompt_templates_core_settings ON prompt_templates USING gin(core_settings);
CREATE INDEX idx_prompt_templates_advanced_settings ON prompt_templates USING gin(advanced_settings);

-- Update the full-text search index to include the new fields
DROP INDEX IF EXISTS idx_prompt_templates_fts;
CREATE INDEX idx_prompt_templates_fts ON prompt_templates 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content));
