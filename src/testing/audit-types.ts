export interface ButtonAuditResult {
  selector: string;
  text: string;
  width: number;
  height: number;
  isClickable: boolean;
  meetsTouchTargetSize: boolean; // >= 44x44px
  viewport: 'desktop' | 'mobile';
  error?: string;
}

export interface PageAuditSnapshot {
  route: string;
  pageTitle: string;
  viewport: 'desktop' | 'mobile';
  screenshotPath: string;
  buttonsAudited: ButtonAuditResult[];
  consoleErrors: string[];
  visualFrictions: string[];
}

export interface ViewportConfig {
  width: number;
  height: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export type ViewportMode = 'desktop' | 'mobile';

export interface ErgonomicsIssue {
  type: 'touch-target' | 'z-index-overlay' | 'horizontal-overflow' | 'text-truncation' | string;
  selector?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErgonomicsReport {
  hasHorizontalOverflow: boolean;
  touchTargetViolations: ButtonAuditResult[];
  issues: ErgonomicsIssue[];
}
