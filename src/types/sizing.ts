/**
 * Talles alfanuméricos oficiales del Estándar GLak Argentina (IRAM 75300-3 / SUNITI)
 * más 'U' para Talle Único orgánico.
 */
export type GlakStandardSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | 'U';

/**
 * Constante ordenada de todos los talles estándar soportados en Admin y Storefront.
 */
export const GLAK_STANDARD_SIZES: readonly GlakStandardSize[] = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  'U',
] as const;

/**
 * Equivalencia numérica argentina según IRAM 75300-3.
 */
export type GlakNumericSize =
  | '36'
  | '38'
  | '40-42'
  | '44-46'
  | '48-50'
  | '52-54'
  | '56+'
  | 'UNICO';

/**
 * Tipología de prenda según IRAM 75300-2:
 * - 'upper': Prendas superiores (Camisas, Remeras, Blusas, Buzos, Sweaters, Abrigos)
 * - 'lower': Prendas inferiores (Pantalones, Jeans, Shorts, Polleras)
 * - 'dress': Cuerpo entero (Vestidos, Monos, Enteritos)
 */
export type GarmentCategoryType = 'upper' | 'lower' | 'dress';

/**
 * Perfil antropométrico según IRAM 75300.
 */
export type SizeGenderProfile = 'female' | 'male' | 'unisex';

/**
 * Modo en que están expresadas las medidas de entrada:
 * - 'flat_garment': Prenda apoyada en superficie plana (ancho de sisa a sisa, cintura plana, cadera plana).
 * - 'body_contour': Contorno corporal 360° con cinta métrica (contorno de busto/pecho, cintura, cadera).
 */
export type MeasurementMode = 'flat_garment' | 'body_contour';

/**
 * Factor de calce / moldería de la prenda (Fit Factor).
 */
export type GarmentFitType = 'slim' | 'regular' | 'relaxed' | 'oversize';

/**
 * Nivel de elasticidad textil de la tela (Stretch Factor).
 */
export type FabricStretchLevel = 'rigid' | 'medium' | 'high';

/**
 * Rango mínimo y máximo en centímetros para una cota corporal en IRAM 75300.
 */
export interface CmRange {
  min: number;
  max: number;
}

/**
 * Fila oficial de la tabla de talles IRAM 75300 / SUNITI Argentina.
 */
export interface IramSizeStandardRow {
  size: Exclude<GlakStandardSize, 'U'>;
  numericSize: Exclude<GlakNumericSize, 'UNICO'>;
  jeansUsEquivalent: string;
  chestCm: CmRange;
  waistCm: CmRange;
  hipCm: CmRange;
  shoulderCm: CmRange;
  backLengthCm: CmRange;
  riseCm: CmRange;
  inseamCm: CmRange;
}

/**
 * Medidas ingresadas (en cm) para un talle de un proveedor o prenda.
 * En modo 'flat_garment', chestCm, waistCm y hipCm representan el ANCHO EN PLANO (de borde a borde).
 * En modo 'body_contour', chestCm, waistCm y hipCm representan el CONTORNO CORPORAL 360°.
 */
export interface RawGarmentMeasurementsInput {
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  shoulderCm?: number | null;
  lengthCm?: number | null;
  sleeveCm?: number | null;
  riseCm?: number | null;
  inseamCm?: number | null;
}

/**
 * Fila de entrada correspondiente a un talle dentro de la tabla o plantilla de un proveedor.
 */
export interface SupplierSizeRowInput {
  supplierSizeLabel: string;
  measurements: RawGarmentMeasurementsInput;
  stock?: number;
}

/**
 * Resultado de traducir un talle de proveedor al Estándar GLak Argentina.
 */
export interface TranslatedSizeResult {
  supplierSizeLabel: string;
  glakStandardSize: GlakStandardSize;
  glakNumericSize: GlakNumericSize;
  confidence: 'high' | 'medium' | 'low';
  deviationCm: number;
  hasLabelDiscrepancy: boolean;
  discrepancyNote?: string;
  stock?: number;
  estimatedBodyContourCm: {
    chestCm?: number;
    waistCm?: number;
    hipCm?: number;
  };
  garmentFlatCm: {
    chestFlatCm?: number;
    waistFlatCm?: number;
    hipFlatCm?: number;
    shoulderCm?: number;
    lengthCm?: number;
    sleeveCm?: number;
    riseCm?: number;
    inseamCm?: number;
  };
  iramReferenceRange: {
    chestCm: CmRange;
    waistCm: CmRange;
    hipCm: CmRange;
  };
}

/**
 * Solicitud de traducción completa de una tabla o plantilla de proveedor.
 */
export interface SupplierChartTranslationRequest {
  supplierName: string;
  garmentCategory: GarmentCategoryType;
  genderProfile?: SizeGenderProfile;
  measurementMode: MeasurementMode;
  fitType?: GarmentFitType;
  stretchLevel?: FabricStretchLevel;
  rows: SupplierSizeRowInput[];
}

/**
 * Perfil / Plantilla guardada de un proveedor.
 */
export interface SupplierSizeProfile {
  id: string;
  supplierName: string;
  profileName: string;
  garmentCategory: GarmentCategoryType;
  genderProfile: SizeGenderProfile;
  measurementMode: MeasurementMode;
  fitType: GarmentFitType;
  stretchLevel: FabricStretchLevel;
  rows: SupplierSizeRowInput[];
  translatedRows: TranslatedSizeResult[];
  sourceType: 'ai_image' | 'manual_template';
  createdAt: string;
  updatedAt: string;
}

/**
 * Extensión retrocompatible de SizeStock para almacenar equivalencia de proveedor
 * y medidas en cm dentro de products.sizes (JSONB).
 */
export interface EnrichedSizeStock {
  name: string;
  stock: number;
  supplierSizeLabel?: string;
  supplierName?: string;
  numericSize?: string;
  measurementsFlatCm?: {
    chestFlatCm?: number;
    waistFlatCm?: number;
    hipFlatCm?: number;
    shoulderCm?: number;
    lengthCm?: number;
    riseCm?: number;
    inseamCm?: number;
  };
  bodyContourRangeCm?: {
    chest?: CmRange;
    waist?: CmRange;
    hip?: CmRange;
  };
}
