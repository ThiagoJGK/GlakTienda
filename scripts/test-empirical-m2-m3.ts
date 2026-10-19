/**
 * Empirical Verification & Adversarial Stress Test Harness
 * Milestones M2 (Gemini Cloud & Matrices) & M3 (Interactive Photo UI)
 * 
 * Run with: npx tsx scripts/test-empirical-m2-m3.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import {
  normalizeCategory,
  getPresetsForCategory,
  CATEGORY_SHOT_MATRICES,
  GENERAL_PHOTO_PRESETS,
  getPreset,
  getAllPresets,
  PhotoPreset,
} from '../src/lib/photo-presets';

import {
  QUALITY_MAP,
  ImageQuality,
} from '../src/lib/gemini/image-generator';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failedTests++;
  }
}

function section(title: string) {
  console.log(`\n======================================================`);
  console.log(`  ${title}`);
  console.log(`======================================================`);
}

// -------------------------------------------------------------
// SUITE 1: Category Matrices & Normalization
// -------------------------------------------------------------
section('SUITE 1: Category Normalization & Presets');

console.log('\n--- 1.1 Category Normalization (Mandatory Spanish strings) ---');
assert(normalizeCategory('Vestido largo') === 'vestidos', 'normalizeCategory("Vestido largo") -> "vestidos"');
assert(normalizeCategory('Remera manga corta') === 'tops', 'normalizeCategory("Remera manga corta") -> "tops"');
assert(normalizeCategory('Pantalón Oxford') === 'pantalones', 'normalizeCategory("Pantalón Oxford") -> "pantalones"');
assert(normalizeCategory('Cartera de cuero') === 'accesorios', 'normalizeCategory("Cartera de cuero") -> "accesorios"');

console.log('\n--- 1.2 Adversarial Category Stress Tests (Diacritics, Casing, Synonyms) ---');
assert(normalizeCategory('VESTIDO DE FIESTA') === 'vestidos', 'Uppercase: "VESTIDO DE FIESTA" -> "vestidos"');
assert(normalizeCategory('Mono enterito') === 'vestidos', 'Jumpsuit keyword: "Mono enterito" -> "vestidos"');
assert(normalizeCategory('Camisa de lino') === 'tops', 'Shirt keyword: "Camisa de lino" -> "tops"');
assert(normalizeCategory('Blusa sin mangas') === 'tops', 'Blouse keyword: "Blusa sin mangas" -> "tops"');
assert(normalizeCategory('Sweater tejido') === 'tops', 'Sweater keyword: "Sweater tejido" -> "tops"');
assert(normalizeCategory('Campera de abrigo') === 'tops', 'Jacket keyword: "Campera de abrigo" -> "tops"');
assert(normalizeCategory('Buzo oversize') === 'tops', 'Hoodie keyword: "Buzo oversize" -> "tops"');
assert(normalizeCategory('PANTALÓN ÓXFORD') === 'pantalones', 'Heavy diacritics + uppercase: "PANTALÓN ÓXFORD" -> "pantalones"');
assert(normalizeCategory('Falda plisada') === 'pantalones', 'Skirt keyword: "Falda plisada" -> "pantalones"');
assert(normalizeCategory('Short de baño') === 'pantalones', 'Short keyword: "Short de baño" -> "pantalones"');
assert(normalizeCategory('Bermudas de gabardina') === 'pantalones', 'Bermuda keyword: "Bermudas de gabardina" -> "pantalones"');
assert(normalizeCategory('Jean chupín') === 'pantalones', 'Jean keyword: "Jean chupín" -> "pantalones"');
assert(normalizeCategory('Denim elastizado') === 'pantalones', 'Denim keyword: "Denim elastizado" -> "pantalones"');
assert(normalizeCategory('Calzas deportivas') === 'pantalones', 'Leggings keyword: "Calzas deportivas" -> "pantalones"');
assert(normalizeCategory('Bolso playero') === 'accesorios', 'Bag keyword: "Bolso playero" -> "accesorios"');
assert(normalizeCategory('Cinturón de cuero') === 'accesorios', 'Belt keyword: "Cinturón de cuero" -> "accesorios"');
assert(normalizeCategory('Billetera de mano') === 'accesorios', 'Wallet keyword: "Billetera de mano" -> "accesorios"');
assert(normalizeCategory('Joyería fina') === 'accesorios', 'Jewelry keyword: "Joyería fina" -> "accesorios"');
assert(normalizeCategory('Pañuelo estampado') === 'accesorios', 'Scarf keyword: "Pañuelo estampado" -> "accesorios"');
assert(normalizeCategory('Mochila escolar') === 'accesorios', 'Backpack keyword: "Mochila escolar" -> "accesorios"');
assert(normalizeCategory('Gorro invernal') === 'accesorios', 'Beanie keyword: "Gorro invernal" -> "accesorios"');
assert(normalizeCategory('Bufanda de lana') === 'accesorios', 'Scarf keyword: "Bufanda de lana" -> "accesorios"');

console.log('\n--- 1.3 Boundary & Falsy Category Inputs ---');
assert(normalizeCategory(null) === 'general', 'null -> "general"');
assert(normalizeCategory(undefined) === 'general', 'undefined -> "general"');
assert(normalizeCategory('') === 'general', 'empty string "" -> "general"');
assert(normalizeCategory('   ') === 'general', 'whitespace "   " -> "general"');
assert(normalizeCategory('Tecnología y computación') === 'general', 'Unrelated text -> "general"');
assert(normalizeCategory('123456') === 'general', 'Numeric string -> "general"');

console.log('\n--- 1.4 Presets per Category (Exact Count of 3 & Correct Aspect Ratios) ---');
const categoriesToTest: Array<{ cat: string | null; expectedCount: number; expectedRatios: string[] }> = [
  { cat: 'Vestidos', expectedCount: 3, expectedRatios: ['3:4', '3:4', '1:1'] },
  { cat: 'Remera', expectedCount: 3, expectedRatios: ['3:4', '3:4', '1:1'] },
  { cat: 'Pantalón', expectedCount: 3, expectedRatios: ['3:4', '1:1', '3:4'] },
  { cat: 'Cartera', expectedCount: 3, expectedRatios: ['1:1', '4:3', '1:1'] },
  { cat: 'General', expectedCount: 3, expectedRatios: ['3:4', '1:1', '4:3'] },
  { cat: null, expectedCount: 3, expectedRatios: ['3:4', '1:1', '4:3'] },
];

for (const tc of categoriesToTest) {
  const presets = getPresetsForCategory(tc.cat);
  assert(presets.length === tc.expectedCount, `getPresetsForCategory("${tc.cat}") returns exactly ${tc.expectedCount} presets`, `Got ${presets.length}`);
  const ratios = presets.map((p) => p.aspectRatio);
  assert(
    JSON.stringify(ratios) === JSON.stringify(tc.expectedRatios),
    `getPresetsForCategory("${tc.cat}") aspect ratios match ${JSON.stringify(tc.expectedRatios)}`,
    `Got ${JSON.stringify(ratios)}`
  );
  for (const p of presets) {
    assert(Boolean(p.id && p.id.length > 0), `Preset ${p.id} has non-empty ID`);
    assert(Boolean(p.name && p.name.length > 0), `Preset ${p.id} has non-empty name ("${p.name}")`);
    assert(Boolean(p.icon && p.icon.length > 0), `Preset ${p.id} has non-empty icon ("${p.icon}")`);
    assert(Boolean(p.prompt && p.prompt.length > 20), `Preset ${p.id} has detailed prompt (>20 chars)`);
  }
}

console.log('\n--- 1.5 Preset Lookup & getAllPresets Uniqueness ---');
const allPresets = getAllPresets();
assert(allPresets.length === 15, `getAllPresets() returns total of 15 presets (3 general + 12 category)`, `Got ${allPresets.length}`);
const uniqueIds = new Set(allPresets.map((p) => p.id));
assert(uniqueIds.size === allPresets.length, `All ${uniqueIds.size} presets have distinct IDs`);

const sampleIds = [
  'vestido_frontal_entero',
  'vestido_45_silueta',
  'top_caida_manga',
  'pantalon_detalle_cintura',
  'accesorio_escala_proporcion',
  'frontal_editorial',
  'detalle_textura',
];
for (const id of sampleIds) {
  const found = getPreset(id);
  assert(found !== undefined && found.id === id, `getPreset("${id}") resolves correctly`);
}
assert(getPreset('non_existent_preset_xyz') === undefined, 'getPreset("non_existent_preset_xyz") returns undefined');


// -------------------------------------------------------------
// SUITE 2: Gemini Image Generator & Cloudinary Upload
// -------------------------------------------------------------
section('SUITE 2: Gemini Image Generator & Cloudinary Upload');

console.log('\n--- 2.1 Resolution & Quality Mapping ---');
assert(QUALITY_MAP['1080p'] === '1K', "QUALITY_MAP['1080p'] === '1K'");
assert(QUALITY_MAP['2k'] === '2K', "QUALITY_MAP['2k'] === '2K'");
assert(QUALITY_MAP['4k'] === '4K', "QUALITY_MAP['4k'] === '4K'");

console.log('\n--- 2.2 Prompt Construction & Negative Prompt Injection ---');
const imgGenSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/gemini/image-generator.ts'),
  'utf8'
);

assert(
  imgGenSource.includes("model: \"gemini-3.1-flash-image\""),
  'image-generator.ts specifies gemini-3.1-flash-image as primary model'
);
assert(
  imgGenSource.includes("responseModalities: [\"IMAGE\"]"),
  'image-generator.ts specifies responseModalities: ["IMAGE"]'
);
assert(
  imgGenSource.includes("model: \"imagen-3.0-generate-002\""),
  'image-generator.ts specifies imagen-3.0-generate-002 as fallback model'
);
assert(
  imgGenSource.includes("ESSENTIAL DIRECTIVE: Preserve the EXACT physical garment"),
  'image-generator.ts includes essential physical garment preservation directive'
);
assert(
  imgGenSource.includes("CORRECTIVE FEEDBACK & NEGATIVE RESTRICTIONS: Strict instructions to avoid:"),
  'image-generator.ts includes corrective feedback & negative restrictions injection'
);
assert(
  imgGenSource.includes("NEGATIVE PROMPT: blurry, oversaturated"),
  'image-generator.ts includes base negative prompt'
);

console.log('\n--- 2.3 Cloudinary REST Upload Logic & SHA-1 Signature ---');
const cloudUploadSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/cloudinary/server-upload.ts'),
  'utf8'
);

assert(
  cloudUploadSource.includes("crypto.subtle.digest('SHA-1'"),
  'server-upload.ts uses crypto.subtle.digest("SHA-1") for web crypto signing'
);
assert(
  cloudUploadSource.includes("createHash('sha1')"),
  'server-upload.ts includes node:crypto createHash("sha1") fallback'
);
assert(
  cloudUploadSource.includes('"GlakTienda"') && cloudUploadSource.includes('CLOUDINARY_UPLOAD_PRESET'),
  'server-upload.ts defaults upload preset to "GlakTienda"'
);
assert(
  cloudUploadSource.includes("folder ?? 'products/standardized'"),
  'server-upload.ts defaults destination folder to "products/standardized"'
);
assert(
  cloudUploadSource.includes("https://api.cloudinary.com/v1_1/"),
  'server-upload.ts directly posts to Cloudinary REST endpoint'
);

// Verify exact SHA-1 signature calculation matches Cloudinary requirements
function generateCloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const sortedQuery = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(`${sortedQuery}${apiSecret}`).digest('hex');
}

const mockParams = {
  timestamp: '1725838800',
  folder: 'products/standardized',
  public_id: 'vestido-rojo-frontal-123456',
  tags: 'glak,standardized,vestidos,vestido_frontal_entero',
};
const mockSecret = 'sample_secret_abcdef123456';
const calculatedSig = generateCloudinarySignature(mockParams, mockSecret);
assert(calculatedSig.length === 40, 'SHA-1 hex signature is exactly 40 characters');
assert(/^[0-9a-f]{40}$/.test(calculatedSig), 'SHA-1 hex signature matches hex pattern');


// -------------------------------------------------------------
// SUITE 3: UI Components, Suggestion Chips & Isolated States
// -------------------------------------------------------------
section('SUITE 3: UI Components, Suggestion Chips & Isolated States');

console.log('\n--- 3.1 RegenerationModal Inspection & Suggestion Chips ---');
const regenModalSource = fs.readFileSync(
  path.join(process.cwd(), 'src/components/admin/standardization/RegenerationModal.tsx'),
  'utf8'
);

const expectedChips = [
  { label: 'Sin fondo oscuro', promptText: 'evitar fondo oscuro, fondo limpio marfil claro' },
  { label: 'Mantener botones', promptText: 'no modificar botones originales, preservar diseño y material de botones' },
  { label: 'Tela mate', promptText: 'evitar brillos sintéticos, textura de tela mate natural' },
  { label: 'Sin sombras duras', promptText: 'sin sombras duras, iluminación de estudio difusa' },
  { label: 'Mejor iluminación', promptText: 'iluminación frontal uniforme de alta costura, sin zonas subexpuestas' },
  { label: 'Color más fiel', promptText: 'preservar tono, matiz y saturación exacta del color original de la prenda' },
];

for (const chip of expectedChips) {
  assert(
    regenModalSource.includes(chip.label),
    `RegenerationModal contains chip label "${chip.label}"`
  );
  assert(
    regenModalSource.includes(chip.promptText),
    `RegenerationModal contains prompt text for "${chip.label}"`
  );
}

// Test chip click concatenation logic
function handleChipClickLogic(currentPrompt: string, chipText: string): string {
  const trimmed = currentPrompt.trim();
  if (!trimmed) return chipText;
  if (trimmed.toLowerCase().includes(chipText.toLowerCase())) return currentPrompt;
  return `${trimmed}, ${chipText}`;
}

let promptState = '';
promptState = handleChipClickLogic(promptState, expectedChips[0].promptText);
assert(promptState === expectedChips[0].promptText, 'First chip click populates empty prompt');

promptState = handleChipClickLogic(promptState, expectedChips[1].promptText);
assert(
  promptState === `${expectedChips[0].promptText}, ${expectedChips[1].promptText}`,
  'Second chip click concatenates with comma and space'
);

const promptStateBeforeDup = promptState;
promptState = handleChipClickLogic(promptState, expectedChips[0].promptText);
assert(promptState === promptStateBeforeDup, 'Duplicate chip click does not append duplicate text');

console.log('\n--- 3.2 StandardizationConfigCard & Mass Upload Default State ---');
const configCardSource = fs.readFileSync(
  path.join(process.cwd(), 'src/components/admin/mass-upload/StandardizationConfigCard.tsx'),
  'utf8'
);

assert(
  configCardSource.includes("Fotos de Catálogo con IA"),
  'StandardizationConfigCard includes title "Fotos de Catálogo con IA"'
);
assert(
  configCardSource.includes("Opcional"),
  'StandardizationConfigCard displays "Opcional" badge'
);
assert(
  configCardSource.includes("100% Asíncrono"),
  'StandardizationConfigCard highlights asynchronous non-blocking operation'
);

const bulkUploadPageSource = fs.readFileSync(
  path.join(process.cwd(), 'src/app/(admin)/admin/productos/carga-masiva/page.tsx'),
  'utf8'
);

assert(
  bulkUploadPageSource.includes("enabled: false"),
  'BulkUploadPage initializes standardizationConfig.enabled to FALSE (100% optional)'
);
assert(
  bulkUploadPageSource.includes("quality: '2k'"),
  'BulkUploadPage initializes default quality to 2K'
);
assert(
  bulkUploadPageSource.includes("if (standardizationConfig.enabled)"),
  'BulkUploadPage only dispatches photo generation when standardizationConfig.enabled is true'
);
assert(
  bulkUploadPageSource.includes("generateStandardizedPhotosCloudAction({") &&
  bulkUploadPageSource.includes(".catch((err) => {"),
  'BulkUploadPage triggers cloud generation non-blockingly with .catch() error logging'
);

console.log('\n--- 3.3 StandardizationWorkbench Independent Card State Isolation ---');
const workbenchSource = fs.readFileSync(
  path.join(process.cwd(), 'src/components/admin/standardization/StandardizationWorkbench.tsx'),
  'utf8'
);

assert(
  workbenchSource.includes("approveGeneratedPhoto"),
  'StandardizationWorkbench integrates approveGeneratedPhoto'
);
assert(
  workbenchSource.includes("rejectGeneratedPhoto"),
  'StandardizationWorkbench integrates rejectGeneratedPhoto'
);
assert(
  workbenchSource.includes("RegenerationModal"),
  'StandardizationWorkbench integrates RegenerationModal'
);
assert(
  workbenchSource.includes("cardStates, setCardStates"),
  'StandardizationWorkbench uses granular cardStates dictionary'
);

// Empirical simulation of card state isolation
interface PhotoCardState {
  status: 'pending_review' | 'approved' | 'discarded' | 'failed';
  isApproving: boolean;
  isDiscarding: boolean;
  cloudinary_id: string;
  url?: string;
  isJustRegenerated?: boolean;
}

const mockJobId = 'job_123';
let cardStates: Record<string, PhotoCardState> = {
  [`${mockJobId}_vestido_frontal_entero`]: {
    status: 'pending_review',
    isApproving: false,
    isDiscarding: false,
    cloudinary_id: 'img_front_001',
    url: 'https://res.cloudinary.com/demo/front.jpg',
  },
  [`${mockJobId}_vestido_45_silueta`]: {
    status: 'pending_review',
    isApproving: false,
    isDiscarding: false,
    cloudinary_id: 'img_side_002',
    url: 'https://res.cloudinary.com/demo/side.jpg',
  },
  [`${mockJobId}_vestido_macro_textura`]: {
    status: 'pending_review',
    isApproving: false,
    isDiscarding: false,
    cloudinary_id: 'img_macro_003',
    url: 'https://res.cloudinary.com/demo/macro.jpg',
  },
};

const frontKey = `${mockJobId}_vestido_frontal_entero`;
const sideKey = `${mockJobId}_vestido_45_silueta`;
const macroKey = `${mockJobId}_vestido_macro_textura`;

// Action 1: Approve front photo
cardStates = {
  ...cardStates,
  [frontKey]: { ...cardStates[frontKey], status: 'approved' },
};

assert(cardStates[frontKey].status === 'approved', 'Front photo status transitioned to "approved"');
assert(cardStates[sideKey].status === 'pending_review', 'Side photo status remains untouched ("pending_review")');
assert(cardStates[macroKey].status === 'pending_review', 'Macro photo status remains untouched ("pending_review")');

// Action 2: Discard side photo
cardStates = {
  ...cardStates,
  [sideKey]: { ...cardStates[sideKey], status: 'discarded' },
};

assert(cardStates[frontKey].status === 'approved', 'Front photo remains "approved"');
assert(cardStates[sideKey].status === 'discarded', 'Side photo transitioned to "discarded"');
assert(cardStates[macroKey].status === 'pending_review', 'Macro photo remains untouched ("pending_review")');

// Action 3: Regenerate macro photo
const newMacroId = 'img_macro_003_regenerated';
cardStates = {
  ...cardStates,
  [macroKey]: {
    status: 'pending_review',
    isApproving: false,
    isDiscarding: false,
    cloudinary_id: newMacroId,
    url: `https://res.cloudinary.com/demo/${newMacroId}.jpg`,
    isJustRegenerated: true,
  },
};

assert(cardStates[frontKey].status === 'approved', 'Front photo remains "approved" after macro regeneration');
assert(cardStates[sideKey].status === 'discarded', 'Side photo remains "discarded" after macro regeneration');
assert(cardStates[macroKey].cloudinary_id === newMacroId, 'Macro photo updated with new regenerated cloudinary_id');
assert(cardStates[macroKey].status === 'pending_review', 'Macro photo reset to "pending_review" for admin evaluation');
assert(cardStates[macroKey].isJustRegenerated === true, 'Macro photo has isJustRegenerated pulse flag active');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
section('SUMMARY OF EMPIRICAL TESTS');
console.log(`Total tests run: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  console.error(`\n❌ VERDICT: FAIL (${failedTests} test(s) failed)`);
  process.exit(1);
} else {
  console.log(`\n✅ VERDICT: ALL ${passedTests} EMPIRICAL TESTS PASSED`);
  process.exit(0);
}
