/**
 * Apparel Category Shot Matrices & Presets
 * 
 * Specialized photographic matrices per apparel category to ensure
 * true-to-life editorial catalog quality for GLak Tienda.
 * 
 * @module photo-presets/category-matrices
 */

export type PresetCategory = 'vestidos' | 'tops' | 'pantalones' | 'accesorios' | 'general';

export interface PhotoPreset {
  /** Unique identifier for the preset */
  id: string;
  /** Garment category this preset belongs to */
  category?: PresetCategory;
  /** Human-readable name shown in admin UI */
  name: string;
  /** Brief description of the shot type */
  description: string;
  /** Emoji icon for admin UI display */
  icon: string;
  /** Specific shot type code */
  shotType?: string;
  /** Master prompt for image generation */
  prompt: string;
  /** Target aspect ratio for the generated image */
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9';
}

/** Result of a single preset generation within a standardization job */
export interface PresetResult {
  /** Preset ID that generated this result */
  preset: string;
  /** Cloudinary public ID of the generated image */
  cloudinary_id: string;
  /** Full Cloudinary secure URL */
  url?: string;
  /** Generation status */
  status: 'pending' | 'generating' | 'completed' | 'failed';
  /** Error message if generation failed */
  error?: string;
}

/** Approved standardized image stored on the product record */
export interface StandardizedImage {
  /** Preset ID that generated this image */
  preset: string;
  /** Cloudinary public ID */
  cloudinary_id: string;
  /** ISO timestamp of when the admin approved this image */
  approved_at: string;
}

/**
 * Structured shot matrices per apparel category.
 * Each preset defines the exact framing, angle, and detail directives
 * required for commercial e-commerce presentation.
 */
