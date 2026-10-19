import { ButtonAuditResult } from './audit-types';

export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Checks if dimensions meet the WCAG 2.5.5 / Apple HIG touch target size (>= 44x44px).
 */
export function meetsTouchTargetSize(width: number, height: number): boolean {
  return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
}

export function checkTouchTarget(box?: { width: number; height: number } | null): boolean {
  if (!box) return false;
  return meetsTouchTargetSize(box.width, box.height);
}

export interface HorizontalOverflowResult {
  hasOverflow: boolean;
  scrollWidth: number;
  clientWidth: number;
  overflowingElements?: string[];
}

export interface OverlayCheckResult {
  isClickable: boolean;
  isOverlayed: boolean;
  topElement?: string;
  error?: string;
}

export class ErgonomicsChecker {
  static meetsTouchTargetSize(width: number, height: number): boolean {
    return meetsTouchTargetSize(width, height);
  }

  static checkTouchTarget(box?: { width: number; height: number } | null): boolean {
    return checkTouchTarget(box);
  }

  /**
   * Detects if the current page has horizontal layout overflow (scrollWidth > clientWidth).
   */
  static async checkHorizontalOverflow(page: any): Promise<HorizontalOverflowResult> {
    try {
      const result = await page.evaluate(() => {
        const docEl = document.documentElement;
        const scrollWidth = Math.max(docEl.scrollWidth, document.body ? document.body.scrollWidth : 0);
        const clientWidth = docEl.clientWidth;
        const hasOverflow = scrollWidth > clientWidth + 1; // 1px threshold for subpixel rendering

        const overflowing: string[] = [];
        if (hasOverflow) {
          const allElements = document.querySelectorAll('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            const rect = el.getBoundingClientRect();
            if (rect.right > clientWidth + 2) {
              const tag = el.tagName.toLowerCase();
              const id = el.id ? `#${el.id}` : '';
              const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').slice(0, 2).join('.')}` : '';
              overflowing.push(`${tag}${id}${cls}`);
              if (overflowing.length >= 10) break;
            }
          }
        }

        return {
          hasOverflow,
          scrollWidth,
          clientWidth,
          overflowingElements: overflowing,
        };
      });

      return result;
    } catch (err: any) {
      return {
        hasOverflow: false,
        scrollWidth: 0,
        clientWidth: 0,
        overflowingElements: [],
      };
    }
  }

  /**
   * Checks if an element is covered by another element (z-index overlay detection)
   * or not clickable.
   */
  static async checkZIndexOverlay(page: any, selector: string): Promise<OverlayCheckResult> {
    try {
      const check = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) {
          return { isClickable: false, isOverlayed: false, error: 'Element not found' };
        }

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return { isClickable: false, isOverlayed: false, error: 'Element has 0 dimension' };
        }

        // Check computed styles
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return { isClickable: false, isOverlayed: false, error: 'Element is hidden' };
        }
        if (style.pointerEvents === 'none') {
          return { isClickable: false, isOverlayed: false, error: 'pointer-events: none' };
        }

        // Hit-test center point
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const topEl = document.elementFromPoint(centerX, centerY);

        if (!topEl) {
          return { isClickable: false, isOverlayed: false, error: 'Point outside viewport' };
        }

        const isSelfOrDescendant = el === topEl || el.contains(topEl);
        const isAncestor = topEl.contains(el);

        if (!isSelfOrDescendant && !isAncestor) {
          const topDesc = `${topEl.tagName.toLowerCase()}${topEl.id ? '#' + topEl.id : ''}${topEl.className && typeof topEl.className === 'string' ? '.' + topEl.className.split(' ')[0] : ''}`;
          return {
            isClickable: false,
            isOverlayed: true,
            topElement: topDesc,
            error: `Obscured by overlay element: ${topDesc}`,
          };
        }

        return {
          isClickable: true,
          isOverlayed: false,
        };
      }, selector);

      return check;
    } catch (err: any) {
      return {
        isClickable: false,
        isOverlayed: false,
        error: err.message,
      };
    }
  }

  /**
   * Audits a single button or clickable element for ergonomics, touch target size, and visibility.
   */
  static async auditButton(
    page: any,
    selector: string,
    viewport: 'desktop' | 'mobile' = 'desktop'
  ): Promise<ButtonAuditResult> {
    try {
      const data = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const text = (el.textContent || (el as HTMLInputElement).value || el.getAttribute('aria-label') || '').trim();
        return {
          text,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          isVisible: rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none',
        };
      }, selector);

      if (!data) {
        return {
          selector,
          text: '',
          width: 0,
          height: 0,
          isClickable: false,
          meetsTouchTargetSize: false,
          viewport,
          error: 'Element not found',
        };
      }

      const overlayCheck = await this.checkZIndexOverlay(page, selector);
      const meetsSize = meetsTouchTargetSize(data.width, data.height);

      return {
        selector,
        text: data.text,
        width: data.width,
        height: data.height,
        isClickable: overlayCheck.isClickable,
        meetsTouchTargetSize: meetsSize,
        viewport,
        ...(overlayCheck.error ? { error: overlayCheck.error } : {}),
      };
    } catch (err: any) {
      return {
        selector,
        text: '',
        width: 0,
        height: 0,
        isClickable: false,
        meetsTouchTargetSize: false,
        viewport,
        error: err.message,
      };
    }
  }

  /**
   * Audits all interactive buttons on the page.
   */
  static async auditAllButtons(
    page: any,
    viewport: 'desktop' | 'mobile' = 'desktop'
  ): Promise<ButtonAuditResult[]> {
    try {
      const selectors = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]'));
        return buttons.map((_, i) => {
          return `button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]:nth-of-type(${i + 1})`;
        });
      });

      const results: ButtonAuditResult[] = [];
      const buttonHandles = await page.$$('button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]');

      for (let i = 0; i < buttonHandles.length; i++) {
        const handle = buttonHandles[i];
        const info = await handle.evaluate((el: Element, idx: number) => {
          const rect = el.getBoundingClientRect();
          const text = (el.textContent || (el as HTMLInputElement).value || el.getAttribute('aria-label') || '').trim();
          const id = el.id ? `#${el.id}` : '';
          const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').filter(Boolean).slice(0, 2).join('.')}` : '';
          const selector = id || (cls ? `${el.tagName.toLowerCase()}${cls}` : `${el.tagName.toLowerCase()}:nth-of-type(${idx + 1})`);
          
          return {
            selector,
            text,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        }, i);

        const meetsSize = meetsTouchTargetSize(info.width, info.height);
        let isClickable = true;
        let error: string | undefined;

        try {
          // Check if element is clickable
          const box = await handle.boundingBox();
          if (!box || box.width === 0 || box.height === 0) {
            isClickable = false;
            error = 'Zero dimension or hidden';
          }
        } catch (e: any) {
          isClickable = false;
          error = e.message;
        }

        results.push({
          selector: info.selector,
          text: info.text,
          width: info.width,
          height: info.height,
          isClickable,
          meetsTouchTargetSize: meetsSize,
          viewport,
          ...(error ? { error } : {}),
        });
      }

      return results;
    } catch {
      return [];
    }
  }
}

export const checkHorizontalOverflow = ErgonomicsChecker.checkHorizontalOverflow;
export const checkZIndexOverlay = ErgonomicsChecker.checkZIndexOverlay;
export const auditButton = ErgonomicsChecker.auditButton;
export const auditAllButtons = ErgonomicsChecker.auditAllButtons;
