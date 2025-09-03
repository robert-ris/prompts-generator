-- Create community_prompts table for shared community content
CREATE TABLE community_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  variables JSONB, -- Store template variables
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create community_saves table for user saves/bookmarks
CREATE TABLE community_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_prompt_id UUID REFERENCES community_prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, community_prompt_id)
);

-- Create community_ratings table for user ratings and reviews
CREATE TABLE community_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_prompt_id UUID REFERENCES community_prompts(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_helpful BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, community_prompt_id)
);

-- Create community_comments table for discussions
CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_prompt_id UUID REFERENCES community_prompts(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  edit_history JSONB, -- Store edit history
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create community_follows table for user relationships
CREATE TABLE community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create community_notifications table for user notifications
CREATE TABLE community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'rating', 'follow', 'save', 'feature', 'approval')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID of related content (prompt, comment, etc.)
  related_type TEXT, -- Type of related content
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_community_prompts_user_id ON community_prompts(user_id);
CREATE INDEX idx_community_prompts_original_template_id ON community_prompts(original_template_id);
CREATE INDEX idx_community_prompts_category ON community_prompts(category);
CREATE INDEX idx_community_prompts_is_featured ON community_prompts(is_featured);
CREATE INDEX idx_community_prompts_is_approved ON community_prompts(is_approved);
CREATE INDEX idx_community_prompts_approval_status ON community_prompts(approval_status);
CREATE INDEX idx_community_prompts_created_at ON community_prompts(created_at);
CREATE INDEX idx_community_prompts_rating_average ON community_prompts(rating_average);
CREATE INDEX idx_community_prompts_view_count ON community_prompts(view_count);
CREATE INDEX idx_community_prompts_save_count ON community_prompts(save_count);
CREATE INDEX idx_community_prompts_tags ON community_prompts USING GIN(tags);

CREATE INDEX idx_community_saves_user_id ON community_saves(user_id);
CREATE INDEX idx_community_saves_community_prompt_id ON community_saves(community_prompt_id);
CREATE INDEX idx_community_saves_created_at ON community_saves(created_at);

CREATE INDEX idx_community_ratings_user_id ON community_ratings(user_id);
CREATE INDEX idx_community_ratings_community_prompt_id ON community_ratings(community_prompt_id);
CREATE INDEX idx_community_ratings_rating ON community_ratings(rating);
CREATE INDEX idx_community_ratings_created_at ON community_ratings(created_at);

CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_comments_community_prompt_id ON community_comments(community_prompt_id);
CREATE INDEX idx_community_comments_parent_comment_id ON community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created_at ON community_comments(created_at);
CREATE INDEX idx_community_comments_upvotes ON community_comments(upvotes);

CREATE INDEX idx_community_follows_follower_id ON community_follows(follower_id);
CREATE INDEX idx_community_follows_following_id ON community_follows(following_id);
CREATE INDEX idx_community_follows_created_at ON community_follows(created_at);

CREATE INDEX idx_community_notifications_user_id ON community_notifications(user_id);
CREATE INDEX idx_community_notifications_type ON community_notifications(type);
CREATE INDEX idx_community_notifications_is_read ON community_notifications(is_read);
CREATE INDEX idx_community_notifications_created_at ON community_notifications(created_at);

-- Add triggers for updated_at
CREATE TRIGGER update_community_prompts_updated_at 
  BEFORE UPDATE ON community_prompts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_ratings_updated_at 
  BEFORE UPDATE ON community_ratings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at 
  BEFORE UPDATE ON community_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE community_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_prompts
CREATE POLICY "Users can view approved community prompts" ON community_prompts
  FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own community prompts" ON community_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community prompts" ON community_prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community prompts" ON community_prompts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_saves
