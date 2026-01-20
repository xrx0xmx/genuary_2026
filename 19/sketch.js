// Genuary 2026 - Día 19: "16x16"
// Sistema de grid 16×16 con intercambios gráciles y animaciones especiales

// ============================================================
// PARÁMETROS CONFIGURABLES
// ============================================================
const CONFIG = {
  GRID: 16,
  tilePadding: 3,

  // Movimiento
  swapAttemptsPerTick: 8,
  tickInterval: 10, // frames entre intentos de swap
  curveAmp: 0.25, // multiplicador del tileSize para la curva
  durationMin: 300, // ms
  durationMax: 450,

  // FX
  popAmp: 0.25,
  rotAmp: Math.PI * 0.5,
  trailCount: 3,
  specialBoost: 1.5,
  specialDurationMultiplier: 1.3,

  // Evolución de super elementos
  swapsForLevel2: 5,
  swapsForLevel3: 10,
  swapsForLevel4: 15,
  enhancedAuraDuration: 900, // 15 segundos en ms (60fps * 15)

  // Singularidad (alineación de 3 super elementos)
  singularityNewSuperMin: 4,
  singularityNewSuperMax: 6,
  singularityDuration: 2400, // 4 segundos
  singularityParticleCount: 25,

  // Búsqueda de pares
  randomSwapChance: 0.7, // 70% random, 30% busca iguales

  // Modos de Final (Cuadrado 2x2 de super elementos)
  titanDevourInterval: 5000, // ms entre devoradas
  titanMaxDevours: 4, // devoradas antes de colapso
  nucleoPulseDuration: 3000, // ms entre pulsos
  nucleoMaxPulses: 6, // pulsos antes de colapso
  tetrameroDomainInterval: 4000, // ms entre conversiones
  tetrameroAbsorptionRadius: 4, // tiles de radio inicial
  tetrameroGrowthPerAbsorb: 0.1, // 10% crecimiento por absorción
  tetrameroAbsorbsForFission: 8, // absorciones antes de explosión

  // Debug
  showGridLines: false,
  showActiveSwaps: false
};

// ============================================================
// PALETAS
// ============================================================
const PALETTES = [
  {
    name: "Mono Ink",
    bg: "#F5F1E8",
    shapes: ["#1A1A1A", "#4A4A4A", "#6A6A6A", "#2A2A2A"],
    accent: "#D32F2F"
  },
  {
    name: "Neo Pastel",
    bg: "#E6D5F5",
    shapes: ["#FFB6C1", "#B5EAD7", "#FFE6A7", "#C7CEEA"],
    accent: "#FFD700"
  },
  {
    name: "Cyber Night",
    bg: "#0A0A0F",
    shapes: ["#00FFFF", "#FF00FF", "#CCFF00", "#9D4EDD"],
    accent: "#FFFFFF"
  },
  {
    name: "Earth Print",
    bg: "#F0EBE3",
    shapes: ["#CB6843", "#5F7161", "#4A6FA5", "#D4A574"],
    accent: "#FF6F61"
  },
  {
    name: "Mint Dream",
    bg: "#F0FFF4",
    shapes: ["#48BB78", "#ED8936", "#4299E1", "#9F7AEA"],
    accent: "#FC8181"
  }
];

let currentPaletteIndex = 0;
let currentPalette;

// ============================================================
// ESTADO GLOBAL
// ============================================================
let grid = []; // matriz 16x16 de referencias a tiles
let tiles = []; // array de todos los tiles
let activeSwaps = [];
let lockedTiles = new Set();
let superAlignments = []; // animaciones de super alineación activas
let singularities = []; // animaciones de singularidad (3 super elementos)
let particles = []; // partículas de efectos
let tileSize;
let offsetX, offsetY;
let frameCounter = 0;
let paused = false;

// UI y grabación
let showHUD = true;
let isRecording = false;
let videoRecorder;

// Modo de Final: null, 'titan', 'nucleo', 'tetramero'
let finalMode = null;
let titans = []; // Array de Titanes activos
let nucleos = []; // Array de Núcleos activos
let tetrameros = []; // Array de Tetrámeros activos

// ============================================================
// EASING FUNCTIONS
// ============================================================
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// ============================================================
// CLASE TILE
// ============================================================
class Tile {
  constructor(i, j, shapeType) {
    this.gridI = i;
    this.gridJ = j;
    this.shapeType = shapeType; // 0: círculo, 1: cuadrado, 2: triángulo, 3: cruz
    this.isSuper = false; // super elemento (resultado de alineación de 3)
    this.isSingular = false; // elemento singular (resultado de 3 super elementos)
    this.isTitan = false; // parte de un Titan (cuadrado 2x2)
    this.isNucleo = false; // parte de un Núcleo (cuadrado 2x2)
    this.isTetramero = false; // parte de un Tetrámero (cuadrado 2x2)
    this.superLevel = 0; // 0: normal, 1-4: niveles de evolución
    this.swapCount = 0; // contador de swaps participados (para evolución)
    this.isEnhanced = false; // efecto temporal de "radiación"
    this.enhancedUntil = 0; // timestamp cuando termina el efecto
    this.seed = Math.random();
    this.worldX = 0;
    this.worldY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.animState = "idle"; // idle, swapping, vanishing
    this.currentSwap = null;

    this.updateTargetPosition();
  }

  updateTargetPosition() {
    this.targetX = offsetX + this.gridJ * tileSize + tileSize / 2;
    this.targetY = offsetY + this.gridI * tileSize + tileSize / 2;
    if (this.animState === "idle") {
      this.worldX = this.targetX;
      this.worldY = this.targetY;
    }
  }

  update() {
    // Actualizar nivel de super elemento basado en swaps
    if (this.isSuper) {
      if (this.swapCount >= CONFIG.swapsForLevel4) {
        this.superLevel = 4;
      } else if (this.swapCount >= CONFIG.swapsForLevel3) {
        this.superLevel = 3;
      } else if (this.swapCount >= CONFIG.swapsForLevel2) {
        this.superLevel = 2;
      } else {
        this.superLevel = 1;
      }
    }

    // Verificar si el efecto enhanced ha expirado
    if (this.isEnhanced && millis() > this.enhancedUntil) {
      this.isEnhanced = false;
    }
  }

  draw() {
    push();
    translate(this.worldX, this.worldY);

    let rot = 0;
    let scl = 1;
    let strokeW = 2;
    let alpha = 255;
    let col = currentPalette.shapes[this.shapeType];

    // Aplicar distorsión gravitacional si hay super elementos nivel 4 cerca
    if (!this.isSuper) {
      const gravScale = getGravitationalScale(this);
      scl *= gravScale;
    }

    // Si está en swap, aplicar FX
    if (this.currentSwap) {
      const swap = this.currentSwap;
      const e = swap.getProgress();

      // Animación normal
      rot = CONFIG.rotAmp * Math.sin(Math.PI * e);
      scl = 1 + CONFIG.popAmp * Math.sin(Math.PI * e);
      strokeW = 2 * (1 + 0.3 * Math.sin(Math.PI * e));

      // Si es especial, aplicar boost y color acento
      if (swap.isSpecial) {
        const merge = 1 - Math.abs(2 * e - 0.5);
        if (merge > 0.3) {
          col = lerpColor(color(col), color(currentPalette.accent), merge * 0.7);
          scl *= (1 + CONFIG.specialBoost * merge * 0.2);
        }
      }

      // Trail (copias fantasma) - mejorado si está enhanced
      const trailCountAdjusted = this.isEnhanced ? CONFIG.trailCount + 2 : CONFIG.trailCount;
      if (trailCountAdjusted > 0 && e < 0.8) {
        for (let i = 1; i <= trailCountAdjusted; i++) {
          const trailE = Math.max(0, e - i * 0.08);
          const trailPos = swap.getPosition(this, trailE);
          const baseAlpha = this.isEnhanced ? 60 : 40;
          const trailAlpha = baseAlpha * (1 - i / trailCountAdjusted);

          push();
          translate(trailPos.x - this.worldX, trailPos.y - this.worldY);
          this.drawShape(col, trailAlpha, strokeW * 0.7, 1, 0);
          pop();
        }
      }
    }

    // Efectos enhanced (radiación de nivel 3+)
    if (this.isEnhanced) {
      const glowPulse = sin(frameCount * 0.1) * 0.15 + 0.15;
      scl *= (1 + glowPulse);

      // Aura brillante
      noFill();
      const auraCol = color(currentPalette.accent);
      auraCol.setAlpha(60 + glowPulse * 100);
      stroke(auraCol);
      strokeWeight(2);
      circle(0, 0, tileSize * 0.8 * (1 + glowPulse));
    }

    // Micro-ruido
    const noiseRot = (noise(this.seed * 1000 + frameCount * 0.01) - 0.5) * 0.05;
    const noiseScl = 1 + (noise(this.seed * 2000 + frameCount * 0.01) - 0.5) * 0.02;

    rotate(rot + noiseRot);
    scale(scl * noiseScl);

    this.drawShape(col, alpha, strokeW, scl, rot);

    // Dibujar efectos de nivel de super elemento
    if (this.isSuper && this.superLevel > 1) {
      this.drawEvolutionEffects();
    }

    // Dibujar efectos de elemento singular
    if (this.isSingular) {
      this.drawSingularEffects();
    }

    pop();
  }

