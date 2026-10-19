import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLAK_STANDARD_SIZES,
  GlakStandardSize,
  SupplierSizeRowInput,
} from '../src/types/sizing';
import {
  IRAM_75300_TABLES,
  getIramTable,
  getIramRowBySize,
  resolveGarmentCategoryType,
  FIT_EASE_CONTOUR_CM,
  STRETCH_BONUS_CONTOUR_CM,
} from '../src/lib/sizing/iramStandards';
import {
  translateSupplierSizeRow,
  translateSupplierSizeChart,
  mapTranslatedRowsToSizeStock,
  recommendCustomerSize,
  SizeTranslationError,
} from '../src/lib/sizing/sizeTranslator';

test('M1-T1: Tablas normativas IRAM 75300 contienen el rango completo de talles XS a 3XL', () => {
  assert.ok(Array.isArray(GLAK_STANDARD_SIZES));
  assert.deepEqual(GLAK_STANDARD_SIZES, ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'U']);

  const femaleTable = getIramTable('female');
  assert.equal(femaleTable.length, 7);
  const femaleSizes = femaleTable.map((r) => r.size);
  assert.deepEqual(femaleSizes, ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']);

  const rowM = getIramRowBySize('M', 'female');
  assert.ok(rowM);
  assert.equal(rowM.size, 'M');
  assert.equal(rowM.numericSize, '40-42');
  assert.deepEqual(rowM.chestCm, { min: 94, max: 100 });
  assert.deepEqual(rowM.waistCm, { min: 76, max: 82 });
  assert.deepEqual(rowM.hipCm, { min: 102, max: 108 });

  // Resolver categorías comerciales a tipos IRAM
  assert.equal(resolveGarmentCategoryType('Camisas'), 'upper');
  assert.equal(resolveGarmentCategoryType('Remeras'), 'upper');
  assert.equal(resolveGarmentCategoryType('Pantalones'), 'lower');
  assert.equal(resolveGarmentCategoryType('Jeans'), 'lower');
  assert.equal(resolveGarmentCategoryType('Vestidos'), 'dress');
  assert.equal(resolveGarmentCategoryType('Monos'), 'dress');
});

test('M1-T2 (Escenario E1): Traducción de prenda superior plana con discrepancia de etiqueta', () => {
  // Prenda superior plana donde el proveedor dice "XL" pero mide 51 cm de sisa y 43 cm de cintura
  // En tela rígida y calce regular:
  // Contorno pecho = (51 * 2) - 8 = 94 cm -> Corresponde a 'M' (IRAM 94-100)
  // Contorno cintura = (43 * 2) - 6 = 80 cm -> Corresponde a 'M' (IRAM 76-82)
  const row: SupplierSizeRowInput = {
    supplierSizeLabel: 'XL',
    measurements: {
      chestCm: 51,
      waistCm: 43,
      shoulderCm: 41,
      lengthCm: 65,
    },
    stock: 12,
  };

  const result = translateSupplierSizeRow(row, {
    garmentCategory: 'upper',
    genderProfile: 'female',
    measurementMode: 'flat_garment',
    fitType: 'regular',
    stretchLevel: 'rigid',
  });

  assert.equal(result.supplierSizeLabel, 'XL');
  assert.equal(result.glakStandardSize, 'M');
  assert.equal(result.glakNumericSize, '40-42');
  assert.equal(result.hasLabelDiscrepancy, true);
  assert.match(result.discrepancyNote ?? '', /XL.*M/i);
  assert.equal(result.estimatedBodyContourCm.chestCm, 94);
  assert.equal(result.estimatedBodyContourCm.waistCm, 80);
  assert.equal(result.garmentFlatCm.chestFlatCm, 51);
  assert.equal(result.garmentFlatCm.waistFlatCm, 43);
  assert.equal(result.confidence, 'high');
});

