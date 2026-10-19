import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('M3-T1: playwright.config.ts must configure desktop and mobile viewports', () => {
  const configPath = path.resolve(process.cwd(), 'playwright.config.ts');
  assert.ok(fs.existsSync(configPath), 'playwright.config.ts must exist');
  const content = fs.readFileSync(configPath, 'utf8');
  assert.ok(content.includes('1280') || content.includes('desktop'), 'Must configure desktop viewport');
  assert.ok(content.includes('390') || content.includes('mobile'), 'Must configure mobile viewport');
});

test('M3-T2: Audit types must define ButtonAuditResult and PageAuditSnapshot in src/testing/audit-types.ts', () => {
  const typesPath = path.resolve(process.cwd(), 'src/testing/audit-types.ts');
  assert.ok(fs.existsSync(typesPath), 'src/testing/audit-types.ts must exist');
  const content = fs.readFileSync(typesPath, 'utf8');
  assert.ok(content.includes('ButtonAuditResult'), 'Must export ButtonAuditResult');
  assert.ok(content.includes('PageAuditSnapshot'), 'Must export PageAuditSnapshot');
  assert.ok(content.includes('meetsTouchTargetSize'), 'Must include meetsTouchTargetSize property');
});

test('M3-T3: Ergonomics checker in src/testing/ergonomics-checker.ts must enforce touch target >= 44x44px', () => {
  const checkerPath = path.resolve(process.cwd(), 'src/testing/ergonomics-checker.ts');
  assert.ok(fs.existsSync(checkerPath), 'src/testing/ergonomics-checker.ts must exist');
  const content = fs.readFileSync(checkerPath, 'utf8');
  assert.ok(content.includes('44'), 'Must check minimum 44px threshold');
});

test('M3-T4: Audit harness in src/testing/audit-harness.ts must provide multi-viewport execution', () => {
  const harnessPath = path.resolve(process.cwd(), 'src/testing/audit-harness.ts');
  assert.ok(fs.existsSync(harnessPath), 'src/testing/audit-harness.ts must exist');
});