  drawShape(col, alpha, strokeW, scl, rot) {
    const size = (tileSize - CONFIG.tilePadding * 2) * 0.6;

    stroke(col);
    fill(col);
    strokeWeight(strokeW);

    // Ajustar alpha
    const c = color(col);
    c.setAlpha(alpha);
    stroke(c);
    fill(c);

    // Si es elemento singular, dibujar versión singular
    if (this.isSingular) {
      this.drawSingularShape(c, size, strokeW);
      return;
    }

    // Si es super elemento, dibujar versión especial
    if (this.isSuper) {
      this.drawSuperShape(c, size, strokeW);
      return;
    }

    switch (this.shapeType) {
      case 0: // Círculo
        noFill();
        circle(0, 0, size);
        break;

      case 1: // Cuadrado
        rectMode(CENTER);
        noFill();
        square(0, 0, size);
        break;

      case 2: // Triángulo
        noFill();
        beginShape();
        for (let i = 0; i < 3; i++) {
          const angle = -Math.PI / 2 + i * Math.PI * 2 / 3;
          const x = Math.cos(angle) * size / 2;
          const y = Math.sin(angle) * size / 2;
          vertex(x, y);
        }
        endShape(CLOSE);
        break;

      case 3: // Cruz
        noFill();
        const crossSize = size / 2;
        const crossThick = size / 6;
        line(-crossSize, 0, crossSize, 0);
        line(0, -crossSize, 0, crossSize);
        break;
    }
  }

  drawSuperShape(c, size, strokeW) {
    // Super formas: versión mejorada de cada forma
    stroke(c);
    strokeWeight(strokeW * 1.5);

    const superSize = size * 1.2;
    const pulse = sin(frameCount * 0.05) * 0.1 + 1;

    switch (this.shapeType) {
      case 0: // Super Círculo: doble anillo
        noFill();
        circle(0, 0, superSize * pulse);
        circle(0, 0, superSize * 0.6 * pulse);
        break;

      case 1: // Super Cuadrado: cuadrado rotado + normal
        push();
        rectMode(CENTER);
        noFill();
        square(0, 0, superSize * pulse);
        rotate(Math.PI / 4);
        square(0, 0, superSize * 0.7 * pulse);
        pop();
        break;

      case 2: // Super Triángulo: estrella de 3 puntas
        noFill();
        beginShape();
        for (let i = 0; i < 6; i++) {
          const angle = -Math.PI / 2 + i * Math.PI / 3;
          const r = (i % 2 === 0) ? superSize / 2 : superSize / 4;
          const x = Math.cos(angle) * r * pulse;
          const y = Math.sin(angle) * r * pulse;
          vertex(x, y);
        }
        endShape(CLOSE);
        break;

      case 3: // Super Cruz: cruz con diagonales
        noFill();
        const scs = superSize / 2 * pulse;
        // Cruz normal
        line(-scs, 0, scs, 0);
        line(0, -scs, 0, scs);
        // Diagonales
        const d = scs * 0.7;
        line(-d, -d, d, d);
        line(-d, d, d, -d);
        break;
    }
  }

  drawEvolutionEffects() {
    const baseSize = tileSize * 0.4;

    // Nivel 2: Anillo orbital con micro-formas
    if (this.superLevel >= 2) {
      const orbitRadius = baseSize * 1.3;
      const orbitSpeed = frameCount * 0.03;
      const numOrbiters = 3;

      noFill();
      stroke(currentPalette.accent);
      const orbitCol = color(currentPalette.accent);
      orbitCol.setAlpha(100);
      stroke(orbitCol);
      strokeWeight(1);
      circle(0, 0, orbitRadius * 2);

      // Micro-formas orbitando
      for (let i = 0; i < numOrbiters; i++) {
        const angle = orbitSpeed + (i * Math.PI * 2 / numOrbiters);
        const x = Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius;

        push();
        translate(x, y);
        orbitCol.setAlpha(150);
        stroke(orbitCol);
        strokeWeight(1.5);
        const miniSize = 4;

        // Mini versión de la forma
        switch (this.shapeType) {
          case 0: circle(0, 0, miniSize); break;
          case 1: square(-miniSize/2, -miniSize/2, miniSize); break;
          case 2:
            triangle(0, -miniSize/2, -miniSize/2, miniSize/2, miniSize/2, miniSize/2);
            break;
          case 3:
            line(-miniSize/2, 0, miniSize/2, 0);
            line(0, -miniSize/2, 0, miniSize/2);
            break;
        }
        pop();
      }
    }

    // Nivel 3: "Radioactivo" - no se dibuja aquí, se aplica a tiles cercanos
    // (ver método applyRadioactiveEffect)

    // Nivel 4: Distorsión gravitacional
    if (this.superLevel >= 4) {
      // Anillos de distorsión espacial
      const numRings = 3;
      for (let i = 0; i < numRings; i++) {
        const ringPhase = (frameCount * 0.02 + i * 0.3) % 1;
        const ringRadius = baseSize * (1.5 + ringPhase * 0.8);
        const ringAlpha = 80 * (1 - ringPhase);

        noFill();
        const distortCol = color(currentPalette.accent);
        distortCol.setAlpha(ringAlpha);
        stroke(distortCol);
        strokeWeight(2 - ringPhase);
        circle(0, 0, ringRadius * 2);
      }
    }
  }

  drawSingularShape(c, size, strokeW) {
    // Forma singular: geometría híbrida evolucionada
    stroke(c);
    strokeWeight(strokeW * 2);

    const singularSize = size * 1.4;
    const pulse = sin(frameCount * 0.03) * 0.15 + 1;

    // Forma base según tipo original
    switch (this.shapeType) {
      case 0: // Círculo Singular: mandala de círculos concéntricos
        noFill();
        for (let i = 0; i < 4; i++) {
          const r = singularSize * (0.3 + i * 0.25) * pulse;
          circle(0, 0, r);
        }
        // Círculos cardinales
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
          const x = Math.cos(a) * singularSize * 0.5;
          const y = Math.sin(a) * singularSize * 0.5;
          circle(x, y, singularSize * 0.2);
        }
        break;

      case 1: // Cuadrado Singular: cubo en rotación continua
        push();
        rectMode(CENTER);
        noFill();
        const rotSpeed = frameCount * 0.02;
        for (let i = 0; i < 3; i++) {
          push();
          rotate(rotSpeed + i * Math.PI / 6);
          square(0, 0, singularSize * (0.7 + i * 0.15) * pulse);
          pop();
        }
        pop();
        break;

      case 2: // Triángulo Singular: estrella compleja
        noFill();
        const points = 12;
        beginShape();
        for (let i = 0; i < points; i++) {
          const angle = -Math.PI / 2 + i * Math.PI * 2 / points;
          const r = (i % 2 === 0) ? singularSize * 0.6 : singularSize * 0.3;
          const x = Math.cos(angle) * r * pulse;
          const y = Math.sin(angle) * r * pulse;
          vertex(x, y);
        }
        endShape(CLOSE);
        break;

      case 3: // Cruz Singular: estrella de 8 puntas
        noFill();
        const sSize = singularSize * 0.6 * pulse;
        // Cruz principal
        line(-sSize, 0, sSize, 0);
        line(0, -sSize, 0, sSize);
        // Diagonales
        const d = sSize * 0.85;
        line(-d, -d, d, d);
        line(-d, d, d, -d);
        // Puntas exteriores
        const pLen = sSize * 0.3;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const x1 = Math.cos(a) * sSize * 0.7;
          const y1 = Math.sin(a) * sSize * 0.7;
          const x2 = Math.cos(a) * (sSize + pLen);
          const y2 = Math.sin(a) * (sSize + pLen);
          line(x1, y1, x2, y2);
        }
        break;
    }
  }

  drawSingularEffects() {
    const baseSize = tileSize * 0.5;

    // Campo de fuerza permanente - anillo pulsante constante
    const fieldPulse = sin(frameCount * 0.04) * 0.2 + 0.8;
    const fieldRadius = baseSize * 2 * fieldPulse;

    noFill();
    const fieldCol = color(currentPalette.accent);
    fieldCol.setAlpha(120 * fieldPulse);
    stroke(fieldCol);
    strokeWeight(3);
    circle(0, 0, fieldRadius);

    // Segundo anillo en contra-fase
    const fieldPulse2 = sin(frameCount * 0.04 + Math.PI) * 0.2 + 0.8;
    const fieldRadius2 = baseSize * 1.5 * fieldPulse2;
    fieldCol.setAlpha(80 * fieldPulse2);
    strokeWeight(2);
    circle(0, 0, fieldRadius2);

    // Rayos energéticos giratorios
    strokeWeight(1.5);
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = frameCount * 0.02 + i * Math.PI * 2 / rayCount;
      const r1 = baseSize;
      const r2 = baseSize * 1.6;
      const rayAlpha = (sin(frameCount * 0.05 + i) * 0.5 + 0.5) * 150;
      fieldCol.setAlpha(rayAlpha);
      stroke(fieldCol);
      line(
        Math.cos(angle) * r1,
        Math.sin(angle) * r1,
        Math.cos(angle) * r2,
        Math.sin(angle) * r2
      );
    }
  }
}

// ============================================================
// CLASE SWAP
// ============================================================
class Swap {
  constructor(tileA, tileB) {
    this.tileA = tileA;
    this.tileB = tileB;
    this.startTime = millis();
    this.isSpecial = tileA.shapeType === tileB.shapeType;

    const baseDuration = random(CONFIG.durationMin, CONFIG.durationMax);
    this.duration = this.isSpecial
      ? baseDuration * CONFIG.specialDurationMultiplier
      : baseDuration;

    // Calcular trayectoria curva
    this.startA = { x: tileA.worldX, y: tileA.worldY };
    this.startB = { x: tileB.worldX, y: tileB.worldY };
    this.endA = { x: tileB.worldX, y: tileB.worldY };
    this.endB = { x: tileA.worldX, y: tileA.worldY };

    // Vector perpendicular para curva
    const dx = this.endA.x - this.startA.x;
    const dy = this.endA.y - this.startA.y;
    this.perpX = -dy;
    this.perpY = dx;
    const len = Math.sqrt(this.perpX * this.perpX + this.perpY * this.perpY);
    if (len > 0) {
      this.perpX /= len;
      this.perpY /= len;
    }
    this.curveAmount = CONFIG.curveAmp * tileSize;

    // Marcar tiles como swapping
    tileA.animState = "swapping";
    tileB.animState = "swapping";
    tileA.currentSwap = this;
    tileB.currentSwap = this;
  }

