import { defineConfig } from 'vite';
import { readdirSync, statSync, existsSync } from 'fs';
import { resolve } from 'path';

// Detectar todos los días disponibles (carpetas numéricas)
function getDays() {
  const days = {};
  const items = readdirSync(__dirname);
  
  for (const item of items) {
    // Solo carpetas con nombres numéricos
    if (/^\d+$/.test(item) && statSync(resolve(__dirname, item)).isDirectory()) {
      const indexPath = resolve(__dirname, item, 'index.html');
      if (existsSync(indexPath)) {
        days[item] = indexPath;
      }
    }
  }
  
  return days;
}

const days = getDays();

// Crear entradas para rollup (multi-page app)
const input = {
  main: resolve(__dirname, 'index.html'),
};

for (const [day, path] of Object.entries(days)) {
  input[day] = path;
}

export default defineConfig({
  root: __dirname,
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input,
    },
  },
  resolve: {
    alias: {
      'p5': resolve(__dirname, 'node_modules/p5/lib/p5.min.js'),
    },
  },
});
