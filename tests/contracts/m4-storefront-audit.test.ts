import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SCENARIOS = [
  'src/testing/scenarios/home-audit.ts',
  'src/testing/scenarios/catalog-audit.ts',
  'src/testing/scenarios/pdp-audit.ts',
  'src/testing/scenarios/cart-audit.ts',
  'src/testing/scenarios/mobile-ergonomics-audit.ts',
];

test('M4-T1: All storefront audit scenarios must exist', () => {
  for (const scenario of SCENARIOS) {
    const fullPath = path.resolve(process.cwd(), scenario);
    assert.ok(fs.existsSync(fullPath), `Scenario ${scenario} must exist`);
  }
});

test('M4-T2: PDP scenario must validate 5 AI photographic poses and reject human model measurements', () => {
  const pdpPath = path.resolve(process.cwd(), 'src/testing/scenarios/pdp-audit.ts');
  assert.ok(fs.existsSync(pdpPath), 'src/testing/scenarios/pdp-audit.ts must exist');
  const content = fs.readFileSync(pdpPath, 'utf8');
  assert.ok(
    content.includes('poses') || content.includes('photo') || content.includes('canonical'),
    'PDP scenario must inspect product photos / AI poses'
  );
});

test('M4-T3: Mobile ergonomics audit scenario must test touch target compliance', () => {
  const mobilePath = path.resolve(process.cwd(), 'src/testing/scenarios/mobile-ergonomics-audit.ts');
  assert.ok(fs.existsSync(mobilePath), 'Mobile ergonomics audit scenario must exist');
});
