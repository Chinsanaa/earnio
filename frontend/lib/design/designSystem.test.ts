/**
 * Design-system guard test.
 *
 * This suite exists so a dark-mode regression fails CI instead of shipping.
 * See CLAUDE.md "Design system rules" and frontend/design-system/MASTER.md.
 *
 * It enforces four things:
 *  1. Every themed foreground/background token pair meets its WCAG contrast
 *     threshold, in both the light (:root) and dark (.dark) theme.
 *  2. app/globals.css has no hardcoded hex/rgb/rgba color literal outside the
 *     `:root { ... }` / `.dark { ... }` token blocks — every component rule
 *     must resolve its color through a token.
 *  3. No `.tsx` file under app/ or components/ uses a one-off light-mode-only
 *     Tailwind color utility (e.g. `bg-white`, `bg-red-50`, `text-gray-900`)
 *     without a `dark:` variant in the same class string.
 *  4. No gradients anywhere ("Solid Pop" rule): no CSS `*-gradient(` in
 *     globals.css or design-system/, no Tailwind gradient utilities or
 *     gradient text, and no SVG <linearGradient>/<radialGradient> in source.
 *
 * Adding a token: add a row to CONTRAST_CHECKS below. Adding a legitimately
 * theme-invariant literal (e.g. a fixed-dark spotlight card): add its token
 * block name to ALLOWED_LITERAL_BLOCKS, or better, give it its own token in
 * :root and reference it — see --hero-* and --overlay-scrim* in globals.css
 * for the established pattern.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { contrastRatio, WCAG_AA_NORMAL_TEXT, WCAG_AA_UI_BOUNDARY } from './contrast';

const GLOBALS_CSS_PATH = path.resolve(__dirname, '../../app/globals.css');
const APP_DIR = path.resolve(__dirname, '../../app');
const COMPONENTS_DIR = path.resolve(__dirname, '../../components');

function readGlobalsCss(): string {
  return fs.readFileSync(GLOBALS_CSS_PATH, 'utf8');
}

/** Extracts `--token: value;` pairs from a single top-level `:root { ... }` or `.dark { ... }` block. */
function parseTokenBlock(css: string, selector: '\\:root' | '\\.dark'): Record<string, string> {
  const re = new RegExp(`${selector}\\s*\\{`);
  const match = css.match(re);
  if (!match || match.index === undefined) throw new Error(`Could not find ${selector} block`);

  let depth = 1;
  let i = match.index + match[0].length;
  const start = i;
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    i++;
  }
  const body = css.slice(start, i - 1);

  const tokens: Record<string, string> = {};
  const tokenRe = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(body))) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

/** Returns every top-level `:root { ... }` / `.dark { ... }` block's raw span, so we can exclude it. */
function findTokenBlockSpans(css: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  const re = /(^|\n)\s*(:root|\.dark)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const braceStart = m.index + m[0].length;
    let depth = 1;
    let i = braceStart;
    while (depth > 0 && i < css.length) {
      if (css[i] === '{') depth++;
      if (css[i] === '}') depth--;
      i++;
    }
    spans.push([m.index, i]);
  }
  return spans;
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;
      out.push(full);
    }
  }
  return out;
}