  getProgress() {
    const elapsed = millis() - this.startTime;
    return constrain(elapsed / this.duration, 0, 1);
  }

  getPosition(tile, progress = null) {
    const e = progress !== null ? progress : this.getProgress();
    const eased = easeInOutCubic(e);

    const isA = tile === this.tileA;
    const start = isA ? this.startA : this.startB;
    const end = isA ? this.endA : this.endB;

    // Interpolación lineal
    let x = lerp(start.x, end.x, eased);
    let y = lerp(start.y, end.y, eased);

    // Añadir curva
    const curveOffset = this.curveAmount * Math.sin(Math.PI * eased);
    x += this.perpX * curveOffset;
    y += this.perpY * curveOffset;

    return { x, y };
  }

  update() {
    const e = this.getProgress();

    // Actualizar posiciones
    const posA = this.getPosition(this.tileA, e);
    const posB = this.getPosition(this.tileB, e);

    this.tileA.worldX = posA.x;
    this.tileA.worldY = posA.y;
    this.tileB.worldX = posB.x;
    this.tileB.worldY = posB.y;

    // Dibujar flash especial en el punto medio
    if (this.isSpecial && e >= 0.4 && e <= 0.6) {
      this.drawSpecialFlash(e);
    }

    return e >= 1;
  }

  drawSpecialFlash(e) {
    const merge = 1 - Math.abs(2 * e - 1);
    const midX = (this.startA.x + this.endA.x) / 2;
    const midY = (this.startA.y + this.endA.y) / 2;

    push();
    translate(midX, midY);

    const radius = tileSize * (0.2 + 0.8 * merge);
    const alpha = 180 * merge;

    // Anillo expansivo
    noFill();
    stroke(currentPalette.accent);
    const c = color(currentPalette.accent);
    c.setAlpha(alpha);
    stroke(c);
    strokeWeight(3 + 2 * merge);
    circle(0, 0, radius);

    // Líneas radiales
    strokeWeight(1.5);
    c.setAlpha(alpha * 0.5);
    stroke(c);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const r1 = radius * 0.3;
      const r2 = radius * 0.7;
      line(
        Math.cos(angle) * r1,
        Math.sin(angle) * r1,
        Math.cos(angle) * r2,
        Math.sin(angle) * r2
      );
    }

    pop();
  }

  complete() {
    // Incrementar contador de swaps si son super elementos
    if (this.tileA.isSuper) {
      this.tileA.swapCount++;
    }
    if (this.tileB.isSuper) {
      this.tileB.swapCount++;
    }

    // Efecto radioactivo (Nivel 3+): tiles que pasan cerca adquieren aura
    if (this.tileA.isSuper && this.tileA.superLevel >= 3 && !this.tileB.isSuper) {
      this.tileB.isEnhanced = true;
      this.tileB.enhancedUntil = millis() + CONFIG.enhancedAuraDuration;
    }
    if (this.tileB.isSuper && this.tileB.superLevel >= 3 && !this.tileA.isSuper) {
      this.tileA.isEnhanced = true;
      this.tileA.enhancedUntil = millis() + CONFIG.enhancedAuraDuration;
    }

    // Intercambiar posiciones en el grid
    const tempI = this.tileA.gridI;
    const tempJ = this.tileA.gridJ;

    this.tileA.gridI = this.tileB.gridI;
    this.tileA.gridJ = this.tileB.gridJ;
    this.tileB.gridI = tempI;
    this.tileB.gridJ = tempJ;

    // Actualizar referencias en la matriz
    grid[this.tileA.gridI][this.tileA.gridJ] = this.tileA;
    grid[this.tileB.gridI][this.tileB.gridJ] = this.tileB;

    // Actualizar targets
    this.tileA.updateTargetPosition();
    this.tileB.updateTargetPosition();

    // Resetear estado
    this.tileA.animState = "idle";
    this.tileB.animState = "idle";
    this.tileA.currentSwap = null;
    this.tileB.currentSwap = null;

    // Verificar alineaciones de 3
    checkAlignments();

    // Verificar cuadrados 2x2 si hay un modo final activo
    if (finalMode) {
      checkSquareFormations();
    }
  }
}

// ============================================================
// CLASE SUPER ALIGNMENT
// ============================================================
class SuperAlignment {
  constructor(centerTile, sideTiles) {
    this.centerTile = centerTile;
    this.sideTiles = sideTiles; // array de 2 tiles laterales
    this.startTime = millis();
    this.duration = 1200; // animación más larga y dramática

    // Marcar tiles
    centerTile.animState = "aligning";
    for (const tile of sideTiles) {
      tile.animState = "vanishing";
    }

    // Bloquear tiles
    lockedTiles.add(centerTile);
    for (const tile of sideTiles) {
      lockedTiles.add(tile);
    }
  }

  getProgress() {
    const elapsed = millis() - this.startTime;
    return constrain(elapsed / this.duration, 0, 1);
  }

  update() {
    const e = this.getProgress();

    // Fase 1 (0-0.4): tiles laterales se desvanecen y viajan hacia el centro
    if (e < 0.4) {
      const phaseT = e / 0.4;
      const eased = easeInOutCubic(phaseT);

      for (const tile of this.sideTiles) {
        // Mover hacia el centro
        tile.worldX = lerp(tile.targetX, this.centerTile.targetX, eased);
        tile.worldY = lerp(tile.targetY, this.centerTile.targetY, eased);
      }
    }

    // Fase 2 (0.4-1.0): tile central se transforma en super
    if (e >= 0.4 && !this.centerTile.isSuper) {
      this.centerTile.isSuper = true;
    }

    return e >= 1;
  }

  draw() {
    const e = this.getProgress();

    // Explosión de energía desde el centro
    if (e >= 0.3 && e <= 0.7) {
      const burstT = (e - 0.3) / 0.4;
      const radius = tileSize * 2 * burstT;
      const alpha = 255 * (1 - burstT);

      push();
      translate(this.centerTile.worldX, this.centerTile.worldY);

      // Círculos expansivos
      noFill();
      const c = color(currentPalette.accent);
      c.setAlpha(alpha);
      stroke(c);
      strokeWeight(3);
      circle(0, 0, radius);
      circle(0, 0, radius * 0.7);

      // Líneas radiales giratorias
      strokeWeight(2);
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6 + frameCount * 0.1;
        const r1 = radius * 0.2;
        const r2 = radius * 0.5;
        c.setAlpha(alpha * 0.7);
        stroke(c);
        line(
          Math.cos(angle) * r1,
          Math.sin(angle) * r1,
          Math.cos(angle) * r2,
          Math.sin(angle) * r2
        );
      }

      pop();
    }
  }

  complete() {
    // Los tiles laterales desaparecen, reemplazarlos con tiles nuevos random
    for (const tile of this.sideTiles) {
      const i = tile.gridI;
      const j = tile.gridJ;

      // Crear nuevo tile con forma aleatoria
      const newShapeType = Math.floor(Math.random() * 4);
      const newTile = new Tile(i, j, newShapeType);

      grid[i][j] = newTile;

      // Reemplazar en el array de tiles
      const idx = tiles.indexOf(tile);
      if (idx !== -1) {
        tiles[idx] = newTile;
      }

      lockedTiles.delete(tile);
    }

    // Desbloquear centro
    this.centerTile.animState = "idle";
    lockedTiles.delete(this.centerTile);
  }
}

// ============================================================
// CLASE SINGULARITY ALIGNMENT (3 Super Elementos)
// ============================================================
class SingularityAlignment {
  constructor(centerTile, sideTiles) {
    this.centerTile = centerTile;
    this.sideTiles = sideTiles; // array de 2 tiles laterales (todos super)
    this.startTime = millis();
    this.duration = CONFIG.singularityDuration;
    this.shapeType = centerTile.shapeType;

    // Marcar tiles
    centerTile.animState = "singularity";
    for (const tile of sideTiles) {
      tile.animState = "vanishing";
    }

    // Bloquear tiles
    lockedTiles.add(centerTile);
    for (const tile of sideTiles) {
      lockedTiles.add(tile);
    }

    // Crear partículas de explosión
    this.createParticles();
  }

