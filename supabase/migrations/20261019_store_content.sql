-- Migración: Tablas store_settings y site_banners para contenido dinámico de la tienda (0 hardcoding)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id text PRIMARY KEY DEFAULT 'default',
  announcement_text text NOT NULL DEFAULT 'Envío gratis en compras mayores a $25.000 | 3 y 6 Cuotas Sin Interés',
  announcement_link text,
  free_shipping_threshold numeric NOT NULL DEFAULT 25000,
  installments_qty integer NOT NULL DEFAULT 6,
  installments_interest_free boolean NOT NULL DEFAULT true,
  transfer_discount_percentage numeric NOT NULL DEFAULT 15,
  trust_badges jsonb NOT NULL DEFAULT '[
    {"icon": "Truck", "title": "Envío a todo el país", "description": "Llega en 3 a 5 días hábiles"},
    {"icon": "CreditCard", "title": "Financiación accesible", "description": "3 y 6 cuotas sin interés"},
    {"icon": "RotateCcw", "title": "Cambio fácil", "description": "10 días para cambios sin costo"}
  ]'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar configuración por defecto si no existe
INSERT INTO public.store_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.site_banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  placement text NOT NULL, -- 'hero_slide', 'collection_banner', 'middle_promo'
  title text NOT NULL,
  subtitle text,
  cta_text text NOT NULL DEFAULT 'Ver Colección',
  cta_link text NOT NULL DEFAULT '/tienda',
  image_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_site_banners_placement_active ON public.site_banners (placement, is_active);

-- Habilitar RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Public read store settings"
ON public.store_settings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Public read site banners"
ON public.site_banners
FOR SELECT
TO public
USING (true);

-- Políticas de administración autenticada
CREATE POLICY "Admins can manage store settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can manage site banners"
ON public.site_banners
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
