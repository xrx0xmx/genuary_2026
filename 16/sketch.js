import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 16
// Prompt: Order and Disorder

// ============================================
// CONFIGURACIÓN DEL LOOP
// ============================================
const LOOP_DURATION = 10; // Duración del loop en segundos
const FPS = 60; // Frames por segundo
const CANVAS_SIZE = 800; // Tamaño del canvas (cuadrado)

const GRID_COLS = 20;
const GRID_ROWS = 20;

const OFF_WHITE = 245;
const STROKE_ALPHA = 40;

const sketch = (p) => {
  const cells = [];

  let chaosIntensity = 0.4;
  let tolerance = 20;
  let correctionSpeed = 0.2;
  let resetProbability = 0.001;
  let rigidity = 1.0;

  const buildGrid = () => {
    cells.length = 0;
    const cellWidth = p.width / GRID_COLS;
    const cellHeight = p.height / GRID_ROWS;

    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        const ix = x * cellWidth + cellWidth / 2;
        const iy = y * cellHeight + cellHeight / 2;
        cells.push({
          ix,
          iy,
          iw: cellWidth,
          ih: cellHeight,
          x: ix,
          y: iy,
          w: cellWidth,
          h: cellHeight,
          rot: 0,
          deviation: 0,
          shade: p.random(230, 245),
          hidden: false,
        });
      }
    }
  };

  const rectOverlapArea = (a, b) => {
    const aHalfW = (a.w * rigidity) / 2;
    const aHalfH = (a.h * rigidity) / 2;
    const bHalfW = (b.w * rigidity) / 2;
    const bHalfH = (b.h * rigidity) / 2;

    const left = Math.max(a.x - aHalfW, b.x - bHalfW);
    const right = Math.min(a.x + aHalfW, b.x + bHalfW);
    const top = Math.max(a.y - aHalfH, b.y - bHalfH);
    const bottom = Math.min(a.y + aHalfH, b.y + bHalfH);

    if (right <= left || bottom <= top) {
      return 0;
    }

    return (right - left) * (bottom - top);
  };

  const resetDefaults = () => {
    chaosIntensity = 0.4;
    tolerance = 20;
    correctionSpeed = 0.2;
    resetProbability = 0.001;
    rigidity = 1.0;
  };

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.rectMode(p.CENTER);
    
    // Configurar grabador para exportar video
    setupRecorder(p, LOOP_DURATION, FPS);

    resetDefaults();
    buildGrid();
  };

  p.draw = () => {
    p.background(OFF_WHITE);
    p.stroke(0, STROKE_ALPHA);

    const correctionGain = correctionSpeed * (1 + chaosIntensity * 0.4);

    for (const cell of cells) {
      cell.hidden = false;

      // Caos
      cell.x += p.random(-chaosIntensity, chaosIntensity);
      cell.y += p.random(-chaosIntensity, chaosIntensity);
      cell.rot += p.random(-0.01, 0.01) * chaosIntensity;

      // Medición
      cell.deviation = p.dist(cell.x, cell.y, cell.ix, cell.iy);

      // Corrección autoritaria
      if (cell.deviation > tolerance) {
        cell.x = p.lerp(cell.x, cell.ix, correctionGain);
        cell.y = p.lerp(cell.y, cell.iy, correctionGain);
        cell.rot = p.lerp(cell.rot, 0, correctionGain * 1.5);
      }

      // Reset sistémico
      if (p.random() < resetProbability) {
        cell.x = cell.ix;
        cell.y = cell.iy;
        cell.rot = 0;
      }
    }

    // Si una tile tapa >10% de otra, la de abajo desaparece
    const overlapThreshold = 0.1;
    for (let i = 0; i < cells.length; i += 1) {
      const lower = cells[i];
      if (lower.hidden) {
        continue;
      }
      const lowerArea = (lower.w * rigidity) * (lower.h * rigidity);
      for (let j = i + 1; j < cells.length; j += 1) {
        const upper = cells[j];
        const overlapArea = rectOverlapArea(lower, upper);
        if (overlapArea / lowerArea > overlapThreshold) {
          lower.hidden = true;
          break;
        }
      }
    }

    for (const cell of cells) {
      if (cell.hidden) {
        continue;
      }

      // Render
      p.push();
      p.translate(cell.x, cell.y);
      p.rotate(cell.rot);
      p.fill(cell.shade);
      p.rect(0, 0, cell.w * rigidity, cell.h * rigidity);
      p.pop();
    }
  };

  p.keyPressed = () => {
    if (p.key === 's' || p.key === 'S') {
      if (window.isRecording?.()) {
        console.warn('⚠️ Ya hay una grabación en curso');
        return;
      }
      if (window.startRecording) {
        console.log(`🔴 Iniciando grabación de ${LOOP_DURATION}s...`);
        window.startRecording();
      } else {
        console.warn('⚠️ Recorder no disponible');
      }
    }
    if (p.key === '1') {
      chaosIntensity = 0.1;
      tolerance = 30;
      correctionSpeed = 0.15;
      rigidity = 1.0;
    }
    if (p.key === '2') {
      chaosIntensity = 1.2;
      tolerance = 15;
      correctionSpeed = 0.35;
      rigidity = 0.95;
    }
    if (p.key === '3') {
      chaosIntensity = 0.6;
      tolerance = 2;
      correctionSpeed = 0.9;
      rigidity = 1.0;
    }
    if (p.key === 'r' || p.key === 'R') {
      resetDefaults();
      buildGrid();
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
