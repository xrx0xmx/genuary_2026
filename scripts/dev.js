#!/usr/bin/env node
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Obtener el número de día desde argumentos
const day = process.argv[2];

if (!day) {
  console.error('❌ Uso: npm run dev -- <número_día>');
  console.error('   Ejemplo: npm run dev -- 1');
  process.exit(1);
}

const dayDir = resolve(rootDir, day);

if (!existsSync(dayDir)) {
  console.error(`❌ El día ${day} no existe.`);
  console.error(`   Usa "npm run new ${day}" para crearlo primero.`);
  process.exit(1);
}

console.log(`🎨 Iniciando desarrollo del día ${day}...`);
console.log(`📁 Carpeta: ${dayDir}`);

// Ejecutar Vite con la variable de entorno del día
const vite = spawn('npx', ['vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    GENUARY_DAY: day,
  },
});

vite.on('close', (code) => {
  process.exit(code);
});

