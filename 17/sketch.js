/**
 * Sketch 15 — Motor generativo para los 17 Wallpaper Groups
 * Prompt: Uso de simetría
 *
 * Sistema completo que implementa las 17 simetrías planas cristalográficas
 * con motivos generativos, debug visual y controles por teclado.
 */

import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// ============================================
// CONFIGURACIÓN
// ============================================
const LOOP_DURATION = 8;
const FPS = 60;
const CANVAS_SIZE = 800;

// ============================================
// PARÁMETROS GLOBALES (modificables por UI)
// ============================================
let params = {
  groupIndex: 0,
  cellSize: 100,
  angle: Math.PI / 3,      // Para oblique/rhombic (60° default)
  aspect: 1.5,             // Para rect
  glideShift: 0.5,         // Offset de glide
  seed: 42,
  debugCell: false,
  debugSym: false,
  motifDensity: 5,
  motifScale: 0.3,
  colorScheme: 0,
  animate: true,
  showUI: true,            // Mostrar panel de ayuda
};

// ============================================
// PALETAS DE COLOR
// ============================================
const PALETTES = [
  // 0: Monocromo elegante
  { bg: '#1a1a2e', stroke: '#eaeaea', fill: '#4a4e69', accent: '#9a8c98' },
  // 1: Cálido terracota
  { bg: '#2d2a32', stroke: '#e8d5b7', fill: '#c17c74', accent: '#d4a373' },
  // 2: Azul marino
  { bg: '#0d1b2a', stroke: '#e0e1dd', fill: '#415a77', accent: '#778da9' },
  // 3: Verde bosque
  { bg: '#1b2621', stroke: '#dad7cd', fill: '#3a5a40', accent: '#a3b18a' },
  // 4: Púrpura místico
  { bg: '#1a1423', stroke: '#e2d4f0', fill: '#5e4b8a', accent: '#9d8ec7' },
  // 5: Coral vibrante
  { bg: '#2b2d42', stroke: '#edf2f4', fill: '#ef233c', accent: '#d90429' },
];

// ============================================
// TIPOS DE LATTICE
// ============================================
const LATTICE_TYPES = {
  SQUARE: 'SQUARE',
  RECT: 'RECT',
  OBLIQUE: 'OBLIQUE',
  RHOMBIC: 'RHOMBIC',
  HEX: 'HEX',
};

// ============================================
// CLASE LATTICE
// ============================================
class Lattice {
  constructor(type, params) {
    this.type = type;
    const s = params.cellSize;
    const aspect = params.aspect || 1.5;
    const angle = params.angle || Math.PI / 3;

    switch (type) {
      case LATTICE_TYPES.SQUARE:
        this.t1 = { x: s, y: 0 };
        this.t2 = { x: 0, y: s };
        break;

      case LATTICE_TYPES.RECT:
        this.t1 = { x: s * aspect, y: 0 };
        this.t2 = { x: 0, y: s };
        break;

      case LATTICE_TYPES.OBLIQUE:
        this.t1 = { x: s, y: 0 };
        this.t2 = { x: s * Math.cos(angle), y: s * Math.sin(angle) };
        break;

      case LATTICE_TYPES.RHOMBIC:
        this.t1 = { x: s, y: 0 };
        this.t2 = { x: s * Math.cos(angle), y: s * Math.sin(angle) };
        break;

      case LATTICE_TYPES.HEX:
        this.t1 = { x: s, y: 0 };
        this.t2 = { x: s / 2, y: s * Math.sqrt(3) / 2 };
        break;

      default:
        this.t1 = { x: s, y: 0 };
        this.t2 = { x: 0, y: s };
    }

    this.origin = { x: 0, y: 0 };
  }

  // Convierte índices de celda (i,j) a coordenadas mundo
  cellToWorld(i, j) {
    return {
      x: this.origin.x + i * this.t1.x + j * this.t2.x,
      y: this.origin.y + i * this.t1.y + j * this.t2.y,
    };
  }

  // Convierte coordenadas UV locales [0,1) a XY dentro de la celda
  uvToXY(u, v) {
    return {
      x: u * this.t1.x + v * this.t2.x,
      y: u * this.t1.y + v * this.t2.y,
    };
  }