/** Splits file text into quoted/template-literal string segments — the places class names live. */
function extractStringSegments(text: string): string[] {
  const segments: string[] = [];
  const re = /`([^`]*)`|"([^"]*)"|'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    segments.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return segments;
}

describe('design system: token contrast (WCAG AA)', () => {
  const css = readGlobalsCss();
  const light = parseTokenBlock(css, '\\:root');
  const dark = parseTokenBlock(css, '\\.dark');

  // [token pair name, foreground token, background token, threshold]
  // Background falls back to the theme's `card` when a token is elevation-agnostic.
  const CONTRAST_CHECKS: Array<[string, string, string, number]> = [
    ['foreground on background', 'foreground', 'background', WCAG_AA_NORMAL_TEXT],
    ['foreground on card', 'foreground', 'card', WCAG_AA_NORMAL_TEXT],
    ['muted-foreground on card', 'muted-foreground', 'card', WCAG_AA_NORMAL_TEXT],
    ['primary-foreground on primary', 'primary-foreground', 'primary', WCAG_AA_NORMAL_TEXT],
    ['accent-text on card', 'accent-text', 'card', WCAG_AA_NORMAL_TEXT],
    ['success-text on card', 'success-text', 'card', WCAG_AA_NORMAL_TEXT],
    ['destructive-text on card', 'destructive-text', 'card', WCAG_AA_NORMAL_TEXT],
    ['destructive-fill-foreground on destructive-fill', 'destructive-fill-foreground', 'destructive-fill', WCAG_AA_NORMAL_TEXT],
    ['border-strong on card', 'border-strong', 'card', WCAG_AA_UI_BOUNDARY],
    ['foreground on card-muted', 'foreground', 'card-muted', WCAG_AA_NORMAL_TEXT],
    ['muted-foreground on background', 'muted-foreground', 'background', WCAG_AA_NORMAL_TEXT],
    ['landing-muted on background', 'landing-muted', 'background', WCAG_AA_NORMAL_TEXT],
    ['outline on card (sticker border)', 'outline', 'card', WCAG_AA_UI_BOUNDARY],
    ['outline on background', 'outline', 'background', WCAG_AA_UI_BOUNDARY],
    ['landing-btn-solid-fg on landing-btn-solid-bg', 'landing-btn-solid-fg', 'landing-btn-solid-bg', WCAG_AA_NORMAL_TEXT],
  ];

  // Solid Pop fills and the hero block are theme-invariant (defined once in :root),
  // so they are checked once against their paired foreground.
  const THEME_INVARIANT_CHECKS: Array<[string, string, string, number]> = [
    ['pop-foreground on pop-lime', 'pop-foreground', 'pop-lime', WCAG_AA_NORMAL_TEXT],
    ['pop-foreground on pop-sun', 'pop-foreground', 'pop-sun', WCAG_AA_NORMAL_TEXT],
    ['pop-foreground on pop-coral', 'pop-foreground', 'pop-coral', WCAG_AA_NORMAL_TEXT],
    ['pop-foreground on pop-lilac', 'pop-foreground', 'pop-lilac', WCAG_AA_NORMAL_TEXT],
    ['pop-foreground on pop-mint', 'pop-foreground', 'pop-mint', WCAG_AA_NORMAL_TEXT],
    ['pop-foreground on pop-sky', 'pop-foreground', 'pop-sky', WCAG_AA_NORMAL_TEXT],
    ['hero-fg on hero-bg', 'hero-fg', 'hero-bg', WCAG_AA_NORMAL_TEXT],
    ['hero-fg-muted on hero-bg', 'hero-fg-muted', 'hero-bg', WCAG_AA_NORMAL_TEXT],
    ['hero-trend-up-fg on hero-trend-up-bg', 'hero-trend-up-fg', 'hero-trend-up-bg', WCAG_AA_NORMAL_TEXT],
    ['hero-trend-down-fg on hero-trend-down-bg', 'hero-trend-down-fg', 'hero-trend-down-bg', WCAG_AA_NORMAL_TEXT],
  ];

  for (const [label, fgKey, bgKey, threshold] of THEME_INVARIANT_CHECKS) {
    it(`both themes: ${label} >= ${threshold}:1`, () => {
      const ratio = contrastRatio(light[fgKey], light[bgKey]);
      expect(ratio, `${fgKey} (${light[fgKey]}) vs ${bgKey} (${light[bgKey]}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(threshold);
    });
  }

  for (const [label, fgKey, bgKey, threshold] of CONTRAST_CHECKS) {
    it(`light: ${label} >= ${threshold}:1`, () => {
      const ratio = contrastRatio(light[fgKey], light[bgKey]);
      expect(ratio, `${fgKey} (${light[fgKey]}) vs ${bgKey} (${light[bgKey]}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(threshold);
    });

    it(`dark: ${label} >= ${threshold}:1`, () => {
      const ratio = contrastRatio(dark[fgKey], dark[bgKey]);
      expect(ratio, `${fgKey} (${dark[fgKey]}) vs ${bgKey} (${dark[bgKey]}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(threshold);
    });
  }

  it('dark elevation: surface-raised is distinguishable from background', () => {
    // Elevation doesn't need full text contrast, but it must be perceptible —
    // this is what "flat, no elevation in dark mode" (the --shadow-sm/-md bug) looked like.
    const ratio = contrastRatio(dark['surface-raised'], dark['background']);
    expect(ratio).toBeGreaterThan(1.15);
  });
});

