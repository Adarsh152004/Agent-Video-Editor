// Single source of truth for every visual value. Light, flat pastel direction from
// ../frontend-design.md (its gradients flattened to solid tints, its blur dropped).
const color = {
  bg: '#f3f4f1',
  previewBlack: '#16191d',
  previewLine: '#2b3037',
  previewWhite: '#ffffff',
  studio: '#202923',
  studioMuted: '#b9c5bc',
  surface: '#f7f7f7',
  surfaceRaised: '#ffffff',
  surfaceHover: '#e9e9e9',
  border: '#dedede',
  borderStrong: '#c4c4c4',
  text: '#141414',
  textMuted: '#505050',
  textFaint: '#666666',
  accent: '#5f8b3e',
  accentHover: '#6f9c4c',
  // white on the accent is only ~4.0:1, near-black is ~4.6:1
  onAccent: '#141414',
  success: '#3d7a3e',
  danger: '#b4413c',
  warning: '#a8770a',
  overlay: 'rgba(20,20,20,0.32)',
  // the design file's card tints, as flat colours
  tintPink: '#fbdfec',
  tintCool: '#e2ebef',
  tintLime: '#e9f0c4',
  tintPeach: '#f7efe6',
  tintLavender: '#e2e0f1',
} as const;

export const darkColors: Record<keyof typeof color, string> = {
  ...color,
  bg: '#111613', surface: '#181f1a', surfaceRaised: '#202923', surfaceHover: '#2b362e',
  border: '#354139', borderStrong: '#56675b',
  text: '#f0f4ee', textMuted: '#b8c4ba', textFaint: '#a6b4a9',
  accent: '#b6d98a', accentHover: '#c9e7a6', onAccent: '#152012',
  success: '#a4d994', danger: '#ffaaa5', warning: '#eac77b',
  overlay: 'rgba(0,0,0,0.68)',
  tintPink: '#3d272f', tintCool: '#24343d', tintLime: '#303d26',
  tintPeach: '#3b3125', tintLavender: '#333047',
};

export const tokens = {
  color,
  font: {
    ui: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  },
  // self-hosted from src/client/public/fonts (latin subset only)
  fontFace: { family: 'Plus Jakarta Sans', url: '/fonts/plus-jakarta-sans-latin.woff2', weight: '400 800' },
  size: { xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28, xxxl: 44 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 },
  lineHeight: { tight: 1.25, normal: 1.5 },
  tracking: { tight: '-0.02em', normal: '-0.01em' },
  space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 },
  radius: { sm: 6, md: 10, lg: 16, xl: 22, pill: 999 },
  border: {
    hairline: '1px solid var(--color-border)',
    strong: '1px solid var(--color-border-strong)',
    focus: '2px solid var(--color-accent)',
    rule: 2,
  },
  outline: { offset: 2 },
  shadow: {
    card: '0 2px 16px rgba(24,30,45,0.045)',
    popover: '0 12px 28px rgba(64,74,44,0.16)',
  },
  control: { sm: 32, md: 40, toggleWidth: 36, toggleHeight: 20, thumb: 12, progress: 6 },
  icon: { sm: 14, md: 16, lg: 20 },
  opacity: { disabled: 0.45 },
  duration: { fast: 120, normal: 180, slow: 260 },
  easing: { standard: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  layout: { sidebarWidth: 240, settingsWidth: 280, topbarHeight: 44, minWidth: 1100, modalWidth: 480, browserWidth: 640, contentWidth: 1040, playerWidth: 880 },
  z: { base: 0, sticky: 10, popover: 100, modal: 200, toast: 300 },
} as const;

export type Tokens = typeof tokens;