  // Estima el rango de celdas necesario para cubrir el canvas
  estimateRange(w, h) {
    // Calcular el máximo alcance necesario
    const maxDim = Math.max(w, h) * 1.5;
    const t1Len = Math.sqrt(this.t1.x ** 2 + this.t1.y ** 2);
    const t2Len = Math.sqrt(this.t2.x ** 2 + this.t2.y ** 2);

    const iRange = Math.ceil(maxDim / t1Len) + 2;
    const jRange = Math.ceil(maxDim / t2Len) + 2;

    return {
      iMin: -iRange,
      iMax: iRange,
      jMin: -jRange,
      jMax: jRange,
    };
  }

  // Dibuja los vértices de una celda (para debug)
  getCellVertices() {
    return [
      { x: 0, y: 0 },
      { x: this.t1.x, y: this.t1.y },
      { x: this.t1.x + this.t2.x, y: this.t1.y + this.t2.y },
      { x: this.t2.x, y: this.t2.y },
    ];
  }
}

// ============================================
// OPERADORES DE SIMETRÍA (SymOps)
// ============================================

// Identidad
class Identity {
  apply(p, L) {
    // No hace nada
  }
  name() {
    return 'I';
  }
}

// Rotación de orden k alrededor de un centro (cu, cv) en UV
class Rotation {
  constructor(k, m, cu = 0, cv = 0) {
    this.k = k;         // Orden de rotación (2, 3, 4, 6)
    this.m = m;         // Múltiplo (0, 1, 2, ..., k-1)
    this.cu = cu;       // Centro U
    this.cv = cv;       // Centro V
  }

  apply(p, L) {
    const theta = (2 * Math.PI / this.k) * this.m;
    const c = L.uvToXY(this.cu, this.cv);
    p.translate(c.x, c.y);
    p.rotate(theta);
    p.translate(-c.x, -c.y);
  }

  name() {
    return `R${this.k}(${this.m})@(${this.cu},${this.cv})`;
  }
}

// Mirror respecto a una línea definida por punto (pu, pv) y ángulo phi
class Mirror {
  constructor(pu, pv, phi) {
    this.pu = pu;       // Punto U en la recta
    this.pv = pv;       // Punto V en la recta
    this.phi = phi;     // Ángulo de la recta respecto a eje X (en radianes)
  }

  apply(p, L) {
    const pt = L.uvToXY(this.pu, this.pv);
    p.translate(pt.x, pt.y);
    p.rotate(this.phi);
    p.scale(1, -1);
    p.rotate(-this.phi);
    p.translate(-pt.x, -pt.y);
  }

  name() {
    return `M@(${this.pu.toFixed(2)},${this.pv.toFixed(2)}),φ=${(this.phi * 180 / Math.PI).toFixed(0)}°`;
  }
}

// Glide = Mirror + Translate paralelo al eje
class Glide {
  constructor(pu, pv, phi, du, dv) {
    this.pu = pu;
    this.pv = pv;
    this.phi = phi;
    this.du = du;       // Desplazamiento U
    this.dv = dv;       // Desplazamiento V
  }

  apply(p, L) {
    // Primero aplicar mirror
    const pt = L.uvToXY(this.pu, this.pv);
    p.translate(pt.x, pt.y);
    p.rotate(this.phi);
    p.scale(1, -1);
    p.rotate(-this.phi);
    p.translate(-pt.x, -pt.y);

    // Luego el desplazamiento
    const shift = L.uvToXY(this.du, this.dv);
    p.translate(shift.x, shift.y);
  }

  name() {
    return `G@(${this.pu.toFixed(2)},${this.pv.toFixed(2)}),φ=${(this.phi * 180 / Math.PI).toFixed(0)}°,d=(${this.du},${this.dv})`;
  }
}

