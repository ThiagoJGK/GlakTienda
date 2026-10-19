import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAndTranslateGeminiChartResponse,
  buildSizeChartExtractionPrompt,
} from '../src/lib/sizing/geminiSizeExtractor';
import {
  buildSupplierSizeProfile,
  createSupplierProfileRepository,
} from '../src/lib/sizing/supplierProfileStore';

test('M2-T1: buildSizeChartExtractionPrompt genera instrucciones con distinción plano vs contorno', () => {
  const promptUpper = buildSizeChartExtractionPrompt('upper');
  assert.match(promptUpper, /prenda apoyada en plano|sisa a sisa/i);
  assert.match(promptUpper, /contorno/i);
  assert.match(promptUpper, /JSON/i);
});

test('M2-T2 (Escenario E4): parseAndTranslateGeminiChartResponse procesa JSON de IA y traduce talles', () => {
  const geminiResponseText = `\`\`\`json
  {
    "supplierName": "Taller Denim Avellaneda",
    "detectedCategory": "lower",
    "detectedMeasurementMode": "flat_garment",
    "rows": [
      {
        "supplierSizeLabel": "38",
        "measurements": {
          "waistCm": 36,
          "hipCm": 48,
          "riseCm": 25,
          "inseamCm": 77
        },
        "stock": 10
      },
      {
        "supplierSizeLabel": "44",
        "measurements": {
          "waistCm": 43,
          "hipCm": 56,
          "riseCm": 27,
          "inseamCm": 79
        },
        "stock": 15
      }
    ]
  }
  \`\`\``;

  const result = parseAndTranslateGeminiChartResponse(geminiResponseText);
  assert.equal(result.extracted.supplierName, 'Taller Denim Avellaneda');
  assert.equal(result.extracted.detectedCategory, 'lower');
  assert.equal(result.extracted.rows.length, 2);
  assert.equal(result.translatedRows.length, 2);

  // Talle 38 proveedor (36 plano -> 72 contorno cintura - 6 holgura = 66 cm -> S)
  const row1 = result.translatedRows[0];
  assert.equal(row1.supplierSizeLabel, '38');
  assert.ok(row1.glakStandardSize === 'XS' || row1.glakStandardSize === 'S');

  // Talle 44 proveedor (43 plano -> 86 contorno cintura - 6 holgura = 80 cm -> M/L)
  const row2 = result.translatedRows[1];
  assert.equal(row2.supplierSizeLabel, '44');
  assert.ok(row2.glakStandardSize === 'M' || row2.glakStandardSize === 'L');
});

test('M2-T3 (Escenario E4): Repositorio de plantillas de proveedor persiste y lista perfiles con fallback', async () => {
  const profileInput = buildSupplierSizeProfile({
    supplierName: 'Taller Lino Flores',
    garmentCategory: 'upper',
    measurementMode: 'flat_garment',
    fitType: 'regular',
    stretchLevel: 'rigid',
    rows: [
      {
        supplierSizeLabel: '1',
        measurements: { chestCm: 46 },
        stock: 5,
      },
      {
        supplierSizeLabel: '2',
        measurements: { chestCm: 50 },
        stock: 12,
      },
    ],
  });

  assert.ok(profileInput.id);
  assert.equal(profileInput.supplierName, 'Taller Lino Flores');
  assert.equal(profileInput.translatedRows.length, 2);

  const repo = createSupplierProfileRepository();
  const saved = await repo.saveProfile(profileInput);
  assert.equal(saved.id, profileInput.id);

  const all = await repo.listProfiles('Flores');
  assert.ok(all.length >= 1);
  assert.ok(all.some((p: { supplierName: string }) => p.supplierName.includes('Flores')));

  const deleted = await repo.deleteProfile(profileInput.id);
  assert.equal(deleted, true);
});
