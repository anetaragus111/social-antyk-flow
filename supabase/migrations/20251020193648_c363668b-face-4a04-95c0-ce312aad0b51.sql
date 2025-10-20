-- Add product_url column to books table
ALTER TABLE public.books
ADD COLUMN product_url text;