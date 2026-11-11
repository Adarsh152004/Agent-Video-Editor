import { darkColors, tokens } from './tokens';

const UNITLESS = new Set(['weight', 'lineHeight', 'z', 'opacity']);
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Flattens the tokens into CSS custom properties, e.g. `--color-surface-raised`. */
export function tokenVars(reduceMotion = false, mode: 'light' | 'dark' = 'light'): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [group, values] of Object.entries(tokens)) {
    for (const [key, value] of Object.entries(group === 'color' && mode === 'dark' ? darkColors : values)) {
      const unit = UNITLESS.has(group) ? '' : group === 'duration' ? 'ms' : 'px';
      const v = group === 'duration' && reduceMotion ? 0 : value;
      vars[`--${kebab(group)}-${kebab(key)}`] = typeof v === 'number' ? `${v}${unit}` : v;
    }
  }
  return vars;
}

interface StyleTarget {
  style: { setProperty(name: string, value: string): void };
}

export function applyTokens(root: StyleTarget = document.documentElement, reduceMotion?: boolean, mode: 'light' | 'dark' = 'light'): void {
  const reduce = reduceMotion ?? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  for (const [name, value] of Object.entries(tokenVars(reduce, mode))) root.style.setProperty(name, value);
}

/** Registers the self-hosted UI font and draws the favicon in the accent colour. */
export function installBrandAssets(): void {
  const { family, url, weight } = tokens.fontFace;
  const face = new FontFace(family, `url(${url}) format('woff2')`, { weight, display: 'swap' });
  document.fonts.add(face);
  face.load().catch(() => {}); // falls back to the system stack in tokens.font.ui

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${tokens.color.accent}"/><path d="M12 9.5v13l11-6.5z" fill="${tokens.color.onAccent}"/></svg>`;
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.append(link);
}
