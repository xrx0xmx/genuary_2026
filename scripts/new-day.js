#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Obtener el número de día desde argumentos
const day = process.argv[2];

if (!day) {
  console.error('❌ Uso: npm run new <número_día>');
  console.error('   Ejemplo: npm run new 2');
  process.exit(1);
}

const dayDir = resolve(rootDir, day);

if (existsSync(dayDir)) {
  console.error(`❌ El día ${day} ya existe en: ${dayDir}`);
  process.exit(1);
}

// Crear directorio
mkdirSync(dayDir, { recursive: true });

// Template HTML
const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Genuary 2026 - Día ${day}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a1a;
    }
    main {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <main id="canvas-container"></main>
  <script type="module" src="./sketch.js"></script>
</body>
</html>
`;

// Template sketch.js
const sketchTemplate = `import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día ${day}
// Prompt: [Escribe aquí el prompt del día]

// ============================================
// CONFIGURACIÓN DEL LOOP
// ============================================
const LOOP_DURATION = 4; // Duración del loop en segundos
const FPS = 60;          // Frames por segundo
const CANVAS_SIZE = 800; // Tamaño del canvas (cuadrado)

const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    
    // Configurar grabador para exportar video
    setupRecorder(p, LOOP_DURATION, FPS);
  };

  p.draw = () => {
    // t va de 0 a 1 durante el loop (perfecto para animaciones cíclicas)
    const t = loop.frameProgress(p);
    
    p.background(20);
    
    // ============================================
    // TU CÓDIGO AQUÍ
    // ============================================
    // Ejemplo: círculo que se mueve en círculo perfecto
    const x = p.width / 2 + p.cos(t * p.TWO_PI) * 200;
    const y = p.height / 2 + p.sin(t * p.TWO_PI) * 200;
    
    p.fill(255);
    p.noStroke();
    p.ellipse(x, y, 50, 50);
    
    // ============================================
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
`;

// Template prompt.txt vacío
const promptTemplate = ``;

// Escribir archivos
writeFileSync(resolve(dayDir, 'index.html'), htmlTemplate);
writeFileSync(resolve(dayDir, 'sketch.js'), sketchTemplate);
writeFileSync(resolve(dayDir, 'prompt.txt'), promptTemplate);

console.log(`✅ Día ${day} creado exitosamente!`);
console.log(`📁 Carpeta: ${dayDir}`);
console.log(`📝 Archivos creados:`);
console.log(`   - index.html`);
console.log(`   - sketch.js`);
console.log(`   - prompt.txt`);
console.log('');
console.log(`🚀 Para comenzar a desarrollar:`);
console.log(`   npm run dev -- ${day}`);
console.log('');
console.log(`🎬 Para grabar un loop perfecto:`);
console.log(`   npm run record ${day}`);

