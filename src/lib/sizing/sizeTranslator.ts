import {
  SupplierSizeRowInput,
  SupplierChartTranslationRequest,
  TranslatedSizeResult,
  EnrichedSizeStock,
  GarmentCategoryType,
  SizeGenderProfile,
  MeasurementMode,
  GarmentFitType,
  FabricStretchLevel,
  GlakStandardSize,
  GlakNumericSize,
  IramSizeStandardRow,
} from '@/types/sizing';
import {
  getIramTable,
  getIramRowBySize,
  FIT_EASE_CONTOUR_CM,
  STRETCH_BONUS_CONTOUR_CM,
} from './iramStandards';

export class SizeTranslationError extends Error {
  public readonly code:
    | 'INVALID_SUPPLIER_LABEL'
    | 'MISSING_PRIMARY_MEASUREMENTS'
    | 'OUT_OF_BOUNDS_MEASUREMENT'
    | 'EMPTY_SIZE_ROWS';

  constructor(
    code:
      | 'INVALID_SUPPLIER_LABEL'
      | 'MISSING_PRIMARY_MEASUREMENTS'
      | 'OUT_OF_BOUNDS_MEASUREMENT'
      | 'EMPTY_SIZE_ROWS',
    message: string
  ) {
    super(message);
    this.name = 'SizeTranslationError';
    this.code = code;
  }
}

/**
 * Traduce una fila individual de un proveedor al Estándar GLak AR (IRAM 75300).
 */
