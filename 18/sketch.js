/**
 * Genuary 2026 - Día 18
 * Prompt: Unexpected path. Draw a route that changes direction based on one very simple rule.
 *
 * Sistema generativo con un walker único que dibuja un camino continuo.
 * La dirección cambia según una regla simple seleccionable en tiempo real.
 */

import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// ============================================
// CONFIGURACIÓN
// ============================================
const LOOP_DURATION = 10;
const FPS = 60;
const CANVAS_SIZE = 800;
const STEP_SIZE = 4;
const STEPS_PER_FRAME = 8;

// ============================================
// DIRECCIONES CARDINALES
// ============================================
const DIRECTIONS = {
  N: { x: 0, y: -1, index: 0 },
  E: { x: 1, y: 0, index: 1 },
  S: { x: 0, y: 1, index: 2 },
  W: { x: -1, y: 0, index: 3 },
};
const DIR_ARRAY = [DIRECTIONS.N, DIRECTIONS.E, DIRECTIONS.S, DIRECTIONS.W];

// ============================================
// PALETAS DE COLOR
// ============================================
const PALETTES = [
  {
    name: 'Neutral',
    bg: '#1a1a1a',
    colors: ['#8a8a8a', '#a0a0a0', '#b8b8b8', '#d0d0d0', '#e8e8e8'],
  },
  {
    name: 'Black / Grey / White',
    bg: '#0a0a0a',
    colors: ['#ffffff', '#cccccc', '#888888', '#444444', '#ffffff'],
  },
  {
    name: 'Neon',
    bg: '#0d0d1a',
    colors: ['#ff00ff', '#00ffff', '#ff6600', '#00ff66', '#ffff00'],
  },
  {
    name: 'Pastel',
    bg: '#2a2a35',
    colors: ['#f8b4b4', '#b4d8f8', '#f8f4b4', '#b4f8d4', '#e4b4f8'],
  },
  {
    name: 'Camouflage',
    bg: '#1a1f1a',
    colors: ['#4a5d23', '#8b7355', '#556b2f', '#6b4423', '#3d4f2f'],
  },
];

// ============================================
// PALABRAS PARA REGLA 10
// ============================================
const WORDS = ['ORDEN', 'CONTROL', 'FE', 'ERROR'];

// ============================================
// CLASE WALKER
// ============================================
class Walker {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.dirIndex = Math.floor(Math.random() * 4);
    this.lastTurn = 0; // -1: izquierda, 0: recto, 1: derecha
    this.stepCount = 0;
    this.visited = new Set();
    this.wordIndex = 0;
    this.charIndex = 0;
    this.currentWord = WORDS[0];
    
    // Registrar posición inicial
    this.markVisited();
  }

  get direction() {
    return DIR_ARRAY[this.dirIndex];
  }

  markVisited() {
    const key = `${Math.floor(this.x / STEP_SIZE)},${Math.floor(this.y / STEP_SIZE)}`;
    this.visited.add(key);
  }

  isVisited(x, y) {
    const key = `${Math.floor(x / STEP_SIZE)},${Math.floor(y / STEP_SIZE)}`;
    return this.visited.has(key);
  }

  turnLeft() {
    this.dirIndex = (this.dirIndex + 3) % 4;
    this.lastTurn = -1;
  }

  turnRight() {
    this.dirIndex = (this.dirIndex + 1) % 4;
    this.lastTurn = 1;
  }

  goStraight() {
    this.lastTurn = 0;
  }

  nextPosition() {
    return {
      x: this.x + this.direction.x * STEP_SIZE,
      y: this.y + this.direction.y * STEP_SIZE,
    };
  }

  step() {
    const next = this.nextPosition();
    this.x = next.x;
    this.y = next.y;
    this.stepCount++;
    this.markVisited();

    // Wrap around
    if (this.x < 0) this.x = CANVAS_SIZE;
    if (this.x > CANVAS_SIZE) this.x = 0;
    if (this.y < 0) this.y = CANVAS_SIZE;
    if (this.y > CANVAS_SIZE) this.y = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.dirIndex = Math.floor(Math.random() * 4);
    this.lastTurn = 0;
    this.stepCount = 0;
    this.visited.clear();
    this.wordIndex = 0;
    this.charIndex = 0;
    this.markVisited();
  }
}