export const CATEGORY_SHOT_MATRICES: Record<Exclude<PresetCategory, 'general'>, PhotoPreset[]> = {
  vestidos: [
    {
      id: 'vestido_frontal_entero',
      category: 'vestidos',
      name: 'Frontal Cuerpo Entero',
      description: 'Vista frontal centrada de cuerpo entero, silueta y largo total.',
      icon: '👗',
      shotType: 'full_body',
      prompt: 'High-end luxury fashion catalog packshot of this exact dress. Full-body frontal view, centered composition displaying the complete length, hemline, and silhouette. Soft diffused studio lighting, clean warm cream background (#FDFBF5) with subtle natural contact shadow. Preserve exact fabric weave, color tone, and drape of the original garment with sharp packshot fidelity.',
      aspectRatio: '3:4',
    },
    {
      id: 'vestido_45_silueta',
      category: 'vestidos',
      name: '45° Silueta',
      description: 'Vista tres cuartos lateral que resalta caída, cintura y volumen.',
      icon: '💃',
      shotType: 'three_quarter',
      prompt: 'Editorial fashion lookbook photograph of this exact dress. Three-quarter (45-degree) angle perspective highlighting the garment silhouette, waist contour, fluid drape, and side profile. Soft directional studio light casting subtle shadows accentuating dress shape. Minimalist warm off-white background (#FDFBF5). Exact reproduction of colors, seams, and fabric texture.',
      aspectRatio: '3:4',
    },
    {
      id: 'vestido_macro_textura',
      category: 'vestidos',
      name: 'Macro Escote / Textura',
      description: 'Primer plano cerrado de escote, cuello, costuras y tejido.',
      icon: '🔍',
      shotType: 'macro_detail',
      prompt: 'Extreme close-up macro photography of this dress focusing on the neckline, collar, and fabric texture. Creamy bokeh background with shallow depth of field. Warm natural lighting revealing tactile weave, stitching precision, and material quality. Retain exact color fidelity and garment details.',
      aspectRatio: '1:1',
    },
  ],

  tops: [
    {
      id: 'top_plano_medio',
      category: 'tops',
      name: 'Plano Medio',
      description: 'Encuadre torso y cintura, mostrando corte de hombros y caída.',
      icon: '👕',
      shotType: 'medium_torso',
      prompt: 'Professional fashion lookbook studio photograph of this exact top/shirt. Medium shot framing from torso to waist, showing natural fit, shoulder seam alignment, and body drape. Warm neutral studio backdrop (#FDFBF5), soft daylight lighting with subtle gradient shadow. Preserve exact garment color, fabric texture, and structural details.',
      aspectRatio: '3:4',
    },
    {
      id: 'top_caida_manga',
      category: 'tops',
      name: 'Caída Manga',
      description: 'Perspectiva lateral destacando largo de manga y remate de puño.',
      icon: '✨',
      shotType: 'sleeve_profile',
      prompt: 'Detailed fashion photography highlighting the sleeve drop, shoulder cut, and cuff finishing of this garment. Angled profile composition showing the sleeve natural fabric drape and silhouette. Soft studio illumination, minimalist warm off-white background (#FDFBF5). High commercial fidelity preserving original fabric texture, stitching, and color.',
      aspectRatio: '3:4',
    },
    {
      id: 'top_detalle_cuello',
      category: 'tops',
      name: 'Detalle Botones / Cuello',
      description: 'Macro en cuello, botones, cartera frontal y confección.',
      icon: '🪡',
      shotType: 'collar_detail',
      prompt: 'Macro photography of this shirt collar, neckline, and buttons. Intimate close-up showing button materials, thread fastening, collar structure, and neckline hem craftsmanship. Shallow depth of field, soft natural side lighting accentuating texture and fabric grain. Exact color and tactile reproduction.',
      aspectRatio: '1:1',
    },
  ],

  pantalones: [
    {
      id: 'pantalon_frontal_completa',
      category: 'pantalones',
      name: 'Vista Frontal Completa',
      description: 'Cuerpo inferior completo: tiro, calce de pierna y ruedo.',
      icon: '👖',
      shotType: 'lower_body_full',
      prompt: 'Clean commercial packshot photography of these pants/skirt. Full frontal perspective showing entire leg length, rise, waistband, and hemline proportions. Centered on a warm cream studio background (#FDFBF5) with soft ground contact shadow. True-to-life reproduction of garment color, fabric weight, and drape.',
      aspectRatio: '3:4',
    },
    {
      id: 'pantalon_detalle_cintura',
      category: 'pantalones',
      name: 'Detalle Bolsillos / Cintura',
      description: 'Close-up de pretina, pasacintos, bolsillos delanteros y botón.',
      icon: '🔍',
      shotType: 'waistband_detail',
      prompt: 'Close-up detail shot of the waistband, belt loops, front pockets, and closure hardware of these pants/skirt. Crisp focus on stitching lines, button/zipper construction, and fabric texture. Soft directional studio light, minimalist cream backdrop. Exact match to original garment color, denim/cotton weave, and hardware finish.',
      aspectRatio: '1:1',
    },
    {
      id: 'pantalon_movimiento_caida',
      category: 'pantalones',
      name: 'Movimiento / Caída',
      description: 'Ángulo 3/4 mostrando el movimiento dinámico y la fluidez de la tela.',
      icon: '🌪️',
      shotType: 'motion_drape',
      prompt: 'Dynamic fashion editorial shot of these pants/skirt showcasing fabric drape and movement. Three-quarter walking angle capturing the natural fluid drop of the fabric and leg silhouette. Elegant studio lighting, clean warm neutral environment (#FDFBF5). Retain original fabric color, folds, and textural depth.',
      aspectRatio: '3:4',
    },
  ],

  accesorios: [
    {
      id: 'accesorio_primer_plano',
      category: 'accesorios',
      name: 'Primer Plano Macro',
      description: 'Packshot hero destacando texturas, cuero o brillo de material.',
      icon: '👜',
      shotType: 'hero_macro',
      prompt: 'High-end luxury commercial still life photography of this accessory. Macro hero packshot showcasing craftsmanship, material texture (leather grain, woven fabric, or metallic polish), and branding details. Soft studio light with delicate reflections, clean cream background (#FDFBF5). Ultra-sharp focus and true-to-life colors.',
      aspectRatio: '1:1',
    },
    {
      id: 'accesorio_escala_proporcion',
      category: 'accesorios',
      name: 'Escala / Proporción',
      description: 'Toma contextualizada con elementos neutros para apreciar tamaño real.',
      icon: '📐',
      shotType: 'contextual_scale',
      prompt: 'Styled editorial still life photograph of this accessory arranged on a minimalist stone or oak surface with subtle neutral props (e.g. ceramic tray or soft linen cloth) to clearly communicate physical scale and everyday elegance. Warm natural window light. No clutter, focus remains 100% on the accessory. Exact colors and dimensions preserved.',
      aspectRatio: '4:3',
    },
    {
      id: 'accesorio_detalle_hebillas',
      category: 'accesorios',
      name: 'Detalle Materiales / Hebillas',
      description: 'Macro de herrajes, cierres, costuras perimetrales y acabados.',
      icon: '✨',
      shotType: 'hardware_detail',
      prompt: 'Extreme close-up macro detail of the hardware, buckle, zipper, and edge stitching of this accessory. Shallow depth of field focusing on metallic finish, seam strength, and premium material quality. Soft specular highlight on hardware, warm neutral background. Exact color and texture fidelity.',
      aspectRatio: '1:1',
    },
  ],
};

