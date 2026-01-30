import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 22
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
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
