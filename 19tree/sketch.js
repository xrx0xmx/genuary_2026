/**
 * 19tree - Visualización de Elementos y Evoluciones
 * 
 * Muestra los elementos geométricos generados por cada regla EN MOVIMIENTO.
 * Cada familia tiene sus propios mini-walkers activos demostrando
 * cómo evolucionan los trazos según cada regla.
 */

import p5 from 'p5';

// ============================================
// CONFIGURACIÓN
// ============================================
const FPS = 60;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// ============================================
// PALETAS DE COLOR (del sketch 18)
// ============================================
const PALETTES = [
  {
    name: 'Neutral',
    bg: '#1a1a1a',
    colors: ['#8a8a8a', '#a0a0a0', '#b8b8b8', '#d0d0d0', '#e8e8e8'],
    accent: '#ffffff',
  },
  {
    name: 'Neon',
    bg: '#0d0d1a',
    colors: ['#ff00ff', '#00ffff', '#ff6600', '#00ff66', '#ffff00'],
    accent: '#ff00ff',
  },
  {
    name: 'Pastel',
    bg: '#2a2a35',
    colors: ['#f8b4b4', '#b4d8f8', '#f8f4b4', '#b4f8d4', '#e4b4f8'],
    accent: '#f8b4b4',
  },
  {
    name: 'Warm',
    bg: '#1a1515',
    colors: ['#ff6b6b', '#ffa07a', '#ffd700', '#ff8c00', '#ff4500'],
    accent: '#ff6b6b',
  },
  {
    name: 'Ocean',
    bg: '#0a1520',
    colors: ['#00bfff', '#1e90ff', '#4169e1', '#00ced1', '#48d1cc'],
    accent: '#00bfff',
  },
];

// ============================================
// DIRECCIONES
// ============================================
const DIRECTIONS = [
  { x: 0, y: -1 },  // N
  { x: 1, y: 0 },   // E
  { x: 0, y: 1 },   // S
  { x: -1, y: 0 },  // W
];

// ============================================
// CLASE MINI-WALKER
// ============================================
class MiniWalker {
  constructor(p, x, y, bounds, stepSize = 3) {
    this.p = p;
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.bounds = bounds; // { x, y, w, h }
    this.stepSize = stepSize;
    this.dirIndex = Math.floor(Math.random() * 4);
    this.stepCount = 0;
    this.lastTurn = 0;
    this.visited = new Set();
    this.path = [{ x: this.x, y: this.y }];
    this.maxPathLength = 200;
    this.colorIndex = 0;
    this.wordIndex = 0;
    this.charIndex = 0;
    this.words = ['ORDEN', 'CONTROL', 'FE', 'ERROR'];
    this.currentWord = this.words[0];
  }

  get direction() {
    return DIRECTIONS[this.dirIndex];
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
      x: this.x + this.direction.x * this.stepSize,
      y: this.y + this.direction.y * this.stepSize,
    };
  }

  isVisited(x, y) {
    const key = `${Math.floor(x / this.stepSize)},${Math.floor(y / this.stepSize)}`;
    return this.visited.has(key);
  }

  markVisited() {
    const key = `${Math.floor(this.x / this.stepSize)},${Math.floor(this.y / this.stepSize)}`;
    this.visited.add(key);
  }

  step() {
    const next = this.nextPosition();
    this.x = next.x;
    this.y = next.y;
    this.stepCount++;
    this.markVisited();

    // Wrap dentro de bounds
    if (this.x < this.bounds.x) this.x = this.bounds.x + this.bounds.w;
    if (this.x > this.bounds.x + this.bounds.w) this.x = this.bounds.x;
    if (this.y < this.bounds.y) this.y = this.bounds.y + this.bounds.h;
    if (this.y > this.bounds.y + this.bounds.h) this.y = this.bounds.y;

    // Guardar en path
    this.path.push({ x: this.x, y: this.y });
    if (this.path.length > this.maxPathLength) {
      this.path.shift();
    }
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.dirIndex = Math.floor(Math.random() * 4);
    this.stepCount = 0;
    this.lastTurn = 0;
    this.visited.clear();
    this.path = [{ x: this.x, y: this.y }];
  }
}