  createParticles() {
    const centerX = this.centerTile.worldX;
    const centerY = this.centerTile.worldY;

    for (let i = 0; i < CONFIG.singularityParticleCount; i++) {
      const angle = random(Math.PI * 2);
      const speed = random(2, 6);
      const life = random(60, 120);

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        maxLife: life,
        size: random(2, 6),
        color: currentPalette.accent,
        alpha: 255
      });
    }
  }

  getProgress() {
    const elapsed = millis() - this.startTime;
    return constrain(elapsed / this.duration, 0, 1);
  }

  update() {
    const e = this.getProgress();

    // Fase 1 (0-0.25): Implosión - todos se contraen hacia el centro
    if (e < 0.25) {
      const phaseT = e / 0.25;
      const eased = easeInOutCubic(phaseT);

      for (const tile of this.sideTiles) {
        tile.worldX = lerp(tile.targetX, this.centerTile.targetX, eased);
        tile.worldY = lerp(tile.targetY, this.centerTile.targetY, eased);
      }
    }

    // Fase 2 (0.25-0.5): Fusión nuclear - explosión masiva
    // (manejado en draw con partículas)

    // Fase 3 (0.5-1.0): Nacimiento del elemento singular
    if (e >= 0.5 && !this.centerTile.isSingular) {
      this.centerTile.isSingular = true;
      this.centerTile.isSuper = false; // ya no es super, es singular
    }

    return e >= 1;
  }

  draw() {
    const e = this.getProgress();
    const centerX = this.centerTile.worldX;
    const centerY = this.centerTile.worldY;

    // Fase 1 (0-0.25): Implosión visual
    if (e < 0.25) {
      const impT = e / 0.25;
      const radius = tileSize * 3 * (1 - impT);

      push();
      translate(centerX, centerY);

      // Líneas convergentes
      strokeWeight(2);
      const lineCol = color(currentPalette.accent);
      for (let i = 0; i < 16; i++) {
        const angle = i * Math.PI / 8;
        const alpha = 200 * impT;
        lineCol.setAlpha(alpha);
        stroke(lineCol);
        line(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0, 0
        );
      }

      pop();
    }

    // Fase 2 (0.25-0.6): Explosión masiva
    if (e >= 0.25 && e <= 0.6) {
      const burstT = (e - 0.25) / 0.35;
      const radius = tileSize * 6 * burstT;
      const alpha = 255 * (1 - burstT);

      push();
      translate(centerX, centerY);

      // Múltiples círculos expansivos
      noFill();
      const burstCol = color(currentPalette.accent);
      for (let i = 0; i < 5; i++) {
        const r = radius * (0.6 + i * 0.1);
        burstCol.setAlpha(alpha * (1 - i * 0.15));
        stroke(burstCol);
        strokeWeight(4 - i * 0.5);
        circle(0, 0, r);
      }

      // Rayos explosivos
      strokeWeight(3);
      for (let i = 0; i < 24; i++) {
        const angle = i * Math.PI / 12 + burstT * Math.PI;
        const r1 = radius * 0.3;
        const r2 = radius * 0.8;
        burstCol.setAlpha(alpha * 0.8);
        stroke(burstCol);
        line(
          Math.cos(angle) * r1,
          Math.sin(angle) * r1,
          Math.cos(angle) * r2,
          Math.sin(angle) * r2
        );
      }

      pop();
    }

    // Fase 3 (0.5-1.0): Aura de nacimiento
    if (e >= 0.5) {
      const birthT = (e - 0.5) / 0.5;
      const auraRadius = tileSize * 2 * (1 - birthT * 0.5);
      const alpha = 180 * (1 - birthT);

      push();
      translate(centerX, centerY);

      noFill();
      const auraCol = color(currentPalette.accent);
      auraCol.setAlpha(alpha);
      stroke(auraCol);
      strokeWeight(4);
      circle(0, 0, auraRadius);

      auraCol.setAlpha(alpha * 0.5);
      strokeWeight(2);
      circle(0, 0, auraRadius * 1.3);

      pop();
    }
  }

  complete() {
    // Los tiles laterales desaparecen, reemplazarlos con tiles nuevos random
    for (const tile of this.sideTiles) {
      const i = tile.gridI;
      const j = tile.gridJ;

      const newShapeType = Math.floor(Math.random() * 4);
      const newTile = new Tile(i, j, newShapeType);

      grid[i][j] = newTile;

      const idx = tiles.indexOf(tile);
      if (idx !== -1) {
        tiles[idx] = newTile;
      }

      lockedTiles.delete(tile);
    }

    // Sembrar nuevos super elementos (Opción C)
    const numNewSupers = Math.floor(random(CONFIG.singularityNewSuperMin, CONFIG.singularityNewSuperMax + 1));
    const normalTiles = tiles.filter(t => !t.isSuper && !t.isSingular && !lockedTiles.has(t));

    for (let i = 0; i < numNewSupers && normalTiles.length > 0; i++) {
      const idx = Math.floor(Math.random() * normalTiles.length);
      const tile = normalTiles[idx];
      tile.isSuper = true;
      tile.superLevel = 1;
      tile.swapCount = 0;
      normalTiles.splice(idx, 1);
    }

    // Desbloquear centro
    this.centerTile.animState = "idle";
    lockedTiles.delete(this.centerTile);
  }
}

// ============================================================
// GESTIÓN DE SWAPS
// ============================================================
function attemptSwaps() {
  const attempts = CONFIG.swapAttemptsPerTick;
  let created = 0;

  for (let attempt = 0; attempt < attempts && created < attempts / 2; attempt++) {
    let tileA;

    // 70% random, 30% busca iguales
    if (Math.random() < CONFIG.randomSwapChance) {
      // Random
      tileA = random(tiles);
    } else {
      // Busca un tile y luego busca vecino igual
      tileA = random(tiles);
      const neighbors = getNeighbors(tileA);
      const sameType = neighbors.filter(t => t.shapeType === tileA.shapeType);
      if (sameType.length > 0) {
        const targetNeighbor = random(sameType);
        // Ahora intenta swap con este vecino
        if (!lockedTiles.has(tileA) && !lockedTiles.has(targetNeighbor)) {
          createSwap(tileA, targetNeighbor);
          created++;
          continue;
        }
      }
      // Si no encuentra igual, continúa con lógica normal
    }

    if (lockedTiles.has(tileA)) continue;

    const neighbors = getNeighbors(tileA);
    if (neighbors.length === 0) continue;

    const tileB = random(neighbors);
    if (lockedTiles.has(tileB)) continue;

    createSwap(tileA, tileB);
    created++;
  }
}

function getNeighbors(tile) {
  const neighbors = [];
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1] // N, S, O, E
  ];

  for (const [di, dj] of dirs) {
    const ni = tile.gridI + di;
    const nj = tile.gridJ + dj;
    if (ni >= 0 && ni < CONFIG.GRID && nj >= 0 && nj < CONFIG.GRID) {
      neighbors.push(grid[ni][nj]);
    }
  }

  return neighbors;
}

function createSwap(tileA, tileB) {
  const swap = new Swap(tileA, tileB);
  activeSwaps.push(swap);
  lockedTiles.add(tileA);
  lockedTiles.add(tileB);
}

function updateSwaps() {
  for (let i = activeSwaps.length - 1; i >= 0; i--) {
    const swap = activeSwaps[i];
    const done = swap.update();

    if (done) {
      swap.complete();
      lockedTiles.delete(swap.tileA);
      lockedTiles.delete(swap.tileB);
      activeSwaps.splice(i, 1);
    }
  }
}

// ============================================================
// EFECTOS GRAVITACIONALES (NIVEL 4)
// ============================================================
function getGravitationalScale(tile) {
  // Verificar si hay super elementos nivel 4 cerca
  let maxDistortion = 0;

  for (const otherTile of tiles) {
    if (!otherTile.isSuper || otherTile.superLevel < 4) continue;
    if (otherTile === tile) continue;

    // Calcular distancia
    const dx = tile.gridJ - otherTile.gridJ;
    const dy = tile.gridI - otherTile.gridI;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Solo afecta en un radio de 2-3 tiles
    if (dist < 3) {
      const distortion = (3 - dist) / 3; // 1.0 a 0.0
      maxDistortion = Math.max(maxDistortion, distortion);
    }
  }

  // Distorsión sutil: 0% a 15% de escala
  return 1 + maxDistortion * 0.15 * Math.sin(frameCount * 0.05);
}

// ============================================================
// DETECCIÓN DE ALINEACIONES
// ============================================================
function checkAlignments() {
  const checked = new Set();

  for (let i = 0; i < CONFIG.GRID; i++) {
    for (let j = 0; j < CONFIG.GRID; j++) {
      const tile = grid[i][j];
      if (checked.has(tile) || tile.isSingular || lockedTiles.has(tile)) continue;

      const shapeType = tile.shapeType;

      // Verificar horizontal (este tile es el centro)
      if (j > 0 && j < CONFIG.GRID - 1) {
        const left = grid[i][j - 1];
        const right = grid[i][j + 1];

        // SINGULARIDAD: Si los 3 son super elementos
        if (tile.isSuper && left.isSuper && right.isSuper &&
            !lockedTiles.has(left) && !lockedTiles.has(right) &&
            left.shapeType === shapeType && right.shapeType === shapeType) {
          // ¡SINGULARIDAD HORIZONTAL!
          createSingularityAlignment(tile, [left, right]);
          checked.add(tile);
          checked.add(left);
          checked.add(right);
          continue;
        }

        // Alineación normal de 3 tiles normales
        if (!left.isSuper && !right.isSuper && !tile.isSuper &&
            !lockedTiles.has(left) && !lockedTiles.has(right) &&
            left.shapeType === shapeType && right.shapeType === shapeType) {
          // ¡Alineación horizontal!
          createSuperAlignment(tile, [left, right]);
          checked.add(tile);
          checked.add(left);
          checked.add(right);
          continue;
        }
      }

      // Verificar vertical (este tile es el centro)
      if (i > 0 && i < CONFIG.GRID - 1) {
        const top = grid[i - 1][j];
        const bottom = grid[i + 1][j];

        // SINGULARIDAD: Si los 3 son super elementos
        if (tile.isSuper && top.isSuper && bottom.isSuper &&
            !lockedTiles.has(top) && !lockedTiles.has(bottom) &&
            top.shapeType === shapeType && bottom.shapeType === shapeType) {
          // ¡SINGULARIDAD VERTICAL!
          createSingularityAlignment(tile, [top, bottom]);
          checked.add(tile);
          checked.add(top);
          checked.add(bottom);
          continue;
        }

        // Alineación normal de 3 tiles normales
        if (!top.isSuper && !bottom.isSuper && !tile.isSuper &&
            !lockedTiles.has(top) && !lockedTiles.has(bottom) &&
            top.shapeType === shapeType && bottom.shapeType === shapeType) {
          // ¡Alineación vertical!
          createSuperAlignment(tile, [top, bottom]);
          checked.add(tile);
          checked.add(top);
          checked.add(bottom);
          continue;
        }
      }
    }
  }
}