test('M1-T3 (Escenario E2): Validaciones de error ante inputs inválidos', () => {
  // 1. Etiqueta vacía
  assert.throws(
    () => {
      translateSupplierSizeRow(
        { supplierSizeLabel: '   ', measurements: { chestCm: 50 } },
        { garmentCategory: 'upper', measurementMode: 'flat_garment' }
      );
    },
    (err: any) => {
      return err instanceof SizeTranslationError && err.code === 'INVALID_SUPPLIER_LABEL';
    }
  );

  // 2. Medida faltante primaria (upper sin chestCm)
  assert.throws(
    () => {
      translateSupplierSizeRow(
        { supplierSizeLabel: 'M', measurements: { waistCm: 38 } },
        { garmentCategory: 'upper', measurementMode: 'flat_garment' }
      );
    },
    (err: any) => {
      return err instanceof SizeTranslationError && err.code === 'MISSING_PRIMARY_MEASUREMENTS';
    }
  );

  // 3. Medida fuera de rango
  assert.throws(
    () => {
      translateSupplierSizeRow(
        { supplierSizeLabel: 'M', measurements: { chestCm: -5 } },
        { garmentCategory: 'upper', measurementMode: 'flat_garment' }
      );
    },
    (err: any) => {
      return err instanceof SizeTranslationError && err.code === 'OUT_OF_BOUNDS_MEASUREMENT';
    }
  );

  // 4. Tabla vacía
  assert.throws(
    () => {
      translateSupplierSizeChart({
        supplierName: 'Taller Test',
        garmentCategory: 'upper',
        measurementMode: 'flat_garment',
        rows: [],
      });
    },
    (err: any) => {
      return err instanceof SizeTranslationError && err.code === 'EMPTY_SIZE_ROWS';
    }
  );
});

test('M1-T4 (Escenario E3): Influencia de Calce Oversize vs Regular y Mapeo de Stock', () => {
  // Una prenda oversize con 58 cm de sisa (116 cm - 20 cm holgura = 96 cm pecho -> M)
  const oversizeRow: SupplierSizeRowInput = {
    supplierSizeLabel: 'Talle 1',
    measurements: { chestCm: 58 },
    stock: 5,
  };
  const translatedOversize = translateSupplierSizeRow(oversizeRow, {
    garmentCategory: 'upper',
    genderProfile: 'female',
    measurementMode: 'flat_garment',
    fitType: 'oversize',
    stretchLevel: 'rigid',
  });
  assert.equal(translatedOversize.glakStandardSize, 'M');

  // La misma sisa de 58 cm en prenda regular (116 cm - 8 cm holgura = 108 cm pecho -> L)
  const regularRow: SupplierSizeRowInput = {
    supplierSizeLabel: 'Talle 2',
    measurements: { chestCm: 58 },
    stock: 8,
  };
  const translatedRegular = translateSupplierSizeRow(regularRow, {
    garmentCategory: 'upper',
    genderProfile: 'female',
    measurementMode: 'flat_garment',
    fitType: 'regular',
    stretchLevel: 'rigid',
  });
  assert.equal(translatedRegular.glakStandardSize, 'L');

  // Mapeo a EnrichedSizeStock consolidando colisiones
  const stocks = mapTranslatedRowsToSizeStock(
    [translatedOversize, translatedRegular],
    undefined,
    'Taller Palermo'
  );
  assert.equal(stocks.length, 2);
  const stockM = stocks.find((s) => s.name === 'M');
  const stockL = stocks.find((s) => s.name === 'L');
  assert.ok(stockM);
  assert.equal(stockM.stock, 5);
  assert.equal(stockM.supplierSizeLabel, 'Talle 1');
  assert.equal(stockM.supplierName, 'Taller Palermo');
  assert.ok(stockL);
  assert.equal(stockL.stock, 8);
  assert.equal(stockL.supplierSizeLabel, 'Talle 2');
});

test('M1-T5: Recomendador de Talles para el Comprador (¿Cuál es mi talle?)', () => {
  const recommendation = recommendCustomerSize({
    chestContourCm: 96,
    waistContourCm: 79,
    hipContourCm: 104,
    garmentCategory: 'upper',
    genderProfile: 'female',
  });

  assert.equal(recommendation.recommendedSize, 'M');
  assert.equal(recommendation.numericSize, '40-42');
  assert.equal(recommendation.matchConfidence, 'high');
  assert.match(recommendation.explanation, /busto|pecho|IRAM/i);
});
