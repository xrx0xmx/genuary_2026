import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'fs';
import { resolve } from 'path';

// Obtener el día desde variable de entorno o argumentos
const day = process.env.GENUARY_DAY || '1';

export default defineConfig({
  root: resolve(__dirname, day),
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: resolve(__dirname, 'dist', day),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'p5': resolve(__dirname, 'node_modules/p5/lib/p5.min.js'),
    },
  },
});

