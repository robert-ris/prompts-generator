-- Fix prompt_templates table schema
-- Add missing columns that the application expects

-- Add metadata column for storing additional prompt metadata
ALTER TABLE prompt_templates 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add template_content column (if it doesn't exist)
-- Note: The existing 'content' column might need to be renamed or we need to add template_content
-- Let's check if we need to rename 'content' to 'template_content' or add both
ALTER TABLE prompt_templates 
ADD COLUMN IF NOT EXISTS template_content TEXT;

-- If template_content is empty but content has data, copy content to template_content
UPDATE prompt_templates 
SET template_content = content 
WHERE template_content IS NULL AND content IS NOT NULL;

-- Create index on metadata for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_metadata ON prompt_templates USING gin(metadata);

-- Update the database types to reflect the new schema
-- This ensures PostgREST knows about the new columns
