-- Create prompt_templates table with full-text search
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  core_settings JSONB, -- Store core prompt settings like role, niche, task type, etc.
  advanced_settings JSONB, -- Store advanced prompt settings like perspective, creativity level, etc.
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create full-text search index
CREATE INDEX idx_prompt_templates_fts ON prompt_templates 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content));

-- Create indexes for performance
CREATE INDEX idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_is_public ON prompt_templates(is_public);
CREATE INDEX idx_prompt_templates_is_featured ON prompt_templates(is_featured);
CREATE INDEX idx_prompt_templates_created_at ON prompt_templates(created_at);
CREATE INDEX idx_prompt_templates_usage_count ON prompt_templates(usage_count);
CREATE INDEX idx_prompt_templates_rating_average ON prompt_templates(rating_average);
CREATE INDEX idx_prompt_templates_tags ON prompt_templates USING gin(tags);

-- Add trigger to prompt_templates table
CREATE TRIGGER update_prompt_templates_updated_at 
  BEFORE UPDATE ON prompt_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_templates
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

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prompt_templates 
  SET usage_count = usage_count + 1 
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update rating
CREATE OR REPLACE FUNCTION update_template_rating(
  template_id UUID,
  new_rating INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE prompt_templates 
  SET 
    rating_average = (
      (rating_average * rating_count + new_rating) / (rating_count + 1)
    ),
    rating_count = rating_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;