// ============================================
// REGLAS DE DIRECCIÓN
// ============================================
const RULES = {
  // Regla 1 — Píxel claro / oscuro
  1: {
    name: 'Píxel claro/oscuro',
    apply: (walker, p, origin) => {
      const px = p.get(Math.floor(walker.x), Math.floor(walker.y));
      const brightness = (px[0] + px[1] + px[2]) / 3;
      if (brightness > 50) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },

  // Regla 2 — No repetir giro
  2: {
    name: 'No repetir giro',
    apply: (walker, p, origin) => {
      const options = [-1, 0, 1].filter((t) => t !== walker.lastTurn);
      const choice = options[Math.floor(Math.random() * options.length)];
      if (choice === -1) walker.turnLeft();
      else if (choice === 1) walker.turnRight();
      else walker.goStraight();
    },
  },

  // Regla 3 — Distancia al origen
  3: {
    name: 'Distancia al origen',
    apply: (walker, p, origin) => {
      const dx = walker.x - origin.x;
      const dy = walker.y - origin.y;
      const distNow = Math.sqrt(dx * dx + dy * dy);

      const next = walker.nextPosition();
      const dxNext = next.x - origin.x;
      const dyNext = next.y - origin.y;
      const distNext = Math.sqrt(dxNext * dxNext + dyNext * dyNext);

      if (distNext > distNow) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },

  // Regla 4 — Borde del canvas
  4: {
    name: 'Borde del canvas',
    apply: (walker, p, origin) => {
      const margin = 80;
      const next = walker.nextPosition();

      const nearEdge =
        next.x < margin ||
        next.x > CANVAS_SIZE - margin ||
        next.y < margin ||
        next.y > CANVAS_SIZE - margin;

      if (nearEdge) {
        // Girar hacia el centro
        const cx = CANVAS_SIZE / 2;
        const cy = CANVAS_SIZE / 2;
        const angleToCenter = Math.atan2(cy - walker.y, cx - walker.x);
        const currentAngle = Math.atan2(walker.direction.y, walker.direction.x);
        const diff = angleToCenter - currentAngle;

        if (Math.sin(diff) > 0) {
          walker.turnLeft();
        } else {
          walker.turnRight();
        }
      } else {
        walker.goStraight();
      }
    },
  },

  // Regla 5 — Contador simple
  5: {
    name: 'Contador (cada N pasos)',
    apply: (walker, p, origin) => {
      const N = 11; // Número primo
      if (walker.stepCount % N === 0) {
        walker.turnRight();
      } else {
        walker.goStraight();
      }
    },
  },

  // Regla 6 — Paridad espacial
  6: {
    name: 'Paridad espacial',
    apply: (walker, p, origin) => {
      const gridX = Math.floor(walker.x / STEP_SIZE);
      const gridY = Math.floor(walker.y / STEP_SIZE);
      if ((gridX + gridY) % 2 === 0) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },

  // Regla 7 — Ruido 1D
  7: {
    name: 'Ruido 1D',
    apply: (walker, p, origin) => {
      const noiseVal = p.noise(walker.stepCount * 0.02);
      if (noiseVal > 0.5) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },

  // Regla 8 — Intersección
  8: {
    name: 'Intersección (auto-evitación)',
    apply: (walker, p, origin) => {
      const next = walker.nextPosition();
      if (walker.isVisited(next.x, next.y)) {
        // Intentar girar para evitar
        if (Math.random() > 0.5) {
          walker.turnRight();
        } else {
          walker.turnLeft();
        }
      } else {
        walker.goStraight();
      }
    },
  },

  // Regla 9 — Gravedad falsa
  9: {
    name: 'Gravedad falsa',
    apply: (walker, p, origin) => {
      const normalizedY = walker.y / CANVAS_SIZE;
      const probability = normalizedY * 0.8;

      if (Math.random() < probability) {
        // Intentar girar hacia abajo
        if (walker.direction.y >= 0) {
          walker.goStraight();
        } else {
          // Girar para ir más hacia abajo
          if (walker.direction.x > 0) {
            walker.turnRight();
          } else if (walker.direction.x < 0) {
            walker.turnLeft();
          } else {
            walker.turnRight();
          }
        }
      } else {
        // Movimiento libre ocasional
        const r = Math.random();
        if (r < 0.3) walker.turnLeft();
        else if (r < 0.6) walker.turnRight();
        else walker.goStraight();
      }
    },
  },

  // Regla 10 — Texto / tipografía
  10: {
    name: 'Texto (vocal/consonante)',
    apply: (walker, p, origin) => {
      const char = walker.currentWord[walker.charIndex];
      const vowels = 'AEIOU';

      if (vowels.includes(char)) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }

      // Avanzar al siguiente carácter
      walker.charIndex = (walker.charIndex + 1) % walker.currentWord.length;

      // Cambiar palabra ocasionalmente
      if (walker.charIndex === 0 && Math.random() < 0.1) {
        walker.wordIndex = (walker.wordIndex + 1) % WORDS.length;
        walker.currentWord = WORDS[walker.wordIndex];
      }
    },
  },
};

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  let walker;
  let currentRule = 1;
  let currentPalette = 0;
  let origin = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
  let colorIndex = 0;
  let graphics; // Buffer para acumulación

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);

    // Crear buffer gráfico para acumulación
    graphics = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE);
    graphics.background(PALETTES[currentPalette].bg);

    // Inicializar walker
    walker = new Walker(p, CANVAS_SIZE / 2, CANVAS_SIZE / 2);

    setupRecorder(p, LOOP_DURATION, FPS);

    console.log('🚶 Día 18: Unexpected Path');
    console.log('   [1-9] Reglas 1-9');
    console.log('   [0] Regla 10 (Texto)');
    console.log('   [P] Cambiar paleta');
    console.log('   [R] Reset');
    console.log('   [Mouse] Mover origen (Regla 3)');
    console.log(`\n   Regla activa: ${RULES[currentRule].name}`);
  };

  p.draw = () => {
    const palette = PALETTES[currentPalette];

    // Dibujar sobre el buffer gráfico (acumulativo)
    graphics.strokeWeight(6);

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      // Guardar posición anterior
      const prevX = walker.x;
      const prevY = walker.y;

      // Aplicar regla actual
      RULES[currentRule].apply(walker, graphics, origin);

      // Mover walker
      walker.step();

      // Seleccionar color de la paleta
      const color = palette.colors[colorIndex % palette.colors.length];
      graphics.stroke(color);

      // Dibujar línea del paso (solo si no hay wrap-around)
      const dx = Math.abs(walker.x - prevX);
      const dy = Math.abs(walker.y - prevY);
      if (dx < STEP_SIZE * 2 && dy < STEP_SIZE * 2) {
        graphics.line(prevX, prevY, walker.x, walker.y);
      }

      // Cambiar color periódicamente
      if (walker.stepCount % 50 === 0) {
        colorIndex = (colorIndex + 1) % palette.colors.length;
      }
    }

    // Renderizar buffer al canvas principal
    p.image(graphics, 0, 0);

    // Dibujar indicador de origen (para regla 3)
    if (currentRule === 3) {
      p.noFill();
      p.stroke(255, 100, 100, 150);
      p.strokeWeight(1);
      p.ellipse(origin.x, origin.y, 20, 20);
      p.line(origin.x - 10, origin.y, origin.x + 10, origin.y);
      p.line(origin.x, origin.y - 10, origin.x, origin.y + 10);
    }

    // Dibujar posición actual del walker (sutil)
    p.fill(255, 200);
    p.noStroke();
    p.ellipse(walker.x, walker.y, 4, 4);
  };

  p.mouseMoved = () => {
    // Actualizar origen con el mouse (para regla 3)
    if (p.mouseX >= 0 && p.mouseX <= CANVAS_SIZE && p.mouseY >= 0 && p.mouseY <= CANVAS_SIZE) {
      origin.x = p.mouseX;
      origin.y = p.mouseY;
    }
  };

  p.keyPressed = () => {
    // Teclas 1-9 para reglas 1-9
    if (p.key >= '1' && p.key <= '9') {
      currentRule = parseInt(p.key);
      console.log(`📐 Regla ${currentRule}: ${RULES[currentRule].name}`);
    }

    // Tecla 0 para regla 10
    if (p.key === '0') {
      currentRule = 10;
      console.log(`📐 Regla 10: ${RULES[10].name}`);
    }

    // Cambiar paleta
    if (p.key === 'p' || p.key === 'P') {
      currentPalette = (currentPalette + 1) % PALETTES.length;
      console.log(`🎨 Paleta: ${PALETTES[currentPalette].name}`);
    }

    // Reset completo
    if (p.key === 'r' || p.key === 'R') {
      graphics.background(PALETTES[currentPalette].bg);
      walker.reset(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      origin = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
      colorIndex = 0;
      console.log('🔄 Reset completo');
    }

    // Grabación
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

// ============================================
// INICIALIZACIÓN
// ============================================
new p5(sketch, document.getElementById('canvas-container'));
