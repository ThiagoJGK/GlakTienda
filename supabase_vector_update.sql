-- ==========================================
-- MIGRACIÓN DE PGVECTOR & BÚSQUEDA SEMÁNTICA
-- GLAK TIENDA - SUPABASE & PGVECTOR UPDATE
-- ==========================================

-- 1. Habilitar la extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Agregar columna de embeddings a la tabla de productos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Crear índice HNSW para búsquedas de alta velocidad por distancia coseno
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx 
ON public.products 
USING hnsw (embedding vector_cosine_ops);

-- 4. Crear función RPC para coincidencia semántica
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  category text,
  tags text[],
  sizes jsonb,
  colors jsonb,
  images jsonb,
  status text,
  stock integer,
  parent_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.category,
    p.tags,
    p.sizes,
    p.colors,
    p.images,
    p.status,
    p.stock,
    p.parent_id,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.status = 'active'
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
