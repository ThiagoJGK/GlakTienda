import {
  GarmentCategoryType,
  GarmentFitType,
  FabricStretchLevel,
  IramSizeStandardRow,
  SizeGenderProfile,
  GlakStandardSize,
} from '@/types/sizing';

/**
 * Tablas antropométricas oficiales IRAM 75300 / SUNITI Argentina (INTI EAAr).
 */
export const IRAM_75300_TABLES: Record<SizeGenderProfile, readonly IramSizeStandardRow[]> = {
  female: [
    {
      size: 'XS',
      numericSize: '36',
      jeansUsEquivalent: '26',
      chestCm: { min: 82, max: 87 },
      waistCm: { min: 64, max: 69 },
      hipCm: { min: 90, max: 95 },
      shoulderCm: { min: 37, max: 38 },
      backLengthCm: { min: 40, max: 41 },
      riseCm: { min: 24, max: 25 },
      inseamCm: { min: 76, max: 77 },
    },
    {
      size: 'S',
      numericSize: '38',
      jeansUsEquivalent: '28',
      chestCm: { min: 88, max: 93 },
      waistCm: { min: 70, max: 75 },
      hipCm: { min: 96, max: 101 },
      shoulderCm: { min: 39, max: 40 },
      backLengthCm: { min: 41, max: 42 },
      riseCm: { min: 25, max: 26 },
      inseamCm: { min: 77, max: 78 },
    },
    {
      size: 'M',
      numericSize: '40-42',
      jeansUsEquivalent: '30-32',
      chestCm: { min: 94, max: 100 },
      waistCm: { min: 76, max: 82 },
      hipCm: { min: 102, max: 108 },
      shoulderCm: { min: 41, max: 42 },
      backLengthCm: { min: 42, max: 43 },
      riseCm: { min: 26, max: 27 },
      inseamCm: { min: 78, max: 79 },
    },
    {
      size: 'L',
      numericSize: '44-46',
      jeansUsEquivalent: '34-36',
      chestCm: { min: 101, max: 108 },
      waistCm: { min: 83, max: 90 },
      hipCm: { min: 109, max: 116 },
      shoulderCm: { min: 43, max: 44 },
      backLengthCm: { min: 43, max: 44 },
      riseCm: { min: 27, max: 28 },
      inseamCm: { min: 79, max: 80 },
    },
    {
      size: 'XL',
      numericSize: '48-50',
      jeansUsEquivalent: '38',
      chestCm: { min: 109, max: 117 },
      waistCm: { min: 91, max: 99 },
      hipCm: { min: 117, max: 125 },
      shoulderCm: { min: 45, max: 46 },
      backLengthCm: { min: 44, max: 45 },
      riseCm: { min: 28, max: 29 },
      inseamCm: { min: 80, max: 81 },
    },
    {
      size: 'XXL',
      numericSize: '52-54',
      jeansUsEquivalent: '40-42',
      chestCm: { min: 118, max: 126 },
      waistCm: { min: 100, max: 109 },
      hipCm: { min: 126, max: 134 },
      shoulderCm: { min: 47, max: 48 },
      backLengthCm: { min: 45, max: 46 },
      riseCm: { min: 29, max: 30 },
      inseamCm: { min: 80, max: 81 },
    },
    {
      size: '3XL',
      numericSize: '56+',
      jeansUsEquivalent: '44+',
      chestCm: { min: 127, max: 136 },
      waistCm: { min: 110, max: 120 },
      hipCm: { min: 135, max: 144 },
      shoulderCm: { min: 49, max: 50 },
      backLengthCm: { min: 46, max: 47 },
      riseCm: { min: 30, max: 31 },
      inseamCm: { min: 81, max: 82 },
    },
  ],
  male: [
    {
      size: 'XS',
      numericSize: '36',
      jeansUsEquivalent: '28',
      chestCm: { min: 82, max: 87 },
      waistCm: { min: 72, max: 77 },
      hipCm: { min: 86, max: 91 },
      shoulderCm: { min: 41, max: 42 },
      backLengthCm: { min: 43, max: 44 },
      riseCm: { min: 25, max: 26 },
      inseamCm: { min: 77, max: 78 },
    },
    {
      size: 'S',
      numericSize: '38',
      jeansUsEquivalent: '30',
      chestCm: { min: 88, max: 94 },
      waistCm: { min: 78, max: 83 },
      hipCm: { min: 92, max: 97 },
      shoulderCm: { min: 43, max: 44 },
      backLengthCm: { min: 44, max: 45 },
      riseCm: { min: 26, max: 27 },
      inseamCm: { min: 79, max: 80 },
    },
    {
      size: 'M',
      numericSize: '40-42',
      jeansUsEquivalent: '32-34',
      chestCm: { min: 95, max: 102 },
      waistCm: { min: 84, max: 90 },
      hipCm: { min: 98, max: 104 },
      shoulderCm: { min: 45, max: 46 },
      backLengthCm: { min: 45, max: 46 },
      riseCm: { min: 27, max: 28 },
      inseamCm: { min: 81, max: 82 },
    },
    {
      size: 'L',
      numericSize: '44-46',
      jeansUsEquivalent: '36-38',
      chestCm: { min: 103, max: 110 },
      waistCm: { min: 91, max: 98 },
      hipCm: { min: 105, max: 112 },
      shoulderCm: { min: 47, max: 48 },
      backLengthCm: { min: 46, max: 47 },
      riseCm: { min: 28, max: 29 },
      inseamCm: { min: 82, max: 83 },
    },
    {
      size: 'XL',
      numericSize: '48-50',
      jeansUsEquivalent: '40',
      chestCm: { min: 111, max: 119 },
      waistCm: { min: 99, max: 107 },
      hipCm: { min: 113, max: 120 },
      shoulderCm: { min: 49, max: 50 },
      backLengthCm: { min: 47, max: 48 },
      riseCm: { min: 29, max: 30 },
      inseamCm: { min: 83, max: 84 },
    },
    {
      size: 'XXL',
      numericSize: '52-54',
      jeansUsEquivalent: '42-44',
      chestCm: { min: 120, max: 128 },
      waistCm: { min: 108, max: 116 },
      hipCm: { min: 121, max: 128 },
      shoulderCm: { min: 51, max: 52 },
      backLengthCm: { min: 48, max: 49 },
      riseCm: { min: 30, max: 31 },
      inseamCm: { min: 84, max: 85 },
    },
    {
      size: '3XL',
      numericSize: '56+',
      jeansUsEquivalent: '46+',
      chestCm: { min: 129, max: 138 },
      waistCm: { min: 117, max: 126 },
      hipCm: { min: 129, max: 137 },
      shoulderCm: { min: 53, max: 54 },
      backLengthCm: { min: 49, max: 50 },
      riseCm: { min: 31, max: 32 },
      inseamCm: { min: 84, max: 85 },
    },
  ],
  unisex: [
    {
      size: 'XS',
      numericSize: '36',
      jeansUsEquivalent: '26-28',
      chestCm: { min: 82, max: 87 },
      waistCm: { min: 68, max: 73 },
      hipCm: { min: 88, max: 93 },
      shoulderCm: { min: 39, max: 40 },
      backLengthCm: { min: 41, max: 42 },
      riseCm: { min: 24, max: 25 },
      inseamCm: { min: 76, max: 77 },
    },
    {
      size: 'S',
      numericSize: '38',
      jeansUsEquivalent: '28-30',
      chestCm: { min: 88, max: 93 },
      waistCm: { min: 74, max: 79 },
      hipCm: { min: 94, max: 99 },
      shoulderCm: { min: 41, max: 42 },
      backLengthCm: { min: 42, max: 43 },
      riseCm: { min: 25, max: 26 },
      inseamCm: { min: 78, max: 79 },
    },
    {
      size: 'M',
      numericSize: '40-42',
      jeansUsEquivalent: '30-32',
      chestCm: { min: 94, max: 101 },
      waistCm: { min: 80, max: 86 },
      hipCm: { min: 100, max: 106 },
      shoulderCm: { min: 43, max: 44 },
      backLengthCm: { min: 43, max: 44 },
      riseCm: { min: 26, max: 27 },
      inseamCm: { min: 79, max: 80 },
    },
    {
      size: 'L',
      numericSize: '44-46',
      jeansUsEquivalent: '34-36',
      chestCm: { min: 102, max: 109 },
      waistCm: { min: 87, max: 94 },
      hipCm: { min: 107, max: 114 },
      shoulderCm: { min: 45, max: 46 },
      backLengthCm: { min: 44, max: 45 },
      riseCm: { min: 27, max: 28 },
      inseamCm: { min: 80, max: 81 },
    },
    {
      size: 'XL',
      numericSize: '48-50',
      jeansUsEquivalent: '38-40',
      chestCm: { min: 110, max: 118 },
      waistCm: { min: 95, max: 103 },
      hipCm: { min: 115, max: 122 },
      shoulderCm: { min: 47, max: 48 },
      backLengthCm: { min: 45, max: 46 },
      riseCm: { min: 28, max: 29 },
      inseamCm: { min: 81, max: 82 },
    },
    {
      size: 'XXL',
      numericSize: '52-54',
      jeansUsEquivalent: '40-42',
      chestCm: { min: 119, max: 127 },
      waistCm: { min: 104, max: 112 },
      hipCm: { min: 123, max: 131 },
      shoulderCm: { min: 49, max: 50 },
      backLengthCm: { min: 46, max: 47 },
      riseCm: { min: 29, max: 30 },
      inseamCm: { min: 82, max: 83 },
    },
    {
      size: '3XL',
      numericSize: '56+',
      jeansUsEquivalent: '44-46',
      chestCm: { min: 128, max: 137 },
      waistCm: { min: 113, max: 123 },
      hipCm: { min: 132, max: 140 },
      shoulderCm: { min: 51, max: 52 },
      backLengthCm: { min: 47, max: 48 },
      riseCm: { min: 30, max: 31 },
      inseamCm: { min: 82, max: 83 },
    },
  ],
};

