-- Add scheduling columns to books table
ALTER TABLE public.books 
ADD COLUMN scheduled_publish_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN auto_publish_enabled BOOLEAN DEFAULT false;

-- Create index for efficient querying of books to auto-publish
CREATE INDEX idx_books_scheduled_publish 
ON public.books(scheduled_publish_at) 
WHERE published = false AND auto_publish_enabled = true;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;