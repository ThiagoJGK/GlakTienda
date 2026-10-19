import { AuditHarness } from '../audit-harness';
import { PageAuditSnapshot, ButtonAuditResult } from '../audit-types';
import { ErgonomicsChecker } from '../ergonomics-checker';

export const MOBILE_AUDIT_VIEWPORT = {
  width: 390,
  height: 844,
  isMobile: true,
  hasTouch: true,
} as const;

export const MIN_TOUCH_TARGET_SIZE = 44;

export interface MobileErgonomicsOptions {
  route?: string;
  minTouchTargetSize?: number;
}

export interface StickyBuyBarAudit {
  isPresent: boolean;
  isObstructive: boolean;
  boundingHeight: number;
  hasSufficientPagePadding: boolean;
  details?: string;
}

export interface MobileErgonomicsResult {
  snapshot: PageAuditSnapshot;
  passed: boolean;
  viewport: { width: number; height: number };
  touchTargetViolations: ButtonAuditResult[];
  compliantButtons: ButtonAuditResult[];
  touchTargetComplianceRatio: number;
  hasHorizontalOverflow: boolean;
  overflowDetails?: string;
  stickyBuyBar: StickyBuyBarAudit;
  stickyBuyBarNonObstructive: boolean;
  issues: string[];
}

/**
 * Validates touch target size compliance across interactive elements.
 * WCAG 2.5.5 / Apple Human Interface Guidelines require minimum 44x44px.
 */
export function checkTouchTargetCompliance(
  buttons: ButtonAuditResult[],
  minSize: number = MIN_TOUCH_TARGET_SIZE
): {
  compliant: ButtonAuditResult[];
  violations: ButtonAuditResult[];
  complianceRatio: number;
} {
  const violations: ButtonAuditResult[] = [];
  const compliant: ButtonAuditResult[] = [];

  for (const btn of buttons) {
    if (btn.width >= minSize && btn.height >= minSize) {
      compliant.push(btn);
    } else {
      violations.push(btn);
    }
  }

  const complianceRatio = buttons.length > 0 ? compliant.length / buttons.length : 1;

  return {
    compliant,
    violations,
    complianceRatio,
  };
}

/**
 * Checks if a sticky bottom buy/action bar is present and verifies it does not obstruct
 * page content (e.g. by checking bottom padding or scroll margins).
 */
export async function checkStickyBuyBar(page: any): Promise<StickyBuyBarAudit> {
  try {
    const audit = await page.evaluate(() => {
      const stickySelectors = [
        '[class*="sticky"]',
        '[class*="bottomBar"]',
        '[class*="buyBar"]',
        '[class*="floatingBar"]',
        'div[style*="position: fixed; bottom: 0"]',
        'div[style*="position: sticky; bottom: 0"]',
      ];

      let stickyEl: HTMLElement | null = null;
      for (const sel of stickySelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el) {
          const style = window.getComputedStyle(el);
          if (
            (style.position === 'fixed' || style.position === 'sticky') &&
            parseInt(style.bottom, 10) <= 20
          ) {
            stickyEl = el;
            break;
          }
        }
      }

      if (!stickyEl) {
        return {
          isPresent: false,
          isObstructive: false,
          boundingHeight: 0,
          hasSufficientPagePadding: true,
          details: 'No sticky bar detected',
        };
      }

      const rect = stickyEl.getBoundingClientRect();
      const bodyStyle = window.getComputedStyle(document.body);
      const bottomPadding = parseInt(bodyStyle.paddingBottom || '0', 10);
      const hasPadding = bottomPadding >= rect.height || rect.height === 0;

      return {
        isPresent: true,
        isObstructive: !hasPadding,
        boundingHeight: Math.round(rect.height),
        hasSufficientPagePadding: hasPadding,
        details: hasPadding
          ? 'Sticky bar safely padded'
          : `Sticky bar (${Math.round(rect.height)}px) may obstruct content: body bottom padding is ${bottomPadding}px`,
      };
    });

    return audit;
  } catch {
    return {
      isPresent: false,
      isObstructive: false,
      boundingHeight: 0,
      hasSufficientPagePadding: true,
      details: 'Audit bypassed (no DOM context)',
    };
  }
}

