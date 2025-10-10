-- Drop the existing authenticated-only policies for INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Authenticated users can insert books" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can update books" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can delete books" ON public.books;

-- Create new policies that allow public access for data management
-- This is appropriate for a bookstore catalog where books are public data

CREATE POLICY "Anyone can insert books" 
ON public.books 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update books" 
ON public.books 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete books" 
ON public.books 
FOR DELETE 
USING (true);