import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const appDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('./src/client', import.meta.url)),
  plugins: [react()],
  build: { outDir: fileURLToPath(new URL('./dist/client', import.meta.url)), emptyOutDir: true },
  test: { root: appDir, include: ['test/**/*.test.ts'] },
});