/** Default master general presets used when no category-specific matrix applies */
export const GENERAL_PHOTO_PRESETS: Record<string, PhotoPreset> = {
  frontal_editorial: {
    id: 'frontal_editorial',
    category: 'general',
    name: 'Frontal Editorial',
    description: 'Vista frontal centrada, fondo neutro crema, iluminación de estudio suave',
    icon: '📸',
    shotType: 'frontal',
    prompt: [
      'Professional e-commerce product photography of this exact garment.',
      'Full frontal view, perfectly centered composition.',
      'Clean warm cream background (#FDFBF5).',
      'Soft diffused studio lighting with subtle shadow underneath.',
      'High-end fashion lookbook aesthetic.',
      'Preserve exact colors, texture, pattern, and proportions of the original garment.',
      '8K commercial packshot quality, sharp focus throughout.',
    ].join(' '),
    aspectRatio: '3:4',
  },

  detalle_textura: {
    id: 'detalle_textura',
    category: 'general',
    name: 'Detalle de Textura',
    description: 'Close-up de la tela, costuras o estampado con bokeh suave',
    icon: '🔍',
    shotType: 'texture',
    prompt: [
      'Extreme close-up macro photography of this garment\'s fabric texture and stitching details.',
      'Shallow depth of field with creamy bokeh background.',
      'Warm natural side lighting to emphasize fabric weave and material quality.',
      'Show the tactile quality of the material — threads, knit pattern, or print detail.',
      'Preserve exact color and texture of the original garment.',
      'High-end fashion detail shot, editorial quality.',
    ].join(' '),
    aspectRatio: '1:1',
  },

  lifestyle_contexto: {
    id: 'lifestyle_contexto',
    category: 'general',
    name: 'Lifestyle / Contexto',
    description: 'La prenda en un ambiente minimalista y elegante',
    icon: '🏡',
    shotType: 'lifestyle',
    prompt: [
      'Elegant lifestyle product photography of this garment styled in a minimalist interior setting.',
      'Neatly folded or draped on a clean wooden surface or modern hanger against a soft neutral wall.',
      'Warm morning natural light from a window, creating gentle shadows.',
      'Organic, aspirational aesthetic matching a premium boutique brand.',
      'Preserve exact colors and details of the original garment.',
      'No human model, focus on the product in context.',
    ].join(' '),
    aspectRatio: '4:3',
  },
};

/**
 * Normalizes an arbitrary category string to one of the standard apparel preset categories.
 * @param category - Raw category name (e.g. "Remeras", "Pantalón Oxford", "Carteras")
 * @returns Normalized category identifier
 */
export function normalizeCategory(category?: string | null): PresetCategory {
  if (!category) return 'general';
  const c = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (c.includes('vestid') || c.includes('mono')) return 'vestidos';
  if (c.includes('top') || c.includes('remer') || c.includes('camis') || c.includes('blus') || c.includes('sweater') || c.includes('abrig') || c.includes('camper') || c.includes('buzo')) return 'tops';
  if (c.includes('pantalon') || c.includes('falda') || c.includes('short') || c.includes('bermud') || c.includes('jean') || c.includes('denim') || c.includes('calza')) return 'pantalones';
  if (c.includes('accesori') || c.includes('carter') || c.includes('bolso') || c.includes('cinturon') || c.includes('billeter') || c.includes('joy') || c.includes('panuel') || c.includes('mochila') || c.includes('gorro') || c.includes('bufand')) return 'accesorios';
  return 'general';
}

/**
 * Returns tailored presets for a specific product category.
 * If the category matches a specialized apparel matrix, returns the 3 tailored shots.
 * Otherwise returns the general master presets.
 * @param category - Product category string
 * @returns Array of PhotoPreset configurations
 */
export function getPresetsForCategory(category?: string | null): PhotoPreset[] {
  const norm = normalizeCategory(category);
  if (norm !== 'general' && CATEGORY_SHOT_MATRICES[norm]) {
    return CATEGORY_SHOT_MATRICES[norm];
  }
  return Object.values(GENERAL_PHOTO_PRESETS);
}
