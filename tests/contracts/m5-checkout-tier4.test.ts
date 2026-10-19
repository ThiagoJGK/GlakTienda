import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('M5-T1: Checkout audit scenario in src/testing/scenarios/checkout-audit.ts must exist', () => {
  const checkoutPath = path.resolve(process.cwd(), 'src/testing/scenarios/checkout-audit.ts');
  assert.ok(fs.existsSync(checkoutPath), 'src/testing/scenarios/checkout-audit.ts must exist');
  const content = fs.readFileSync(checkoutPath, 'utf8');
  assert.ok(
    content.includes('MercadoPago') || content.includes('mercadopago') || content.includes('abandoned') || content.includes('lock'),
    'Checkout scenario must test Mercado Pago checkout, 15 min lock or abandoned cart'
  );
});

test('M5-T2: Adversarial reporter in src/testing/reporters/adversarial-reporter.ts must exist', () => {
  const reporterPath = path.resolve(process.cwd(), 'src/testing/reporters/adversarial-reporter.ts');
  assert.ok(fs.existsSync(reporterPath), 'src/testing/reporters/adversarial-reporter.ts must exist');
});

test('M5-T3: Adversarial UX/UI master report must exist at reports/uxui-audit/ADVERSARIAL_UXUI_REPORT.md', () => {
  const reportPath = path.resolve(process.cwd(), 'reports/uxui-audit/ADVERSARIAL_UXUI_REPORT.md');
  assert.ok(fs.existsSync(reportPath), 'reports/uxui-audit/ADVERSARIAL_UXUI_REPORT.md must exist');
  const content = fs.readFileSync(reportPath, 'utf8');
  assert.ok(content.length > 200, 'Report must contain substantial content and analysis');
});
