-- ============================================
-- Photo Standardization Pipeline Schema
-- GLak Tienda — Estandarización Automática de Fotografía de Producto
-- ============================================

-- Tabla principal de jobs de estandarización
CREATE TABLE IF NOT EXISTS public.photo_standardization_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Fotos fuente (Cloudinary public IDs de las fotos crudas del producto)
  source_images JSONB NOT NULL,  -- ["products/foto-cruda-1", "products/foto-cruda-2"]
  
  -- Presets solicitados
  requested_presets TEXT[] NOT NULL,  -- ['frontal_editorial', 'detalle_textura', 'lifestyle_contexto']
  
  -- Estado del pipeline
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  
  -- Resultados: array de objetos con preset + cloudinary URL
  results JSONB DEFAULT '[]'::jsonb,
  -- Ejemplo: [{"preset": "frontal_editorial", "cloudinary_id": "products/std/xxx", "status": "completed"}]
  
  -- Metadatos de ejecución
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Google Flow project tracking
  flow_project_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para polling eficiente del daemon local
CREATE INDEX IF NOT EXISTS idx_std_jobs_status 
  ON public.photo_standardization_jobs(status) 
  WHERE status IN ('pending', 'processing');
  
CREATE INDEX IF NOT EXISTS idx_std_jobs_product 
  ON public.photo_standardization_jobs(product_id);

CREATE INDEX IF NOT EXISTS idx_std_jobs_created 
  ON public.photo_standardization_jobs(created_at DESC);

-- Trigger de updated_at (reutiliza la función existente del schema de productos)
CREATE TRIGGER update_std_jobs_updated_at
  BEFORE UPDATE ON public.photo_standardization_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE public.photo_standardization_jobs ENABLE ROW LEVEL SECURITY;

-- Admins autenticados tienen acceso completo
CREATE POLICY "Admins full access to standardization jobs"
  ON public.photo_standardization_jobs FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true);

-- Service role (usado por el daemon local) tiene acceso completo
CREATE POLICY "Service role full access to standardization jobs"
  ON public.photo_standardization_jobs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- Nuevo campo en products para fotos estandarizadas
-- ============================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS standardized_images JSONB DEFAULT '[]'::jsonb;

-- Comentario descriptivo
COMMENT ON COLUMN public.products.standardized_images IS 
  'Array of approved standardized product photos. Format: [{"preset": "frontal_editorial", "cloudinary_id": "products/std/slug-frontal", "approved_at": "ISO timestamp"}]';

COMMENT ON TABLE public.photo_standardization_jobs IS 
  'Pipeline jobs for AI-powered product photo standardization via Google Flow. Created by admin panel, processed by local daemon.';
