import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  base: mode === 'desktop' ? './' : '/',
  define: { __VISUAL_PREVIEW__: JSON.stringify(mode === 'visual-preview') },
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3001' } },
  build: { outDir: 'dist/client', emptyOutDir: true },
}));
