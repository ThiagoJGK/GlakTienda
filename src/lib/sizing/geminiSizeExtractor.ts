import {
  GarmentCategoryType,
  MeasurementMode,
  SupplierSizeRowInput,
  TranslatedSizeResult,
} from '@/types/sizing';
import { translateSupplierSizeChart } from './sizeTranslator';

export interface ExtractedSupplierChartPayload {
  supplierName?: string;
  detectedCategory: GarmentCategoryType;
  detectedMeasurementMode: MeasurementMode;
  rows: SupplierSizeRowInput[];
  rawNotes?: string;
}

export interface ExtractAndTranslateChartResult {
  success: boolean;
  extracted?: ExtractedSupplierChartPayload;
  translatedRows?: TranslatedSizeResult[];
  error?: string;
}

/**
 * Prompt para que Gemini Vision extraiga tablas de talles desde imágenes de proveedores.
 */
export function buildSizeChartExtractionPrompt(hintCategory?: GarmentCategoryType): string {
  return `
Eres un asistente experto en moldería, confección textil y tablas de talles de indumentaria.
Tu misión es inspeccionar minuciosamente la imagen provista (que corresponde a una tabla, guía de talles, etiqueta o ficha técnica de un proveedor/taller textil) y extraer todos los talles y sus medidas exactas en centímetros.

REGLAS CRÍTICAS DE EXTRACCIÓN:
1. DETECCIÓN DE MODO DE MEDIDA:
   - "flat_garment": Si las medidas indican ancho en plano, medida de borde a borde apoyada en mesa, "sisa a sisa", "ancho de pecho", "ancho de cintura", o números menores a 70 cm en busto/cintura de adultos.
   - "body_contour": Si las medidas indican contorno corporal completo 360°, contorno de busto/pecho, cintura o cadera con valores superiores a 75 cm.
2. CATEGORÍA DE PRENDA:
   - "upper": Si es camisa, remera, top, blusa, sweater, buzo, campera, abrigo o blazer.
   - "lower": Si es pantalón, jean, short, bermuda, pollera o falda.
   - "dress": Si es vestido, mono o enterito.
   ${hintCategory ? `(Pista: la categoría sugerida es "${hintCategory}")` : ''}
3. FILAS Y MEDIDAS (en centímetros numéricos):
   - Cada talle debe incluir su etiqueta original del taller (supplierSizeLabel: ej. "1", "2", "3" o "S", "M", "L", "XL", "38", "40", etc.).
   - Mapea las columnas a las propiedades: chestCm, waistCm, hipCm, shoulderCm, lengthCm, sleeveCm, riseCm, inseamCm.

Responde ÚNICAMENTE un objeto JSON válido con la siguiente estructura, sin texto adicional ni explicaciones:
{
  "supplierName": "Nombre del proveedor o marca detectada en la imagen (o null si no figura)",
  "detectedCategory": "upper" | "lower" | "dress",
  "detectedMeasurementMode": "flat_garment" | "body_contour",
  "rows": [
    {
      "supplierSizeLabel": "S",
      "measurements": {
        "chestCm": 50,
        "waistCm": 44,
        "shoulderCm": 40,
        "lengthCm": 68
      },
      "stock": 0
    }
  ],
  "rawNotes": "Cualquier aclaración de moldería visible (ej. 'tela elastizada', 'corte amplio')"
}
`.trim();
}

/**
 * Parsea y valida el texto devuelto por Gemini Vision, eliminando bloques markdown,
 * y traduce automáticamente las filas al Estándar GLak AR.
 */
export function parseAndTranslateGeminiChartResponse(
  rawText: string,
  overrides?: {
    garmentCategory?: GarmentCategoryType;
    measurementMode?: MeasurementMode;
  }
): {
  extracted: ExtractedSupplierChartPayload;
  translatedRows: TranslatedSizeResult[];
} {
  if (!rawText || !rawText.trim()) {
    throw new Error('La respuesta de la IA está vacía');
  }

  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Error parseando JSON de la tabla del proveedor: ${err.message}`);
  }

  if (!parsed || !Array.isArray(parsed.rows) || parsed.rows.length === 0) {
    throw new Error('No se detectaron filas de talles válidas en la imagen');
  }

  const detectedCategory: GarmentCategoryType =
    overrides?.garmentCategory || parsed.detectedCategory || 'upper';
  const detectedMeasurementMode: MeasurementMode =
    overrides?.measurementMode || parsed.detectedMeasurementMode || 'flat_garment';

  const rows: SupplierSizeRowInput[] = parsed.rows.map((r: any) => ({
    supplierSizeLabel: String(r.supplierSizeLabel || '').trim(),
    measurements: {
      chestCm: r.measurements?.chestCm ? Number(r.measurements.chestCm) : undefined,
      waistCm: r.measurements?.waistCm ? Number(r.measurements.waistCm) : undefined,
      hipCm: r.measurements?.hipCm ? Number(r.measurements.hipCm) : undefined,
      shoulderCm: r.measurements?.shoulderCm ? Number(r.measurements.shoulderCm) : undefined,
      lengthCm: r.measurements?.lengthCm ? Number(r.measurements.lengthCm) : undefined,
      sleeveCm: r.measurements?.sleeveCm ? Number(r.measurements.sleeveCm) : undefined,
      riseCm: r.measurements?.riseCm ? Number(r.measurements.riseCm) : undefined,
      inseamCm: r.measurements?.inseamCm ? Number(r.measurements.inseamCm) : undefined,
    },
    stock: typeof r.stock === 'number' ? r.stock : 0,
  }));

  const extracted: ExtractedSupplierChartPayload = {
    supplierName: parsed.supplierName || undefined,
    detectedCategory,
    detectedMeasurementMode,
    rows,
    rawNotes: parsed.rawNotes || undefined,
  };

  const translatedRows = translateSupplierSizeChart({
    supplierName: extracted.supplierName || 'Proveedor',
    garmentCategory: detectedCategory,
    measurementMode: detectedMeasurementMode,
    rows,
  });

  return {
    extracted,
    translatedRows,
  };
}
