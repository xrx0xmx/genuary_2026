#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, unlinkSync, readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Obtener argumentos
const day = process.argv[2];

if (!day) {
  console.error('❌ Uso: npm run record <número_día>');
  console.error('   Ejemplo: npm run record 1');
  process.exit(1);
}

const dayDir = resolve(rootDir, day);
const outputDir = resolve(rootDir, 'outputs', day);
const framesDir = resolve(outputDir, 'frames');

if (!existsSync(dayDir)) {
  console.error(`❌ El día ${day} no existe.`);
  process.exit(1);
}

// Crear directorios de salida
mkdirSync(framesDir, { recursive: true });

// Limpiar frames anteriores
const existingFrames = readdirSync(framesDir).filter(f => f.endsWith('.png'));
existingFrames.forEach(f => unlinkSync(join(framesDir, f)));

console.log(`🎬 Grabando loop del día ${day}...`);

// Leer configuración del sketch para obtener duración y FPS
const sketchPath = resolve(dayDir, 'sketch.js');
const sketchContent = readFileSync(sketchPath, 'utf-8');

// Extraer configuración del sketch
const durationMatch = sketchContent.match(/LOOP_DURATION\s*=\s*(\d+)/);
const fpsMatch = sketchContent.match(/FPS\s*=\s*(\d+)/);
const sizeMatch = sketchContent.match(/CANVAS_SIZE\s*=\s*(\d+)/);

const LOOP_DURATION = durationMatch ? parseInt(durationMatch[1]) : 4;
const FPS = fpsMatch ? parseInt(fpsMatch[1]) : 60;
const CANVAS_SIZE = sizeMatch ? parseInt(sizeMatch[1]) : 800;
const TOTAL_FRAMES = LOOP_DURATION * FPS;

console.log(`📊 Configuración: ${LOOP_DURATION}s @ ${FPS}fps = ${TOTAL_FRAMES} frames`);
console.log(`📐 Tamaño: ${CANVAS_SIZE}x${CANVAS_SIZE}px`);

// Iniciar servidor Vite
console.log('🚀 Iniciando servidor...');
const viteProcess = spawn('npx', ['vite', '--port', '4000'], {
  cwd: rootDir,
  shell: true,
  env: {
    ...process.env,
    GENUARY_DAY: day,
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let serverReady = false;
viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Local:') || output.includes('ready')) {
    serverReady = true;
  }
});

// Esperar a que el servidor esté listo
await new Promise((resolve) => {
  const checkReady = setInterval(() => {
    if (serverReady) {
      clearInterval(checkReady);
      resolve();
    }
  }, 100);
  
  // Timeout de 10 segundos
  setTimeout(() => {
    clearInterval(checkReady);
    resolve();
  }, 10000);
});

console.log('✅ Servidor listo');

// Lanzar Puppeteer
console.log('🌐 Abriendo navegador...');
const browser = await puppeteer.launch({
  headless: true,
  args: [`--window-size=${CANVAS_SIZE + 100},${CANVAS_SIZE + 100}`],
});

const page = await browser.newPage();
await page.setViewport({ width: CANVAS_SIZE + 50, height: CANVAS_SIZE + 50 });

// Navegar a la página
await page.goto(`http://localhost:4000/`, { waitUntil: 'networkidle0' });

// Esperar a que el canvas esté listo
await page.waitForSelector('canvas');
console.log('🎨 Canvas detectado');

// Capturar frames
console.log(`📸 Capturando ${TOTAL_FRAMES} frames...`);

for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
  // Obtener el canvas y guardarlo como PNG
  const canvas = await page.$('canvas');
  const frameNumber = String(frame).padStart(5, '0');
  const framePath = join(framesDir, `frame_${frameNumber}.png`);
  
  await canvas.screenshot({ path: framePath });
  
  // Mostrar progreso
  if (frame % FPS === 0 || frame === TOTAL_FRAMES - 1) {
    const percent = Math.round((frame / TOTAL_FRAMES) * 100);
    console.log(`   ${percent}% (${frame + 1}/${TOTAL_FRAMES})`);
  }
  
  // Esperar al siguiente frame
  await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
}

console.log('✅ Frames capturados');

// Cerrar navegador y servidor
await browser.close();
viteProcess.kill();

// Generar video con FFmpeg
console.log('🎥 Generando MP4...');
const mp4Path = join(outputDir, 'loop.mp4');

try {
  execSync(`ffmpeg -y -framerate ${FPS} -i "${framesDir}/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 "${mp4Path}"`, {
    stdio: 'pipe',
  });
  console.log(`   ✅ ${mp4Path}`);
} catch (error) {
  console.error('   ❌ Error generando MP4. ¿Tienes FFmpeg instalado?');
  console.error('   Instala con: brew install ffmpeg');
}

// Generar GIF con FFmpeg
console.log('🎞️  Generando GIF...');
const gifPath = join(outputDir, 'loop.gif');
const palettePath = join(outputDir, 'palette.png');

try {
  // Generar paleta optimizada
  execSync(`ffmpeg -y -framerate ${FPS} -i "${framesDir}/frame_%05d.png" -vf "fps=${FPS},scale=${CANVAS_SIZE}:-1:flags=lanczos,palettegen=max_colors=256:stats_mode=full" "${palettePath}"`, {
    stdio: 'pipe',
  });
  
  // Generar GIF con la paleta
  execSync(`ffmpeg -y -framerate ${FPS} -i "${framesDir}/frame_%05d.png" -i "${palettePath}" -lavfi "fps=${FPS},scale=${CANVAS_SIZE}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" "${gifPath}"`, {
    stdio: 'pipe',
  });
  
  // Limpiar paleta temporal
  unlinkSync(palettePath);
  
  console.log(`   ✅ ${gifPath}`);
} catch (error) {
  console.error('   ❌ Error generando GIF');
}

// Limpiar frames (opcional, comentar si quieres conservarlos)
console.log('🧹 Limpiando frames temporales...');
const frames = readdirSync(framesDir).filter(f => f.endsWith('.png'));
frames.forEach(f => unlinkSync(join(framesDir, f)));

console.log('');
console.log('🎉 ¡Grabación completada!');
console.log(`📁 Archivos en: ${outputDir}`);
console.log(`   - loop.mp4`);
console.log(`   - loop.gif`);

