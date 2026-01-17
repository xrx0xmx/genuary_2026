#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname, basename, extname } from 'path';

// Obtener el archivo desde argumentos
const inputFile = process.argv[2];

if (!inputFile) {
  console.error('❌ Uso: npm run convert <archivo.webm>');
  console.error('   Ejemplo: npm run convert ~/Downloads/loop_123456.webm');
  process.exit(1);
}

// Resolver ruta completa
const inputPath = resolve(inputFile);

if (!existsSync(inputPath)) {
  console.error(`❌ Archivo no encontrado: ${inputPath}`);
  process.exit(1);
}

// Verificar extensión
const ext = extname(inputPath).toLowerCase();
if (ext !== '.webm') {
  console.error(`❌ El archivo debe ser .webm, recibido: ${ext}`);
  process.exit(1);
}

// Generar nombre de salida
const dir = dirname(inputPath);
const name = basename(inputPath, ext);
const outputPath = resolve(dir, `${name}.mp4`);

console.log(`🎬 Convirtiendo: ${basename(inputPath)}`);
console.log(`📁 Entrada: ${inputPath}`);
console.log(`📁 Salida:  ${outputPath}`);

try {
  // Convertir con ffmpeg
  // El filtro scale ajusta dimensiones a números pares (requerido por libx264)
  execSync(`ffmpeg -y -i "${inputPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outputPath}"`, {
    stdio: 'inherit',
  });
  
  console.log('');
  console.log('✅ Conversión completada!');
  console.log(`📹 Archivo: ${outputPath}`);
} catch (error) {
  console.error('');
  console.error('❌ Error durante la conversión');
  console.error('   ¿Tienes FFmpeg instalado?');
  console.error('   Instala con: brew install ffmpeg');
  process.exit(1);
}

