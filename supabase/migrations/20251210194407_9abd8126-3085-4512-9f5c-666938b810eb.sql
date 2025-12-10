-- Create table for TikTok OAuth tokens
CREATE TABLE public.tiktok_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  open_id TEXT NOT NULL,
  scope TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tiktok_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own tiktok tokens"
ON public.tiktok_oauth_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tiktok tokens"
ON public.tiktok_oauth_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tiktok tokens"
ON public.tiktok_oauth_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tiktok tokens"
ON public.tiktok_oauth_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tiktok_oauth_tokens_updated_at
BEFORE UPDATE ON public.tiktok_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();