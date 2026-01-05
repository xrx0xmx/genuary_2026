import p5 from 'p5';
import * as brush from 'p5.brush';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 5
// Prompt: Write "Genuary". Avoid using a font.
// Versión con p5.brush para trazos naturales

// ============================================
// CONFIGURACIÓN
// ============================================
const FPS = 60;
const CANVAS_SIZE = 800;

// Fuente para UI (se carga en preload)
let uiFont;

const PAPER_COLOR = [248, 244, 235];

const WORD = "Genuary";

// ============================================
// CONFIGURACIÓN DEL PINCEL (ajustable con teclas)
// ============================================
const CONFIG = {
  brushType: 'charcoal',  // Tipo de pincel actual
  weight: 1.0,            // Multiplicador de grosor
  color: '#1a1410',       // Color del trazo (negro cálido)
  vibration: 1.0,         // Factor de vibración
  opacity: 180,           // Opacidad (0-255)
};

// Lista de pinceles disponibles
const BRUSH_TYPES = ['pen', 'rotring', 'marker', 'charcoal', '2B', 'HB', 'spray', 'cpencil', 'marker2'];

// ============================================
// TRAYECTORIAS DE CADA LETRA (normalizadas 0-1)
// ============================================
const LETTER_PATHS = {
  G: [
    { x: 0.75, y: 0.25, p: 0.6 },
    { x: 0.6, y: 0.15, p: 0.8 },
    { x: 0.35, y: 0.15, p: 1.0 },
    { x: 0.15, y: 0.3, p: 1.2 },
    { x: 0.1, y: 0.5, p: 1.3 },
    { x: 0.15, y: 0.7, p: 1.2 },
    { x: 0.35, y: 0.85, p: 1.0 },
    { x: 0.6, y: 0.85, p: 0.9 },
    { x: 0.75, y: 0.7, p: 0.8 },
    { x: 0.7, y: 0.5, p: 0.7 },
    { x: 0.5, y: 0.5, p: 0.6 },
  ],
  e: [
    { x: 0.2, y: 0.5, p: 0.6 },
    { x: 0.5, y: 0.35, p: 0.9 },
    { x: 0.8, y: 0.45, p: 1.0 },
    { x: 0.75, y: 0.5, p: 0.9 },
    { x: 0.2, y: 0.5, p: 0.8 },
    { x: 0.15, y: 0.65, p: 1.0 },
    { x: 0.25, y: 0.85, p: 1.1 },
    { x: 0.55, y: 0.88, p: 0.9 },
    { x: 0.8, y: 0.78, p: 0.7 },
  ],
  n: [
    { x: 0.2, y: 0.85, p: 0.7 },
    { x: 0.2, y: 0.45, p: 1.0 },
    { x: 0.25, y: 0.35, p: 1.1 },
    { x: 0.45, y: 0.3, p: 1.0 },
    { x: 0.65, y: 0.4, p: 0.9 },
    { x: 0.75, y: 0.55, p: 0.85 },
    { x: 0.8, y: 0.85, p: 0.7 },
  ],
  u: [
    { x: 0.2, y: 0.35, p: 0.7 },
    { x: 0.2, y: 0.65, p: 0.9 },
    { x: 0.3, y: 0.85, p: 1.1 },
    { x: 0.5, y: 0.88, p: 1.0 },
    { x: 0.7, y: 0.8, p: 0.9 },
    { x: 0.8, y: 0.6, p: 0.8 },
    { x: 0.8, y: 0.35, p: 0.7 },
    { x: 0.8, y: 0.85, p: 0.6 },
  ],
  a: [
    { x: 0.7, y: 0.5, p: 0.6 },
    { x: 0.5, y: 0.35, p: 0.8 },
    { x: 0.3, y: 0.38, p: 1.0 },
    { x: 0.2, y: 0.55, p: 1.1 },
    { x: 0.25, y: 0.75, p: 1.0 },
    { x: 0.45, y: 0.88, p: 0.9 },
    { x: 0.7, y: 0.8, p: 0.8 },
    { x: 0.75, y: 0.55, p: 0.9 },
    { x: 0.75, y: 0.85, p: 0.7 },
  ],
  r: [
    { x: 0.25, y: 0.85, p: 0.6 },
    { x: 0.25, y: 0.5, p: 1.0 },
    { x: 0.3, y: 0.38, p: 1.1 },
    { x: 0.5, y: 0.32, p: 0.9 },
    { x: 0.7, y: 0.38, p: 0.7 },
  ],
  y: [
    { x: 0.2, y: 0.35, p: 0.6 },
    { x: 0.35, y: 0.55, p: 0.9 },
    { x: 0.5, y: 0.65, p: 1.0 },
    { x: 0.65, y: 0.55, p: 0.9 },
    { x: 0.8, y: 0.35, p: 0.7 },
    { x: 0.5, y: 0.65, p: 0.6 },
    { x: 0.4, y: 0.8, p: 0.8 },
    { x: 0.25, y: 0.95, p: 1.0 },
    { x: 0.15, y: 0.92, p: 0.5 },
  ],
};