/**
 * Holgura de calce en cm (contorno 360°) según moldería.
 */
export const FIT_EASE_CONTOUR_CM: Record<GarmentFitType, { chest: number; waist: number; hip: number }> = {
  slim: { chest: 4, waist: 2, hip: 3 },
  regular: { chest: 8, waist: 6, hip: 6 },
  relaxed: { chest: 14, waist: 10, hip: 10 },
  oversize: { chest: 20, waist: 16, hip: 16 },
};

/**
 * Compensación en cm (contorno 360°) por elasticidad textil.
 */
export const STRETCH_BONUS_CONTOUR_CM: Record<FabricStretchLevel, { chest: number; waist: number; hip: number }> = {
  rigid: { chest: 0, waist: 0, hip: 0 },
  medium: { chest: 4, waist: 4, hip: 4 },
  high: { chest: 8, waist: 8, hip: 8 },
};

/**
 * Devuelve la tabla IRAM 75300 para el perfil de género especificado (default: 'female').
 */
export function getIramTable(genderProfile: SizeGenderProfile = 'female'): readonly IramSizeStandardRow[] {
  return IRAM_75300_TABLES[genderProfile] || IRAM_75300_TABLES.female;
}

/**
 * Busca la fila normativa IRAM para un talle estándar específico (ej. 'M').
 */
export function getIramRowBySize(
  size: GlakStandardSize,
  genderProfile: SizeGenderProfile = 'female'
): IramSizeStandardRow | undefined {
  if (size === 'U') return undefined;
  const table = getIramTable(genderProfile);
  return table.find((r) => r.size === size);
}

/**
 * Mapea una categoría comercial de GLak a la tipología IRAM ('upper' | 'lower' | 'dress').
 */
export function resolveGarmentCategoryType(categoryName: string): GarmentCategoryType {
  const norm = (categoryName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (
    norm.includes('vestido') ||
    norm.includes('mono') ||
    norm.includes('enterito') ||
    norm.includes('jumpsuit')
  ) {
    return 'dress';
  }

  if (
    norm.includes('pantalon') ||
    norm.includes('jean') ||
    norm.includes('short') ||
    norm.includes('pollera') ||
    norm.includes('falda') ||
    norm.includes('bermuda')
  ) {
    return 'lower';
  }

  // Por defecto (Camisas, Remeras, Tops, Blusas, Sweaters, Buzos, Abrigos, Blazers, Camperas)
  return 'upper';
}
