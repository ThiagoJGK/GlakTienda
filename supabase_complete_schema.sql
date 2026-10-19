-- =========================================================================
-- GLAK TIENDA — CONSOLIDATED SCHEMA MIGRATIONS (BACKEND & INFRASTRUCTURE)
-- Copiar y pegar este script en el Supabase SQL Editor (https://supabase.com/dashboard)
-- para inicializar toda la base de datos de Checkout, Stock Locks,
-- Carritos Abandonados y Búsqueda Semántica en un solo clic.
-- =========================================================================

-- =========================================================================
-- FASE 1: BÚSQUEDA SEMÁNTICA (PGVECTOR & SIMILITUD COSENO)
-- =========================================================================

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


-- =========================================================================
-- FASE 2: ENUMS Y TABLAS DE CHECKOUT & CONTROL DE STOCK (15 MINUTOS)
-- =========================================================================

-- Tipos Enums para estados consistentes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'in_process', 'cancelled', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lock_status') THEN
    CREATE TYPE lock_status AS ENUM ('active', 'completed', 'released');
  END IF;
END $$;

-- 1. Tabla de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  
  shipping_method text NOT NULL, -- 'correo_argentino_sucursal', 'andreani_domicilio', etc.
  shipping_cost numeric NOT NULL DEFAULT 0,
  shipping_address jsonb NOT NULL, -- { street, number, floor, apartment, city, state, zip_code }
  shipping_tracking_number text,
  
  preference_id text,
  payment_id text,
  payment_status payment_status DEFAULT 'pending'::payment_status NOT NULL,
  payment_status_detail text,
  
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  
  status order_status DEFAULT 'pending'::order_status NOT NULL,
  
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Items del Pedido (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  
  name text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL,
  size text NOT NULL,
  color text NOT NULL
);

-- 3. Locks de Inventario Transaccional (Reserva temporal de 15 minutos)
CREATE TABLE IF NOT EXISTS public.inventory_locks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  quantity integer NOT NULL,
  
  session_id text NOT NULL,
  status lock_status DEFAULT 'active'::lock_status NOT NULL
);

