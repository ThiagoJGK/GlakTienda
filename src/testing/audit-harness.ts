import path from 'path';
import fs from 'fs';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ButtonAuditResult, PageAuditSnapshot, ViewportMode } from './audit-types';
import { ErgonomicsChecker } from './ergonomics-checker';

export const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
export const MOBILE_VIEWPORT = { width: 390, height: 844, isMobile: true, hasTouch: true };

export const VIEWPORTS = {
  desktop: DESKTOP_VIEWPORT,
  mobile: MOBILE_VIEWPORT,
} as const;

export interface AuditHarnessOptions {
  baseURL?: string;
  screenshotDir?: string;
  headless?: boolean;
}

export class AuditHarness {
  public baseURL: string;
  public screenshotDir: string;
  public headless: boolean;
  public browser: Browser | null = null;
  public context: BrowserContext | null = null;

  constructor(options: AuditHarnessOptions = {}) {
    this.baseURL = options.baseURL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    this.screenshotDir = options.screenshotDir || path.resolve(process.cwd(), 'reports/uxui-audit/screenshots');
    this.headless = options.headless !== undefined ? options.headless : true;
  }

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.headless,
      });
    }
  }

  async createPage(viewportMode: ViewportMode = 'desktop'): Promise<Page> {
    await this.init();
    if (!this.browser) throw new Error('Browser failed to initialize');

    const vp = viewportMode === 'mobile' ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT;
    const isMobile = 'isMobile' in vp ? Boolean((vp as any).isMobile) : false;
    const hasTouch = 'hasTouch' in vp ? Boolean((vp as any).hasTouch) : false;
    const context = await this.browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile,
      hasTouch,
    });
    this.context = context;
    return context.newPage();
  }

  sanitizeRoute(route: string): string {
    return route.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/^_+|_+$/g, '') || 'home';
  }

  async captureScreenshot(
    page: Page,
    route: string,
    viewport: ViewportMode = 'desktop'
  ): Promise<string> {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    const cleanRoute = this.sanitizeRoute(route);
    const fileName = `${cleanRoute}-${viewport}.png`;
    const fullPath = path.join(this.screenshotDir, fileName);

    await page.screenshot({
      path: fullPath,
      fullPage: true,
    });

    return fullPath;
  }

  async auditPage(
    route: string,
    viewport: ViewportMode = 'desktop'
  ): Promise<PageAuditSnapshot> {
    const page = await this.createPage(viewport);
    const consoleErrors: string[] = [];
    const visualFrictions: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    const targetUrl = route.startsWith('http') ? route : `${this.baseURL}${route.startsWith('/') ? '' : '/'}${route}`;

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Brief wait for animations / hydration
      await page.waitForTimeout(500);
    } catch (err: any) {
      visualFrictions.push(`Navigation error: ${err.message}`);
    }

    const pageTitle = await page.title().catch(() => '');

    // Check layout overflow
    const overflow = await ErgonomicsChecker.checkHorizontalOverflow(page);
    if (overflow.hasOverflow) {
      visualFrictions.push(
        `Horizontal overflow detected: scrollWidth (${overflow.scrollWidth}px) exceeds clientWidth (${overflow.clientWidth}px). Elements: ${overflow.overflowingElements?.join(', ') || 'unknown'}`
      );
    }

    // Capture screenshot
    let screenshotPath = '';
    try {
      screenshotPath = await this.captureScreenshot(page, route, viewport);
    } catch (err: any) {
      visualFrictions.push(`Screenshot failed: ${err.message}`);
    }

    // Audit interactive elements
    const buttonsAudited: ButtonAuditResult[] = await ErgonomicsChecker.auditAllButtons(page, viewport);

    // Identify touch target size issues
    for (const btn of buttonsAudited) {
      if (!btn.meetsTouchTargetSize) {
        visualFrictions.push(
          `Touch target < 44x44px: [${btn.text || btn.selector}] (${btn.width}x${btn.height}px)`
        );
      }
      if (!btn.isClickable) {
        visualFrictions.push(`Unclickable button: [${btn.text || btn.selector}] - ${btn.error || 'Blocked'}`);
      }
    }

    await page.close().catch(() => {});

    return {
      route,
      pageTitle,
      viewport,
      screenshotPath,
      buttonsAudited,
      consoleErrors,
      visualFrictions,
    };
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}

export function createAuditHarness(options?: AuditHarnessOptions): AuditHarness {
  return new AuditHarness(options);
}