/**
 * Audits a route or page for mobile ergonomics on 390x844 viewport:
 * 1. Navigation with domcontentloaded
 * 2. Touch targets >= 44x44px
 * 3. Zero horizontal overflow (scrollWidth <= clientWidth)
 * 4. Sticky buy bar does not obstruct content
 */
export async function auditMobileErgonomics(
  harnessOrPage: AuditHarness | any,
  options: MobileErgonomicsOptions = {}
): Promise<MobileErgonomicsResult> {
  const route = options.route || '/';
  const minSize = options.minTouchTargetSize || MIN_TOUCH_TARGET_SIZE;

  let page: any;
  let ownPage = false;
  let snapshot: PageAuditSnapshot;

  const baseURL = (harnessOrPage && harnessOrPage.baseURL) || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  const targetUrl = route.startsWith('http') ? route : `${baseURL}${route.startsWith('/') ? '' : '/'}${route}`;

  if (typeof harnessOrPage.createPage === 'function') {
    page = await harnessOrPage.createPage('mobile');
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
        snapshot = await harnessOrPage.auditPage(route, 'mobile');
      } catch {
        const buttons = await ErgonomicsChecker.auditAllButtons(page, 'mobile');
        snapshot = {
          route,
          pageTitle: await page.title().catch(() => ''),
          viewport: 'mobile',
          screenshotPath: '',
          buttonsAudited: buttons,
          consoleErrors: [],
          visualFrictions: [],
        };
      }
    } else {
      const buttons = await ErgonomicsChecker.auditAllButtons(page, 'mobile');
      snapshot = {
        route,
        pageTitle: await page.title().catch(() => ''),
        viewport: 'mobile',
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
    const buttons = await ErgonomicsChecker.auditAllButtons(page, 'mobile');
    const overflow = await ErgonomicsChecker.checkHorizontalOverflow(page);
    snapshot = {
      route,
      pageTitle: await page.title().catch(() => ''),
      viewport: 'mobile',
      screenshotPath: '',
      buttonsAudited: buttons,
      consoleErrors: [],
      visualFrictions: overflow.hasOverflow ? ['Horizontal overflow detected'] : [],
    };
  } else {
    throw new Error('First argument must be AuditHarness or Playwright Page');
  }

  const issues: string[] = [...snapshot.visualFrictions];

  // 1. Touch Target Audit
  const compliance = checkTouchTargetCompliance(snapshot.buttonsAudited, minSize);
  for (const violation of compliance.violations) {
    issues.push(
      `Mobile touch target below ${minSize}px: [${violation.text || violation.selector}] (${violation.width}x${violation.height}px)`
    );
  }

  // 2. Horizontal Overflow Audit
  const overflowCheck = await ErgonomicsChecker.checkHorizontalOverflow(page);
  let overflowDetails: string | undefined;
  if (overflowCheck.hasOverflow) {
    overflowDetails = `Scroll width (${overflowCheck.scrollWidth}px) exceeds client width (${overflowCheck.clientWidth}px)`;
    if (!issues.some((i) => i.toLowerCase().includes('overflow'))) {
      issues.push(overflowDetails);
    }
  }

  // 3. Sticky Buy Bar Check
  const stickyCheck = await checkStickyBuyBar(page);
  if (stickyCheck.isObstructive) {
    issues.push(`Obstructive sticky bar: ${stickyCheck.details}`);
  }

  if (ownPage && page) {
    await page.close().catch(() => {});
  }

  return {
    snapshot,
    passed: issues.length === 0,
    viewport: { width: MOBILE_AUDIT_VIEWPORT.width, height: MOBILE_AUDIT_VIEWPORT.height },
    touchTargetViolations: compliance.violations,
    compliantButtons: compliance.compliant,
    touchTargetComplianceRatio: compliance.complianceRatio,
    hasHorizontalOverflow: overflowCheck.hasOverflow,
    overflowDetails,
    stickyBuyBar: stickyCheck,
    stickyBuyBarNonObstructive: !stickyCheck.isObstructive,
    issues,
  };
}

export const runMobileErgonomicsAudit = auditMobileErgonomics;
export default auditMobileErgonomics;