describe('design system: no hardcoded colors outside token blocks', () => {
  it('app/globals.css has zero hex/rgb/rgba literals outside :root and .dark', () => {
    const css = readGlobalsCss();
    const tokenSpans = findTokenBlockSpans(css);
    const isInsideTokenBlock = (index: number) => tokenSpans.some(([start, end]) => index >= start && index < end);

    const colorLiteralRe = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/g;
    const offenders: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = colorLiteralRe.exec(css))) {
      if (isInsideTokenBlock(m.index)) continue;
      const lineNumber = css.slice(0, m.index).split('\n').length;
      const lineText = css.split('\n')[lineNumber - 1].trim();
      offenders.push(`line ${lineNumber}: ${lineText}`);
    }

    expect(
      offenders,
      offenders.length
        ? `Found hardcoded color literal(s) outside :root/.dark — replace with a token:\n${offenders.join('\n')}`
        : undefined
    ).toEqual([]);
  });
});

describe('design system: no unpaired light-mode-only Tailwind color utilities', () => {
  // Raw Tailwind color utilities that read as "light mode" defaults and need
  // an explicit dark: variant in the same class string (or must route through
  // a semantic token like text-foreground / bg-card instead).
  const OFFENDING_PATTERNS = [
    /\bbg-white\b/,
    /\bbg-black\/(?!4|5)\d+\b/, // bg-black/40, /50 etc. are fine (theme-neutral scrims); anything else, flag
    /\bbg-(red|amber|emerald|sky|green|blue|slate|gray|neutral|zinc)-(50|100|200)\b/,
    /\btext-(gray|slate|neutral|zinc)-(800|900)\b/,
    /\bborder-(gray|slate|neutral|zinc)-(100|200)\b/,
  ];

  const files = [...listSourceFiles(APP_DIR), ...listSourceFiles(COMPONENTS_DIR)];

  it('scans app/ and components/ for offending patterns', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      const segments = extractStringSegments(text);
      for (const segment of segments) {
        if (!segment.includes('-') || segment.length > 400) continue; // cheap pre-filter
        for (const pattern of OFFENDING_PATTERNS) {
          if (pattern.test(segment) && !/dark:/.test(segment)) {
            offenders.push(`${path.relative(path.resolve(__dirname, '../..'), file)}: "${segment.slice(0, 120)}"`);
            break;
          }
        }
      }
    }

    expect(
      offenders,
      offenders.length
        ? `Found light-mode-only color utility with no dark: pair — add one, or use a semantic token (bg-card, text-foreground, etc.):\n${offenders.join('\n')}`
        : undefined
    ).toEqual([]);
  });
});

describe('design system: solid colors only, no gradients', () => {
  const FRONTEND_DIR = path.resolve(__dirname, '../..');
  const DESIGN_SYSTEM_DIR = path.resolve(FRONTEND_DIR, 'design-system');
  const CSS_GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/;
  const TAILWIND_GRADIENT = [
    /\bbg-(?:gradient|linear|radial|conic)-/,
    /(?:^|\s)(?:[\w-]+:)*(?:from|via|to)-(?:[a-z]+-\d{2,3}|primary|accent|card|background|foreground|transparent|white|black|\[)/,
    /\bbg-clip-text\b/,
    /\btext-gradient\b/,
  ];
  const SVG_GRADIENT = /<(?:linearGradient|radialGradient)\b/;

  function listFiles(dir: string, exts: string[]): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...listFiles(full, exts));
      else if (exts.some((ext) => entry.name.endsWith(ext)) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  const rel = (file: string) => path.relative(FRONTEND_DIR, file);

  it('no CSS gradient functions in globals.css or design-system/', () => {
    const files = [GLOBALS_CSS_PATH, ...listFiles(DESIGN_SYSTEM_DIR, ['.css', '.jsx', '.tsx', '.js', '.html'])];
    const offenders: string[] = [];
    for (const file of files) {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (CSS_GRADIENT.test(line)) offenders.push(`${rel(file)}:${i + 1}: ${line.trim().slice(0, 120)}`);
      });
    }
    expect(offenders, `Gradients are banned, use a solid token instead:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('no gradient utilities, gradient text, or SVG gradients in app/ and components/', () => {
    const files = [...listSourceFiles(APP_DIR), ...listSourceFiles(COMPONENTS_DIR)];
    const offenders: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (SVG_GRADIENT.test(text)) offenders.push(`${rel(file)}: SVG gradient element`);
      if (CSS_GRADIENT.test(text)) offenders.push(`${rel(file)}: inline CSS gradient`);
      for (const segment of extractStringSegments(text)) {
        if (segment.length > 400) continue;
        if (TAILWIND_GRADIENT.some((re) => re.test(segment))) {
          offenders.push(`${rel(file)}: "${segment.slice(0, 120)}"`);
        }
      }
    }
    expect(offenders, `Gradients are banned, use a solid token instead:\n${offenders.join('\n')}`).toEqual([]);
  });
});
