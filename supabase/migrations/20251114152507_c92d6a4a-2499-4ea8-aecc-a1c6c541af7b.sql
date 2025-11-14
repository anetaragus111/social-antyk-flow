-- Add error tracking columns to campaign_posts
ALTER TABLE campaign_posts 
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;