import test from 'node:test';
import assert from 'node:assert/strict';
import {
  translateSupplierSizeRow,
  mapTranslatedRowsToSizeStock,
  recommendCustomerSize,
} from '../src/lib/sizing/sizeTranslator';
import { getIramTable } from '../src/lib/sizing/iramStandards';

test('M4-T1 (Escenario E6 Tier 4 E2E): Flujo punta a punta Proveedor -> Traducción -> Storefront', () => {
  // 1. Proveedor carga pantalón de jean rígido donde su "Talle 44" mide 39 cm de cintura plana y 52 cm de cadera plana
  const supplierRow = {
    supplierSizeLabel: 'Talle 44',
    measurements: {
      waistCm: 39,
      hipCm: 52,
      riseCm: 26,
      inseamCm: 78,
    },
    stock: 6,
  };

  // 2. Traducción al estándar IRAM 75300
  const translated = translateSupplierSizeRow(supplierRow, {
    garmentCategory: 'lower',
    genderProfile: 'female',
    measurementMode: 'flat_garment',
    fitType: 'regular',
    stretchLevel: 'rigid',
  });

  // Cintura plana 39 -> 78 - 6 = 72 cm cintura
  // Cadera plana 52 -> 104 - 6 = 98 cm cadera
  // En tabla IRAM femenina: S es Cintura 70-75 / Cadera 96-101. M es Cintura 76-82 / Cadera 102-108.
  assert.ok(['S', 'M'].includes(translated.glakStandardSize));
  assert.equal(translated.hasLabelDiscrepancy, true);
  assert.match(translated.discrepancyNote ?? '', /Talle 44.*equivale a Talle GLak/i);

  // 3. Mapeo a stock de producto
  const productSizes = mapTranslatedRowsToSizeStock(
    [translated],
    undefined,
    'Denim Flores'
  );
  assert.equal(productSizes.length, 1);
  const sizeItem = productSizes[0];
  assert.equal(sizeItem.supplierSizeLabel, 'Talle 44');
  assert.equal(sizeItem.supplierName, 'Denim Flores');
  assert.equal(sizeItem.stock, 6);

  // 4. Comprador en la tienda utiliza el recomendador de talle
  // Cliente con 73 cm de cintura y 99 cm de cadera
  const recommendation = recommendCustomerSize(
    {
      waistContourCm: 73,
      hipContourCm: 99,
      garmentCategory: 'lower',
      genderProfile: 'female',
    },
    productSizes
  );

  assert.equal(recommendation.recommendedSize, sizeItem.name);
  assert.equal(recommendation.matchConfidence, 'high');
  if (sizeItem.supplierSizeLabel !== sizeItem.name) {
    assert.ok(recommendation.supplierTagNotice);
    assert.match(recommendation.supplierTagNotice, /Talle 44/);
  }

  // 5. Verificación de cumplimiento legal SUNITI (Ley 27.521)
  const officialIramTable = getIramTable('female');
  assert.equal(officialIramTable.length, 7);
  assert.equal(officialIramTable[0].size, 'XS');
  assert.equal(officialIramTable[6].size, '3XL');
});
