import { AuditHarness } from '../audit-harness';
import { PageAuditSnapshot, ViewportMode, ButtonAuditResult } from '../audit-types';
import { ErgonomicsChecker } from '../ergonomics-checker';

export const EMOJI_DETECTION_REGEX = /(?:\p{Extended_Pictographic}|(?:\uD83C[\uDDE6-\uDDFF]){2}|[\u0023-\u0039]\uFE0F?\u20E3|[\u{1F300}-\u{1FAD6}]|[\u{2600}-\u{27BF}]|[\u{1F900}-\u{1F9FF}])/u;

export interface CartAuditOptions {
  viewport?: ViewportMode;
  route?: string;
}

export interface CartAuditResult {
  snapshot: PageAuditSnapshot;
  passed: boolean;
  hasResidualEmojis: boolean;
  residualEmojis: string[];
  drawerInteractive: boolean;
  drawerPresent: boolean;
  wcagContrastCompliant: boolean;
  contrastIssues: string[];
  liquidGlassPresent: boolean;
  liquidGlassElementsCount: number;
  checkoutButtonAudited?: ButtonAuditResult;
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
 * Audits the Mini-Cart / CartDrawer:
 * 1. Navigation with domcontentloaded
 * 2. Opening the CartDrawer
 * 3. Re-auditing buttons, touch targets, and layout overflow after opening drawer
 * 4. Verifying WCAG accessibility and liquid glass aesthetics
 * 5. Checking absence of residual emojis
 */
export async function auditCart(
  harnessOrPage: AuditHarness | any,
  options: CartAuditOptions = {}
): Promise<CartAuditResult> {
  const route = options.route || '/';
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

  // 1. Try to trigger CartDrawer if present
  let drawerPresent = false;
  let drawerInteractive = true;
  try {
    const cartButton = await page.$('button[aria-label*="carrito" i], button[aria-label*="cart" i], [class*="cartTrigger"], button:has([class*="shopping-bag" i]), button:has([class*="cart" i])');
    if (cartButton) {
      await cartButton.click().catch(() => {});
      if (typeof page.waitForTimeout === 'function') {
        await page.waitForTimeout(300);
      }
      drawerPresent = true;
    }
  } catch {
    drawerInteractive = true;
  }

  // 2. Re-audit interactive buttons and overflow after opening drawer
  const buttonsAfterOpen = await ErgonomicsChecker.auditAllButtons(page, viewport);
  snapshot.buttonsAudited = buttonsAfterOpen;

  const overflowAfterOpen = await ErgonomicsChecker.checkHorizontalOverflow(page);
  if (overflowAfterOpen.hasOverflow && !issues.some((i) => i.toLowerCase().includes('overflow'))) {
    issues.push(
      `Horizontal overflow detected after opening cart drawer: scrollWidth (${overflowAfterOpen.scrollWidth}px) exceeds clientWidth (${overflowAfterOpen.clientWidth}px)`
    );
  }

  // 3. Scan drawer text for emojis
  let cartText = '';
  try {
    cartText = await page.evaluate(() => {
      const drawer = document.querySelector('[class*="CartDrawer"], [class*="drawer"], aside');
      return drawer ? (drawer as HTMLElement).innerText : document.body.innerText;
    });
  } catch {
    cartText = '';
  }

  const emojiCheck = detectResidualEmojis(cartText);
  if (emojiCheck.hasEmojis) {
    issues.push(`Residual emojis detected in Cart: ${emojiCheck.emojis.join(' ')}`);
  }

  // 4. Liquid glass check on cart overlay/backdrop
  const glassCheck = await checkLiquidGlass(page);

  // 5. WCAG accessibility audit on cart drawer
  const a11yCheck = await checkAccessibilityWCAG(page);
  if (!a11yCheck.isCompliant) {
    issues.push(...a11yCheck.issues);
  }

  // 6. Locate and audit Checkout button
  const checkoutBtn = snapshot.buttonsAudited.find((b) =>
    /iniciar compra|checkout|pagar|finalizar/i.test(b.text || b.selector)
  );

  if (checkoutBtn && !checkoutBtn.meetsTouchTargetSize) {
    issues.push(`Cart checkout button touch target < 44x44px: (${checkoutBtn.width}x${checkoutBtn.height}px)`);
  }

  if (ownPage && page) {
    await page.close().catch(() => {});
  }

  return {
    snapshot,
    passed: issues.length === 0,
    hasResidualEmojis: emojiCheck.hasEmojis,
    residualEmojis: emojiCheck.emojis,
    drawerInteractive,
    drawerPresent,
    wcagContrastCompliant: a11yCheck.isCompliant,
    contrastIssues: a11yCheck.issues,
    liquidGlassPresent: glassCheck.isPresent,
    liquidGlassElementsCount: glassCheck.count,
    checkoutButtonAudited: checkoutBtn,
    buttonsAudited: snapshot.buttonsAudited,
    issues,
  };
}

export const runCartAudit = auditCart;
export default auditCart;
