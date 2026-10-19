-- Migración: Tabla supplier_size_profiles para plantillas y tablas de talles por proveedor
-- Compatible con RLS de Supabase y roles de administrador

CREATE TABLE IF NOT EXISTS public.supplier_size_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  garment_category TEXT NOT NULL CHECK (garment_category IN ('upper', 'lower', 'dress')),
  gender_profile TEXT NOT NULL DEFAULT 'female' CHECK (gender_profile IN ('female', 'male', 'unisex')),
  measurement_mode TEXT NOT NULL DEFAULT 'flat_garment' CHECK (measurement_mode IN ('flat_garment', 'body_contour')),
  fit_type TEXT NOT NULL DEFAULT 'regular' CHECK (fit_type IN ('slim', 'regular', 'relaxed', 'oversize')),
  stretch_level TEXT NOT NULL DEFAULT 'rigid' CHECK (stretch_level IN ('rigid', 'medium', 'high')),
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  translated_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_type TEXT NOT NULL DEFAULT 'manual_template' CHECK (source_type IN ('ai_image', 'manual_template')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_supplier_size_profiles_supplier_name ON public.supplier_size_profiles (supplier_name);
CREATE INDEX IF NOT EXISTS idx_supplier_size_profiles_category ON public.supplier_size_profiles (garment_category);

-- RLS
ALTER TABLE public.supplier_size_profiles ENABLE ROW LEVEL SECURITY;

-- Política de lectura y escritura para usuarios administradores autenticados
CREATE POLICY "Admins can manage supplier size profiles"
ON public.supplier_size_profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
