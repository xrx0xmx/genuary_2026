import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 5
// Prompt: Write "Genuary". Avoid using a font.
// Interacción: dibujar rectángulos con rotación donde se pintarán las letras

// ============================================
// CONFIGURACIÓN
// ============================================
const FPS = 60;
const CANVAS_SIZE = 800;

const INK_COLOR = [25, 20, 15];
const PAPER_COLOR = [248, 244, 235];
const BASE_STROKE_WIDTH = 16;
const JITTER_AMPLITUDE = 1.0;

const WORD = "Genuary";

// Configuración del control de rotación
const ROTATION_HANDLE_DISTANCE = 30; // Distancia del asa desde la esquina
const ROTATION_HANDLE_SIZE = 10;     // Tamaño del círculo del asa

// ============================================
// TRAYECTORIAS DE CADA LETRA (normalizadas 0-1)
// ============================================
const LETTER_PATHS = {
  G: [
    { x: 0.75, y: 0.25, pressure: 0.6 },
    { x: 0.6, y: 0.15, pressure: 0.8 },
    { x: 0.35, y: 0.15, pressure: 1.0 },
    { x: 0.15, y: 0.3, pressure: 1.2 },
    { x: 0.1, y: 0.5, pressure: 1.3 },
    { x: 0.15, y: 0.7, pressure: 1.2 },
    { x: 0.35, y: 0.85, pressure: 1.0 },
    { x: 0.6, y: 0.85, pressure: 0.9 },
    { x: 0.75, y: 0.7, pressure: 0.8 },
    { x: 0.7, y: 0.5, pressure: 0.7 },
    { x: 0.5, y: 0.5, pressure: 0.6 },
  ],
  e: [
    { x: 0.2, y: 0.5, pressure: 0.6 },
    { x: 0.5, y: 0.35, pressure: 0.9 },
    { x: 0.8, y: 0.45, pressure: 1.0 },
    { x: 0.75, y: 0.5, pressure: 0.9 },
    { x: 0.2, y: 0.5, pressure: 0.8 },
    { x: 0.15, y: 0.65, pressure: 1.0 },
    { x: 0.25, y: 0.85, pressure: 1.1 },
    { x: 0.55, y: 0.88, pressure: 0.9 },
    { x: 0.8, y: 0.78, pressure: 0.7 },
  ],
  n: [
    { x: 0.2, y: 0.85, pressure: 0.7 },
    { x: 0.2, y: 0.45, pressure: 1.0 },
    { x: 0.25, y: 0.35, pressure: 1.1 },
    { x: 0.45, y: 0.3, pressure: 1.0 },
    { x: 0.65, y: 0.4, pressure: 0.9 },
    { x: 0.75, y: 0.55, pressure: 0.85 },
    { x: 0.8, y: 0.85, pressure: 0.7 },
  ],
  u: [
    { x: 0.2, y: 0.35, pressure: 0.7 },
    { x: 0.2, y: 0.65, pressure: 0.9 },
    { x: 0.3, y: 0.85, pressure: 1.1 },
    { x: 0.5, y: 0.88, pressure: 1.0 },
    { x: 0.7, y: 0.8, pressure: 0.9 },
    { x: 0.8, y: 0.6, pressure: 0.8 },
    { x: 0.8, y: 0.35, pressure: 0.7 },
    { x: 0.8, y: 0.85, pressure: 0.6 },
  ],
  a: [
    { x: 0.7, y: 0.5, pressure: 0.6 },
    { x: 0.5, y: 0.35, pressure: 0.8 },
    { x: 0.3, y: 0.38, pressure: 1.0 },
    { x: 0.2, y: 0.55, pressure: 1.1 },
    { x: 0.25, y: 0.75, pressure: 1.0 },
    { x: 0.45, y: 0.88, pressure: 0.9 },
    { x: 0.7, y: 0.8, pressure: 0.8 },
    { x: 0.75, y: 0.55, pressure: 0.9 },
    { x: 0.75, y: 0.85, pressure: 0.7 },
  ],
  r: [
    { x: 0.25, y: 0.85, pressure: 0.6 },
    { x: 0.25, y: 0.5, pressure: 1.0 },
    { x: 0.3, y: 0.38, pressure: 1.1 },
    { x: 0.5, y: 0.32, pressure: 0.9 },
    { x: 0.7, y: 0.38, pressure: 0.7 },
  ],
  y: [
    { x: 0.2, y: 0.35, pressure: 0.6 },
    { x: 0.35, y: 0.55, pressure: 0.9 },
    { x: 0.5, y: 0.65, pressure: 1.0 },
    { x: 0.65, y: 0.55, pressure: 0.9 },
    { x: 0.8, y: 0.35, pressure: 0.7 },
    { x: 0.5, y: 0.65, pressure: 0.6 },
    { x: 0.4, y: 0.8, pressure: 0.8 },
    { x: 0.25, y: 0.95, pressure: 1.0 },
    { x: 0.15, y: 0.92, pressure: 0.5 },
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
  if (n < 2) return { x: 0.5, y: 0.5, pressure: 1 };
  
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
      pressure: p1.pressure + (p2.pressure - p1.pressure) * frac,
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
    pressure: Math.max(0.3, Math.min(1.5, catmullRom(
      path[i0].pressure, path[i1].pressure,
      path[i2].pressure, path[i3].pressure, localT
    ))),
  };
}