export function translateSupplierSizeRow(
  row: SupplierSizeRowInput,
  options: {
    garmentCategory: GarmentCategoryType;
    genderProfile?: SizeGenderProfile;
    measurementMode: MeasurementMode;
    fitType?: GarmentFitType;
    stretchLevel?: FabricStretchLevel;
  }
): TranslatedSizeResult {
  const supplierSizeLabel = (row?.supplierSizeLabel ?? '').trim();
  if (!supplierSizeLabel) {
    throw new SizeTranslationError(
      'INVALID_SUPPLIER_LABEL',
      'La etiqueta de talle del proveedor no puede estar vacía'
    );
  }

  const measurements = row.measurements || {};
  const measureKeys: (keyof typeof measurements)[] = [
    'chestCm',
    'waistCm',
    'hipCm',
    'shoulderCm',
    'lengthCm',
    'sleeveCm',
    'riseCm',
    'inseamCm',
  ];

  for (const k of measureKeys) {
    const val = measurements[k];
    if (val !== undefined && val !== null) {
      if (typeof val !== 'number' || val <= 0 || val > 300) {
        throw new SizeTranslationError(
          'OUT_OF_BOUNDS_MEASUREMENT',
          `Las medidas en cm deben ser números mayores a 0 y menores o iguales a 300 (recibido ${val} en ${k})`
        );
      }
    }
  }

  const hasChest = typeof measurements.chestCm === 'number' && measurements.chestCm > 0;
  const hasWaist = typeof measurements.waistCm === 'number' && measurements.waistCm > 0;
  const hasHip = typeof measurements.hipCm === 'number' && measurements.hipCm > 0;

  if (options.garmentCategory === 'upper') {
    if (!hasChest) {
      throw new SizeTranslationError(
        'MISSING_PRIMARY_MEASUREMENTS',
        "Las prendas superiores ('upper') requieren la medida de ancho de pecho o sisa (chestCm)"
      );
    }
  } else if (options.garmentCategory === 'lower') {
    if (!hasWaist && !hasHip) {
      throw new SizeTranslationError(
        'MISSING_PRIMARY_MEASUREMENTS',
        "Las prendas inferiores ('lower') requieren al menos la medida de cintura o cadera"
      );
    }
  } else if (options.garmentCategory === 'dress') {
    if (!hasChest || (!hasWaist && !hasHip)) {
      throw new SizeTranslationError(
        'MISSING_PRIMARY_MEASUREMENTS',
        "Los vestidos ('dress') requieren la medida de busto y al menos cintura o cadera"
      );
    }
  }

  const fit = options.fitType ?? 'regular';
  const stretch = options.stretchLevel ?? 'rigid';
  const ease = FIT_EASE_CONTOUR_CM[fit];
  const bonus = STRETCH_BONUS_CONTOUR_CM[stretch];

  let estimatedBodyChest: number | undefined;
  let estimatedBodyWaist: number | undefined;
  let estimatedBodyHip: number | undefined;

  let chestFlatCm: number | undefined;
  let waistFlatCm: number | undefined;
  let hipFlatCm: number | undefined;

  if (options.measurementMode === 'flat_garment') {
    if (hasChest) {
      chestFlatCm = measurements.chestCm!;
      estimatedBodyChest = chestFlatCm * 2 - ease.chest + bonus.chest;
    }
    if (hasWaist) {
      waistFlatCm = measurements.waistCm!;
      estimatedBodyWaist = waistFlatCm * 2 - ease.waist + bonus.waist;
    }
    if (hasHip) {
      hipFlatCm = measurements.hipCm!;
      estimatedBodyHip = hipFlatCm * 2 - ease.hip + bonus.hip;
    }
  } else {
    // body_contour
    if (hasChest) {
      estimatedBodyChest = measurements.chestCm!;
      chestFlatCm = Math.round(((estimatedBodyChest + ease.chest - bonus.chest) / 2) * 10) / 10;
    }
    if (hasWaist) {
      estimatedBodyWaist = measurements.waistCm!;
      waistFlatCm = Math.round(((estimatedBodyWaist + ease.waist - bonus.waist) / 2) * 10) / 10;
    }
    if (hasHip) {
      estimatedBodyHip = measurements.hipCm!;
      hipFlatCm = Math.round(((estimatedBodyHip + ease.hip - bonus.hip) / 2) * 10) / 10;
    }
  }

  const table = getIramTable(options.genderProfile ?? 'female');

  let wChest = 0;
  let wWaist = 0;
  let wHip = 0;

  if (options.garmentCategory === 'upper') {
    wChest = hasChest ? 0.75 : 0;
    wWaist = hasWaist ? 0.25 : 0;
  } else if (options.garmentCategory === 'lower') {
    wHip = hasHip ? 0.55 : 0;
    wWaist = hasWaist ? 0.45 : 0;
  } else {
    // dress
    wChest = hasChest ? 0.4 : 0;
    wWaist = hasWaist ? 0.3 : 0;
    wHip = hasHip ? 0.3 : 0;
  }

  const totalW = wChest + wWaist + wHip || 1;
  wChest /= totalW;
  wWaist /= totalW;
  wHip /= totalW;

  let bestRow: IramSizeStandardRow = table[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const iramRow of table) {
    let score = 0;

    if (wChest > 0 && estimatedBodyChest !== undefined) {
      const min = iramRow.chestCm.min;
      const max = iramRow.chestCm.max;
      const center = (min + max) / 2;
      const dRange =
        estimatedBodyChest >= min && estimatedBodyChest <= max
          ? 0
          : Math.min(Math.abs(estimatedBodyChest - min), Math.abs(estimatedBodyChest - max));
      const dCenter = Math.abs(estimatedBodyChest - center);
      const metricPenalty = dRange * 2 + dCenter * 0.35;
      score += wChest * metricPenalty;
    }

    if (wWaist > 0 && estimatedBodyWaist !== undefined) {
      const min = iramRow.waistCm.min;
      const max = iramRow.waistCm.max;
      const center = (min + max) / 2;
      const dRange =
        estimatedBodyWaist >= min && estimatedBodyWaist <= max
          ? 0
          : Math.min(Math.abs(estimatedBodyWaist - min), Math.abs(estimatedBodyWaist - max));
      const dCenter = Math.abs(estimatedBodyWaist - center);
      const metricPenalty = dRange * 2 + dCenter * 0.35;
      score += wWaist * metricPenalty;
    }

    if (wHip > 0 && estimatedBodyHip !== undefined) {
      const min = iramRow.hipCm.min;
      const max = iramRow.hipCm.max;
      const center = (min + max) / 2;
      const dRange =
        estimatedBodyHip >= min && estimatedBodyHip <= max
          ? 0
          : Math.min(Math.abs(estimatedBodyHip - min), Math.abs(estimatedBodyHip - max));
      const dCenter = Math.abs(estimatedBodyHip - center);
      const metricPenalty = dRange * 2 + dCenter * 0.35;
      score += wHip * metricPenalty;
    }

    if (score < bestScore) {
      bestScore = score;
      bestRow = iramRow;
    }
  }

  const deviationCm = Math.round(bestScore * 10) / 10;
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (deviationCm > 6.0) {
    confidence = 'low';
  } else if (deviationCm > 2.5) {
    confidence = 'medium';
  }

  const cleanSupplierLabel = supplierSizeLabel.toUpperCase();
  const cleanAssignedSize = bestRow.size.toUpperCase();
  const cleanNumericSize = bestRow.numericSize.toUpperCase();

  const isExactSizeMatch =
    cleanSupplierLabel === cleanAssignedSize || cleanSupplierLabel === cleanNumericSize;
  const isContainedNumericMatch =
    cleanSupplierLabel.length >= 2 && cleanNumericSize.includes(cleanSupplierLabel);

  const hasLabelDiscrepancy = !(isExactSizeMatch || isContainedNumericMatch);

  let discrepancyNote: string | undefined;
  if (hasLabelDiscrepancy) {
    discrepancyNote = `Etiqueta fabricante '${supplierSizeLabel}' equivale a Talle GLak ${bestRow.size} (AR ${bestRow.numericSize}) según medidas reales IRAM 75300`;
  }

  return {
    supplierSizeLabel,
    glakStandardSize: bestRow.size,
    glakNumericSize: bestRow.numericSize,
    confidence,
    deviationCm,
    hasLabelDiscrepancy,
    discrepancyNote,
    stock: row.stock,
    estimatedBodyContourCm: {
      chestCm: estimatedBodyChest ? Math.round(estimatedBodyChest * 10) / 10 : undefined,
      waistCm: estimatedBodyWaist ? Math.round(estimatedBodyWaist * 10) / 10 : undefined,
      hipCm: estimatedBodyHip ? Math.round(estimatedBodyHip * 10) / 10 : undefined,
    },
    garmentFlatCm: {
      chestFlatCm,
      waistFlatCm,
      hipFlatCm,
      shoulderCm: measurements.shoulderCm ?? undefined,
      lengthCm: measurements.lengthCm ?? undefined,
      sleeveCm: measurements.sleeveCm ?? undefined,
      riseCm: measurements.riseCm ?? undefined,
      inseamCm: measurements.inseamCm ?? undefined,
    },
    iramReferenceRange: {
      chestCm: bestRow.chestCm,
      waistCm: bestRow.waistCm,
      hipCm: bestRow.hipCm,
    },
  };
}

