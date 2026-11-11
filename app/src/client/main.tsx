import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installBrandAssets } from './design/applyTokens';
import { applyColorMode, preferredColorMode } from './design/appearance';
import './design/global.css';
import './components/ui/ui.css';

applyColorMode(preferredColorMode());
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => applyColorMode(document.documentElement.dataset.colorMode === 'dark' ? 'dark' : 'light'));
installBrandAssets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