function createSuperAlignment(centerTile, sideTiles) {
  const alignment = new SuperAlignment(centerTile, sideTiles);
  superAlignments.push(alignment);
}

function createSingularityAlignment(centerTile, sideTiles) {
  const singularity = new SingularityAlignment(centerTile, sideTiles);
  singularities.push(singularity);
}

function updateSuperAlignments() {
  for (let i = superAlignments.length - 1; i >= 0; i--) {
    const alignment = superAlignments[i];
    const done = alignment.update();

    if (done) {
      alignment.complete();
      superAlignments.splice(i, 1);
    }
  }
}

function drawSuperAlignments() {
  for (const alignment of superAlignments) {
    alignment.draw();
  }
}

function updateSingularities() {
  for (let i = singularities.length - 1; i >= 0; i--) {
    const singularity = singularities[i];
    const done = singularity.update();

    if (done) {
      singularity.complete();
      singularities.splice(i, 1);
    }
  }
}

function drawSingularities() {
  for (const singularity of singularities) {
    singularity.draw();
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Actualizar posición
    p.x += p.vx;
    p.y += p.vy;

    // Aplicar fricción
    p.vx *= 0.98;
    p.vy *= 0.98;

    // Decrementar vida
    p.life--;

    // Actualizar alpha
    p.alpha = 255 * (p.life / p.maxLife);

    // Eliminar si murió
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    push();
    noStroke();
    const particleCol = color(p.color);
    particleCol.setAlpha(p.alpha);
    fill(particleCol);
    circle(p.x, p.y, p.size);
    pop();
  }
}

// ============================================================
// CLASES DE FINALES (CUADRADOS 2x2)
// ============================================================

// TITAN: Colapso Gravitacional
class Titan {
  constructor(squareTiles) {
    this.tiles = squareTiles; // 4 tiles del cuadrado
    this.shapeType = squareTiles[0].shapeType;
    this.centerX = (squareTiles[0].worldX + squareTiles[3].worldX) / 2;
    this.centerY = (squareTiles[0].worldY + squareTiles[3].worldY) / 2;
    this.startTime = millis();
    this.lastDevourTime = millis();
    this.devourCount = 0;
    this.isCollapsing = false;
    this.collapseStartTime = 0;
    this.collapseDuration = 3000; // 3 segundos
    this.scale = 1;

    // Marcar tiles
    squareTiles.forEach(t => {
      t.isTitan = true;
      t.animState = "titan";
      lockedTiles.add(t);
    });
  }

  update() {
    // Actualizar centro
    this.centerX = (this.tiles[0].worldX + this.tiles[3].worldX) / 2;
    this.centerY = (this.tiles[0].worldY + this.tiles[3].worldY) / 2;

    if (this.isCollapsing) {
      // Animación de colapso
      const elapsed = millis() - this.collapseStartTime;
      const progress = Math.min(elapsed / this.collapseDuration, 1);

      if (progress >= 1) {
        return true; // Completado
      }
      return false;
    }

    // Intentar devorar cada X segundos
    if (millis() - this.lastDevourTime > CONFIG.titanDevourInterval) {
      this.devour();
      this.lastDevourTime = millis();
    }

    return false;
  }

  devour() {
    // Buscar tiles normales adyacentes
    const adjacentNormals = [];

    for (const titanTile of this.tiles) {
      const neighbors = getNeighbors(titanTile);
      for (const n of neighbors) {
        if (!n.isSuper && !n.isSingular && !n.isTitan && !n.isNucleo && !n.isTetramero && !lockedTiles.has(n)) {
          if (!adjacentNormals.includes(n)) {
            adjacentNormals.push(n);
          }
        }
      }
    }

    if (adjacentNormals.length > 0) {
      // Devorar uno aleatorio
      const target = random(adjacentNormals);
      target.isSuper = true;
      target.superLevel = 1;
      target.swapCount = 0;
      this.devourCount++;

      // Crear partículas de devoración
      this.createDevourParticles(target);

      console.log(`Titan devoró tile en (${target.gridI},${target.gridJ}). Total: ${this.devourCount}`);

      // Si alcanzó el máximo, iniciar colapso
      if (this.devourCount >= CONFIG.titanMaxDevours) {
        this.isCollapsing = true;
        this.collapseStartTime = millis();
        console.log('¡Titan iniciando colapso!');
      }
    }
  }

  createDevourParticles(target) {
    // Partículas desde el target hacia el titan
    for (let i = 0; i < 15; i++) {
      const angle = random(Math.PI * 2);
      const speed = random(1, 3);

      particles.push({
        x: target.worldX,
        y: target.worldY,
        vx: Math.cos(angle) * speed * -1, // Hacia el centro
        vy: Math.sin(angle) * speed * -1,
        life: 40,
        maxLife: 40,
        size: random(2, 5),
        color: currentPalette.shapes[this.shapeType],
        alpha: 255
      });
    }
  }

  draw() {
    push();
    translate(this.centerX, this.centerY);

    if (this.isCollapsing) {
      this.drawCollapse();
    } else {
      this.drawTitanForm();
      this.drawGravityWaves();
    }

    pop();
  }

  drawTitanForm() {
    const size = tileSize * 2; // Ocupa 2x2
    const pulse = sin(frameCount * 0.04) * 0.15 + 1;

    // Forma base magnificada
    stroke(currentPalette.shapes[this.shapeType]);
    strokeWeight(4);
    noFill();

    switch (this.shapeType) {
      case 0: // Super círculo
        circle(0, 0, size * pulse);
        circle(0, 0, size * 0.7 * pulse);
        circle(0, 0, size * 0.4 * pulse);
        break;
      case 1: // Super cuadrado
        rectMode(CENTER);
        square(0, 0, size * pulse);
        push();
        rotate(Math.PI / 4);
        square(0, 0, size * 0.7 * pulse);
        pop();
        break;
      case 2: // Super triángulo
        beginShape();
        for (let i = 0; i < 3; i++) {
          const angle = -Math.PI / 2 + i * Math.PI * 2 / 3;
          vertex(Math.cos(angle) * size / 2 * pulse, Math.sin(angle) * size / 2 * pulse);
        }
        endShape(CLOSE);
        break;
      case 3: // Super cruz
        const cs = size / 2 * pulse;
        line(-cs, 0, cs, 0);
        line(0, -cs, 0, cs);
        line(-cs * 0.7, -cs * 0.7, cs * 0.7, cs * 0.7);
        line(-cs * 0.7, cs * 0.7, cs * 0.7, -cs * 0.7);
        break;
    }

    // Núcleo oscuro
    fill(currentPalette.shapes[this.shapeType]);
    noStroke();
    circle(0, 0, 8 * pulse);
  }

  drawGravityWaves() {
    // Ondas gravitacionales
    const waveCount = 4;
    for (let i = 0; i < waveCount; i++) {
      const phase = (frameCount * 0.02 + i * 0.25) % 1;
      const radius = tileSize * (2 + phase * 2);
      const alpha = 100 * (1 - phase);

      noFill();
      const waveCol = color(currentPalette.accent);
      waveCol.setAlpha(alpha);
      stroke(waveCol);
      strokeWeight(2);
      circle(0, 0, radius);
    }
  }

  drawCollapse() {
    const elapsed = millis() - this.collapseStartTime;
    const progress = elapsed / this.collapseDuration;

    // Implosión
    if (progress < 0.5) {
      const t = progress / 0.5;
      const size = tileSize * 2 * (1 - t);

      stroke(currentPalette.accent);
      strokeWeight(5);
      noFill();
      circle(0, 0, size);

      // Líneas convergentes
      for (let i = 0; i < 16; i++) {
        const angle = i * Math.PI / 8;
        line(
          Math.cos(angle) * size,
          Math.sin(angle) * size,
          0, 0
        );
      }
    } else {
      // Explosión
      const t = (progress - 0.5) / 0.5;
      const size = tileSize * 4 * t;
      const alpha = 255 * (1 - t);

      const expCol = color(currentPalette.accent);
      expCol.setAlpha(alpha);
      stroke(expCol);
      strokeWeight(4);
      noFill();

      for (let i = 0; i < 3; i++) {
        circle(0, 0, size * (0.7 + i * 0.15));
      }
    }
  }

  complete() {
    // Convertir las 4 tiles en elementos singulares del tipo original
    for (const tile of this.tiles) {
      tile.isSingular = true;
      tile.isTitan = false;
      tile.isSuper = false;
      tile.animState = "idle";
      lockedTiles.delete(tile);
    }

    console.log('¡Titan colapsó en 4 elementos singulares!');
  }
}

// NÚCLEO: Transmutador Cíclico
class Nucleo {
  constructor(squareTiles) {
    this.tiles = squareTiles;
    this.centerTile = squareTiles[0]; // Tile superior izquierdo como referencia
    this.centerX = (squareTiles[0].worldX + squareTiles[3].worldX) / 2;
    this.centerY = (squareTiles[0].worldY + squareTiles[3].worldY) / 2;
    this.startTime = millis();
    this.lastPulseTime = millis();
    this.pulseCount = 0;
    this.currentPulse = null;
    this.transformedTypes = { 0: 0, 1: 0, 2: 0, 3: 0 }; // contador por tipo

    // Marcar tiles
    squareTiles.forEach(t => {
      t.isNucleo = true;
      t.animState = "nucleo";
      lockedTiles.add(t);
    });
  }