/**
 * Traduce una tabla completa de un proveedor y devuelve todas las filas traducidas.
 */
export function translateSupplierSizeChart(
  request: SupplierChartTranslationRequest
): TranslatedSizeResult[] {
  if (!request.rows || request.rows.length === 0) {
    throw new SizeTranslationError(
      'EMPTY_SIZE_ROWS',
      'La tabla de talles del proveedor debe contener al menos una fila con medidas'
    );
  }

  return request.rows.map((row) =>
    translateSupplierSizeRow(row, {
      garmentCategory: request.garmentCategory,
      genderProfile: request.genderProfile,
      measurementMode: request.measurementMode,
      fitType: request.fitType,
      stretchLevel: request.stretchLevel,
    })
  );
}

/**
 * Convierte un conjunto de filas traducidas en el arreglo EnrichedSizeStock[]
 * compatible con ColorVariation.sizes en products.sizes.
 */
export function mapTranslatedRowsToSizeStock(
  translatedRows: TranslatedSizeResult[],
  stocksBySupplierLabel?: Record<string, number>,
  supplierName?: string
): EnrichedSizeStock[] {
  const mapBySize = new Map<GlakStandardSize, EnrichedSizeStock>();

  for (const row of translatedRows) {
    const sizeName = row.glakStandardSize;
    const stockVal =
      stocksBySupplierLabel?.[row.supplierSizeLabel] ??
      (row as any).stock ??
      0;

    const existing = mapBySize.get(sizeName);

    if (existing) {
      existing.stock += stockVal;
      if (
        row.supplierSizeLabel &&
        existing.supplierSizeLabel &&
        !existing.supplierSizeLabel.includes(row.supplierSizeLabel)
      ) {
        existing.supplierSizeLabel = `${existing.supplierSizeLabel} / ${row.supplierSizeLabel}`;
      }
    } else {
      mapBySize.set(sizeName, {
        name: sizeName,
        stock: stockVal,
        supplierSizeLabel: row.supplierSizeLabel,
        supplierName,
        numericSize: row.glakNumericSize,
        measurementsFlatCm: {
          chestFlatCm: row.garmentFlatCm.chestFlatCm,
          waistFlatCm: row.garmentFlatCm.waistFlatCm,
          hipFlatCm: row.garmentFlatCm.hipFlatCm,
          shoulderCm: row.garmentFlatCm.shoulderCm,
          lengthCm: row.garmentFlatCm.lengthCm,
          riseCm: row.garmentFlatCm.riseCm,
          inseamCm: row.garmentFlatCm.inseamCm,
        },
        bodyContourRangeCm: {
          chest: row.iramReferenceRange.chestCm,
          waist: row.iramReferenceRange.waistCm,
          hip: row.iramReferenceRange.hipCm,
        },
      });
    }
  }

  return Array.from(mapBySize.values());
}

export interface CustomerBodyInput {
  chestContourCm?: number;
  waistContourCm?: number;
  hipContourCm?: number;
  garmentCategory?: GarmentCategoryType;
  genderProfile?: SizeGenderProfile;
  preferredFit?: 'snug' | 'true_to_size' | 'loose';
}

