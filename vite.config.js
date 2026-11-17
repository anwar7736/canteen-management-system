import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  esbuild: {
    loader: 'jsx',
    include: /src[\\/].*\.jsx?$/,
    exclude: [],
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      injectManifest: {
        globPatterns: ['**/*.{css,html,ico,js,png,svg,webp}'],
      },
    }),
  ],
  resolve: {
    alias: {
      'cogo-toast': fileURLToPath(new URL('./src/utils/cogoToast.js', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    setupFiles: './src/setupTests.js',
  },
});