// ============================================
// DEFINICIONES DE LOS 17 GRUPOS
// ============================================
const GROUPS = [
  // ==========================================
  // A) SIN ESPEJOS NI GLIDES
  // ==========================================

  // 1) p1 - Solo traslaciones
  {
    id: 'p1',
    name: 'p1 (Oblicuo, solo traslación)',
    lattice: LATTICE_TYPES.OBLIQUE,
    buildOps: (P, L) => [new Identity()],
  },

  // 2) p2 - Rotación 180° en 4 centros
  {
    id: 'p2',
    name: 'p2 (Rotación 180°)',
    lattice: LATTICE_TYPES.OBLIQUE,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(2, 1, 0, 0),
      new Rotation(2, 1, 0.5, 0),
      new Rotation(2, 1, 0, 0.5),
      new Rotation(2, 1, 0.5, 0.5),
    ],
  },

  // 3) p3 - Rotación 120° (hexagonal)
  {
    id: 'p3',
    name: 'p3 (Rotación 120°)',
    lattice: LATTICE_TYPES.HEX,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(3, 1, 0, 0),
      new Rotation(3, 2, 0, 0),
    ],
  },

  // 4) p4 - Rotación 90° (cuadrado)
  {
    id: 'p4',
    name: 'p4 (Rotación 90°)',
    lattice: LATTICE_TYPES.SQUARE,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(4, 1, 0.5, 0.5),
      new Rotation(4, 2, 0.5, 0.5),
      new Rotation(4, 3, 0.5, 0.5),
    ],
  },

  // 5) p6 - Rotación 60° (hexagonal)
  {
    id: 'p6',
    name: 'p6 (Rotación 60°)',
    lattice: LATTICE_TYPES.HEX,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(6, 1, 0, 0),
      new Rotation(6, 2, 0, 0),
      new Rotation(6, 3, 0, 0),
      new Rotation(6, 4, 0, 0),
      new Rotation(6, 5, 0, 0),
    ],
  },

  // ==========================================
  // B) SOLO ESPEJOS / GLIDES (SIN ROTACIÓN ALTA)
  // ==========================================

  // 6) pm - Espejos paralelos
  {
    id: 'pm',
    name: 'pm (Espejos paralelos)',
    lattice: LATTICE_TYPES.RECT,
    buildOps: (P, L) => [
      new Identity(),
      new Mirror(0, 0, Math.PI / 2),  // Espejo vertical en u=0
    ],
  },

  // 7) pg - Glide reflections
  {
    id: 'pg',
    name: 'pg (Glide reflections)',
    lattice: LATTICE_TYPES.RECT,
    buildOps: (P, L) => {
      const gs = P.glideShift;
      return [
        new Identity(),
        new Glide(0, 0, Math.PI / 2, 0, gs),  // Glide vertical con shift en v
      ];
    },
  },

  // 8) cm - Espejo + glide (rómbico)
  {
    id: 'cm',
    name: 'cm (Espejo + glide centrado)',
    lattice: LATTICE_TYPES.RHOMBIC,
    buildOps: (P, L) => {
      const gs = P.glideShift;
      return [
        new Identity(),
        new Mirror(0, 0, Math.PI / 2),
        new Glide(0.5, 0, Math.PI / 2, 0, gs),
      ];
    },
  },

  // 9) pmm - Grupo de Klein (2 espejos perpendiculares)
  {
    id: 'pmm',
    name: 'pmm (Espejos perpendiculares)',
    lattice: LATTICE_TYPES.RECT,
    buildOps: (P, L) => [
      new Identity(),
      new Mirror(0, 0, Math.PI / 2),  // Vertical
      new Mirror(0, 0, 0),            // Horizontal
      new Rotation(2, 1, 0, 0),       // Rot180 equivalente a ambos mirrors
    ],
  },

  // 10) pmg - Espejo + glide perpendicular
  {
    id: 'pmg',
    name: 'pmg (Espejo + glide perp.)',
    lattice: LATTICE_TYPES.RECT,
    buildOps: (P, L) => {
      const gs = P.glideShift;
      return [
        new Identity(),
        new Mirror(0, 0, Math.PI / 2),
        new Glide(0, 0, 0, gs, 0),
        new Rotation(2, 1, gs / 2, 0.25),
      ];
    },
  },

  // 11) pgg - Dos glides perpendiculares
  {
    id: 'pgg',
    name: 'pgg (Doble glide)',
    lattice: LATTICE_TYPES.RECT,
    buildOps: (P, L) => {
      const gs = P.glideShift;
      return [
        new Identity(),
        new Glide(0, 0, Math.PI / 2, 0, gs),
        new Glide(0, 0, 0, gs, 0),
        new Rotation(2, 1, gs / 2, gs / 2),
      ];
    },
  },

  // 12) cmm - Centrado con espejos
  {
    id: 'cmm',
    name: 'cmm (Centrado con espejos)',
    lattice: LATTICE_TYPES.RECT,
    buildOps: (P, L) => [
      new Identity(),
      new Mirror(0, 0, Math.PI / 2),
      new Mirror(0, 0, 0),
      new Rotation(2, 1, 0, 0),
      new Rotation(2, 1, 0.5, 0.5),
    ],
    centered: true,  // Flag para renderizado centrado
  },

  // ==========================================
  // C) ROTACIÓN 4 CON ESPEJOS
  // ==========================================

  // 13) p4m - D4 completo (8 operaciones)
  {
    id: 'p4m',
    name: 'p4m (D4 - cuadrado completo)',
    lattice: LATTICE_TYPES.SQUARE,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(4, 1, 0.5, 0.5),
      new Rotation(4, 2, 0.5, 0.5),
      new Rotation(4, 3, 0.5, 0.5),
      new Mirror(0.5, 0.5, 0),              // Horizontal por centro
      new Mirror(0.5, 0.5, Math.PI / 2),    // Vertical por centro
      new Mirror(0.5, 0.5, Math.PI / 4),    // Diagonal u=v
      new Mirror(0.5, 0.5, -Math.PI / 4),   // Diagonal u=1-v
    ],
  },

  // 14) p4g - Rotación 4 con glides
  {
    id: 'p4g',
    name: 'p4g (Rotación 4 + glides)',
    lattice: LATTICE_TYPES.SQUARE,
    buildOps: (P, L) => {
      const gs = P.glideShift;
      return [
        new Identity(),
        new Rotation(4, 1, 0.5, 0.5),
        new Rotation(4, 2, 0.5, 0.5),
        new Rotation(4, 3, 0.5, 0.5),
        new Mirror(0, 0, Math.PI / 2),
        new Mirror(0, 0, 0),
        new Glide(0.5, 0, Math.PI / 2, 0, gs),
        new Glide(0, 0.5, 0, gs, 0),
      ];
    },
  },

  // ==========================================
  // D) ROTACIÓN 3 CON ESPEJOS
  // ==========================================

  // 15) p3m1 - D3 con espejos por el origen
  {
    id: 'p3m1',
    name: 'p3m1 (D3 - espejos por origen)',
    lattice: LATTICE_TYPES.HEX,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(3, 1, 0, 0),
      new Rotation(3, 2, 0, 0),
      new Mirror(0, 0, 0),                    // 0°
      new Mirror(0, 0, Math.PI / 3),          // 60°
      new Mirror(0, 0, 2 * Math.PI / 3),      // 120°
    ],
  },

  // 16) p31m - D3 con espejos offset
  {
    id: 'p31m',
    name: 'p31m (D3 - espejos offset)',
    lattice: LATTICE_TYPES.HEX,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(3, 1, 0, 0),
      new Rotation(3, 2, 0, 0),
      new Mirror(1 / 3, 0, Math.PI / 6),           // Offset
      new Mirror(1 / 3, 0, Math.PI / 6 + Math.PI / 3),
      new Mirror(1 / 3, 0, Math.PI / 6 + 2 * Math.PI / 3),
    ],
  },

  // ==========================================
  // E) ROTACIÓN 6 CON ESPEJOS
  // ==========================================

  // 17) p6m - D6 completo
  {
    id: 'p6m',
    name: 'p6m (D6 - hexagonal completo)',
    lattice: LATTICE_TYPES.HEX,
    buildOps: (P, L) => [
      new Identity(),
      new Rotation(6, 1, 0, 0),
      new Rotation(6, 2, 0, 0),
      new Rotation(6, 3, 0, 0),
      new Rotation(6, 4, 0, 0),
      new Rotation(6, 5, 0, 0),
      new Mirror(0, 0, 0),                    // 0°
      new Mirror(0, 0, Math.PI / 6),          // 30°
      new Mirror(0, 0, Math.PI / 3),          // 60°
      new Mirror(0, 0, Math.PI / 2),          // 90°
      new Mirror(0, 0, 2 * Math.PI / 3),      // 120°
      new Mirror(0, 0, 5 * Math.PI / 6),      // 150°
    ],
  },
];

