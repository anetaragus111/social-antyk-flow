-- Add separate columns for AI-generated text per platform
ALTER TABLE public.books 
ADD COLUMN ai_text_x text,
ADD COLUMN ai_text_facebook text;

-- Migrate existing ai_generated_text to both columns if it exists
UPDATE public.books 
SET ai_text_x = ai_generated_text, 
    ai_text_facebook = ai_generated_text 
WHERE ai_generated_text IS NOT NULL AND ai_generated_text != '';