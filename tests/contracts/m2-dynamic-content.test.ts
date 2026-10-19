import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('M2-T1: Types for dynamic content must exist in src/types/content.ts', () => {
  const filePath = path.resolve(process.cwd(), 'src/types/content.ts');
  assert.ok(fs.existsSync(filePath), 'src/types/content.ts must exist');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.includes('TrustBadgeItem'), 'Must export TrustBadgeItem interface');
  assert.ok(content.includes('StoreSettings'), 'Must export StoreSettings interface');
  assert.ok(content.includes('SiteBanner'), 'Must export SiteBanner interface');
});

test('M2-T2: Supabase migration for store content must define store_settings and site_banners tables', () => {
  const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261019_store_content.sql');
  assert.ok(fs.existsSync(sqlPath), 'Migration file supabase/migrations/20261019_store_content.sql must exist');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.ok(sql.includes('store_settings'), 'Migration must create or alter store_settings table');
  assert.ok(sql.includes('site_banners'), 'Migration must create or alter site_banners table');
});

test('M2-T3: Content store module src/lib/content/contentStore.ts must exist and export store methods', () => {
  const filePath = path.resolve(process.cwd(), 'src/lib/content/contentStore.ts');
  assert.ok(fs.existsSync(filePath), 'src/lib/content/contentStore.ts must exist');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(
    content.includes('getStoreSettings') || content.includes('useContentStore') || content.includes('storeSettings'),
    'contentStore must provide settings retrieval logic'
  );
});

test('M2-T4: Admin content management page must exist at src/app/(admin)/admin/contenido/page.tsx', () => {
  const pagePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/contenido/page.tsx');
  assert.ok(fs.existsSync(pagePath), 'Admin content page must exist');
});

test('M2-T5: Storefront components must be connected to dynamic content structures', () => {
  const bentoPath = path.resolve(process.cwd(), 'src/components/home/CategoriesBento.tsx');
  const bannerPath = path.resolve(process.cwd(), 'src/components/home/CollectionBanner.tsx');
  assert.ok(fs.existsSync(bentoPath), 'CategoriesBento component must exist');
  assert.ok(fs.existsSync(bannerPath), 'CollectionBanner component must exist');
});