  update() {
    // Actualizar centro
    this.centerX = (this.tiles[0].worldX + this.tiles[3].worldX) / 2;
    this.centerY = (this.tiles[0].worldY + this.tiles[3].worldY) / 2;

    // Emitir pulso cada X segundos
    if (millis() - this.lastPulseTime > CONFIG.nucleoPulseDuration && !this.currentPulse) {
      this.emitPulse();
      this.lastPulseTime = millis();
      this.pulseCount++;
    }

    // Actualizar pulso activo
    if (this.currentPulse) {
      this.currentPulse.progress += 0.02;
      if (this.currentPulse.progress >= 1) {
        this.currentPulse = null;
      }
    }

    // Si completó todos los pulsos, terminar
    if (this.pulseCount >= CONFIG.nucleoMaxPulses) {
      return true;
    }

    return false;
  }

  emitPulse() {
    this.currentPulse = {
      progress: 0,
      radius: 0
    };

    // Transformar tiles en radio de 3
    const radius = 3;
    const transformed = [];

    for (let i = 0; i < CONFIG.GRID; i++) {
      for (let j = 0; j < CONFIG.GRID; j++) {
        const tile = grid[i][j];

        // Calcular distancia al centro del núcleo
        const centerI = this.centerTile.gridI + 0.5;
        const centerJ = this.centerTile.gridJ + 0.5;
        const di = i - centerI;
        const dj = j - centerJ;
        const dist = Math.sqrt(di * di + dj * dj);

        if (dist <= radius && !tile.isSuper && !tile.isSingular && !tile.isNucleo) {
          // Transformar al siguiente tipo en el ciclo
          const oldType = tile.shapeType;
          tile.shapeType = (tile.shapeType + 1) % 4; // círculo→cuadrado→triángulo→cruz→círculo
          this.transformedTypes[tile.shapeType]++;
          transformed.push(tile);
        } else if (tile.isSuper && dist <= radius) {
          // Recargar super elementos
          tile.swapCount++;
        }
      }
    }

    console.log(`Núcleo emitió pulso ${this.pulseCount + 1}. Transformados: ${transformed.length}`);
  }

  draw() {
    push();
    translate(this.centerX, this.centerY);

    this.drawNucleoCore();

    if (this.currentPulse) {
      this.drawPulseWave();
    }

    pop();
  }

  drawNucleoCore() {
    const size = tileSize * 2;
    const rotation = frameCount * 0.05;

    // Forma fractal central con los 4 tipos fusionados
    push();
    rotate(rotation);

    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const offset = size * 0.3;

      push();
      translate(Math.cos(angle) * offset, Math.sin(angle) * offset);

      stroke(currentPalette.shapes[i]);
      strokeWeight(2);
      noFill();

      const miniSize = size * 0.2;
      switch (i) {
        case 0: circle(0, 0, miniSize); break;
        case 1: square(-miniSize/2, -miniSize/2, miniSize); break;
        case 2:
          triangle(0, -miniSize/2, -miniSize/2, miniSize/2, miniSize/2, miniSize/2);
          break;
        case 3:
          line(-miniSize/2, 0, miniSize/2, 0);
          line(0, -miniSize/2, 0, miniSize/2);
          break;
      }
      pop();
    }

    pop();

    // Núcleo central
    fill(currentPalette.accent);
    noStroke();
    const pulse = sin(frameCount * 0.08) * 0.3 + 1;
    circle(0, 0, 12 * pulse);
  }

  drawPulseWave() {
    const maxRadius = tileSize * 3;
    const currentRadius = maxRadius * this.currentPulse.progress;
    const alpha = 200 * (1 - this.currentPulse.progress);

    // Onda en cruz (4 direcciones cardinales)
    stroke(currentPalette.accent);
    const waveCol = color(currentPalette.accent);
    waveCol.setAlpha(alpha);
    stroke(waveCol);
    strokeWeight(4);

    // Líneas en las 4 direcciones
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      line(0, 0, Math.cos(angle) * currentRadius, Math.sin(angle) * currentRadius);
    }

    // Círculo expansivo
    noFill();
    strokeWeight(2);
    circle(0, 0, currentRadius * 2);
  }

  complete() {
    // Colapsar a 4 super elementos del tipo más transformado
    let maxType = 0;
    let maxCount = 0;

    for (let type = 0; type < 4; type++) {
      if (this.transformedTypes[type] > maxCount) {
        maxCount = this.transformedTypes[type];
        maxType = type;
      }
    }

    for (const tile of this.tiles) {
      tile.isSuper = true;
      tile.isNucleo = false;
      tile.superLevel = 1;
      tile.swapCount = 0;
      tile.shapeType = maxType;
      tile.animState = "idle";
      lockedTiles.delete(tile);
    }

    console.log(`¡Núcleo colapsó en 4 super elementos tipo ${maxType}!`);
  }
}

// TETRÁMERO: Fusión Tetramórfica
class Tetramero {
  constructor(squareTiles) {
    this.tiles = squareTiles;
    this.shapeType = squareTiles[0].shapeType;
    this.centerTile = squareTiles[0];
    this.centerX = (squareTiles[0].worldX + squareTiles[3].worldX) / 2;
    this.centerY = (squareTiles[0].worldY + squareTiles[3].worldY) / 2;
    this.startTime = millis();
    this.lastDomainTime = millis();
    this.convertedCount = 0;
    this.absorbedCount = 0;
    this.isCritical = false;
    this.isFissioning = false;
    this.fissionStartTime = 0;
    this.fissionDuration = 4000; // 4 segundos
    this.scale = 1;
    this.absorptionRadius = CONFIG.tetrameroAbsorptionRadius;
    this.fissionProjectiles = [];

    // Marcar tiles
    squareTiles.forEach(t => {
      t.isTetramero = true;
      t.animState = "tetramero";
      lockedTiles.add(t);
    });
  }

  update() {
    // Actualizar centro
    this.centerX = (this.tiles[0].worldX + this.tiles[3].worldX) / 2;
    this.centerY = (this.tiles[0].worldY + this.tiles[3].worldY) / 2;

    if (this.isFissioning) {
      return this.updateFission();
    }

    // Irradiar dominio cada X segundos
    if (millis() - this.lastDomainTime > CONFIG.tetrameroDomainInterval) {
      this.radiateDomain();
      this.lastDomainTime = millis();
    }

    // Si es critical, intentar absorber
    if (this.isCritical) {
      this.tryAbsorb();
    }

    return false;
  }

  radiateDomain() {
    // Convertir un tile normal aleatorio en radio a su tipo
    const candidates = [];

    for (let i = 0; i < CONFIG.GRID; i++) {
      for (let j = 0; j < CONFIG.GRID; j++) {
        const tile = grid[i][j];

        const centerI = this.centerTile.gridI + 0.5;
        const centerJ = this.centerTile.gridJ + 0.5;
        const di = i - centerI;
        const dj = j - centerJ;
        const dist = Math.sqrt(di * di + dj * dj);

        if (dist <= this.absorptionRadius && !tile.isSuper && !tile.isSingular && !tile.isTetramero && !tile.isNucleo && !tile.isTitan) {
          candidates.push(tile);
        }
      }
    }

    if (candidates.length > 0) {
      const target = random(candidates);
      target.shapeType = this.shapeType;
      this.convertedCount++;

      console.log(`Tetrámero convirtió tile a tipo ${this.shapeType}. Total: ${this.convertedCount}`);

      // Si alcanzó 12 conversiones, entra en modo crítico
      if (this.convertedCount >= 12 && !this.isCritical) {
        this.isCritical = true;
        console.log('¡Tetrámero entró en modo CRÍTICO!');
      }
    }
  }

  tryAbsorb() {
    // Buscar tiles del mismo tipo en el radio
    const candidates = [];

    for (let i = 0; i < CONFIG.GRID; i++) {
      for (let j = 0; j < CONFIG.GRID; j++) {
        const tile = grid[i][j];

        const centerI = this.centerTile.gridI + 0.5;
        const centerJ = this.centerTile.gridJ + 0.5;
        const di = i - centerI;
        const dj = j - centerJ;
        const dist = Math.sqrt(di * di + dj * dj);

        if (dist <= this.absorptionRadius && tile.shapeType === this.shapeType && !tile.isSuper && !tile.isSingular && !tile.isTetramero) {
          candidates.push(tile);
        }
      }
    }

    if (candidates.length > 0 && Math.random() < 0.1) { // 10% chance por frame
      const target = random(candidates);

      // "Absorber" el tile (convertirlo en tile random de otro tipo)
      target.shapeType = Math.floor(Math.random() * 4);
      this.absorbedCount++;

      // Crecer
      this.scale += CONFIG.tetrameroGrowthPerAbsorb;
      this.absorptionRadius += 0.5;

      this.createAbsorptionParticles(target);

      console.log(`Tetrámero absorbió tile. Total: ${this.absorbedCount}. Escala: ${this.scale.toFixed(2)}`);

      // Si alcanzó el máximo, iniciar fisión
      if (this.absorbedCount >= CONFIG.tetrameroAbsorbsForFission) {
        this.startFission();
      }
    }
  }

  createAbsorptionParticles(target) {
    for (let i = 0; i < 20; i++) {
      const angle = random(Math.PI * 2);
      const speed = random(2, 4);

      particles.push({
        x: target.worldX,
        y: target.worldY,
        vx: Math.cos(angle) * speed * -1,
        vy: Math.sin(angle) * speed * -1,
        life: 50,
        maxLife: 50,
        size: random(3, 6),
        color: currentPalette.shapes[this.shapeType],
        alpha: 255
      });
    }
  }