// ============================================
// INTERPOLACIÓN CATMULL-ROM
// ============================================

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) + (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function getPointOnPath(path, t) {
  const n = path.length;
  if (n < 2) return { x: 0.5, y: 0.5, p: 1 };
  
  t = Math.max(0, Math.min(1, t));
  
  if (n < 4) {
    const idx = t * (n - 1);
    const i = Math.floor(idx);
    const frac = idx - i;
    const p1 = path[Math.min(i, n - 1)];
    const p2 = path[Math.min(i + 1, n - 1)];
    return {
      x: p1.x + (p2.x - p1.x) * frac,
      y: p1.y + (p2.y - p1.y) * frac,
      p: p1.p + (p2.p - p1.p) * frac,
    };
  }
  
  const totalSegments = n - 1;
  const segmentFloat = t * totalSegments;
  const segment = Math.floor(segmentFloat);
  const localT = segmentFloat - segment;
  
  const i0 = Math.max(0, segment - 1);
  const i1 = Math.min(n - 1, segment);
  const i2 = Math.min(n - 1, segment + 1);
  const i3 = Math.min(n - 1, segment + 2);
  
  return {
    x: catmullRom(path[i0].x, path[i1].x, path[i2].x, path[i3].x, localT),
    y: catmullRom(path[i0].y, path[i1].y, path[i2].y, path[i3].y, localT),
    p: Math.max(0.3, Math.min(1.5, catmullRom(
      path[i0].p, path[i1].p, path[i2].p, path[i3].p, localT
    ))),
  };
}

// ============================================
// SKETCH PRINCIPAL
// ============================================

const sketch = (p) => {
  // Registrar p5.brush para modo instancia
  brush.instance(p);
  
  // Buffer para los trazos de p5.brush (persistente)
  let inkBuffer;
  
  // Áreas definidas
  let letterAreas = [];
  
  // Cargar fuente para UI en WEBGL
  p.preload = () => {
    uiFont = p.loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Regular.otf');
  };
  
  // Estados
  const STATE_IDLE = 'idle';
  const STATE_DRAGGING = 'dragging';
  const STATE_ROTATING = 'rotating';
  const STATE_DRAWING = 'drawing';
  
  let currentState = STATE_IDLE;
  
  // Arrastre
  let dragStartX = 0;
  let dragStartY = 0;
  let dragCurrentX = 0;
  let dragCurrentY = 0;
  
  // Rotación
  let pendingArea = null;
  let isRotating = false;
  const ROTATION_HANDLE_DISTANCE = 30;
  const ROTATION_HANDLE_SIZE = 10;
  
  // Letras
  let nextLetterIndex = 0;
  
  // Animación
  let drawingAreaIndex = -1;
  let drawProgress = 0;
  let lastDrawProgress = 0;
  
  // UI
  let dashOffset = 0;
  let showConfig = true;
  
  // Cola de letras para dibujar
  let pendingLetterDraw = null;

  p.setup = () => {
    // WEBGL requerido por p5.brush
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
    p.frameRate(FPS);
    
    // Crear buffer para los trazos (también en WEBGL)
    inkBuffer = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
    
    // Inicializar p5.brush en el buffer de tinta
    brush.load(inkBuffer);
    
    // Preparar el fondo del buffer
    initInkBuffer();
    
    // Configurar fuente para texto UI
    if (uiFont) {
      p.textFont(uiFont);
    }
    
    setupRecorder(p, 10, FPS);
    
    console.log('🖋️ Día 5: Escritura Gestural con p5.brush');
    console.log('🎨 Teclas de configuración:');
    console.log('   1-9: Cambiar tipo de pincel');
    console.log('   +/-: Ajustar grosor');
    console.log('   [/]: Ajustar vibración');
    console.log('   O/o: Ajustar opacidad');
    console.log('   X: Randomizar parámetros');
    console.log('   H: Mostrar/ocultar configuración');
    console.log('   R: Reiniciar');
  };

  function initInkBuffer() {
    // Fondo de papel en el buffer
    inkBuffer.background(PAPER_COLOR[0], PAPER_COLOR[1], PAPER_COLOR[2]);
    
    // Añadir textura de papel con p5.brush
    brush.noStroke();
    for (let i = 0; i < 300; i++) {
      const x = p.random(-CANVAS_SIZE/2, CANVAS_SIZE/2);
      const y = p.random(-CANVAS_SIZE/2, CANVAS_SIZE/2);
      brush.fill(PAPER_COLOR[0] - 10, PAPER_COLOR[1] - 8, PAPER_COLOR[2] - 5, 15);
      brush.circle(x, y, p.random(2, 8));
    }
    brush.reDraw();
  }

  function drawLetterWithBrush(area) {
    const letter = WORD[area.letterIndex];
    const path = LETTER_PATHS[letter];
    if (!path) return;
    
    // Coordenadas en sistema WEBGL (centro en 0,0)
    const centerX = area.x + area.w / 2 - CANVAS_SIZE / 2;
    const centerY = area.y + area.h / 2 - CANVAS_SIZE / 2;
    const padding = Math.min(area.w, area.h) * 0.1;
    const innerW = area.w - padding * 2;
    const innerH = area.h - padding * 2;
    
    const cos = Math.cos(area.rotation);
    const sin = Math.sin(area.rotation);
    
    // Convertir color hex a RGB para poder aplicar opacidad
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 26, g: 20, b: 16 };
    };
    const rgb = hexToRgb(CONFIG.color);
    
    // Configurar el pincel con opacidad
    brush.set(CONFIG.brushType, CONFIG.color, CONFIG.weight);
    brush.stroke(rgb.r, rgb.g, rgb.b, CONFIG.opacity);
    
    // Dibujar líneas entre puntos consecutivos
    const numSegments = 50;
    
    for (let i = 0; i < numSegments; i++) {
      const t1 = i / numSegments;
      const t2 = (i + 1) / numSegments;
      
      const p1 = getPointOnPath(path, t1);
      const p2 = getPointOnPath(path, t2);
      
      // Posición local y rotada
      const localX1 = (p1.x - 0.5) * innerW;
      const localY1 = (p1.y - 0.5) * innerH;
      const x1 = centerX + (localX1 * cos - localY1 * sin);
      const y1 = centerY + (localX1 * sin + localY1 * cos);
      
      const localX2 = (p2.x - 0.5) * innerW;
      const localY2 = (p2.y - 0.5) * innerH;
      const x2 = centerX + (localX2 * cos - localY2 * sin);
      const y2 = centerY + (localX2 * sin + localY2 * cos);
      
      // Ajustar grosor según presión
      const avgPressure = (p1.p + p2.p) / 2;
      brush.strokeWeight(CONFIG.weight * avgPressure * CONFIG.vibration);
      
      // Dibujar línea
      brush.line(x1, y1, x2, y2);
    }
    
    // Forzar renderizado
    brush.reDraw();
  }

  // Obtener las 4 esquinas del rectángulo rotado
  function getRotatedCorners(area) {
    const cx = area.x + area.w / 2 - CANVAS_SIZE / 2;
    const cy = area.y + area.h / 2 - CANVAS_SIZE / 2;
    const hw = area.w / 2;
    const hh = area.h / 2;
    const cos = Math.cos(area.rotation);
    const sin = Math.sin(area.rotation);
    
    return [
      { x: cx + (-hw * cos - -hh * sin), y: cy + (-hw * sin + -hh * cos) },
      { x: cx + (hw * cos - -hh * sin), y: cy + (hw * sin + -hh * cos) },
      { x: cx + (hw * cos - hh * sin), y: cy + (hw * sin + hh * cos) },
      { x: cx + (-hw * cos - hh * sin), y: cy + (-hw * sin + hh * cos) },
    ];
  }

  function getRotationHandle(area) {
    const corners = getRotatedCorners(area);
    const topRight = corners[1];
    const cx = area.x + area.w / 2 - CANVAS_SIZE / 2;
    const cy = area.y + area.h / 2 - CANVAS_SIZE / 2;
    
    const dx = topRight.x - cx;
    const dy = topRight.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return {
      x: topRight.x + (dx / dist) * ROTATION_HANDLE_DISTANCE,
      y: topRight.y + (dy / dist) * ROTATION_HANDLE_DISTANCE,
    };
  }

  function isOverRotationHandle(mx, my, area) {
    const handle = getRotationHandle(area);
    const webglX = mx - CANVAS_SIZE / 2;
    const webglY = my - CANVAS_SIZE / 2;
    const dx = webglX - handle.x;
    const dy = webglY - handle.y;
    return Math.sqrt(dx * dx + dy * dy) < ROTATION_HANDLE_SIZE + 8;
  }

  function isInsideRotatedArea(mx, my, area) {
    const cx = area.x + area.w / 2;
    const cy = area.y + area.h / 2;
    
    const dx = mx - cx;
    const dy = my - cy;
    const cos = Math.cos(-area.rotation);
    const sin = Math.sin(-area.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    return Math.abs(localX) <= area.w / 2 && Math.abs(localY) <= area.h / 2;
  }

  p.draw = () => {
    dashOffset += 0.5;
    
    // Procesar letra pendiente para dibujar
    if (pendingLetterDraw !== null) {
      drawLetterWithBrush(letterAreas[pendingLetterDraw]);
      pendingLetterDraw = null;
    }
    
    // Mostrar el buffer de tinta (con el fondo de papel y los trazos)
    p.push();
    p.imageMode(p.CENTER);
    p.image(inkBuffer, 0, 0);
    p.pop();
    
    // Estado de dibujo (animación)
    if (currentState === STATE_DRAWING && drawingAreaIndex >= 0) {
      const speed = 0.05;
      drawProgress = Math.min(1, drawProgress + speed);
      
      if (drawProgress >= 1 && lastDrawProgress < 1) {
        // Programar el dibujo de la letra
        pendingLetterDraw = drawingAreaIndex;
        lastDrawProgress = 1;
      }
      
      if (drawProgress >= 1) {
        currentState = STATE_IDLE;
        drawingAreaIndex = -1;
      }
    }
    
    // Dibujar bordes de áreas existentes
    drawAreaBorders();
    
    // Preview mientras arrastra
    if (currentState === STATE_DRAGGING) {
      drawDragPreview();
    }
    
    // Área pendiente con controles
    if (pendingArea) {
      drawPendingAreaWithControls();
    }
    
    // UI
    drawUI();
    
    // Panel de configuración
    if (showConfig) {
      drawConfigPanel();
    }
  };

  function drawAreaBorders() {
    if (nextLetterIndex >= WORD.length && currentState !== STATE_DRAWING) {
      return;
    }
    
    p.push();
    p.strokeWeight(1.5);
    
    for (let i = 0; i < letterAreas.length; i++) {
      const corners = getRotatedCorners(letterAreas[i]);
      
      p.stroke(80, 60, 40, 100);
      p.noFill();
      
      for (let j = 0; j < corners.length; j++) {
        const c1 = corners[j];
        const c2 = corners[(j + 1) % corners.length];
        drawDashedLine(c1.x, c1.y, c2.x, c2.y, 8, 6);
      }
    }
    p.pop();
  }

  function drawDashedLine(x1, y1, x2, y2, dashLen, gapLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / len;
    const unitY = dy / len;
    
    let pos = (dashOffset % (dashLen + gapLen));
    
    while (pos < len) {
      const startPos = pos;
      const endPos = Math.min(pos + dashLen, len);
      
      if (endPos > startPos) {
        p.line(
          x1 + unitX * startPos, y1 + unitY * startPos,
          x1 + unitX * endPos, y1 + unitY * endPos
        );
      }
      pos += dashLen + gapLen;
    }
  }

  function drawDragPreview() {
    const x = Math.min(dragStartX, dragCurrentX) - CANVAS_SIZE / 2;
    const y = Math.min(dragStartY, dragCurrentY) - CANVAS_SIZE / 2;
    const w = Math.abs(dragCurrentX - dragStartX);
    const h = Math.abs(dragCurrentY - dragStartY);
    
    if (w < 5 || h < 5) return;
    
    p.push();
    p.fill(255, 250, 240, 30);
    p.stroke(60, 40, 20, 180);
    p.strokeWeight(2);
    p.rect(x, y, w, h);
    
    if (nextLetterIndex < WORD.length) {
      p.fill(60, 40, 20, 100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.min(w, h) * 0.5);
      p.text(WORD[nextLetterIndex], x + w / 2, y + h / 2);
    }
    p.pop();
  }

  function drawPendingAreaWithControls() {
    const area = pendingArea;
    const corners = getRotatedCorners(area);
    const handle = getRotationHandle(area);
    
    p.push();
    
    // Fondo
    p.fill(255, 250, 240, 40);
    p.noStroke();
    p.beginShape();
    for (const corner of corners) {
      p.vertex(corner.x, corner.y);
    }
    p.endShape(p.CLOSE);
    
    // Borde
    p.stroke(40, 100, 180, 200);
    p.strokeWeight(2);
    p.noFill();
    p.beginShape();
    for (const corner of corners) {
      p.vertex(corner.x, corner.y);
    }
    p.endShape(p.CLOSE);
    
    // Esquinas
    p.fill(40, 100, 180);
    p.noStroke();
    for (const corner of corners) {
      p.rectMode(p.CENTER);
      p.rect(corner.x, corner.y, 8, 8);
    }
    
    // Línea al asa
    const topRight = corners[1];
    p.stroke(40, 100, 180, 150);
    p.strokeWeight(1.5);
    p.line(topRight.x, topRight.y, handle.x, handle.y);
    
    // Asa de rotación
    const webglMouseX = p.mouseX - CANVAS_SIZE / 2;
    const webglMouseY = p.mouseY - CANVAS_SIZE / 2;
    const isHovering = Math.sqrt(Math.pow(webglMouseX - handle.x, 2) + Math.pow(webglMouseY - handle.y, 2)) < ROTATION_HANDLE_SIZE + 8;
    
    if (isHovering || isRotating) {
      p.fill(60, 140, 220);
    } else {
      p.fill(40, 100, 180);
    }
    p.stroke(255);
    p.strokeWeight(2);
    p.ellipse(handle.x, handle.y, ROTATION_HANDLE_SIZE * 2, ROTATION_HANDLE_SIZE * 2);
    
    // Preview de la letra
    if (nextLetterIndex < WORD.length) {
      const cx = area.x + area.w / 2 - CANVAS_SIZE / 2;
      const cy = area.y + area.h / 2 - CANVAS_SIZE / 2;
      p.push();
      p.translate(cx, cy);
      p.rotate(area.rotation);
      p.fill(40, 100, 180, 80);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.min(area.w, area.h) * 0.5);
      p.text(WORD[nextLetterIndex], 0, 0);
      p.pop();
    }
    
    // Indicador de ángulo
    const cx = area.x + area.w / 2 - CANVAS_SIZE / 2;
    const degrees = Math.round((area.rotation * 180 / Math.PI) % 360);
    p.fill(40, 100, 180);
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text(`${degrees}°`, cx, area.y - CANVAS_SIZE / 2 - 10);
    
    p.pop();
  }

  function drawUI() {
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.noStroke();
    
    const topLeft = -CANVAS_SIZE / 2 + 15;
    
    if (nextLetterIndex >= WORD.length && currentState !== STATE_DRAWING) {
      p.fill(60, 100, 60, 200);
      p.text('✓ Palabra completa', topLeft, topLeft);
    } else if (!pendingArea) {
      p.fill(80, 60, 40, 180);
      p.text(`Siguiente: "${WORD[nextLetterIndex]}" (${nextLetterIndex + 1}/${WORD.length})`, topLeft, topLeft);
    }
    p.pop();
  }

  function drawConfigPanel() {
    p.push();
    
    const panelX = CANVAS_SIZE / 2 - 180;
    const panelY = -CANVAS_SIZE / 2 + 15;
    const panelW = 165;
    const panelH = 120;
    
    // Fondo del panel
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(panelX, panelY, panelW, panelH, 6);
    
    // Texto
    p.fill(255, 255, 255, 220);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    
    const brushIndex = BRUSH_TYPES.indexOf(CONFIG.brushType) + 1;
    
    p.text(`Pincel: ${CONFIG.brushType} [${brushIndex}]`, panelX + 10, panelY + 10);
    p.text(`Grosor: ${CONFIG.weight.toFixed(1)} [+/-]`, panelX + 10, panelY + 28);
    p.text(`Vibración: ${CONFIG.vibration.toFixed(1)} [/]`, panelX + 10, panelY + 46);
    p.text(`Opacidad: ${CONFIG.opacity} [O/o]`, panelX + 10, panelY + 64);
    
    p.fill(200, 200, 200, 150);
    p.textSize(9);
    p.text('X: randomizar | H: ocultar', panelX + 10, panelY + 90);
    p.text('R: reiniciar', panelX + 10, panelY + 102);
    
    p.pop();
  }

  p.mousePressed = () => {
    if (nextLetterIndex >= WORD.length) return;
    if (currentState === STATE_DRAWING) return;
    
    if (pendingArea) {
      if (isOverRotationHandle(p.mouseX, p.mouseY, pendingArea)) {
        isRotating = true;
        currentState = STATE_ROTATING;
        return;
      }
      
      if (isInsideRotatedArea(p.mouseX, p.mouseY, pendingArea)) {
        confirmPendingArea();
        return;
      }
      
      pendingArea = null;
    }
    
    currentState = STATE_DRAGGING;
    dragStartX = p.mouseX;
    dragStartY = p.mouseY;
    dragCurrentX = p.mouseX;
    dragCurrentY = p.mouseY;
  };

  p.mouseDragged = () => {
    if (currentState === STATE_DRAGGING) {
      dragCurrentX = p.mouseX;
      dragCurrentY = p.mouseY;
    } else if (currentState === STATE_ROTATING && pendingArea) {
      const cx = pendingArea.x + pendingArea.w / 2;
      const cy = pendingArea.y + pendingArea.h / 2;
      const angle = Math.atan2(p.mouseY - cy, p.mouseX - cx);
      const baseAngle = Math.atan2(-pendingArea.h / 2, pendingArea.w / 2);
      pendingArea.rotation = angle - baseAngle;
    }
  };

  p.mouseReleased = () => {
    if (currentState === STATE_DRAGGING) {
      currentState = STATE_IDLE;
      
      const x = Math.min(dragStartX, dragCurrentX);
      const y = Math.min(dragStartY, dragCurrentY);
      const w = Math.abs(dragCurrentX - dragStartX);
      const h = Math.abs(dragCurrentY - dragStartY);
      
      if (w < 30 || h < 30) {
        return;
      }
      
      if (nextLetterIndex >= WORD.length) return;
      
      pendingArea = { x, y, w, h, rotation: 0 };
      
    } else if (currentState === STATE_ROTATING) {
      isRotating = false;
      currentState = STATE_IDLE;
    }
  };

  function confirmPendingArea() {
    if (!pendingArea || nextLetterIndex >= WORD.length) return;
    
    const newArea = {
      ...pendingArea,
      letterIndex: nextLetterIndex,
    };
    letterAreas.push(newArea);
    
    currentState = STATE_DRAWING;
    drawingAreaIndex = letterAreas.length - 1;
    drawProgress = 0;
    lastDrawProgress = 0;
    
    pendingArea = null;
    nextLetterIndex++;
  }

  function resetSketch() {
    letterAreas = [];
    nextLetterIndex = 0;
    currentState = STATE_IDLE;
    drawingAreaIndex = -1;
    pendingArea = null;
    isRotating = false;
    pendingLetterDraw = null;
    
    // Reinicializar el buffer de tinta
    initInkBuffer();
    
    console.log('🔄 Reiniciado');
  }

  function randomizeConfig() {
    // Randomizar tipo de pincel
    CONFIG.brushType = BRUSH_TYPES[Math.floor(p.random(BRUSH_TYPES.length))];
    
    // Randomizar grosor (0.3 - 3.0)
    CONFIG.weight = p.random(0.3, 3.0);
    
    // Randomizar vibración (0.3 - 2.5)
    CONFIG.vibration = p.random(0.3, 2.5);
    
    // Randomizar opacidad (60 - 255)
    CONFIG.opacity = Math.floor(p.random(60, 255));
    
    // Randomizar color (tonos oscuros cálidos)
    const colors = [
      '#1a1410', // negro cálido
      '#2d1f1a', // marrón oscuro
      '#1a2433', // azul tinta
      '#2a1a2a', // púrpura oscuro
      '#3d2b1f', // sepia
      '#1a2a1a', // verde bosque
      '#3a1a1a', // rojo oscuro
      '#1a1a2d', // azul medianoche
    ];
    CONFIG.color = colors[Math.floor(p.random(colors.length))];
    
    console.log(`🎲 Randomizado:`);
    console.log(`   Pincel: ${CONFIG.brushType}`);
    console.log(`   Grosor: ${CONFIG.weight.toFixed(2)}`);
    console.log(`   Vibración: ${CONFIG.vibration.toFixed(2)}`);
    console.log(`   Opacidad: ${CONFIG.opacity}`);
    console.log(`   Color: ${CONFIG.color}`);
  }

  p.keyPressed = () => {
    // Cambiar tipo de pincel (1-9)
    const num = parseInt(p.key);
    if (num >= 1 && num <= BRUSH_TYPES.length) {
      CONFIG.brushType = BRUSH_TYPES[num - 1];
      console.log(`🖌️ Pincel: ${CONFIG.brushType}`);
    }
    
    // Ajustar grosor
    if (p.key === '+' || p.key === '=') {
      CONFIG.weight = Math.min(5, CONFIG.weight + 0.2);
      console.log(`📏 Grosor: ${CONFIG.weight.toFixed(1)}`);
    }
    if (p.key === '-' || p.key === '_') {
      CONFIG.weight = Math.max(0.2, CONFIG.weight - 0.2);
      console.log(`📏 Grosor: ${CONFIG.weight.toFixed(1)}`);
    }
    
    // Ajustar vibración
    if (p.key === ']') {
      CONFIG.vibration = Math.min(3, CONFIG.vibration + 0.2);
      console.log(`〰️ Vibración: ${CONFIG.vibration.toFixed(1)}`);
    }
    if (p.key === '[') {
      CONFIG.vibration = Math.max(0.2, CONFIG.vibration - 0.2);
      console.log(`〰️ Vibración: ${CONFIG.vibration.toFixed(1)}`);
    }
    
    // Ajustar opacidad
    if (p.key === 'O') {
      CONFIG.opacity = Math.min(255, CONFIG.opacity + 20);
      console.log(`🔆 Opacidad: ${CONFIG.opacity}`);
    }
    if (p.key === 'o') {
      CONFIG.opacity = Math.max(20, CONFIG.opacity - 20);
      console.log(`🔆 Opacidad: ${CONFIG.opacity}`);
    }
    
    // Randomizar parámetros
    if (p.key === 'x' || p.key === 'X') {
      randomizeConfig();
    }
    
    // Mostrar/ocultar config
    if (p.key === 'h' || p.key === 'H') {
      showConfig = !showConfig;
    }
    
    // Reiniciar
    if (p.key === 'r' || p.key === 'R') {
      resetSketch();
    }
    
    // Confirmar rotación
    if (p.keyCode === p.ENTER && pendingArea) {
      confirmPendingArea();
    }
    
    // Cancelar
    if (p.keyCode === p.ESCAPE && pendingArea) {
      pendingArea = null;
    }
    
    // Grabar
    if (p.key === 's' || p.key === 'S') {
      if (window.startRecording && !window.isRecording?.()) {
        window.startRecording();
      }
    }
  };
};

new p5(sketch, document.getElementById('canvas-container'));
