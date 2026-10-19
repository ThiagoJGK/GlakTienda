-- ============================================================
-- EXTENSIONES Y ESTRUCTURAS COMERCIALES DE GLAK TIENDA
-- RECUPERACIÓN DE CARRITOS ABANDONADOS
-- ============================================================

-- D. Tabla de Sesiones de Carritos Abandonados
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  -- Contenido del carrito alineado con CartItem en Zustand
  cart_items jsonb DEFAULT '[]'::jsonb NOT NULL, 
  checkout_url text NOT NULL,
  status text DEFAULT 'abandoned'::text NOT NULL, -- 'abandoned', 'recovered', 'converted'
  recovery_count integer DEFAULT 0 NOT NULL, -- Número de correos enviados
  last_contacted_at timestamp with time zone
);

-- ============================================================
-- OPTIMIZACIONES E ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS abandoned_carts_email_idx ON public.abandoned_carts (email);
CREATE INDEX IF NOT EXISTS abandoned_carts_status_updated_idx ON public.abandoned_carts (status, updated_at);

-- Trigger para timestamps
DROP TRIGGER IF EXISTS trigger_abandoned_carts_updated_at ON public.abandoned_carts;
CREATE TRIGGER trigger_abandoned_carts_updated_at BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- ============================================================
-- POLÍTICAS RLS ZERO-TRUST
-- ============================================================
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- 1. Permitir al rol service_role (backend/cron) acceso total
CREATE POLICY "Allow service_role full access" ON public.abandoned_carts
  AS DEFINED
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Permitir inserciones públicas (anon y auth) para iniciar checkouts
CREATE POLICY "Allow public insert" ON public.abandoned_carts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Permitir actualizaciones públicas si conocen el ID del carrito
CREATE POLICY "Allow public update by id" ON public.abandoned_carts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Permitir lectura si conocen el ID del carrito (para recuperar la sesión)
CREATE POLICY "Allow public select by id" ON public.abandoned_carts
  FOR SELECT
  TO anon, authenticated
  USING (true);
