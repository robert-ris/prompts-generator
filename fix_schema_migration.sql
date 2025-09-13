-- =====================================================
-- FIX PROMPT TEMPLATES SCHEMA
-- This migration adds missing columns that the application expects
-- =====================================================

-- Add metadata column for storing additional prompt metadata
ALTER TABLE prompt_templates 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add template_content column (if it doesn't exist)
ALTER TABLE prompt_templates 
ADD COLUMN IF NOT EXISTS template_content TEXT;

-- If template_content is empty but content has data, copy content to template_content
UPDATE prompt_templates 
SET template_content = content 
WHERE template_content IS NULL AND content IS NOT NULL;

-- Create index on metadata for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_metadata ON prompt_templates USING gin(metadata);

-- Create index on template_content for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_template_content ON prompt_templates(template_content);

-- Update any existing records that might have null metadata
UPDATE prompt_templates 
SET metadata = '{}' 
WHERE metadata IS NULL;

-- Ensure the metadata column has a default value for new records
ALTER TABLE prompt_templates 
ALTER COLUMN metadata SET DEFAULT '{}';

-- Refresh the schema cache so PostgREST recognizes the new columns
NOTIFY pgrst, 'reload schema';