CREATE POLICY "Users can view their own saves" ON community_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saves" ON community_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" ON community_saves
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_ratings
CREATE POLICY "Users can view all ratings" ON community_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own ratings" ON community_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON community_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON community_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_comments
CREATE POLICY "Users can view all comments" ON community_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON community_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON community_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_follows
CREATE POLICY "Users can view their own follows" ON community_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create their own follows" ON community_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON community_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for community_notifications
CREATE POLICY "Users can view their own notifications" ON community_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" ON community_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON community_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_community_prompt_views(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_prompts 
  SET view_count = view_count + 1
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update community prompt rating
CREATE OR REPLACE FUNCTION update_community_prompt_rating(prompt_id UUID)
RETURNS VOID AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_ratings INTEGER;
BEGIN
  SELECT 
    ROUND(AVG(rating)::DECIMAL, 2),
    COUNT(*)
  INTO avg_rating, total_ratings
  FROM community_ratings
  WHERE community_prompt_id = prompt_id;
  
  UPDATE community_prompts 
  SET 
    rating_average = COALESCE(avg_rating, 0),
    rating_count = total_ratings
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update save count
CREATE OR REPLACE FUNCTION update_community_prompt_save_count(prompt_id UUID)
RETURNS VOID AS $$
DECLARE
  total_saves INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total_saves
  FROM community_saves
  WHERE community_prompt_id = prompt_id;
  
  UPDATE community_prompts 
  SET save_count = total_saves
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get community prompt with stats
CREATE OR REPLACE FUNCTION get_community_prompt_with_stats(prompt_uuid UUID, user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  original_template_id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  variables JSONB,
  is_featured BOOLEAN,
  is_approved BOOLEAN,
  approval_status TEXT,
  view_count INTEGER,
  save_count INTEGER,
  rating_average DECIMAL(3,2),
  rating_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  author_name TEXT,
  author_avatar TEXT,
  is_saved BOOLEAN,
  user_rating INTEGER,
  user_review TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.original_template_id,
    cp.user_id,
    cp.title,
    cp.content,
    cp.description,
    cp.category,
    cp.tags,
    cp.variables,
    cp.is_featured,
    cp.is_approved,
    cp.approval_status,
    cp.view_count,
    cp.save_count,
    cp.rating_average,
    cp.rating_count,
    cp.created_at,
    cp.updated_at,
    p.full_name,
    p.avatar_url,
    COALESCE(cs.id IS NOT NULL, false) AS is_saved,
    cr.rating,
    cr.review
  FROM community_prompts cp
  LEFT JOIN profiles p ON cp.user_id = p.id
  LEFT JOIN community_saves cs ON cp.id = cs.community_prompt_id AND cs.user_id = user_uuid
  LEFT JOIN community_ratings cr ON cp.id = cr.community_prompt_id AND cr.user_id = user_uuid
  WHERE cp.id = prompt_uuid AND (cp.is_approved = true OR cp.user_id = user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Create function to get trending community prompts
CREATE OR REPLACE FUNCTION get_trending_community_prompts(
  days INTEGER DEFAULT 7,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  view_count INTEGER,
  save_count INTEGER,
  rating_average DECIMAL(3,2),
  rating_count INTEGER,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  author_avatar TEXT,
  trend_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.title,
    cp.description,
    cp.category,
    cp.tags,
    cp.view_count,
    cp.save_count,
    cp.rating_average,
    cp.rating_count,
    cp.created_at,
    p.full_name,
    p.avatar_url,
    (
      cp.view_count * 0.3 + 
      cp.save_count * 0.5 + 
      cp.rating_average * cp.rating_count * 0.2 +
      EXTRACT(EPOCH FROM (NOW() - cp.created_at)) / 86400 * 0.1
    ) AS trend_score
  FROM community_prompts cp
  LEFT JOIN profiles p ON cp.user_id = p.id
  WHERE cp.is_approved = true
    AND cp.created_at >= NOW() - INTERVAL '1 day' * days
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update stats
CREATE TRIGGER update_community_prompt_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON community_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_community_prompt_rating(NEW.community_prompt_id);

CREATE TRIGGER update_community_prompt_save_count_trigger
  AFTER INSERT OR DELETE ON community_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_community_prompt_save_count(NEW.community_prompt_id);

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_community_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  related_content_id UUID DEFAULT NULL,
  related_content_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO community_notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    related_content_id,
    related_content_type
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;
