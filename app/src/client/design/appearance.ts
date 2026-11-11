import { applyTokens } from './applyTokens';

export type ColorMode = 'light' | 'dark';
const storageKey = 'agent-video-editor-color-mode';

export function preferredColorMode(): ColorMode {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* Storage may be unavailable in private browsing. */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyColorMode(mode: ColorMode) {
  document.documentElement.dataset.colorMode = mode;
  document.documentElement.style.colorScheme = mode;
  applyTokens(undefined, undefined, mode);
}

export function saveColorMode(mode: ColorMode) {
  try { localStorage.setItem(storageKey, mode); } catch { /* Keep the current session usable. */ }
  applyColorMode(mode);
}