// ============================================
// MOTIVO GENERATIVO
// ============================================
function drawMotif(p, L, P, t) {
  const palette = PALETTES[P.colorScheme % PALETTES.length];
  const density = P.motifDensity;
  const scale = P.motifScale;

  // Usar seed para coherencia
  p.randomSeed(P.seed);
  p.noiseSeed(P.seed);

  // Obtener dimensiones de la celda para escalar
  const cellW = Math.sqrt(L.t1.x ** 2 + L.t1.y ** 2);
  const cellH = Math.sqrt(L.t2.x ** 2 + L.t2.y ** 2);
  const avgSize = (cellW + cellH) / 2;

  // Configurar estilos
  p.stroke(palette.stroke);
  p.strokeWeight(1.5);
  p.noFill();

  // Animación basada en t
  const animOffset = P.animate ? t * Math.PI * 2 : 0;

  // Generar primitivas ancladas a puntos UV fijos
  for (let i = 0; i < density; i++) {
    const u = p.random(0.1, 0.9);
    const v = p.random(0.1, 0.9);
    const pt = L.uvToXY(u, v);

    // Variación con noise para coherencia
    const n = p.noise(u * 3, v * 3, P.seed * 0.01);
    const primitiveType = Math.floor(n * 4);

    const size = avgSize * scale * (0.3 + n * 0.7);

    // Animación sutil
    const animScale = P.animate ? 1 + 0.1 * Math.sin(animOffset + u * 4 + v * 4) : 1;
    const animRot = P.animate ? 0.1 * Math.sin(animOffset * 0.5 + i) : 0;

    p.push();
    p.translate(pt.x, pt.y);
    p.rotate(animRot);

    switch (primitiveType) {
      case 0:
        // Círculo
        p.stroke(palette.stroke);
        p.ellipse(0, 0, size * animScale, size * animScale);
        break;

      case 1:
        // Arco
        p.stroke(palette.accent);
        const startAngle = n * Math.PI;
        const endAngle = startAngle + Math.PI * (0.5 + n);
        p.arc(0, 0, size * animScale, size * animScale, startAngle, endAngle);
        break;

      case 2:
        // Líneas radiantes
        p.stroke(palette.stroke);
        const numLines = 3 + Math.floor(n * 4);
        for (let j = 0; j < numLines; j++) {
          const angle = (j / numLines) * Math.PI * 2 + animRot;
          const len = size * 0.4 * animScale;
          p.line(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
        }
        break;

      case 3:
        // Polígono
        p.stroke(palette.accent);
        const sides = 3 + Math.floor(n * 4);
        p.beginShape();
        for (let j = 0; j < sides; j++) {
          const angle = (j / sides) * Math.PI * 2 - Math.PI / 2 + animRot;
          const r = size * 0.35 * animScale;
          p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        p.endShape(p.CLOSE);
        break;
    }

    p.pop();
  }

  // Punto de campo con ruido (wrap local)
  p.fill(palette.fill);
  p.noStroke();

  for (let i = 0; i < density * 2; i++) {
    const u = p.random();
    const v = p.random();
    const pt = L.uvToXY(u, v);

    const noiseVal = p.noise(u * 5, v * 5, P.seed * 0.02 + (P.animate ? t : 0));
    if (noiseVal > 0.6) {
      const dotSize = 2 + noiseVal * 4;
      p.ellipse(pt.x, pt.y, dotSize, dotSize);
    }
  }

  // Curva suave central
  p.noFill();
  p.stroke(palette.accent);
  p.strokeWeight(2);
  p.beginShape();
  for (let i = 0; i <= 10; i++) {
    const u = 0.2 + i * 0.06;
    const vBase = 0.5 + 0.2 * Math.sin(u * Math.PI * 2 + P.seed + animOffset * 0.3);
    const pt = L.uvToXY(u, vBase);
    p.curveVertex(pt.x, pt.y);
  }
  p.endShape();
}

// ============================================
// DEBUG: DIBUJAR CELDA
// ============================================
function drawCellDebug(p, L, palette) {
  const vertices = L.getCellVertices();

  // Contorno de la celda
  p.stroke(palette.accent);
  p.strokeWeight(1);
  p.noFill();
  p.beginShape();
  for (const v of vertices) {
    p.vertex(v.x, v.y);
  }
  p.endShape(p.CLOSE);

  // Vectores t1 y t2
  p.strokeWeight(2);

  // t1 en rojo
  p.stroke(255, 100, 100);
  p.line(0, 0, L.t1.x * 0.9, L.t1.y * 0.9);
  drawArrow(p, L.t1.x * 0.9, L.t1.y * 0.9, Math.atan2(L.t1.y, L.t1.x), 8);

  // t2 en verde
  p.stroke(100, 255, 100);
  p.line(0, 0, L.t2.x * 0.9, L.t2.y * 0.9);
  drawArrow(p, L.t2.x * 0.9, L.t2.y * 0.9, Math.atan2(L.t2.y, L.t2.x), 8);

  // Origen
  p.fill(255, 255, 100);
  p.noStroke();
  p.ellipse(0, 0, 6, 6);
}

function drawArrow(p, x, y, angle, size) {
  p.push();
  p.translate(x, y);
  p.rotate(angle);
  p.line(0, 0, -size, -size / 2);
  p.line(0, 0, -size, size / 2);
  p.pop();
}

// ============================================
// DEBUG: DIBUJAR SIMETRÍAS
// ============================================
function drawSymDebug(p, L, ops, palette) {
  for (const op of ops) {
    if (op instanceof Rotation && op.m > 0) {
      // Centro de rotación
      const c = L.uvToXY(op.cu, op.cv);
      p.fill(255, 200, 0);
      p.noStroke();

      // Símbolo según orden
      const size = 8;
      if (op.k === 2) {
        // Rombo para orden 2
        p.push();
        p.translate(c.x, c.y);
        p.rotate(Math.PI / 4);
        p.rect(-size / 2, -size / 2, size, size);
        p.pop();
      } else if (op.k === 3) {
        // Triángulo para orden 3
        p.push();
        p.translate(c.x, c.y);
        p.beginShape();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          p.vertex(Math.cos(a) * size, Math.sin(a) * size);
        }
        p.endShape(p.CLOSE);
        p.pop();
      } else if (op.k === 4) {
        // Cuadrado para orden 4
        p.rectMode(p.CENTER);
        p.rect(c.x, c.y, size, size);
      } else if (op.k === 6) {
        // Hexágono para orden 6
        p.push();
        p.translate(c.x, c.y);
        p.beginShape();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          p.vertex(Math.cos(a) * size, Math.sin(a) * size);
        }
        p.endShape(p.CLOSE);
        p.pop();
      }
    }

    if (op instanceof Mirror) {
      // Línea de espejo
      const pt = L.uvToXY(op.pu, op.pv);
      const len = 150;
      p.stroke(0, 200, 255);
      p.strokeWeight(1.5);
      p.push();
      p.translate(pt.x, pt.y);
      p.rotate(op.phi);
      p.line(-len, 0, len, 0);
      p.pop();
    }

    if (op instanceof Glide) {
      // Línea discontinua para glide
      const pt = L.uvToXY(op.pu, op.pv);
      const len = 150;
      p.stroke(255, 100, 200);
      p.strokeWeight(1.5);
      p.push();
      p.translate(pt.x, pt.y);
      p.rotate(op.phi);
      // Línea discontinua
      p.drawingContext.setLineDash([8, 4]);
      p.line(-len, 0, len, 0);
      p.drawingContext.setLineDash([]);
      p.pop();

      // Flecha de desplazamiento
      const shift = L.uvToXY(op.du, op.dv);
      p.stroke(255, 100, 200);
      p.line(pt.x, pt.y, pt.x + shift.x * 0.5, pt.y + shift.y * 0.5);
    }
  }
}

