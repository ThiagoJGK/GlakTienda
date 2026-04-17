-- ==========================================
-- E-COMMERCE PRODUCTS SCHEMA (GLAK TIENDA)
-- Copy and paste this into the Supabase SQL Editor
-- ==========================================

-- 1. Create the `products` table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  category text,
  tags text[] DEFAULT '{}', -- Added column for easier semantic search
  sizes jsonb DEFAULT '[]'::jsonb,
  colors jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft', -- 'active', 'draft', 'archived'
  stock integer DEFAULT 0,
  
  -- Automatically generate updated_at timestamp
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);

-- 3. Row Level Security (RLS) - Basic Rules
-- Warning: Currently allows anonymous reading. Admin writing is allowed universally for development.
-- (Will lock down writing later using Supabase Auth).
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active products
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.products FOR SELECT 
USING (status = 'active');

-- Allow development inserts/updates/deletes (WARNING: change for production)
CREATE POLICY "Allow all updates during development" 
ON public.products FOR ALL 
USING (true)
WITH CHECK (true);

-- Function to handle auto updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- ==========================================
-- END OF SCRIPT
-- ==========================================