export interface CustomerSizeRecommendation {
  recommendedSize: GlakStandardSize;
  numericSize: string;
  alternativeSize?: GlakStandardSize;
  supplierTagNotice?: string;
  matchConfidence: 'high' | 'medium' | 'low';
  explanation: string;
}

/**
 * Recomendador interactivo de talle para clientes en el Storefront ("¿Cuál es mi talle?").
 */
export function recommendCustomerSize(
  input: CustomerBodyInput,
  productSizes?: EnrichedSizeStock[]
): CustomerSizeRecommendation {
  const table = getIramTable(input.genderProfile ?? 'female');
  const cat = input.garmentCategory ?? 'upper';

  let wChest = 0;
  let wWaist = 0;
  let wHip = 0;

  if (cat === 'upper') {
    wChest = input.chestContourCm ? 0.75 : 0;
    wWaist = input.waistContourCm ? 0.25 : 0;
  } else if (cat === 'lower') {
    wHip = input.hipContourCm ? 0.55 : 0;
    wWaist = input.waistContourCm ? 0.45 : 0;
  } else {
    wChest = input.chestContourCm ? 0.4 : 0;
    wWaist = input.waistContourCm ? 0.3 : 0;
    wHip = input.hipContourCm ? 0.3 : 0;
  }

  const totalW = wChest + wWaist + wHip || 1;
  wChest /= totalW;
  wWaist /= totalW;
  wHip /= totalW;

  let bestRow = table[0];
  let secondBestRow: IramSizeStandardRow | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  let secondScore = Number.POSITIVE_INFINITY;

  for (const iramRow of table) {
    let score = 0;

    if (wChest > 0 && input.chestContourCm) {
      const min = iramRow.chestCm.min;
      const max = iramRow.chestCm.max;
      const center = (min + max) / 2;
      const dRange =
        input.chestContourCm >= min && input.chestContourCm <= max
          ? 0
          : Math.min(Math.abs(input.chestContourCm - min), Math.abs(input.chestContourCm - max));
      const dCenter = Math.abs(input.chestContourCm - center);
      score += wChest * (dRange * 2 + dCenter * 0.35);
    }

    if (wWaist > 0 && input.waistContourCm) {
      const min = iramRow.waistCm.min;
      const max = iramRow.waistCm.max;
      const center = (min + max) / 2;
      const dRange =
        input.waistContourCm >= min && input.waistContourCm <= max
          ? 0
          : Math.min(Math.abs(input.waistContourCm - min), Math.abs(input.waistContourCm - max));
      const dCenter = Math.abs(input.waistContourCm - center);
      score += wWaist * (dRange * 2 + dCenter * 0.35);
    }

    if (wHip > 0 && input.hipContourCm) {
      const min = iramRow.hipCm.min;
      const max = iramRow.hipCm.max;
      const center = (min + max) / 2;
      const dRange =
        input.hipContourCm >= min && input.hipContourCm <= max
          ? 0
          : Math.min(Math.abs(input.hipContourCm - min), Math.abs(input.hipContourCm - max));
      const dCenter = Math.abs(input.hipContourCm - center);
      score += wHip * (dRange * 2 + dCenter * 0.35);
    }

    if (score < bestScore) {
      secondScore = bestScore;
      secondBestRow = bestRow;
      bestScore = score;
      bestRow = iramRow;
    } else if (score < secondScore) {
      secondScore = score;
      secondBestRow = iramRow;
    }
  }

  const deviationCm = Math.round(bestScore * 10) / 10;
  const matchConfidence: 'high' | 'medium' | 'low' =
    deviationCm <= 2.5 ? 'high' : deviationCm <= 6.0 ? 'medium' : 'low';

  const matchedProductSize = productSizes?.find((s) => s.name === bestRow.size);
  let supplierTagNotice: string | undefined;

  if (
    matchedProductSize?.supplierSizeLabel &&
    matchedProductSize.supplierSizeLabel.toUpperCase() !== bestRow.size.toUpperCase()
  ) {
    supplierTagNotice = `La etiqueta física del taller marca '${matchedProductSize.supplierSizeLabel}', pero corresponde al talle ${bestRow.size} estándar.`;
  }

  return {
    recommendedSize: bestRow.size,
    numericSize: bestRow.numericSize,
    alternativeSize: secondBestRow?.size,
    supplierTagNotice,
    matchConfidence,
    explanation: `Tus medidas corporales se ajustan al talle oficial IRAM ${bestRow.size} (AR ${bestRow.numericSize}).`,
  };
}