// ============================================
// RENDER PRINCIPAL
// ============================================
function renderWallpaper(p, group, params, t) {
  const L = new Lattice(group.lattice, params);
  const ops = group.buildOps(params, L);
  const palette = PALETTES[params.colorScheme % PALETTES.length];

  const r = L.estimateRange(p.width, p.height);

  // Renderizado de celdas
  for (let j = r.jMin; j <= r.jMax; j++) {
    for (let i = r.iMin; i <= r.iMax; i++) {
      const o = L.cellToWorld(i, j);

      p.push();
      p.translate(o.x, o.y);

      // Aplicar cada operador y dibujar el motivo
      for (const op of ops) {
        p.push();
        op.apply(p, L);
        drawMotif(p, L, params, t);
        p.pop();
      }

      // Debug de celda (solo en algunas celdas para no saturar)
      if (params.debugCell && Math.abs(i) <= 2 && Math.abs(j) <= 2) {
        drawCellDebug(p, L, palette);
      }

      p.pop();
    }
  }

  // Renderizado centrado extra para cmm
  if (group.centered) {
    for (let j = r.jMin; j <= r.jMax; j++) {
      for (let i = r.iMin; i <= r.iMax; i++) {
        // Celda offset en (i+0.5, j+0.5)
        const ox = L.cellToWorld(i, j);
        const offset = L.uvToXY(0.5, 0.5);
        const o = { x: ox.x + offset.x, y: ox.y + offset.y };

        p.push();
        p.translate(o.x, o.y);

        for (const op of ops) {
          p.push();
          op.apply(p, L);
          drawMotif(p, L, params, t);
          p.pop();
        }

        p.pop();
      }
    }
  }

  // Debug de simetrías (solo en celda central)
  if (params.debugSym) {
    p.push();
    p.translate(p.width / 2, p.height / 2);
    const centerCell = L.cellToWorld(0, 0);
    p.translate(-centerCell.x, -centerCell.y);
    drawSymDebug(p, L, ops, palette);
    p.pop();
  }
}

