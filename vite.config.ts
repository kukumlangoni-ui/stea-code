import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || null),
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || null),
      'process.env.SPORTS_API_KEY': JSON.stringify(process.env.SPORTS_API_KEY || null),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild',
      reportCompressedSize: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 5000
    },
    server: {
      // Required for local verification of the production Classroom host.
      allowedHosts: ['classroom.stea.africa', 'stea.africa'],
      hmr: false,
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.firebase/**'],
      },
      proxy: {
        '/api': 'http://localhost:3000',
        '/ws': { target: 'http://localhost:3000', ws: true },
      },
    },
  };
});
