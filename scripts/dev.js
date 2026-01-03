#!/usr/bin/env node
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Obtener el número de día desde argumentos (opcional)
const day = process.argv[2];

if (day) {
  const dayDir = resolve(rootDir, day);
  
  if (!existsSync(dayDir)) {
    console.error(`❌ El día ${day} no existe.`);
    console.error(`   Usa "npm run new ${day}" para crearlo primero.`);
    process.exit(1);
  }
  
  console.log(`🎨 Iniciando servidor de desarrollo...`);
  console.log(`📁 Abriendo día ${day}`);
  console.log(`🌐 URL: http://localhost:3000/${day}/`);
} else {
  console.log(`🎨 Iniciando servidor de desarrollo...`);
  console.log(`🌐 URL: http://localhost:3000/`);
  console.log(`📋 Accede a cada día en: http://localhost:3000/1/, /2/, etc.`);
}

// Ejecutar Vite
const vite = spawn('npx', ['vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

vite.on('close', (code) => {
  process.exit(code);
});
