import test from 'node:test';
import assert from 'node:assert/strict';
import { GLAK_STANDARD_SIZES, EnrichedSizeStock } from '../src/types/sizing';
import { mapTranslatedRowsToSizeStock, translateSupplierSizeChart } from '../src/lib/sizing/sizeTranslator';

test('M3-T1: Constante GLAK_STANDARD_SIZES soporta talles extendidos XS a 3XL y U', () => {
  assert.equal(GLAK_STANDARD_SIZES.length, 8);
  assert.ok(GLAK_STANDARD_SIZES.includes('XXL'));
  assert.ok(GLAK_STANDARD_SIZES.includes('3XL'));
  assert.ok(GLAK_STANDARD_SIZES.includes('U'));
});

test('M3-T2 (Escenario E5): Serialización y enriquecimiento de variaciones para create/updateProductAction', () => {
  const translated = translateSupplierSizeChart({
    supplierName: 'Taller Palermo',
    garmentCategory: 'upper',
    measurementMode: 'flat_garment',
    fitType: 'regular',
    stretchLevel: 'rigid',
    rows: [
      { supplierSizeLabel: 'S', measurements: { chestCm: 48 }, stock: 3 },
      { supplierSizeLabel: 'M', measurements: { chestCm: 51 }, stock: 7 },
      { supplierSizeLabel: 'L', measurements: { chestCm: 55 }, stock: 4 },
    ],
  });

  const enrichedSizes: EnrichedSizeStock[] = mapTranslatedRowsToSizeStock(
    translated,
    undefined,
    'Taller Palermo'
  );

  assert.ok(enrichedSizes.length >= 2);
  for (const s of enrichedSizes) {
    assert.ok(GLAK_STANDARD_SIZES.includes(s.name as any));
    assert.equal(s.supplierName, 'Taller Palermo');
    assert.ok(s.numericSize);
    assert.ok(s.measurementsFlatCm);
  }

  // Verifica que sea serializable como JSON para FormData
  const jsonString = JSON.stringify(enrichedSizes);
  const parsedBack = JSON.parse(jsonString);
  assert.equal(parsedBack.length, enrichedSizes.length);
  assert.equal(parsedBack[0].name, enrichedSizes[0].name);
});
