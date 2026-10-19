import { AuditHarness } from '../audit-harness';
import { PageAuditSnapshot, ViewportMode, ButtonAuditResult } from '../audit-types';
import { ErgonomicsChecker } from '../ergonomics-checker';

export const EMOJI_DETECTION_REGEX = /(?:\p{Extended_Pictographic}|(?:\uD83C[\uDDE6-\uDDFF]){2}|[\u0023-\u0039]\uFE0F?\u20E3|[\u{1F300}-\u{1FAD6}]|[\u{2600}-\u{27BF}]|[\u{1F900}-\u{1F9FF}])/u;

/**
 * The 5 canonical AI-generated photography poses for fashion ecommerce catalog.
 * Blueprint Section 1.3:
 * 1. Frontal editorial (cuerpo entero, caída de la prenda)
 * 2. Dorsal / Espalda (calce posterior y corte)
 * 3. Lateral / Perfil (en movimiento natural)
 * 4. Macro / Close-up (textura del tejido, costuras, botones)
 * 5. Flat-lay / Fondo neutro (prenda suspendida o doblada)
 */
export const CANONICAL_AI_POSES = [
  'Frontal editorial',
  'Dorsal/Espalda',
  'Lateral/Perfil',
  'Macro/Close-up',
  'Flat-lay/Fondo neutro',
] as const;

export type CanonicalAIPose = typeof CANONICAL_AI_POSES[number];

/**
 * Standard normalized keys for the 5 canonical poses.
 */
export const CANONICAL_POSE_KEYS = [
  'frontal_editorial',
  'dorsal_espalda',
  'lateral_perfil',
  'macro_closeup',
  'flat_lay',
] as const;

/**
 * Forbidden phrases referencing human model measurements.
 * AI-standardized PDPs must never include fictitious model proportions.
 */
export const FORBIDDEN_MODEL_PHRASES = [
  'mide 1.78m y viste M',
  'mide 1,78m y viste M',
  'mide 1.78m y viste talle M',
  'mide 1,78m y viste talle M',
  'mide 1.78m',
  'mide 1,78m',
  'mide 1.78 m',
  'mide 1,78 m',
  'mide 1.78',
  'mide 1,78',
  'mide 1.75m',
  'mide 1,75m',
  'mide 1.70m',
  'mide 1,70m',
  'mide 178 cm',
  'mide 178cm',
  'mide 175 cm',
  'mide 175cm',
  'mide 170 cm',
  'mide 170cm',
  'viste M',
  'viste talle M',
  'viste talle S',
  'viste S',
  'la modelo mide',
  'el modelo mide',
  'altura de la modelo',
  'medidas de la modelo',
] as const;

export interface PDPAuditOptions {
  viewport?: ViewportMode;
  route?: string;
  slug?: string;
  expectedPoses?: readonly string[];
  supportedPoses?: string[];
  detectedPoses?: string[];
}

export interface PDPAuditResult {
  snapshot: PageAuditSnapshot;
  passed: boolean;
  supportedPoses: string[];
  canonicalPosesValidated: boolean;
  hasFictitiousModelMeasurements: boolean;
  fictitiousModelViolations: string[];
  hasResidualEmojis: boolean;
  residualEmojis: string[];
  buttonsAudited: ButtonAuditResult[];
  issues: string[];
}

/**
 * Scans a text string or DOM for any residual emoji characters.
 * Guards against null or undefined input.
 */
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

/**
 * Validates that an array of poses contains all required canonical AI poses.
 */
export function validateCanonicalPoses(
  detectedPoses: string[],
  requiredPoses: readonly string[] = CANONICAL_AI_POSES
): { isValid: boolean; missingPoses: string[] } {
  if (!detectedPoses || !Array.isArray(detectedPoses)) {
    return {
      isValid: false,
      missingPoses: [...requiredPoses],
    };
  }

  const normalizedDetected = detectedPoses.map((p) =>
    p.toLowerCase().replace(/[\s\-_/]/g, '')
  );

  const missingPoses = requiredPoses.filter((req) => {
    const normReq = req.toLowerCase().replace(/[\s\-_/]/g, '');
    return !normalizedDetected.some(
      (det) => det.includes(normReq) || normReq.includes(det)
    );
  });

  return {
    isValid: missingPoses.length === 0,
    missingPoses: [...missingPoses],
  };
}

/**
 * Inspects content text to ensure zero fictitious human model measurements.
 * Detects phrases, decimal commas/periods, and metric cm measurements.
 */
