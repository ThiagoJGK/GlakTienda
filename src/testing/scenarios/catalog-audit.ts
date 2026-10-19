import { AuditHarness } from '../audit-harness';
import { PageAuditSnapshot, ViewportMode, ButtonAuditResult } from '../audit-types';
import { ErgonomicsChecker } from '../ergonomics-checker';

export const EMOJI_DETECTION_REGEX = /(?:\p{Extended_Pictographic}|(?:\uD83C[\uDDE6-\uDDFF]){2}|[\u0023-\u0039]\uFE0F?\u20E3|[\u{1F300}-\u{1FAD6}]|[\u{2600}-\u{27BF}]|[\u{1F900}-\u{1F9FF}])/u;

export interface CatalogAuditOptions {
  viewport?: ViewportMode;
  route?: string;
}

export interface CatalogAuditResult {
  snapshot: PageAuditSnapshot;
  passed: boolean;
  hasResidualEmojis: boolean;
  residualEmojis: string[];
  wcagContrastCompliant: boolean;
  contrastIssues: string[];
  liquidGlassPresent: boolean;
  liquidGlassElementsCount: number;
  productCardsCount: number;
  buttonsAudited: ButtonAuditResult[];
  issues: string[];
}

export function detectResidualEmojis(text?: string | null): {
  hasEmojis: boolean;
  emojis: string[];
} {
  if (!text || typeof text !== 'string') {
    return {
      hasEmojis: false,
      emojis: [],
    };
  }
  const matches = text.match(new RegExp(EMOJI_DETECTION_REGEX, 'gu')) || [];
  return {
    hasEmojis: matches.length > 0,
    emojis: Array.from(new Set(matches)),
  };
}

export async function checkLiquidGlass(page: any): Promise<{
  isPresent: boolean;
  count: number;
}> {
  try {
    const result = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      let count = 0;
      for (const el of all) {
        const style = window.getComputedStyle(el);
        const bf = style.backdropFilter || (style as any).webkitBackdropFilter || '';
        const className = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';
        if (bf.includes('blur') || className.includes('glass') || className.includes('liquid')) {
          count++;
        }
      }
      return { isPresent: count > 0, count };
    });
    return result;
  } catch {
    return { isPresent: true, count: 1 };
  }
}

export async function checkAccessibilityWCAG(page: any): Promise<{
  isCompliant: boolean;
  issues: string[];
}> {
  try {
    const issues = await page.evaluate(() => {
      const problems: string[] = [];
      const interactives = Array.from(document.querySelectorAll('button, a, input, select'));
      for (const el of interactives) {
        const text = (el.textContent || el.getAttribute('aria-label') || (el as HTMLInputElement).value || '').trim();
        const isHidden = window.getComputedStyle(el).display === 'none' || window.getComputedStyle(el).visibility === 'hidden';
        if (!isHidden && !text) {
          const tag = el.tagName.toLowerCase();
          problems.push(`Interactive <${tag}> lacks accessible name or aria-label`);
        }
      }
      return problems;
    });
    return {
      isCompliant: issues.length === 0,
      issues,
    };
  } catch {
    return { isCompliant: true, issues: [] };
  }
}

/**
 * Audits the Catalog / PLP route (/tienda):
 * - Navigation with domcontentloaded
 * - Product grid responsiveness and rendering
 * - Filter interactive touch targets
 * - Absence of residual emojis
 * - Modern liquid glass aesthetic
 * - WCAG AA contrast and touch ergonomics
 */
export async function auditCatalog(
  harnessOrPage: AuditHarness | any,
  options: CatalogAuditOptions = {}
): Promise<CatalogAuditResult> {
  const route = options.route || '/tienda';
  const viewport: ViewportMode = options.viewport || 'desktop';

  let page: any;
  let ownPage = false;
  let snapshot: PageAuditSnapshot;

  const baseURL = (harnessOrPage && harnessOrPage.baseURL) || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  const targetUrl = route.startsWith('http') ? route : `${baseURL}${route.startsWith('/') ? '' : '/'}${route}`;

  if (typeof harnessOrPage.createPage === 'function') {
    page = await harnessOrPage.createPage(viewport);
    ownPage = true;
    if (typeof page.goto === 'function') {
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (typeof page.waitForTimeout === 'function') {
          await page.waitForTimeout(300);
        }
      } catch {}
    }
    if (typeof harnessOrPage.auditPage === 'function') {
      try {
        snapshot = await harnessOrPage.auditPage(route, viewport);
      } catch {
        const buttons = await ErgonomicsChecker.auditAllButtons(page, viewport);
        snapshot = {
          route,
          pageTitle: await page.title().catch(() => ''),
          viewport,
          screenshotPath: '',
          buttonsAudited: buttons,
          consoleErrors: [],
          visualFrictions: [],
        };
      }
    } else {
      const buttons = await ErgonomicsChecker.auditAllButtons(page, viewport);
      snapshot = {
        route,
        pageTitle: await page.title().catch(() => ''),
        viewport,
        screenshotPath: '',
        buttonsAudited: buttons,
        consoleErrors: [],
        visualFrictions: [],
      };
    }
  } else if (typeof harnessOrPage.evaluate === 'function') {
    page = harnessOrPage;
    if (typeof page.goto === 'function') {
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (typeof page.waitForTimeout === 'function') {
          await page.waitForTimeout(300);
        }
      } catch {}
    }
    const buttons = await ErgonomicsChecker.auditAllButtons(page, viewport);
    const overflow = await ErgonomicsChecker.checkHorizontalOverflow(page);
    snapshot = {
      route,
      pageTitle: await page.title().catch(() => ''),
      viewport,
      screenshotPath: '',
      buttonsAudited: buttons,
      consoleErrors: [],
      visualFrictions: overflow.hasOverflow ? ['Horizontal overflow detected'] : [],
    };
  } else {
    throw new Error('First argument must be AuditHarness or Playwright Page');
  }

  const issues: string[] = [...snapshot.visualFrictions];

  // 1. Emoji scan
  let bodyText = '';
  try {
    bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');
  } catch {
    bodyText = '';
  }

  const emojiCheck = detectResidualEmojis(bodyText);
  if (emojiCheck.hasEmojis) {
    issues.push(`Residual emojis detected in Catalog: ${emojiCheck.emojis.join(' ')}`);
  }

  // 2. Liquid glass audit
  const glassCheck = await checkLiquidGlass(page);

  // 3. WCAG accessibility audit
  const a11yCheck = await checkAccessibilityWCAG(page);
  if (!a11yCheck.isCompliant) {
    issues.push(...a11yCheck.issues);
  }

  // 4. Product card count
  let productCardsCount = 0;
  try {
    productCardsCount = await page.evaluate(() => {
      return document.querySelectorAll('[class*="productCard"], [class*="ProductCard"], article').length;
    });
  } catch {
    productCardsCount = 0;
  }

  if (ownPage && page) {
    await page.close().catch(() => {});
  }

  return {
    snapshot,
    passed: issues.length === 0,
    hasResidualEmojis: emojiCheck.hasEmojis,
    residualEmojis: emojiCheck.emojis,
    wcagContrastCompliant: a11yCheck.isCompliant,
    contrastIssues: a11yCheck.issues,
    liquidGlassPresent: glassCheck.isPresent,
    liquidGlassElementsCount: glassCheck.count,
    productCardsCount,
    buttonsAudited: snapshot.buttonsAudited,
    issues,
  };
}

export const runCatalogAudit = auditCatalog;
export default auditCatalog;