  startFission() {
    this.isFissioning = true;
    this.fissionStartTime = millis();

    // Crear 4 proyectiles hacia las esquinas
    const corners = [
      { i: 0, j: 0 },
      { i: 0, j: CONFIG.GRID - 1 },
      { i: CONFIG.GRID - 1, j: 0 },
      { i: CONFIG.GRID - 1, j: CONFIG.GRID - 1 }
    ];

    for (let idx = 0; idx < 4; idx++) {
      const corner = corners[idx];
      this.fissionProjectiles.push({
        startX: this.centerX,
        startY: this.centerY,
        endX: offsetX + corner.j * tileSize + tileSize / 2,
        endY: offsetY + corner.i * tileSize + tileSize / 2,
        progress: 0,
        trail: []
      });
    }

    console.log('¡Tetrámero iniciando FISIÓN NUCLEAR!');
  }

  updateFission() {
    const elapsed = millis() - this.fissionStartTime;
    const progress = Math.min(elapsed / this.fissionDuration, 1);

    // Actualizar proyectiles
    for (const proj of this.fissionProjectiles) {
      proj.progress = easeInOutCubic(progress);

      const x = lerp(proj.startX, proj.endX, proj.progress);
      const y = lerp(proj.startY, proj.endY, proj.progress);

      // Guardar trail
      if (frameCount % 2 === 0) {
        proj.trail.push({ x, y });
        if (proj.trail.length > 20) proj.trail.shift();
      }

      // Convertir tiles en el camino
      if (frameCount % 3 === 0) {
        const gridI = Math.floor((y - offsetY) / tileSize);
        const gridJ = Math.floor((x - offsetX) / tileSize);

        if (gridI >= 0 && gridI < CONFIG.GRID && gridJ >= 0 && gridJ < CONFIG.GRID) {
          const tile = grid[gridI][gridJ];
          if (!tile.isTetramero && !tile.isSingular) {
            tile.shapeType = this.shapeType;
          }
        }
      }
    }

    if (progress >= 1) {
      return true; // Completado
    }

    return false;
  }

  draw() {
    push();
    translate(this.centerX, this.centerY);

    if (this.isFissioning) {
      this.drawFission();
    } else {
      this.drawTetrameroForm();
      if (this.isCritical) {
        this.drawCriticalEffects();
      }
    }

    pop();
  }

  drawTetrameroForm() {
    const size = tileSize * 2 * this.scale;
    const pulse = sin(frameCount * 0.05) * 0.1 + 1;

    // Forma monumental del tipo original
    stroke(currentPalette.shapes[this.shapeType]);
    strokeWeight(5);
    noFill();

    switch (this.shapeType) {
      case 0:
        for (let i = 0; i < 4; i++) {
          circle(0, 0, size * (0.4 + i * 0.2) * pulse);
        }
        break;
      case 1:
        rectMode(CENTER);
        for (let i = 0; i < 3; i++) {
          push();
          rotate(i * Math.PI / 6);
          square(0, 0, size * (0.6 + i * 0.2) * pulse);
          pop();
        }
        break;
      case 2:
        beginShape();
        for (let i = 0; i < 3; i++) {
          const angle = -Math.PI / 2 + i * Math.PI * 2 / 3;
          vertex(Math.cos(angle) * size / 2 * pulse, Math.sin(angle) * size / 2 * pulse);
        }
        endShape(CLOSE);
        break;
      case 3:
        const cs = size / 2 * pulse;
        line(-cs, 0, cs, 0);
        line(0, -cs, 0, cs);
        line(-cs * 0.7, -cs * 0.7, cs * 0.7, cs * 0.7);
        line(-cs * 0.7, cs * 0.7, cs * 0.7, -cs * 0.7);
        break;
    }

    // Pulsos de dominio
    const domPhase = ((millis() - this.lastDomainTime) / CONFIG.tetrameroDomainInterval);
    const domRadius = tileSize * this.absorptionRadius * domPhase;
    const domAlpha = 100 * (1 - domPhase);

    const domCol = color(currentPalette.shapes[this.shapeType]);
    domCol.setAlpha(domAlpha);
    stroke(domCol);
    strokeWeight(2);
    noFill();
    circle(0, 0, domRadius * 2);
  }

  drawCriticalEffects() {
    // Energía crítica pulsante
    const critPulse = sin(frameCount * 0.15) * 0.5 + 0.5;

    noFill();
    stroke(currentPalette.accent);
    strokeWeight(3);

    const rings = 5;
    for (let i = 0; i < rings; i++) {
      const r = tileSize * this.scale * (1 + i * 0.3 + critPulse * 0.2);
      const alpha = 150 * (1 - i / rings);
      const ringCol = color(currentPalette.accent);
      ringCol.setAlpha(alpha);
      stroke(ringCol);
      circle(0, 0, r);
    }
  }

  drawFission() {
    // Obtener progreso de la fisión
    const elapsed = millis() - this.fissionStartTime;
    const progress = Math.min(elapsed / this.fissionDuration, 1);

    // Dibujar proyectiles y trails
    for (const proj of this.fissionProjectiles) {
      // Trail
      stroke(currentPalette.accent);
      strokeWeight(3);
      noFill();
      beginShape();
      for (const point of proj.trail) {
        vertex(point.x - this.centerX, point.y - this.centerY);
      }
      endShape();

      // Proyectil
      const x = lerp(proj.startX, proj.endX, proj.progress) - this.centerX;
      const y = lerp(proj.startY, proj.endY, proj.progress) - this.centerY;

      fill(currentPalette.shapes[this.shapeType]);
      noStroke();
      circle(x, y, 15);

      // Aura
      noFill();
      stroke(currentPalette.accent);
      strokeWeight(2);
      circle(x, y, 25);
    }

    // Explosión central
    const expSize = tileSize * 4 * progress;
    noFill();
    stroke(currentPalette.accent);
    strokeWeight(4);
    for (let i = 0; i < 3; i++) {
      circle(0, 0, expSize * (0.7 + i * 0.15));
    }
  }

  complete() {
    // Los 4 tiles en las esquinas se convierten en singulares
    const corners = [
      grid[0][0],
      grid[0][CONFIG.GRID - 1],
      grid[CONFIG.GRID - 1][0],
      grid[CONFIG.GRID - 1][CONFIG.GRID - 1]
    ];

    for (const corner of corners) {
      corner.isSingular = true;
      corner.isSuper = false;
      corner.shapeType = this.shapeType;
    }

    // Limpiar las tiles del tetrámero
    for (const tile of this.tiles) {
      tile.isTetramero = false;
      tile.shapeType = Math.floor(Math.random() * 4);
      tile.animState = "idle";
      lockedTiles.delete(tile);
    }

    console.log('¡Tetrámero completó fisión! 4 singulares en las esquinas');
  }
}

// ============================================================
// DETECCIÓN DE CUADRADOS 2x2 (FINALES)
// ============================================================
function checkSquareFormations() {
  if (!finalMode) return;

  const checked = new Set();

  for (let i = 0; i < CONFIG.GRID - 1; i++) {
    for (let j = 0; j < CONFIG.GRID - 1; j++) {
      const topLeft = grid[i][j];
      const topRight = grid[i][j + 1];
      const bottomLeft = grid[i + 1][j];
      const bottomRight = grid[i + 1][j + 1];

      const squareTiles = [topLeft, topRight, bottomLeft, bottomRight];

      // Verificar que ninguno esté checkeado o bloqueado
      if (squareTiles.some(t => checked.has(t) || lockedTiles.has(t))) continue;

      // Verificar que los 4 sean super elementos (no singulares, titanes, etc)
      if (!squareTiles.every(t => t.isSuper && !t.isSingular && !t.isTitan && !t.isNucleo && !t.isTetramero)) continue;

      // Según el modo, verificar condiciones específicas
      if (finalMode === 'titan') {
        // Titan requiere 4 super elementos del MISMO tipo
        const shapeType = topLeft.shapeType;
        if (squareTiles.every(t => t.shapeType === shapeType)) {
          createTitan(squareTiles);
          squareTiles.forEach(t => checked.add(t));
        }
      } else if (finalMode === 'nucleo') {
        // Núcleo acepta cualquier combinación de super elementos
        createNucleo(squareTiles);
        squareTiles.forEach(t => checked.add(t));
      } else if (finalMode === 'tetramero') {
        // Tetrámero requiere 4 super elementos del MISMO tipo
        const shapeType = topLeft.shapeType;
        if (squareTiles.every(t => t.shapeType === shapeType)) {
          createTetramero(squareTiles);
          squareTiles.forEach(t => checked.add(t));
        }
      }
    }
  }
}

function createTitan(squareTiles) {
  const titan = new Titan(squareTiles);
  titans.push(titan);
  console.log('¡TITAN formado!');
}

function createNucleo(squareTiles) {
  const nucleo = new Nucleo(squareTiles);
  nucleos.push(nucleo);
  console.log('¡NÚCLEO formado!');
}

function createTetramero(squareTiles) {
  const tetramero = new Tetramero(squareTiles);
  tetrameros.push(tetramero);
  console.log('¡TETRÁMERO formado!');
}

// ============================================================
// GESTIÓN DE FINALES
// ============================================================
function updateTitans() {
  for (let i = titans.length - 1; i >= 0; i--) {
    const titan = titans[i];
    const done = titan.update();

    if (done) {
      titan.complete();
      titans.splice(i, 1);
    }
  }
}

function drawTitans() {
  for (const titan of titans) {
    titan.draw();
  }
}

function updateNucleos() {
  for (let i = nucleos.length - 1; i >= 0; i--) {
    const nucleo = nucleos[i];
    const done = nucleo.update();

    if (done) {
      nucleo.complete();
      nucleos.splice(i, 1);
    }
  }
}

function drawNucleos() {
  for (const nucleo of nucleos) {
    nucleo.draw();
  }
}

function updateTetrameros() {
  for (let i = tetrameros.length - 1; i >= 0; i--) {
    const tetramero = tetrameros[i];
    const done = tetramero.update();

    if (done) {
      tetramero.complete();
      tetrameros.splice(i, 1);
    }
  }
}