export function checkFictitiousModelMeasurements(text?: string | null): {
  hasViolations: boolean;
  violations: string[];
} {
  if (!text || typeof text !== 'string') {
    return { hasViolations: false, violations: [] };
  }

  const lowerText = text.toLowerCase();
  const violations: string[] = [];

  for (const phrase of FORBIDDEN_MODEL_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      violations.push(phrase);
    }
  }

  // Regex check for variations: "mide 1.xx m", "mide 1,xx m", "mide 1xx cm"
  const patterns = [
    /(?:modelo|model)\s+(?:mide|altura|viste)[^.,\n]*/gi,
    /mide\s+1[.,]\d{1,2}\s*(?:m|mts|metros)?\b/gi,
    /mide\s+1\d{2}\s*cm\b/gi,
    /altura\s*(?:de\s*la\s*modelo)?\s*:\s*1[.,]\d{1,2}/gi,
    /viste\s*(?:talle|tamaño)?\s*[xX]?[sSmMlLeE]\b/gi,
  ];

  for (const regex of patterns) {
    const matches = text.match(regex);
    if (matches) {
      for (const match of matches) {
        const trimmed = match.trim();
        if (!violations.includes(trimmed)) {
          violations.push(trimmed);
        }
      }
    }
  }

  return {
    hasViolations: violations.length > 0,
    violations,
  };
}

/**
 * Audits a Product Detail Page (PDP) for:
 * 1. Navigation with domcontentloaded
 * 2. Strict validation of 5 canonical AI photo poses (no synthetic fallback)
 * 3. Eradication of fictitious human model measurements
 * 4. Zero residual emojis
 * 5. Interactive button ergonomics
 */
export async function auditPDP(
  harnessOrPage: AuditHarness | any,
  options: PDPAuditOptions = {}
): Promise<PDPAuditResult> {
  const route = options.route || (options.slug ? `/producto/${options.slug}` : '/producto/vestido-lino-verona');
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

  // 1. Check for fictitious model measurements in page text
  let pageText = '';
  try {
    pageText = await page.evaluate(() => document.body ? document.body.innerText : '');
  } catch {
    pageText = '';
  }

  const measurementCheck = checkFictitiousModelMeasurements(pageText);
  if (measurementCheck.hasViolations) {
    issues.push(
      `Fictitious human model measurements detected: ${measurementCheck.violations.join(', ')}`
    );
  }

  // 2. Scan for residual emojis on PDP
  const emojiCheck = detectResidualEmojis(pageText);
  if (emojiCheck.hasEmojis) {
    issues.push(`Residual emojis detected on PDP: ${emojiCheck.emojis.join(' ')}`);
  }

  // 3. Detect poses presented in gallery / image alt / data attributes
  let detectedPoses: string[] = [];
  try {
    detectedPoses = await page.evaluate(() => {
      const poses: string[] = [];
      const images = Array.from(document.querySelectorAll('img, [data-pose], [data-shot-type]'));
      for (const el of images) {
        const alt = el.getAttribute('alt') || '';
        const poseAttr = el.getAttribute('data-pose') || el.getAttribute('data-shot-type') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const combined = `${alt} ${poseAttr} ${ariaLabel}`.toLowerCase();

        if (combined.includes('frontal') || combined.includes('editorial')) poses.push('Frontal editorial');
        if (combined.includes('dorsal') || combined.includes('espalda')) poses.push('Dorsal/Espalda');
        if (combined.includes('lateral') || combined.includes('perfil')) poses.push('Lateral/Perfil');
        if (combined.includes('macro') || combined.includes('close-up') || combined.includes('textura')) poses.push('Macro/Close-up');
        if (combined.includes('flat-lay') || combined.includes('fondo neutro') || combined.includes('flat lay')) poses.push('Flat-lay/Fondo neutro');
      }
      return Array.from(new Set(poses));
    });
  } catch {
    detectedPoses = [];
  }

  // Strict pose validation: NO synthetic fallback to CANONICAL_AI_POSES
  // Poses must be explicitly detected in DOM or supplied through options
  const supportedPoses = options.supportedPoses || options.detectedPoses || detectedPoses;
  const poseValidation = validateCanonicalPoses(supportedPoses, options.expectedPoses || CANONICAL_AI_POSES);

  if (!poseValidation.isValid) {
    issues.push(`Missing canonical AI poses: ${poseValidation.missingPoses.join(', ')}`);
  }

  if (ownPage && page) {
    await page.close().catch(() => {});
  }

  return {
    snapshot,
    passed: issues.length === 0,
    supportedPoses,
    canonicalPosesValidated: poseValidation.isValid,
    hasFictitiousModelMeasurements: measurementCheck.hasViolations,
    fictitiousModelViolations: measurementCheck.violations,
    hasResidualEmojis: emojiCheck.hasEmojis,
    residualEmojis: emojiCheck.emojis,
    buttonsAudited: snapshot.buttonsAudited,
    issues,
  };
}

export const runPDPAudit = auditPDP;
export default auditPDP;
