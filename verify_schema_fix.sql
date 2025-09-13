-- =====================================================
-- VERIFY PROMPT TEMPLATES SCHEMA
-- Run this to check if the schema is correctly set up
-- =====================================================

-- Check if the prompt_templates table has all required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prompt_templates' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the metadata column exists and has the right type
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'prompt_templates' 
            AND column_name = 'metadata' 
            AND data_type = 'jsonb'
        ) THEN '✅ metadata column exists with correct type'
        ELSE '❌ metadata column missing or wrong type'
    END as metadata_status;

-- Check if the template_content column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'prompt_templates' 
            AND column_name = 'template_content' 
            AND data_type = 'text'
        ) THEN '✅ template_content column exists'
        ELSE '❌ template_content column missing'
    END as template_content_status;

-- Test inserting a record with the new schema
INSERT INTO prompt_templates (
    user_id,
    title,
    content,
    template_content,
    category,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- dummy UUID for testing
    'Test Prompt',
    'This is a test prompt content',
    'This is a test prompt template content',
    'test',
    '{"isFavorite": false, "usageCount": 0}'::jsonb
) ON CONFLICT DO NOTHING;

-- Clean up test record
DELETE FROM prompt_templates 
WHERE title = 'Test Prompt' 
AND user_id = '00000000-0000-0000-0000-000000000000';

-- Show sample data structure
SELECT 
    'Schema verification complete' as status,
    'prompt_templates table is ready for use' as message;