function drawTetrameros() {
  for (const tetramero of tetrameros) {
    tetramero.draw();
  }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
function initGrid() {
  tiles = [];
  grid = [];
  activeSwaps = [];
  superAlignments = [];
  singularities = [];
  particles = [];
  titans = [];
  nucleos = [];
  tetrameros = [];
  lockedTiles.clear();

  // Distribución balanceada: 25% de cada forma
  const shapeTypes = [];
  const total = CONFIG.GRID * CONFIG.GRID;
  const perType = Math.floor(total / 4);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < perType; j++) {
      shapeTypes.push(i);
    }
  }
  // Completar con random si no es múltiplo exacto
  while (shapeTypes.length < total) {
    shapeTypes.push(Math.floor(Math.random() * 4));
  }

  // Shuffle
  for (let i = shapeTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shapeTypes[i], shapeTypes[j]] = [shapeTypes[j], shapeTypes[i]];
  }

  // Crear tiles
  let idx = 0;
  for (let i = 0; i < CONFIG.GRID; i++) {
    grid[i] = [];
    for (let j = 0; j < CONFIG.GRID; j++) {
      const tile = new Tile(i, j, shapeTypes[idx]);
      grid[i][j] = tile;
      tiles.push(tile);
      idx++;
    }
  }
}

// ============================================================
// SETUP Y DRAW
// ============================================================
function setup() {
  // Canvas cuadrado para que sea exactamente 16x16
  const canvasSize = 800; // 800px / 16 = 50px por tile
  createCanvas(canvasSize, canvasSize);

  currentPalette = PALETTES[currentPaletteIndex];

  // Calcular dimensiones del grid (sin padding, usa todo el canvas)
  tileSize = canvasSize / CONFIG.GRID; // exactamente 50px
  offsetX = 0;
  offsetY = 0;

  initGrid();

  frameRate(60);
}

function draw() {
  background(currentPalette.bg);

  frameCounter++;

  // Intentar crear swaps periódicamente
  if (!paused && frameCounter % CONFIG.tickInterval === 0) {
    attemptSwaps();
  }

  // Actualizar swaps activos
  if (!paused) {
    updateSwaps();
    updateSuperAlignments();
    updateSingularities();
    updateParticles();

    // Actualizar finales según el modo activo
    if (finalMode === 'titan') {
      updateTitans();
    } else if (finalMode === 'nucleo') {
      updateNucleos();
    } else if (finalMode === 'tetramero') {
      updateTetrameros();
    }
  }

  // Actualizar tiles
  for (const tile of tiles) {
    tile.update();
  }

  // Dibujar grid lines (debug)
  if (CONFIG.showGridLines) {
    stroke(0, 30);
    strokeWeight(0.5);
    noFill();
    for (let i = 0; i <= CONFIG.GRID; i++) {
      const x = offsetX + i * tileSize;
      const y = offsetY + i * tileSize;
      line(x, offsetY, x, offsetY + CONFIG.GRID * tileSize);
      line(offsetX, y, offsetX + CONFIG.GRID * tileSize, y);
    }
  }

  // Dibujar tiles
  for (const tile of tiles) {
    tile.draw();
  }

  // Dibujar partículas (detrás de los efectos)
  drawParticles();

  // Dibujar efectos de super alineaciones
  drawSuperAlignments();

  // Dibujar efectos de singularidades
  drawSingularities();

  // Dibujar finales según el modo activo
  if (finalMode === 'titan') {
    drawTitans();
  } else if (finalMode === 'nucleo') {
    drawNucleos();
  } else if (finalMode === 'tetramero') {
    drawTetrameros();
  }

  // HUD
  drawHUD();
}

function drawHUD() {
  if (!showHUD) return; // No dibujar HUD si está oculto

  // Contar super elementos por nivel y singulares
  const superCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const enhancedCount = tiles.filter(t => t.isEnhanced).length;
  const singularCount = tiles.filter(t => t.isSingular).length;

  for (const tile of tiles) {
    if (tile.isSuper && tile.superLevel > 0) {
      superCounts[tile.superLevel]++;
    }
  }

  push();
  noStroke();
  fill(0, 150);
  rect(10, 10, 240, 175, 5);

  fill(255);
  textSize(12);
  textAlign(LEFT, TOP);
  text(`Paleta: ${currentPalette.name}`, 20, 20);
  text(`P/O: cambiar paleta`, 20, 40);
  text(`R: reset | SPACE: pausa`, 20, 55);
  text(`H: HUD | S: grabar`, 20, 70);
  text(`1:Titan 2:Núcleo 3:Tetrámero 0:Off`, 20, 85);
  text(`Swaps: ${activeSwaps.length}`, 20, 100);

  // Mostrar modo activo
  if (finalMode) {
    fill(currentPalette.accent);
    text(`Modo: ${finalMode.toUpperCase()}`, 20, 115);
  }

  // Stats de evolución
  fill(currentPalette.accent);
  text(`Super Elementos:`, 20, 130);
  fill(255);
  textSize(11);
  text(`L1:${superCounts[1]} L2:${superCounts[2]} L3:${superCounts[3]} L4:${superCounts[4]}`, 20, 145);
  text(`Enhanced: ${enhancedCount}`, 20, 160);

  // Stats de finales
  if (finalMode) {
    fill(currentPalette.accent);
    textSize(12);
    if (finalMode === 'titan') {
      text(`⚫ TITANES: ${titans.length}`, 20, 175);
    } else if (finalMode === 'nucleo') {
      text(`💠 NÚCLEOS: ${nucleos.length}`, 20, 175);
    } else if (finalMode === 'tetramero') {
      text(`🔶 TETRÁMEROS: ${tetrameros.length}`, 20, 175);
    }
  }

  pop();

  // Indicador de grabación
  if (isRecording) {
    push();
    noStroke();
    fill(255, 0, 0);
    circle(width - 30, 30, 20);
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text('REC', width - 30, 30);
    pop();
  }

  // Mostrar swaps activos (debug)
  if (CONFIG.showActiveSwaps) {
    for (const swap of activeSwaps) {
      push();
      stroke(currentPalette.accent);
      strokeWeight(2);
      noFill();
      const midX = (swap.tileA.worldX + swap.tileB.worldX) / 2;
      const midY = (swap.tileA.worldY + swap.tileB.worldY) / 2;
      circle(midX, midY, 10);
      pop();
    }
  }
}

// ============================================================
// INPUT
// ============================================================
function keyPressed() {
  if (key === 'p' || key === 'P') {
    currentPaletteIndex = (currentPaletteIndex + 1) % PALETTES.length;
    currentPalette = PALETTES[currentPaletteIndex];
  } else if (key === 'o' || key === 'O') {
    currentPaletteIndex = (currentPaletteIndex - 1 + PALETTES.length) % PALETTES.length;
    currentPalette = PALETTES[currentPaletteIndex];
  } else if (key === 'r' || key === 'R') {
    initGrid();
  } else if (key === ' ') {
    paused = !paused;
  } else if (key === 'h' || key === 'H') {
    showHUD = !showHUD;
  } else if (key === 's' || key === 'S') {
    toggleRecording();
  } else if (key === '1') {
    // Activar modo Titan
    finalMode = 'titan';
    initGrid();
    console.log('Modo TITAN activado: 4 super elementos iguales en cuadrado → Titan Convergente');
  } else if (key === '2') {
    // Activar modo Núcleo
    finalMode = 'nucleo';
    initGrid();
    console.log('Modo NÚCLEO activado: 4 super elementos en cuadrado → Núcleo Transmutador');
  } else if (key === '3') {
    // Activar modo Tetrámero
    finalMode = 'tetramero';
    initGrid();
    console.log('Modo TETRÁMERO activado: 4 super elementos iguales en cuadrado → Fusión Tetramórfica');
  } else if (key === '0') {
    // Desactivar modo final
    finalMode = null;
    initGrid();
    console.log('Modo final desactivado');
  }
}

function toggleRecording() {
  if (!isRecording) {
    // Iniciar grabación
    isRecording = true;

    // p5.js no tiene grabación de video nativa, usar el método saveCanvas en loop
    // Alternativa: usar librería externa o método manual con captureStream
    const canvas = document.querySelector('canvas');

    if (canvas.captureStream) {
      const stream = canvas.captureStream(60); // 60 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      });

      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `genuary_day19_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('Video guardado');
      };

      mediaRecorder.start();
      videoRecorder = mediaRecorder;

      console.log('Grabación iniciada - presiona S de nuevo para detener');
    } else {
      console.error('Tu navegador no soporta captureStream');
      isRecording = false;
    }
  } else {
    // Detener grabación
    if (videoRecorder && videoRecorder.state === 'recording') {
      videoRecorder.stop();
      isRecording = false;
      videoRecorder = null;
      console.log('Grabación detenida');
    }
  }
}

function windowResized() {
  // No redimensionar, mantener tamaño fijo de 800x800
  // para que sea exactamente 16x16
}

// ============================================================
// FUNCIONES DE FINALES
// ============================================================

function updateTitans() {
  for (let titan of titans) {
    titan.update(tiles);
  }
}

function drawTitans() {
  for (let titan of titans) {
    titan.draw();
  }
}

function updateNucleos() {
  for (let nucleo of nucleos) {
    nucleo.update(tiles);
  }
}

function drawNucleos() {
  for (let nucleo of nucleos) {
    nucleo.draw();
  }
}

function updateTetrameros() {
  for (let tetramero of tetrameros) {
    tetramero.update(tiles);
  }
}

function drawTetrameros() {
  for (let tetramero of tetrameros) {
    tetramero.draw();
  }
}