// ============================================
// UI: DIBUJAR INFO
// ============================================
function drawUI(p, group, params) {
  const palette = PALETTES[params.colorScheme % PALETTES.length];

  p.push();
  p.resetMatrix();

  // Panel semi-transparente
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(10, 10, 280, 218, 8);

  // Texto
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);

  let y = 20;
  const x = 20;
  const lineH = 18;

  p.textStyle(p.BOLD);
  p.text(`Grupo: ${group.name}`, x, y);
  y += lineH + 5;

  p.textStyle(p.NORMAL);
  p.textSize(12);

  p.text(`[/] Grupo: ${params.groupIndex + 1}/17`, x, y);
  y += lineH;
  p.text(`[-/+] Tamaño celda: ${params.cellSize}`, x, y);
  y += lineH;
  p.text(`[A/D] Ángulo: ${(params.angle * 180 / Math.PI).toFixed(0)}°`, x, y);
  y += lineH;
  p.text(`[W/S] Aspecto: ${params.aspect.toFixed(2)}`, x, y);
  y += lineH;
  p.text(`[G/H] Glide shift: ${params.glideShift.toFixed(2)}`, x, y);
  y += lineH;
  p.text(`[R] Seed: ${params.seed}`, x, y);
  y += lineH;
  p.text(`[C] Debug celda: ${params.debugCell ? 'ON' : 'OFF'}`, x, y);
  y += lineH;
  p.text(`[V] Debug simetría: ${params.debugSym ? 'ON' : 'OFF'}`, x, y);
  y += lineH;
  p.text(`[P] Animación: ${params.animate ? 'ON' : 'OFF'}`, x, y);
  y += lineH;
  p.text(`[E] Guardar PNG | [I] Ocultar panel`, x, y);

  p.pop();
}

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  let startTime = null;

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);

    setupRecorder(p, LOOP_DURATION, FPS);

    console.log('🔷 Sketch 15: Motor de 17 Wallpaper Groups');
    console.log('   [/] Cambiar grupo');
    console.log('   [-/+] Tamaño de celda');
    console.log('   [A/D] Ángulo (oblique/rhombic/hex)');
    console.log('   [W/S] Aspecto (rect)');
    console.log('   [G/H] Glide shift');
    console.log('   [R] Nueva seed');
    console.log('   [C] Toggle debug celda');
    console.log('   [V] Toggle debug simetría');
    console.log('   [P] Toggle animación');
    console.log('   [1-6] Cambiar paleta de colores');
  };

  p.draw = () => {
    const t = loop.frameProgress(p);
    
    // Rotación automática del grupo cada 3 segundos
    if (startTime === null) startTime = p.millis();
    const GROUP_ROTATION_INTERVAL = 3; // segundos
    const elapsedSeconds = (p.millis() - startTime) / 1000;
    const autoGroupIndex = Math.floor(elapsedSeconds / GROUP_ROTATION_INTERVAL) % GROUPS.length;
    params.groupIndex = autoGroupIndex;
    
    const group = GROUPS[params.groupIndex];
    const palette = PALETTES[params.colorScheme % PALETTES.length];

    // Fondo
    p.background(palette.bg);

    // Centrar el origen
    p.push();
    p.translate(p.width / 2, p.height / 2);

    // Renderizar el wallpaper
    renderWallpaper(p, group, params, t);

    p.pop();

    // UI
    if (params.showUI) {
      drawUI(p, group, params);
    }
  };

  p.keyPressed = () => {
    // Navegación de grupos
    if (p.key === '[' || p.key === '{') {
      params.groupIndex = (params.groupIndex - 1 + GROUPS.length) % GROUPS.length;
      // Reiniciar timer para que la rotación automática continúe desde este grupo
      startTime = p.millis() - (params.groupIndex * 3 * 1000);
      console.log(`Grupo: ${GROUPS[params.groupIndex].name}`);
    }
    if (p.key === ']' || p.key === '}') {
      params.groupIndex = (params.groupIndex + 1) % GROUPS.length;
      // Reiniciar timer para que la rotación automática continúe desde este grupo
      startTime = p.millis() - (params.groupIndex * 3 * 1000);
      console.log(`Grupo: ${GROUPS[params.groupIndex].name}`);
    }

    // Tamaño de celda
    if (p.key === '-' || p.key === '_') {
      params.cellSize = Math.max(40, params.cellSize - 10);
    }
    if (p.key === '=' || p.key === '+') {
      params.cellSize = Math.min(200, params.cellSize + 10);
    }

    // Ángulo
    if (p.key === 'a' || p.key === 'A') {
      params.angle = Math.max(Math.PI / 6, params.angle - Math.PI / 18);
    }
    if (p.key === 'd' || p.key === 'D') {
      params.angle = Math.min(Math.PI * 5 / 6, params.angle + Math.PI / 18);
    }

    // Aspecto
    if (p.key === 's') {
      params.aspect = Math.max(0.5, params.aspect - 0.1);
    }
    if (p.key === 'w') {
      params.aspect = Math.min(3, params.aspect + 0.1);
    }

    // Glide shift
    if (p.key === 'g' || p.key === 'G') {
      params.glideShift = Math.max(0.1, params.glideShift - 0.1);
    }
    if (p.key === 'h' || p.key === 'H') {
      params.glideShift = Math.min(0.9, params.glideShift + 0.1);
    }

    // Seed
    if (p.key === 'r' || p.key === 'R') {
      params.seed = Math.floor(Math.random() * 10000);
      console.log(`Nueva seed: ${params.seed}`);
    }

    // Debug toggles
    if (p.key === 'c' || p.key === 'C') {
      params.debugCell = !params.debugCell;
    }
    if (p.key === 'v' || p.key === 'V') {
      params.debugSym = !params.debugSym;
    }

    // Animación toggle
    if (p.key === 'p' || p.key === 'P') {
      params.animate = !params.animate;
    }

    // Ocultar/mostrar UI
    if (p.key === 'i' || p.key === 'I') {
      params.showUI = !params.showUI;
    }

    // Paletas de color (1-6)
    if (p.key >= '1' && p.key <= '6') {
      params.colorScheme = parseInt(p.key) - 1;
    }

    // Captura PNG
    if (p.key === 'e' || p.key === 'E') {
      const group = GROUPS[params.groupIndex];
      const filename = `wallpaper-${group.id}-${params.seed}`;
      p.saveCanvas(filename, 'png');
      console.log(`📷 Imagen guardada: ${filename}.png`);
    }

    // Grabación
    if (p.key === 'S') {
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
