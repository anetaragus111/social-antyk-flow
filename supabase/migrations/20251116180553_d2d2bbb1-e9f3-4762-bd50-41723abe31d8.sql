-- Create campaign_content_history table to track used content topics
CREATE TABLE IF NOT EXISTS public.campaign_content_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_post_id UUID NOT NULL REFERENCES public.campaign_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  category TEXT NOT NULL,
  topic_summary TEXT NOT NULL,
  full_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_content_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (open access like other tables in the project)
CREATE POLICY "Anyone can view campaign_content_history" 
  ON public.campaign_content_history 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert campaign_content_history" 
  ON public.campaign_content_history 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update campaign_content_history" 
  ON public.campaign_content_history 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete campaign_content_history" 
  ON public.campaign_content_history 
  FOR DELETE 
  USING (true);

-- Create indexes for efficient querying
CREATE INDEX idx_campaign_content_history_platform ON public.campaign_content_history(platform);
CREATE INDEX idx_campaign_content_history_created_at ON public.campaign_content_history(created_at);
CREATE INDEX idx_campaign_content_history_category ON public.campaign_content_history(category);
CREATE INDEX idx_campaign_content_history_platform_created_at ON public.campaign_content_history(platform, created_at);