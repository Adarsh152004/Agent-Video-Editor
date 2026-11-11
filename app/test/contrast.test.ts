import { describe, expect, it } from 'vitest';
import { tokens } from '../src/client/design/tokens';

const { color: c } = tokens;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const neutralSurfaces = [c.bg, c.surface, c.surfaceRaised, c.surfaceHover];
const tints = [c.tintPink, c.tintCool, c.tintLime, c.tintPeach, c.tintLavender];

describe('token contrast (WCAG AA, 4.5:1 for text)', () => {
  it.each(neutralSurfaces.flatMap((bg) => [c.text, c.textMuted, c.textFaint, c.danger].map((fg) => [fg, bg])))(
    '%s on %s',
    (fg, bg) => expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5),
  );

  it.each(tints.flatMap((bg) => [c.text, c.textMuted].map((fg) => [fg, bg])))('%s on tint %s', (fg, bg) =>
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5),
  );

  it.each([c.accent, c.accentHover])('onAccent on %s', (bg) =>
    expect(contrast(c.onAccent, bg)).toBeGreaterThanOrEqual(4.5),
  );

  it('focus ring and status rules reach 3:1 on the page background', () => {
    for (const fg of [c.accent, c.success, c.danger, c.warning]) expect(contrast(fg, c.bg)).toBeGreaterThanOrEqual(3);
  });
});

import { darkColors } from '../src/client/design/tokens';

describe('dark mode contrast', () => {
  const surfaces = [darkColors.bg, darkColors.surface, darkColors.surfaceRaised, darkColors.surfaceHover, darkColors.tintPink, darkColors.tintCool, darkColors.tintLime, darkColors.tintPeach, darkColors.tintLavender];
  it.each(surfaces.flatMap((bg) => [darkColors.text, darkColors.textMuted, darkColors.textFaint].map((fg) => [fg, bg])))('%s on %s reaches AA', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it.each([darkColors.accent, darkColors.accentHover])('button text on %s reaches AA', (bg) => {
    expect(contrast(darkColors.onAccent, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