// ============================================
// SKETCH PRINCIPAL
// ============================================

const sketch = (p) => {
  let paperBuffer;
  let inkBuffer;
  
  // Áreas definidas (rectángulos donde van las letras)
  let letterAreas = [];  // { x, y, w, h, rotation, letterIndex }
  
  // Estados de interacción
  const STATE_IDLE = 'idle';
  const STATE_DRAGGING = 'dragging';
  const STATE_ROTATING = 'rotating';
  const STATE_DRAWING = 'drawing';
  
  let currentState = STATE_IDLE;
  
  // Estado de arrastre para crear área
  let dragStartX = 0;
  let dragStartY = 0;
  let dragCurrentX = 0;
  let dragCurrentY = 0;
  
  // Estado de rotación
  let pendingArea = null;  // Área pendiente de confirmar { x, y, w, h, rotation }
  let isRotating = false;
  
  // Índice de la próxima letra a colocar
  let nextLetterIndex = 0;
  
  // Animación de dibujo
  let drawingAreaIndex = -1;
  let drawProgress = 0;
  let lastDrawProgress = 0;
  
  // Para línea discontinua animada
  let dashOffset = 0;

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    
    paperBuffer = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE);
    inkBuffer = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE);
    
    generatePaperTexture(paperBuffer);
    inkBuffer.clear();
    
    setupRecorder(p, 10, FPS);
    
    console.log('🖋️ Día 5: Escritura Gestural con Rotación');
    console.log('🖱️ Click + arrastra para definir el área');
    console.log('🔄 Arrastra el asa circular para rotar');
    console.log('✓ Click dentro del área o Enter para confirmar');
    console.log(`📝 Palabra: "${WORD}" (${WORD.length} letras)`);
    console.log('⌨️ R = reiniciar, Esc = cancelar rotación');
  };

  function generatePaperTexture(buffer) {
    buffer.background(PAPER_COLOR[0], PAPER_COLOR[1], PAPER_COLOR[2]);
    buffer.loadPixels();
    
    p.noiseSeed(1234);
    p.randomSeed(5678);
    
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const idx = (y * CANVAS_SIZE + x) * 4;
        const noiseVal = (p.noise(x * 0.015, y * 0.015) - 0.5) * 12;
        const fineNoise = (p.random() - 0.5) * 6;
        const variation = noiseVal + fineNoise;
        
        buffer.pixels[idx] = Math.max(220, Math.min(255, PAPER_COLOR[0] + variation));
        buffer.pixels[idx + 1] = Math.max(215, Math.min(252, PAPER_COLOR[1] + variation * 0.9));
        buffer.pixels[idx + 2] = Math.max(205, Math.min(245, PAPER_COLOR[2] + variation * 0.8));
        buffer.pixels[idx + 3] = 255;
      }
    }
    buffer.updatePixels();
  }

  function drawInkPoint(buffer, x, y, pressure, angle, noiseOffset) {
    const baseSize = BASE_STROKE_WIDTH * pressure;
    const passes = 5;
    
    for (let pass = 0; pass < passes; pass++) {
      const perpAngle = angle + Math.PI / 2;
      const spreadAmount = (pass - passes / 2) * (baseSize * 0.2);
      const spreadX = Math.cos(perpAngle) * spreadAmount;
      const spreadY = Math.sin(perpAngle) * spreadAmount;
      
      const jitterX = (p.noise(noiseOffset, pass * 10) - 0.5) * JITTER_AMPLITUDE * 2.5;
      const jitterY = (p.noise(noiseOffset + 100, pass * 10) - 0.5) * JITTER_AMPLITUDE * 2.5;
      
      const finalX = x + spreadX + jitterX;
      const finalY = y + spreadY + jitterY;
      
      const sizeVariation = 1 + (p.noise(noiseOffset + pass * 50) - 0.5) * 0.35;
      const size = baseSize * sizeVariation * (1 - pass * 0.1);
      
      const baseOpacity = 0.18 + pressure * 0.12;
      const opacity = baseOpacity * (1 - pass * 0.12);
      
      const colorVar = (p.noise(noiseOffset + 200) - 0.5) * 10;
      buffer.noStroke();
      buffer.fill(
        INK_COLOR[0] + colorVar,
        INK_COLOR[1] + colorVar * 0.8,
        INK_COLOR[2] + colorVar * 0.6,
        opacity * 255
      );
      
      buffer.push();
      buffer.translate(finalX, finalY);
      buffer.rotate(angle + (p.noise(noiseOffset + 300) - 0.5) * 0.25);
      const stretch = 1.2 + pressure * 0.25;
      buffer.ellipse(0, 0, size * stretch, size / stretch * 0.9);
      buffer.pop();
    }
  }

  function drawLetterInArea(area, fromT, toT) {
    const letter = WORD[area.letterIndex];
    const path = LETTER_PATHS[letter];
    if (!path) return;
    
    const centerX = area.x + area.w / 2;
    const centerY = area.y + area.h / 2;
    const padding = Math.min(area.w, area.h) * 0.1;
    const innerW = area.w - padding * 2;
    const innerH = area.h - padding * 2;
    
    const steps = Math.ceil((toT - fromT) * 150);
    
    for (let i = 0; i <= steps; i++) {
      const t = fromT + (toT - fromT) * (i / steps);
      const point = getPointOnPath(path, t);
      
      // Posición local (centrada en origen)
      const localX = (point.x - 0.5) * innerW;
      const localY = (point.y - 0.5) * innerH;
      
      // Aplicar rotación
      const cos = Math.cos(area.rotation);
      const sin = Math.sin(area.rotation);
      const rotatedX = localX * cos - localY * sin;
      const rotatedY = localX * sin + localY * cos;
      
      // Posición final
      const x = centerX + rotatedX;
      const y = centerY + rotatedY;
      
      // Calcular ángulo del trazo (también rotado)
      const nextT = Math.min(1, t + 0.02);
      const nextPoint = getPointOnPath(path, nextT);
      const nextLocalX = (nextPoint.x - 0.5) * innerW;
      const nextLocalY = (nextPoint.y - 0.5) * innerH;
      const nextRotatedX = nextLocalX * cos - nextLocalY * sin;
      const nextRotatedY = nextLocalX * sin + nextLocalY * cos;
      const nextX = centerX + nextRotatedX;
      const nextY = centerY + nextRotatedY;
      const strokeAngle = Math.atan2(nextY - y, nextX - x);
      
      const noiseOffset = t * 500 + area.letterIndex * 1000;
      
      const driftX = (p.noise(area.letterIndex * 0.1, t) - 0.5) * 2;
      const driftY = (p.noise(area.letterIndex * 0.1 + 50, t) - 0.5) * 2;
      
      const sizeScale = Math.min(area.w, area.h) / 150;
      const adjustedPressure = point.pressure * Math.max(0.5, Math.min(1.5, sizeScale));
      
      drawInkPoint(inkBuffer, x + driftX, y + driftY, adjustedPressure, strokeAngle, noiseOffset);
    }
  }

  // Obtener las 4 esquinas del rectángulo rotado
  function getRotatedCorners(area) {
    const cx = area.x + area.w / 2;
    const cy = area.y + area.h / 2;
    const hw = area.w / 2;
    const hh = area.h / 2;
    const cos = Math.cos(area.rotation);
    const sin = Math.sin(area.rotation);
    
    return [
      { x: cx + (-hw * cos - -hh * sin), y: cy + (-hw * sin + -hh * cos) }, // top-left
      { x: cx + (hw * cos - -hh * sin), y: cy + (hw * sin + -hh * cos) },   // top-right
      { x: cx + (hw * cos - hh * sin), y: cy + (hw * sin + hh * cos) },     // bottom-right
      { x: cx + (-hw * cos - hh * sin), y: cy + (-hw * sin + hh * cos) },   // bottom-left
    ];
  }

  // Obtener posición del asa de rotación (fuera de la esquina superior derecha)
  function getRotationHandle(area) {
    const corners = getRotatedCorners(area);
    const topRight = corners[1];
    const cx = area.x + area.w / 2;
    const cy = area.y + area.h / 2;
    
    // Dirección desde el centro hacia la esquina superior derecha
    const dx = topRight.x - cx;
    const dy = topRight.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Extender más allá de la esquina
    return {
      x: topRight.x + (dx / dist) * ROTATION_HANDLE_DISTANCE,
      y: topRight.y + (dy / dist) * ROTATION_HANDLE_DISTANCE,
    };
  }

  // Verificar si el mouse está sobre el asa de rotación
  function isOverRotationHandle(mx, my, area) {
    const handle = getRotationHandle(area);
    const dx = mx - handle.x;
    const dy = my - handle.y;
    return Math.sqrt(dx * dx + dy * dy) < ROTATION_HANDLE_SIZE + 5;
  }

  // Verificar si el mouse está dentro del área rotada
  function isInsideRotatedArea(mx, my, area) {
    const cx = area.x + area.w / 2;
    const cy = area.y + area.h / 2;
    
    // Transformar punto al espacio local (sin rotación)
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
    
    // Animar dibujo de letra
    if (currentState === STATE_DRAWING && drawingAreaIndex >= 0) {
      const speed = 0.035;
      drawProgress = Math.min(1, drawProgress + speed);
      
      if (drawProgress > lastDrawProgress) {
        drawLetterInArea(letterAreas[drawingAreaIndex], lastDrawProgress, drawProgress);
        lastDrawProgress = drawProgress;
      }
      
      if (drawProgress >= 1) {
        currentState = STATE_IDLE;
        drawingAreaIndex = -1;
      }
    }
    
    // Componer imagen
    p.image(paperBuffer, 0, 0);
    p.image(inkBuffer, 0, 0);
    
    // Dibujar bordes de áreas existentes
    drawAreaBorders();
    
    // Dibujar preview del área mientras se arrastra
    if (currentState === STATE_DRAGGING) {
      drawDragPreview();
    }
    
    // Dibujar área pendiente con controles de rotación
    if (pendingArea) {
      drawPendingAreaWithControls();
    }
    
    // UI
    drawUI();
  };

  function drawAreaBorders() {
    // No dibujar bordes si ya se completó la palabra
    if (nextLetterIndex >= WORD.length && currentState !== STATE_DRAWING) {
      return;
    }
    
    const ctx = p.drawingContext;
    
    for (let i = 0; i < letterAreas.length; i++) {
      const area = letterAreas[i];
      const corners = getRotatedCorners(area);
      
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -dashOffset;
      ctx.strokeStyle = 'rgba(80, 60, 40, 0.4)';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let j = 1; j < corners.length; j++) {
        ctx.lineTo(corners[j].x, corners[j].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDragPreview() {
    const x = Math.min(dragStartX, dragCurrentX);
    const y = Math.min(dragStartY, dragCurrentY);
    const w = Math.abs(dragCurrentX - dragStartX);
    const h = Math.abs(dragCurrentY - dragStartY);
    
    if (w < 5 || h < 5) return;
    
    const ctx = p.drawingContext;
    
    // Fondo semi-transparente
    p.fill(255, 250, 240, 30);
    p.noStroke();
    p.rect(x, y, w, h);
    
    // Borde discontinuo animado
    ctx.save();
    ctx.setLineDash([10, 5]);
    ctx.lineDashOffset = -dashOffset * 2;
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
    
    // Mostrar la letra que se dibujará
    if (nextLetterIndex < WORD.length) {
      p.fill(60, 40, 20, 100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.min(w, h) * 0.6);
      p.text(WORD[nextLetterIndex], x + w / 2, y + h / 2);
    }
  }

  function drawPendingAreaWithControls() {
    const area = pendingArea;
    const corners = getRotatedCorners(area);
    const handle = getRotationHandle(area);
    const ctx = p.drawingContext;
    
    // Fondo semi-transparente
    p.fill(255, 250, 240, 40);
    p.noStroke();
    p.beginShape();
    for (const corner of corners) {
      p.vertex(corner.x, corner.y);
    }
    p.endShape(p.CLOSE);
    
    // Borde del área (más visible)
    ctx.save();
    ctx.setLineDash([10, 5]);
    ctx.lineDashOffset = -dashOffset * 2;
    ctx.strokeStyle = 'rgba(40, 100, 180, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let j = 1; j < corners.length; j++) {
      ctx.lineTo(corners[j].x, corners[j].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // Esquinas (pequeños cuadrados)
    p.fill(40, 100, 180);
    p.noStroke();
    for (const corner of corners) {
      p.rectMode(p.CENTER);
      p.rect(corner.x, corner.y, 8, 8);
    }
    
    // Línea hacia el asa de rotación
    const topRight = corners[1];
    p.stroke(40, 100, 180, 150);
    p.strokeWeight(1.5);
    p.line(topRight.x, topRight.y, handle.x, handle.y);
    
    // Asa de rotación (círculo)
    const isHovering = isOverRotationHandle(p.mouseX, p.mouseY, area);
    if (isHovering || isRotating) {
      p.fill(60, 140, 220);
      p.stroke(255);
      p.strokeWeight(2);
    } else {
      p.fill(40, 100, 180);
      p.stroke(255);
      p.strokeWeight(1.5);
    }
    p.ellipse(handle.x, handle.y, ROTATION_HANDLE_SIZE * 2, ROTATION_HANDLE_SIZE * 2);
    
    // Icono de rotación dentro del asa
    p.noFill();
    p.stroke(255);
    p.strokeWeight(1.5);
    p.arc(handle.x, handle.y, 10, 10, -p.PI * 0.7, p.PI * 0.5);
    // Flecha
    const arrowAngle = p.PI * 0.5;
    const arrowX = handle.x + Math.cos(arrowAngle) * 5;
    const arrowY = handle.y + Math.sin(arrowAngle) * 5;
    p.line(arrowX - 3, arrowY - 2, arrowX, arrowY);
    p.line(arrowX + 2, arrowY - 3, arrowX, arrowY);
    
    // Letra preview (rotada)
    if (nextLetterIndex < WORD.length) {
      p.push();
      p.translate(area.x + area.w / 2, area.y + area.h / 2);
      p.rotate(area.rotation);
      p.fill(40, 100, 180, 80);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.min(area.w, area.h) * 0.5);
      p.text(WORD[nextLetterIndex], 0, 0);
      p.pop();
    }
    
    // Indicador de ángulo
    const degrees = Math.round((area.rotation * 180 / Math.PI) % 360);
    p.fill(40, 100, 180);
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text(`${degrees}°`, area.x + area.w / 2, area.y - 10);
    
    // Instrucción
    p.fill(80, 80, 80, 200);
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Arrastra el ○ para rotar • Click dentro o Enter para confirmar', 
           area.x + area.w / 2, area.y + area.h + 15);
  }

  function drawUI() {
    if (nextLetterIndex >= WORD.length && currentState !== STATE_DRAWING) {
      p.fill(60, 100, 60, 200);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(14);
      p.text('✓ Palabra completa', 15, 15);
    } else if (!pendingArea) {
      p.fill(80, 60, 40, 180);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(14);
      p.text(`Siguiente: "${WORD[nextLetterIndex]}" (${nextLetterIndex + 1}/${WORD.length})`, 15, 15);
    }
  }

  p.mousePressed = () => {
    if (nextLetterIndex >= WORD.length) return;
    if (currentState === STATE_DRAWING) return;
    
    // Si hay área pendiente
    if (pendingArea) {
      // Verificar si click en asa de rotación
      if (isOverRotationHandle(p.mouseX, p.mouseY, pendingArea)) {
        isRotating = true;
        currentState = STATE_ROTATING;
        return;
      }
      
      // Verificar si click dentro del área (confirmar)
      if (isInsideRotatedArea(p.mouseX, p.mouseY, pendingArea)) {
        confirmPendingArea();
        return;
      }
      
      // Click fuera - cancelar y empezar nueva área
      pendingArea = null;
    }
    
    // Empezar a arrastrar nueva área
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
      // Calcular nuevo ángulo basado en la posición del mouse
      const cx = pendingArea.x + pendingArea.w / 2;
      const cy = pendingArea.y + pendingArea.h / 2;
      const angle = Math.atan2(p.mouseY - cy, p.mouseX - cx);
      
      // Ajustar para que el asa esté en la dirección correcta
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
        console.log('⚠️ Área demasiado pequeña');
        return;
      }
      
      if (nextLetterIndex >= WORD.length) return;
      
      // Crear área pendiente (para rotación)
      pendingArea = { x, y, w, h, rotation: 0 };
      console.log(`📐 Área definida - ajusta la rotación`);
      
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
    
    console.log(`✓ Letra "${WORD[nextLetterIndex]}" confirmada (${Math.round(newArea.rotation * 180 / Math.PI)}°)`);
    
    // Iniciar animación de dibujo
    currentState = STATE_DRAWING;
    drawingAreaIndex = letterAreas.length - 1;
    drawProgress = 0;
    lastDrawProgress = 0;
    
    pendingArea = null;
    nextLetterIndex++;
  }

  p.keyPressed = () => {
    if (p.key === 'r' || p.key === 'R') {
      inkBuffer.clear();
      letterAreas = [];
      nextLetterIndex = 0;
      currentState = STATE_IDLE;
      drawingAreaIndex = -1;
      pendingArea = null;
      isRotating = false;
      console.log('🔄 Reiniciado');
    }
    
    if (p.keyCode === p.ENTER && pendingArea) {
      confirmPendingArea();
    }
    
    if (p.keyCode === p.ESCAPE && pendingArea) {
      pendingArea = null;
      console.log('❌ Rotación cancelada');
    }
    
    if (p.key === 's' || p.key === 'S') {
      if (window.startRecording && !window.isRecording?.()) {
        window.startRecording();
      }
    }
  };
};

new p5(sketch, document.getElementById('canvas-container'));