// ============================================
// REGLAS (funciones que modifican el walker)
// ============================================
const RULES = {
  1: {
    name: 'Píxel claro/oscuro',
    desc: 'Gira según brillo del píxel',
    apply: (walker, p, graphics) => {
      const px = graphics.get(Math.floor(walker.x - walker.bounds.x), Math.floor(walker.y - walker.bounds.y));
      const brightness = (px[0] + px[1] + px[2]) / 3;
      if (brightness > 30) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },
  2: {
    name: 'No repetir giro',
    desc: 'Evita el último giro',
    apply: (walker, p, graphics) => {
      const options = [-1, 0, 1].filter((t) => t !== walker.lastTurn);
      const choice = options[Math.floor(Math.random() * options.length)];
      if (choice === -1) walker.turnLeft();
      else if (choice === 1) walker.turnRight();
      else walker.goStraight();
    },
  },
  3: {
    name: 'Distancia origen',
    desc: 'Gira según distancia al centro',
    apply: (walker, p, graphics) => {
      const cx = walker.bounds.x + walker.bounds.w / 2;
      const cy = walker.bounds.y + walker.bounds.h / 2;
      const distNow = p.dist(walker.x, walker.y, cx, cy);
      const next = walker.nextPosition();
      const distNext = p.dist(next.x, next.y, cx, cy);
      if (distNext > distNow) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },
  4: {
    name: 'Borde canvas',
    desc: 'Rebota en los márgenes',
    apply: (walker, p, graphics) => {
      const margin = 15;
      const next = walker.nextPosition();
      const nearEdge =
        next.x < walker.bounds.x + margin ||
        next.x > walker.bounds.x + walker.bounds.w - margin ||
        next.y < walker.bounds.y + margin ||
        next.y > walker.bounds.y + walker.bounds.h - margin;

      if (nearEdge) {
        const cx = walker.bounds.x + walker.bounds.w / 2;
        const cy = walker.bounds.y + walker.bounds.h / 2;
        const angleToCenter = Math.atan2(cy - walker.y, cx - walker.x);
        const currentAngle = Math.atan2(walker.direction.y, walker.direction.x);
        const diff = angleToCenter - currentAngle;
        if (Math.sin(diff) > 0) walker.turnLeft();
        else walker.turnRight();
      } else {
        walker.goStraight();
      }
    },
  },
  5: {
    name: 'Contador mod N',
    desc: 'Gira cada 11 pasos',
    apply: (walker, p, graphics) => {
      if (walker.stepCount % 11 === 0) {
        walker.turnRight();
      } else {
        walker.goStraight();
      }
    },
  },
  6: {
    name: 'Paridad espacial',
    desc: 'Suma (x+y) par/impar',
    apply: (walker, p, graphics) => {
      const gridX = Math.floor((walker.x - walker.bounds.x) / walker.stepSize);
      const gridY = Math.floor((walker.y - walker.bounds.y) / walker.stepSize);
      if ((gridX + gridY) % 2 === 0) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },
  7: {
    name: 'Ruido 1D',
    desc: 'Perlin noise temporal',
    apply: (walker, p, graphics) => {
      const noiseVal = p.noise(walker.stepCount * 0.03);
      if (noiseVal > 0.5) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
    },
  },
  8: {
    name: 'Intersección',
    desc: 'Auto-evitación',
    apply: (walker, p, graphics) => {
      const next = walker.nextPosition();
      if (walker.isVisited(next.x, next.y)) {
        if (Math.random() > 0.5) walker.turnRight();
        else walker.turnLeft();
      } else {
        walker.goStraight();
      }
    },
  },
  9: {
    name: 'Gravedad falsa',
    desc: 'Tendencia a bajar',
    apply: (walker, p, graphics) => {
      const normalizedY = (walker.y - walker.bounds.y) / walker.bounds.h;
      const probability = normalizedY * 0.7;
      if (Math.random() < probability) {
        if (walker.direction.y >= 0) {
          walker.goStraight();
        } else {
          if (walker.direction.x > 0) walker.turnRight();
          else walker.turnLeft();
        }
      } else {
        const r = Math.random();
        if (r < 0.3) walker.turnLeft();
        else if (r < 0.6) walker.turnRight();
        else walker.goStraight();
      }
    },
  },
  10: {
    name: 'Texto vocal/cons',
    desc: 'Lee palabras',
    apply: (walker, p, graphics) => {
      const char = walker.currentWord[walker.charIndex];
      const vowels = 'AEIOU';
      if (vowels.includes(char)) {
        walker.turnRight();
      } else {
        walker.turnLeft();
      }
      walker.charIndex = (walker.charIndex + 1) % walker.currentWord.length;
      if (walker.charIndex === 0 && Math.random() < 0.1) {
        walker.wordIndex = (walker.wordIndex + 1) % walker.words.length;
        walker.currentWord = walker.words[walker.wordIndex];
      }
    },
  },
};

// ============================================
// FAMILIAS DE REGLAS
// ============================================
const FAMILIES = [
  {
    id: 'visual',
    name: 'ENTORNO VISUAL',
    color: '#ff6b6b',
    rules: [1],
  },
  {
    id: 'memory',
    name: 'HISTORIAL',
    color: '#4ecdc4',
    rules: [2, 8],
  },
  {
    id: 'geometry',
    name: 'GEOMETRÍA',
    color: '#45b7d1',
    rules: [3, 4, 6],
  },
  {
    id: 'time',
    name: 'TIEMPO',
    color: '#96ceb4',
    rules: [5, 7],
  },
  {
    id: 'physics',
    name: 'FÍSICA',
    color: '#dda0dd',
    rules: [9],
  },
  {
    id: 'data',
    name: 'DATOS',
    color: '#f7dc6f',
    rules: [10],
  },
];

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  let currentPalette = 0;
  let ruleDisplays = []; // Cada display contiene { rule, walker, graphics, bounds }
  let stepsPerFrame = 3;
  let showLabels = true;

  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);

    initializeDisplays();

    console.log('🌳 19tree - Elementos Geométricos en Movimiento');
    console.log('   [1-5] Cambiar paleta');
    console.log('   [R] Reset todos los walkers');
    console.log('   [+/-] Velocidad de simulación');
    console.log('   [L] Toggle etiquetas');
  };

  function initializeDisplays() {
    ruleDisplays = [];

    // Calcular layout: 2 filas x 5 columnas para las 10 reglas
    const cols = 5;
    const rows = 2;
    const padding = 15;
    const headerHeight = 60;
    const cellWidth = (CANVAS_WIDTH - padding * (cols + 1)) / cols;
    const cellHeight = (CANVAS_HEIGHT - headerHeight - padding * (rows + 1)) / rows;

    let ruleIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (ruleIndex >= 10) break;

        const ruleId = ruleIndex + 1;
        const x = padding + col * (cellWidth + padding);
        const y = headerHeight + padding + row * (cellHeight + padding);

        const bounds = { x, y, w: cellWidth, h: cellHeight };

        // Crear graphics buffer para este display
        const graphics = p.createGraphics(cellWidth, cellHeight);
        graphics.background(0, 0);

        // Crear walker centrado en el display
        const walker = new MiniWalker(
          p,
          x + cellWidth / 2,
          y + cellHeight / 2,
          bounds,
          3
        );

        // Encontrar la familia de esta regla
        const family = FAMILIES.find((f) => f.rules.includes(ruleId));

        ruleDisplays.push({
          ruleId,
          rule: RULES[ruleId],
          walker,
          graphics,
          bounds,
          family,
          colorIndex: 0,
        });

        ruleIndex++;
      }
    }
  }

  p.draw = () => {
    const palette = PALETTES[currentPalette];
    p.background(palette.bg);

    // Header
    p.fill(palette.accent);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text('ELEMENTOS GEOMÉTRICOS Y SUS EVOLUCIONES', CANVAS_WIDTH / 2, 15);
    p.textStyle(p.NORMAL);
    p.textSize(12);
    p.fill(palette.colors[2]);
    p.text(`Paleta: ${palette.name} [1-5] | Velocidad: ${stepsPerFrame}x [+/-] | Reset [R] | Labels [L]`, CANVAS_WIDTH / 2, 40);

    // Actualizar y dibujar cada display
    for (const display of ruleDisplays) {
      updateDisplay(display, palette);
      drawDisplay(display, palette);
    }
  };

  function updateDisplay(display, palette) {
    const { walker, rule, graphics, bounds, family } = display;

    // Aplicar regla y mover walker múltiples veces por frame
    for (let i = 0; i < stepsPerFrame; i++) {
      rule.apply(walker, p, graphics);
      
      const prevX = walker.x;
      const prevY = walker.y;
      
      walker.step();

      // Dibujar en el graphics buffer
      const localPrevX = prevX - bounds.x;
      const localPrevY = prevY - bounds.y;
      const localX = walker.x - bounds.x;
      const localY = walker.y - bounds.y;

      // Solo dibujar si no hay wrap-around
      const dx = Math.abs(walker.x - prevX);
      const dy = Math.abs(walker.y - prevY);
      
      if (dx < walker.stepSize * 2 && dy < walker.stepSize * 2) {
        const col = p.color(family.color);
        col.setAlpha(180);
        graphics.stroke(col);
        graphics.strokeWeight(1.5);
        graphics.line(localPrevX, localPrevY, localX, localY);
      }

      // Cambiar color periódicamente
      if (walker.stepCount % 100 === 0) {
        display.colorIndex = (display.colorIndex + 1) % palette.colors.length;
      }

      // Reset si el walker se estanca mucho
      if (walker.stepCount > 2000) {
        walker.reset();
        graphics.clear();
      }
    }
  }

  function drawDisplay(display, palette) {
    const { bounds, graphics, walker, rule, ruleId, family } = display;

    // Fondo del panel
    p.fill(0, 40);
    p.stroke(family.color);
    p.strokeWeight(2);
    p.rect(bounds.x, bounds.y, bounds.w, bounds.h, 8);

    // Contenido del graphics buffer
    p.image(graphics, bounds.x, bounds.y);

    // Posición actual del walker (punto brillante)
    p.fill(palette.accent);
    p.noStroke();
    p.ellipse(walker.x, walker.y, 6, 6);

    // Trail effect - últimos puntos del path
    const trail = walker.path.slice(-20);
    for (let i = 0; i < trail.length; i++) {
      const alpha = p.map(i, 0, trail.length, 50, 200);
      const size = p.map(i, 0, trail.length, 2, 5);
      p.fill(family.color + p.hex(Math.floor(alpha), 2).slice(-2));
      p.noStroke();
      p.ellipse(trail[i].x, trail[i].y, size, size);
    }

    if (showLabels) {
      // Badge con número de regla
      const badgeX = bounds.x + 20;
      const badgeY = bounds.y + 20;
      p.fill(family.color);
      p.noStroke();
      p.ellipse(badgeX, badgeY, 28, 28);
      p.fill(palette.bg);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.textStyle(p.BOLD);
      p.text(ruleId, badgeX, badgeY);

      // Nombre de la regla
      p.fill(palette.colors[4]);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(11);
      p.textStyle(p.BOLD);
      p.text(rule.name, bounds.x + 38, bounds.y + 20);

      // Descripción
      p.textStyle(p.NORMAL);
      p.textSize(9);
      p.fill(palette.colors[2]);
      p.text(rule.desc, bounds.x + 38, bounds.y + 35);

      // Familia (esquina inferior)
      p.fill(family.color);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(8);
      p.text(family.name, bounds.x + 10, bounds.y + bounds.h - 8);

      // Step count
      p.fill(palette.colors[2]);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text(`steps: ${walker.stepCount}`, bounds.x + bounds.w - 10, bounds.y + bounds.h - 8);
    }
  }

  p.keyPressed = () => {
    // Cambio de paleta (1-5)
    if (p.key >= '1' && p.key <= '5') {
      currentPalette = parseInt(p.key) - 1;
      console.log(`🎨 Paleta: ${PALETTES[currentPalette].name}`);
    }

    // Reset
    if (p.key === 'r' || p.key === 'R') {
      for (const display of ruleDisplays) {
        display.walker.reset();
        display.graphics.clear();
      }
      console.log('🔄 Reset todos los walkers');
    }

    // Velocidad
    if (p.key === '+' || p.key === '=') {
      stepsPerFrame = Math.min(20, stepsPerFrame + 1);
      console.log(`⏩ Velocidad: ${stepsPerFrame}x`);
    }
    if (p.key === '-' || p.key === '_') {
      stepsPerFrame = Math.max(1, stepsPerFrame - 1);
      console.log(`⏪ Velocidad: ${stepsPerFrame}x`);
    }

    // Toggle labels
    if (p.key === 'l' || p.key === 'L') {
      showLabels = !showLabels;
      console.log(`🏷️ Labels: ${showLabels ? 'ON' : 'OFF'}`);
    }
  };
};

// ============================================
// INICIALIZACIÓN
// ============================================
new p5(sketch, document.getElementById('canvas-container'));
