-- ==========================================
-- E-COMMERCE PRODUCTS SCHEMA (GLAK TIENDA)
-- Copy and paste this into the Supabase SQL Editor
-- Sibling Relationship & Core Architecture Update
-- ==========================================

-- ==========================================
-- 1. EXTENSIONS & UTILITIES
-- ==========================================

-- Function to handle auto updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';


-- ==========================================
-- 2. TABLE DEFINITIONS
-- ==========================================

-- A. Products Table (Core E-Commerce Items)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
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
  
  -- Sibling relationship architecture (Self-referencing parent ID)
  parent_id uuid REFERENCES public.products(id) ON DELETE SET NULL
);

-- B. Collections Table (Marketing and Curated Product Groups)
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text
);

-- C. Colors Table (Global Colors Repository for Design System Alignment)
CREATE TABLE IF NOT EXISTS public.colors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  name text NOT NULL,
  hex text NOT NULL -- Aligned column name with the Next.js frontend actions
);


-- D. Product Collections Junction Table (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS public.product_collections (
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);


-- ==========================================
-- 3. PERFORMANCE INDEXES & OPTIMIZATIONS
-- ==========================================

-- Products Indexes
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);
CREATE INDEX IF NOT EXISTS products_parent_id_idx ON public.products (parent_id);

-- Collections Indexes
CREATE INDEX IF NOT EXISTS collections_slug_idx ON public.collections (slug);

-- Product Collections Junction Indexes
CREATE INDEX IF NOT EXISTS product_collections_product_id_idx ON public.product_collections (product_id);
CREATE INDEX IF NOT EXISTS product_collections_collection_id_idx ON public.product_collections (collection_id);


-- ==========================================
-- 4. AUTOMATED TRIGGERS
-- ==========================================

-- Trigger for products updated_at
DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Trigger for collections updated_at
DROP TRIGGER IF EXISTS trigger_collections_updated_at ON public.collections;
CREATE TRIGGER trigger_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Trigger for colors updated_at
DROP TRIGGER IF EXISTS trigger_colors_updated_at ON public.colors;
CREATE TRIGGER trigger_colors_updated_at
  BEFORE UPDATE ON public.colors
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();


-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- A. Products Table Policies
-- ------------------------------------------
-- Allow public SELECT access (read-only) for everyone
CREATE POLICY "Allow public read on products" ON public.products 
  FOR SELECT USING (true);

-- Restrict all write mutations strictly to authenticated admin users
-- Checked securely via Supabase JWT Custom Claims (app_metadata -> is_admin)
CREATE POLICY "Admins have full write access on products" ON public.products 
  FOR ALL 
  TO authenticated 
  USING (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true))
  WITH CHECK (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true));

-- ------------------------------------------
-- B. Collections Table Policies
-- ------------------------------------------
-- Allow public SELECT access (read-only) for everyone
CREATE POLICY "Allow public read on collections" ON public.collections 
  FOR SELECT USING (true);

-- Restrict all write mutations strictly to authenticated admin users
-- Checked securely via Supabase JWT Custom Claims (app_metadata -> is_admin)
CREATE POLICY "Admins have full write access on collections" ON public.collections 
  FOR ALL 
  TO authenticated 
  USING (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true))
  WITH CHECK (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true));

-- ------------------------------------------
-- C. Colors Table Policies
-- ------------------------------------------
-- Allow public SELECT access (read-only) for everyone
CREATE POLICY "Allow public read on colors" ON public.colors 
  FOR SELECT USING (true);

-- Restrict all write mutations strictly to authenticated admin users
-- Checked securely via Supabase JWT Custom Claims (app_metadata -> is_admin)
CREATE POLICY "Admins have full write access on colors" ON public.colors 
  FOR ALL 
  TO authenticated 
  USING (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true))
  WITH CHECK (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true));

-- ------------------------------------------
-- D. Product Collections Table Policies
-- ------------------------------------------
-- Allow public SELECT access (read-only) for everyone
CREATE POLICY "Allow public read on product_collections" ON public.product_collections 
  FOR SELECT USING (true);

-- Restrict all write mutations strictly to authenticated admin users
-- Checked securely via Supabase JWT Custom Claims (app_metadata -> is_admin)
CREATE POLICY "Admins have full write access on product_collections" ON public.product_collections 
  FOR ALL 
  TO authenticated 
  USING (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true))
  WITH CHECK (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true));

-- ==========================================
-- END OF SCRIPT
-- ==========================================