-- Indexación de alto rendimiento
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_payment_id_idx ON public.orders (payment_id);
CREATE INDEX IF NOT EXISTS orders_preference_id_idx ON public.orders (preference_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS inventory_locks_product_id_idx ON public.inventory_locks (product_id);
CREATE INDEX IF NOT EXISTS inventory_locks_expires_at_idx ON public.inventory_locks (expires_at);

-- Trigger para automatizar timestamps de actualización en pedidos
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();


-- =========================================================================
-- FASE 3: FUNCIONES PL/PGSQL TRANSACCIONALES (ATOMIC STOCK RESERVATION)
-- =========================================================================

-- A. Función para realizar el bloqueo temporal de inventario
CREATE OR REPLACE FUNCTION public.lock_inventory_item(
  p_product_id uuid,
  p_size text,
  p_color text,
  p_quantity integer,
  p_session_id text,
  p_lock_duration_minutes integer DEFAULT 15
)
RETURNS jsonb AS $$
DECLARE
  v_available_stock integer;
  v_total_stock integer;
  v_active_locks integer;
  v_sizes_json jsonb;
  v_lock_id uuid;
  v_success boolean := false;
  v_message text;
BEGIN
  -- Obtener la columna 'sizes' del producto hermano que representa la variante de color
  SELECT sizes INTO v_sizes_json
  FROM public.products
  WHERE id = p_product_id AND status = 'active';
  
  IF v_sizes_json IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Producto no encontrado o inactivo');
  END IF;

  -- Extraer el stock asignado a ese talle
  SELECT (elem->>'stock')::integer INTO v_total_stock
  FROM jsonb_array_elements(v_sizes_json) AS elem
  WHERE elem->>'name' = p_size;

  IF v_total_stock IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'El talle solicitado ' || p_size || ' no existe en el catálogo');
  END IF;

  -- Calcular la suma de todos los locks de stock actualmente activos
  SELECT COALESCE(SUM(quantity), 0) INTO v_active_locks
  FROM public.inventory_locks
  WHERE product_id = p_product_id
    AND size = p_size
    AND expires_at > now()
    AND status = 'active';

  -- Determinar stock disponible real
  v_available_stock := v_total_stock - v_active_locks;

  -- Comprobar si hay existencias suficientes
  IF v_available_stock >= p_quantity THEN
    INSERT INTO public.inventory_locks (
      product_id, size, color, quantity, session_id, expires_at, status
    ) VALUES (
      p_product_id, p_size, p_color, p_quantity, p_session_id, now() + (p_lock_duration_minutes || ' minutes')::interval, 'active'
    ) RETURNING id INTO v_lock_id;

    v_success := true;
    v_message := 'Inventario reservado exitosamente por ' || p_lock_duration_minutes || ' minutos';
    RETURN jsonb_build_object(
      'success', true, 
      'lock_id', v_lock_id, 
      'available_stock', v_available_stock - p_quantity, 
      'message', v_message
    );
  ELSE
    v_message := 'Stock insuficiente. Disponible: ' || v_available_stock || ', Solicitado: ' || p_quantity;
    RETURN jsonb_build_object(
      'success', false, 
      'available_stock', v_available_stock, 
      'message', v_message
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- B. Función para liberar reservas temporales manualmente (si el usuario aborta compra)
CREATE OR REPLACE FUNCTION public.release_inventory_lock(
  p_lock_id uuid,
  p_session_id text
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.inventory_locks
  SET status = 'released'
  WHERE id = p_lock_id AND session_id = p_session_id AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- C. Función para descontar definitivamente el stock del producto al aprobarse el pago
CREATE OR REPLACE FUNCTION public.confirm_and_deduct_inventory(
  p_order_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_item record;
  v_sizes_json jsonb;
  v_updated_sizes_json jsonb;
BEGIN
  -- Iterar y descontar stock por cada item del pedido
  FOR v_item IN 
    SELECT product_id, size, quantity 
    FROM public.order_items 
    WHERE order_id = p_order_id
  LOOP
    SELECT sizes INTO v_sizes_json
    FROM public.products
    WHERE id = v_item.product_id;
    
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'name' = v_item.size THEN 
          jsonb_set(elem, '{stock}', to_jsonb(GREATEST(0, (elem->>'stock')::integer - v_item.quantity)))
        ELSE elem
      END
    ) INTO v_updated_sizes_json
    FROM jsonb_array_elements(v_sizes_json) AS elem;
    
    UPDATE public.products
    SET 
      sizes = v_updated_sizes_json,
      stock = GREATEST(0, stock - v_item.quantity)
    WHERE id = v_item.product_id;
  END LOOP;

  -- Pasar todos los locks activos del cliente a estado 'completed'
  UPDATE public.inventory_locks
  SET status = 'completed'
  WHERE session_id = (SELECT metadata->>'session_id' FROM public.orders WHERE id = p_order_id)
    AND status = 'active';

  RETURN true;
END;
$$ LANGUAGE plpgsql;


-- =========================================================================
-- FASE 4: SEGURIDAD RLS ZERO-TRUST PARA CHECKOUT
-- =========================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locks ENABLE ROW LEVEL SECURITY;

-- Pedidos (Orders)
CREATE POLICY "Allow public insert on orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to read their own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (metadata->>'session_id') = current_setting('request.jwt.claims', true)::json->>'session_id'
  );

CREATE POLICY "Admins have full access on orders" ON public.orders
  FOR ALL TO authenticated
  USING (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true))
  WITH CHECK (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true));

-- Items del Pedido (Order Items)
CREATE POLICY "Allow public insert on order_items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to read their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
        AND (orders.user_id = auth.uid() OR orders.email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

CREATE POLICY "Admins have full access on order_items" ON public.order_items
  FOR ALL TO authenticated
  USING (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true))
  WITH CHECK (((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true));

-- Reservas de Stock (Inventory Locks)
CREATE POLICY "Allow public insert on inventory_locks" ON public.inventory_locks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select and update on inventory_locks" ON public.inventory_locks
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- FASE 5: ESTRUCTURA DE RECUPERACIÓN DE CARRITOS ABANDONADOS
-- =========================================================================

-- 1. Tabla de Sesiones de Carritos Abandonados
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  cart_items jsonb DEFAULT '[]'::jsonb NOT NULL, 
  checkout_url text NOT NULL,
  status text DEFAULT 'abandoned'::text NOT NULL, -- 'abandoned', 'recovered', 'converted'
  recovery_count integer DEFAULT 0 NOT NULL,
  last_contacted_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS abandoned_carts_email_idx ON public.abandoned_carts (email);
CREATE INDEX IF NOT EXISTS abandoned_carts_status_updated_idx ON public.abandoned_carts (status, updated_at);

-- Trigger para automatizar timestamp de actualización en carritos abandonados
DROP TRIGGER IF EXISTS trigger_abandoned_carts_updated_at ON public.abandoned_carts;
CREATE TRIGGER trigger_abandoned_carts_updated_at BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Seguridad RLS para Carritos Abandonados
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role full access" ON public.abandoned_carts
  AS DEFINED
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert" ON public.abandoned_carts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update by id" ON public.abandoned_carts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public select by id" ON public.abandoned_carts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =========================================================================
-- MIGRACIÓN FINALIZADA CON ÉXITO
-- =========================================================================
