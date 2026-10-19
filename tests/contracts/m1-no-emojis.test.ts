import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Regex to detect emoji characters (Unicode Extended Pictographic, Emoticons, Symbols, Transport, Misc)
const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

const TARGET_FILES = [
  'src/components/layout/Navbar.tsx',
  'src/components/layout/TrustBar.tsx',
  'src/components/layout/AdminSidebar.tsx',
  'src/app/(store)/checkout/CheckoutClient.tsx',
  'src/components/home/Hero.tsx',
];

test('M1-T1: package.json must include lucide-react dependency', () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const hasLucide = !!(pkg.dependencies?.['lucide-react'] || pkg.devDependencies?.['lucide-react']);
  assert.ok(hasLucide, 'package.json must contain lucide-react dependency');
});

test('M1-T2: All target files must exist', () => {
  for (const relPath of TARGET_FILES) {
    const fullPath = path.resolve(process.cwd(), relPath);
    assert.ok(fs.existsSync(fullPath), `Target file ${relPath} must exist`);
  }
});

test('M1-T3: Target components must have ZERO emojis', () => {
  for (const relPath of TARGET_FILES) {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const matches: string[] = [];
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (EMOJI_REGEX.test(line)) {
        matches.push(`Line ${idx + 1}: ${line.trim()}`);
      }
    });
    assert.equal(
      matches.length,
      0,
      `File ${relPath} contains emojis:\n${matches.slice(0, 5).join('\n')}`
    );
  }
});

test('M1-T4: Target components must import icons from lucide-react', () => {
  for (const relPath of TARGET_FILES) {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasLucideImport = /from\s+['"]lucide-react['"]/.test(content);
    assert.ok(
      hasLucideImport,
      `File ${relPath} must import icons from 'lucide-react'`
    );
  }
});
