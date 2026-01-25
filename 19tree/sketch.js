/**
 * 19tree - Árbol de Evoluciones del Sistema Celular
 * 
 * Visualiza las 4 formas base, sus evoluciones (Normal → Super → Singular)
 * y los 3 finales (Titan, Núcleo, Tetrámero) con animaciones en movimiento.
 */

// ============================================
// CONFIGURACIÓN
// ============================================
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 750;

// ============================================
// PALETAS (igual que sketch 19)
// ============================================
const PALETTES = [
  {
    name: "Mono Ink",
    bg: "#F5F1E8",
    shapes: ["#1A1A1A", "#4A4A4A", "#6A6A6A", "#2A2A2A", "#3A3A3A", "#5A5A5A", "#7A7A7A", "#8A8A8A", "#0A0A0A"],
    accent: "#D32F2F"
  },
  {
    name: "Neo Pastel",
    bg: "#E6D5F5",
    shapes: ["#FFB6C1", "#B5EAD7", "#FFE6A7", "#C7CEEA", "#FFDAB9", "#98FB98", "#DDA0DD", "#F0E68C", "#E6E6FA"],
    accent: "#FFD700"
  },
  {
    name: "Cyber Night",
    bg: "#0A0A0F",
    shapes: ["#00FFFF", "#FF00FF", "#CCFF00", "#9D4EDD", "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"],
    accent: "#FFFFFF"
  },
  {
    name: "Earth Print",
    bg: "#F0EBE3",
    shapes: ["#CB6843", "#5F7161", "#4A6FA5", "#D4A574", "#8B4513", "#2E8B57", "#CD853F", "#708090", "#B8860B"],
    accent: "#FF6F61"
  },
  {
    name: "Mint Dream",
    bg: "#F0FFF4",
    shapes: ["#48BB78", "#ED8936", "#4299E1", "#9F7AEA", "#F56565", "#38B2AC", "#ECC94B", "#667EEA", "#ED64A6"],
    accent: "#FC8181"
  }
];

let currentPaletteIndex = 2; // Cyber Night por defecto
let currentPalette;

// Forma seleccionada (0-3) o null para todas
let selectedShape = null;

// ============================================
// FORMAS BASE
// ============================================
const SHAPE_NAMES = [
  "Círculo", "Cuadrado", "Triángulo", "Cruz",
  "Hexágono", "Rombo", "Pentágono", "Luna", "Espiral"
];

// ============================================
// SETUP Y DRAW
// ============================================
function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  currentPalette = PALETTES[currentPaletteIndex];
  frameRate(60);
  
  console.log('🌳 19tree - Árbol de Evoluciones');
  console.log('   [P/O] Cambiar paleta');
}

function draw() {
  background(currentPalette.bg);
  
  // Título
  fill(currentPalette.accent);
  textAlign(CENTER, TOP);
  textSize(24);
  textStyle(BOLD);
  text("ÁRBOL DE EVOLUCIONES - SISTEMA CELULAR 16×16", width / 2, 20);
  textStyle(NORMAL);
  textSize(12);
  fill(currentPalette.shapes[0]);
  text(`Paleta: ${currentPalette.name} [P/O para cambiar]`, width / 2, 50);
  
  // Dibujar secciones
  drawBaseShapes();
  drawEvolutionChain();
  drawFinals();
  drawLegend();
}

// ============================================
// FORMAS BASE
// ============================================
function drawBaseShapes() {
  const startX = 80;
  const startY = 90;
  const boxWidth = 70;
  const boxHeight = 85;
  const gap = 12;
  
  // Título de sección
  fill(currentPalette.accent);
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(BOLD);
  text("FORMAS BASE", startX, startY - 18);
  textStyle(NORMAL);
  
  for (let i = 0; i < 9; i++) {
    const x = startX + i * (boxWidth + gap);
    const y = startY;
    
    // Indicar si está seleccionada
    const isSelected = selectedShape === i;
    
    // Caja
    const shapeColor = currentPalette.shapes[i % currentPalette.shapes.length];
    stroke(shapeColor);
    strokeWeight(isSelected ? 3 : 1.5);
    
    if (isSelected) {
      // Fondo highlight para seleccionada
      const bgCol = color(shapeColor);
      bgCol.setAlpha(40);
      fill(bgCol);
    } else {
      fill(red(currentPalette.bg), green(currentPalette.bg), blue(currentPalette.bg), 200);
    }
    rect(x, y, boxWidth, boxHeight, 6);
    
    // Indicador de selección
    if (isSelected) {
      fill(currentPalette.accent);
      noStroke();
      circle(x + boxWidth - 8, y + 8, 12);
      fill(currentPalette.bg);
      textAlign(CENTER, CENTER);
      textSize(8);
      textStyle(BOLD);
      text("✓", x + boxWidth - 8, y + 8);
      textStyle(NORMAL);
    }
    
    // Forma animada
    push();
    translate(x + boxWidth / 2, y + boxHeight / 2 - 8);
    const pulse = sin(frameCount * 0.05 + i) * 0.1 + 1;
    const rot = sin(frameCount * 0.02 + i * 0.5) * 0.1;
    rotate(rot);
    scale(pulse);
    drawShape(i, 22, false, false, 1);
    pop();
    
    // Nombre
    fill(currentPalette.shapes[i % currentPalette.shapes.length]);
    textAlign(CENTER, BOTTOM);
    textSize(8);
    textStyle(BOLD);
    text(SHAPE_NAMES[i], x + boxWidth / 2, y + boxHeight - 3);
    textStyle(NORMAL);
    
    // Índice
    fill(currentPalette.bg);
    noStroke();
    circle(x + 10, y + 10, 14);
    fill(currentPalette.shapes[i % currentPalette.shapes.length]);
    textAlign(CENTER, CENTER);
    textSize(8);
    text(i, x + 10, y + 10);
  }
}

// ============================================
// CADENA DE EVOLUCIÓN
// ============================================
function drawEvolutionChain() {
  const startX = 80;
  const startY = 210;
  const stageWidth = 130;
  const stageHeight = 140;
  const gap = 18;
  
  // Título de sección
  fill(currentPalette.accent);
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(BOLD);
  const chainTitle = selectedShape !== null 
    ? `CADENA DE EVOLUCIÓN - ${SHAPE_NAMES[selectedShape].toUpperCase()}`
    : "CADENA DE EVOLUCIÓN";
  text(chainTitle, startX, startY - 18);
  textStyle(NORMAL);
  
  // Indicador de controles
  fill(currentPalette.shapes[1]);
  textSize(9);
  if (selectedShape === null) {
    text("(Pulsa 0-8 para seleccionar)", startX + 180, startY - 16);
  } else {
    text(`(Pulsa ${selectedShape} para deseleccionar)`, startX + 250, startY - 16);
  }
  
  const stages = [
    { name: "NORMAL", level: 0, desc: "Forma básica" },
    { name: "SUPER L1", level: 1, desc: "3 iguales → fusión" },
    { name: "SUPER L2", level: 2, desc: "+5 swaps, órbita" },
    { name: "SUPER L3", level: 3, desc: "+10, radioactivo" },
    { name: "SUPER L4", level: 4, desc: "+15, gravedad" },
    { name: "SINGULAR", level: 5, desc: "3 SUPER → final" }
  ];
  
  for (let i = 0; i < stages.length; i++) {
    const x = startX + i * (stageWidth + gap);
    const y = startY;
    const stage = stages[i];
    
    // Caja
    const isSuper = stage.level >= 1 && stage.level <= 4;
    const isSingular = stage.level === 5;
    
    let boxColor = currentPalette.shapes[0];
    if (isSuper) boxColor = currentPalette.accent;
    if (isSingular) boxColor = currentPalette.accent;
    
    stroke(boxColor);
    strokeWeight(isSingular ? 3 : 2);
    fill(red(currentPalette.bg), green(currentPalette.bg), blue(currentPalette.bg), 220);
    rect(x, y, stageWidth, stageHeight, 10);
    
    // Forma animada (usa la seleccionada o círculo por defecto)
    push();
    translate(x + stageWidth / 2, y + 60);
    const pulse = sin(frameCount * 0.04 + i * 0.3) * 0.1 + 1;
    scale(pulse);
    
    const shapeType = selectedShape !== null ? selectedShape : 0;
    
    if (stage.level === 0) {
      drawShape(shapeType, 30, false, false, 1);
    } else if (stage.level >= 1 && stage.level <= 4) {
      drawSuperShape(shapeType, 32, stage.level);
    } else if (stage.level === 5) {
      drawSingularShape(shapeType, 35);
    }
    pop();
    
    // Nombre del stage
    fill(boxColor);
    textAlign(CENTER, TOP);
    textSize(10);
    textStyle(BOLD);
    text(stage.name, x + stageWidth / 2, y + 6);
    textStyle(NORMAL);
    
    // Descripción
    fill(currentPalette.shapes[1]);
    textSize(9);
    textAlign(CENTER, BOTTOM);
    text(stage.desc, x + stageWidth / 2, y + stageHeight - 8);
    
    // Flecha al siguiente (excepto el último)
    if (i < stages.length - 1) {
      const arrowX = x + stageWidth + gap / 2;
      const arrowY = y + stageHeight / 2;
      
      stroke(currentPalette.accent);
      strokeWeight(2);
      fill(currentPalette.accent);
      
      // Línea
      line(x + stageWidth + 5, arrowY, arrowX + 10, arrowY);
      
      // Punta
      triangle(
        arrowX + 15, arrowY,
        arrowX + 5, arrowY - 6,
        arrowX + 5, arrowY + 6
      );
    }
  }
}

// ============================================
// FINALES (2x2)
// ============================================
function drawFinals() {
  const startX = 80;
  const startY = 390;
  const boxWidth = 400;
  const boxHeight = 320;
  const gap = 60;
  
  // Título de sección
  fill(currentPalette.accent);
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(BOLD);
  text("FINALES (Cuadrado 2×2 de Super Elementos)", startX, startY - 18);
  textStyle(NORMAL);
  
  const finals = [
    {
      name: "TITAN",
      key: "1",
      color: currentPalette.shapes[0],
      requirement: "4 Super IGUALES",
      behavior: "• Devora tiles normales cercanos\n• Cada devorada → nuevo Super\n• Tras 4 devoradas → Colapso",
      result: "4 Elementos SINGULARES"
    },
    {
      name: "NÚCLEO",
      key: "2",
      color: currentPalette.shapes[1],
      requirement: "4 Super CUALQUIERA",
      behavior: "• Emite pulsos transmutadores\n• Transforma tipos en radio 3\n• Recarga Super cercanos",
      result: "4 Super del tipo dominante"
    },
    {
      name: "TETRÁMERO",
      key: "3",
      color: currentPalette.shapes[2],
      requirement: "4 Super IGUALES",
      behavior: "• Irradia dominio (convierte)\n• Modo CRÍTICO → absorbe\n• Crece con cada absorción",
      result: "FISIÓN → 4 Singulares en esquinas"
    }
  ];
  
  for (let i = 0; i < finals.length; i++) {
    const x = startX + i * (boxWidth + gap);
    const y = startY;
    const final = finals[i];
    
    // Caja principal
    stroke(final.color);
    strokeWeight(3);
    fill(red(currentPalette.bg), green(currentPalette.bg), blue(currentPalette.bg), 230);
    rect(x, y, boxWidth, boxHeight, 12);
    
    // Header
    fill(final.color);
    noStroke();
    rect(x, y, boxWidth, 50, 12, 12, 0, 0);
    
    // Nombre y tecla
    fill(currentPalette.bg);
    textAlign(LEFT, CENTER);
    textSize(20);
    textStyle(BOLD);
    text(final.name, x + 20, y + 25);
    textStyle(NORMAL);
    
    // Tecla
    textAlign(RIGHT, CENTER);
    textSize(14);
    text(`[${final.key}]`, x + boxWidth - 20, y + 25);
    
    // Dibujar representación visual del final
    push();
    translate(x + boxWidth / 2, y + 115);
    drawFinalVisual(i, 70);
    pop();
    
    // Requisito
    fill(currentPalette.accent);
    textAlign(CENTER, TOP);
    textSize(13);
    textStyle(BOLD);
    text(final.requirement, x + boxWidth / 2, y + 175);
    textStyle(NORMAL);
    
    // Comportamiento
    fill(currentPalette.shapes[1]);
    textSize(11);
    textAlign(LEFT, TOP);
    const behaviorLines = final.behavior.split('\n');
    for (let l = 0; l < behaviorLines.length; l++) {
      text(behaviorLines[l], x + 20, y + 200 + l * 16);
    }
    
    // Resultado
    fill(currentPalette.accent);
    textAlign(CENTER, BOTTOM);
    textSize(13);
    textStyle(BOLD);
    text("→ " + final.result, x + boxWidth / 2, y + boxHeight - 12);
    textStyle(NORMAL);
  }
}

// ============================================
// LEYENDA
// ============================================
function drawLegend() {
  const x = width - 180;
  const y = 80;
  
  // Caja
  stroke(currentPalette.shapes[1]);
  strokeWeight(1);
  fill(red(currentPalette.bg), green(currentPalette.bg), blue(currentPalette.bg), 200);
  rect(x, y, 150, 115, 6);
  
  // Título
  fill(currentPalette.accent);
  textAlign(LEFT, TOP);
  textSize(10);
  textStyle(BOLD);
  text("LEYENDA", x + 8, y + 8);
  textStyle(NORMAL);
  
  // Items
  const items = [
    { symbol: "○", desc: "Normal" },
    { symbol: "◎", desc: "Super (L1-L4)" },
    { symbol: "✦", desc: "Singular" },
  ];
  
  textSize(9);
  for (let i = 0; i < items.length; i++) {
    fill(currentPalette.accent);
    textAlign(LEFT, TOP);
    text(items[i].symbol, x + 10, y + 26 + i * 16);
    fill(currentPalette.shapes[1]);
    text(items[i].desc, x + 28, y + 26 + i * 16);
  }
  
  // Controles de este sketch
  fill(currentPalette.shapes[2]);
  textSize(8);
  text("P/O: paleta", x + 8, y + 80);
  text("0-8: forma", x + 8, y + 92);
  text("misma tecla: deseleccionar", x + 8, y + 104);
}

// ============================================
// FUNCIONES DE DIBUJO DE FORMAS
// ============================================
function drawShape(type, size, isSuper, isSingular, level) {
  stroke(currentPalette.shapes[type % currentPalette.shapes.length]);
  strokeWeight(2);
  noFill();
  
  switch (type) {
    case 0: // Círculo
      circle(0, 0, size);
      break;
    case 1: // Cuadrado
      rectMode(CENTER);
      square(0, 0, size);
      break;
    case 2: // Triángulo
      beginShape();
      for (let i = 0; i < 3; i++) {
        const angle = -PI / 2 + i * TWO_PI / 3;
        vertex(cos(angle) * size / 2, sin(angle) * size / 2);
      }
      endShape(CLOSE);
      break;
    case 3: // Cruz
      const cs = size / 2;
      line(-cs, 0, cs, 0);
      line(0, -cs, 0, cs);
      break;
    case 4: // Hexágono
      beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = i * TWO_PI / 6;
        vertex(cos(angle) * size / 2, sin(angle) * size / 2);
      }
      endShape(CLOSE);
      break;
    case 5: // Rombo
      beginShape();
      vertex(0, -size / 2);
      vertex(size / 3, 0);
      vertex(0, size / 2);
      vertex(-size / 3, 0);
      endShape(CLOSE);
      break;
    case 6: // Pentágono
      beginShape();
      for (let i = 0; i < 5; i++) {
        const angle = -PI / 2 + i * TWO_PI / 5;
        vertex(cos(angle) * size / 2, sin(angle) * size / 2);
      }
      endShape(CLOSE);
      break;
    case 7: // Luna
      arc(0, 0, size, size, PI / 4, PI + PI / 4);
      arc(size * 0.15, 0, size * 0.7, size * 0.7, PI / 4, PI + PI / 4);
      break;
    case 8: // Espiral
      noFill();
      beginShape();
      for (let a = 0; a < TWO_PI * 2; a += 0.2) {
        const r = (a / (TWO_PI * 2)) * size / 2;
        vertex(cos(a) * r, sin(a) * r);
      }
      endShape();
      break;
  }
}

function drawSuperShape(type, size, level) {
  const col = currentPalette.shapes[type % currentPalette.shapes.length];
  stroke(col);
  strokeWeight(2.5);
  noFill();
  
  const pulse = sin(frameCount * 0.05) * 0.1 + 1;
  
  switch (type) {
    case 0: // Super Círculo
      circle(0, 0, size * pulse);
      circle(0, 0, size * 0.6 * pulse);
      break;
    case 1: // Super Cuadrado
      rectMode(CENTER);
      square(0, 0, size * pulse);
      push();
      rotate(PI / 4);
      square(0, 0, size * 0.7 * pulse);
      pop();
      break;
    case 2: // Super Triángulo (estrella 3 puntas)
      beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = -PI / 2 + i * PI / 3;
        const r = (i % 2 === 0) ? size / 2 : size / 4;
        vertex(cos(angle) * r * pulse, sin(angle) * r * pulse);
      }
      endShape(CLOSE);
      break;
    case 3: // Super Cruz
      const scs = size / 2 * pulse;
      line(-scs, 0, scs, 0);
      line(0, -scs, 0, scs);
      const d = scs * 0.7;
      line(-d, -d, d, d);
      line(-d, d, d, -d);
      break;
    case 4: // Super Hexágono - doble hexágono rotado
      for (let j = 0; j < 2; j++) {
        push();
        rotate(j * PI / 6);
        beginShape();
        for (let i = 0; i < 6; i++) {
          const angle = i * TWO_PI / 6;
          const r = (j === 0 ? size / 2 : size / 3) * pulse;
          vertex(cos(angle) * r, sin(angle) * r);
        }
        endShape(CLOSE);
        pop();
      }
      break;
    case 5: // Super Rombo - rombo con rombo interior girado
      beginShape();
      vertex(0, -size / 2 * pulse);
      vertex(size / 3 * pulse, 0);
      vertex(0, size / 2 * pulse);
      vertex(-size / 3 * pulse, 0);
      endShape(CLOSE);
      push();
      rotate(PI / 2);
      beginShape();
      vertex(0, -size / 3 * pulse);
      vertex(size / 4 * pulse, 0);
      vertex(0, size / 3 * pulse);
      vertex(-size / 4 * pulse, 0);
      endShape(CLOSE);
      pop();
      break;
    case 6: // Super Pentágono - pentagrama (estrella 5 puntas)
      beginShape();
      for (let i = 0; i < 10; i++) {
        const angle = -PI / 2 + i * TWO_PI / 10;
        const r = (i % 2 === 0) ? size / 2 : size / 4;
        vertex(cos(angle) * r * pulse, sin(angle) * r * pulse);
      }
      endShape(CLOSE);
      break;
    case 7: // Super Luna - lunas opuestas (yin-yang)
      const moonSize = size * pulse;
      arc(0, 0, moonSize, moonSize, PI / 4, PI + PI / 4);
      push();
      rotate(PI);
      arc(0, 0, moonSize * 0.7, moonSize * 0.7, PI / 4, PI + PI / 4);
      pop();
      break;
    case 8: // Super Espiral - espiral doble (ADN)
      noFill();
      for (let s = 0; s < 2; s++) {
        beginShape();
        for (let a = 0; a < TWO_PI * 2.5; a += 0.15) {
          const r = (a / (TWO_PI * 2.5)) * size / 2 * pulse;
          const offset = s * PI;
          vertex(cos(a + offset) * r, sin(a + offset) * r);
        }
        endShape();
      }
      break;
  }
  
  // Efectos según nivel
  if (level >= 2) {
    // Anillo orbital
    const orbitRadius = size * 0.8;
    stroke(currentPalette.accent);
    strokeWeight(1);
    const orbitCol = color(currentPalette.accent);
    orbitCol.setAlpha(100);
    stroke(orbitCol);
    noFill();
    circle(0, 0, orbitRadius * 2);
    
    // Mini formas orbitando
    for (let i = 0; i < 3; i++) {
      const angle = frameCount * 0.03 + i * TWO_PI / 3;
      const ox = cos(angle) * orbitRadius;
      const oy = sin(angle) * orbitRadius;
      fill(currentPalette.accent);
      noStroke();
      circle(ox, oy, 4);
    }
  }
  
  if (level >= 3) {
    // Aura radioactiva
    const glowPulse = sin(frameCount * 0.1) * 0.2 + 0.3;
    noFill();
    const auraCol = color(currentPalette.accent);
    auraCol.setAlpha(60 + glowPulse * 100);
    stroke(auraCol);
    strokeWeight(2);
    circle(0, 0, size * 1.2 * (1 + glowPulse));
  }
  
  if (level >= 4) {
    // Ondas de distorsión
    for (let i = 0; i < 3; i++) {
      const ringPhase = (frameCount * 0.02 + i * 0.3) % 1;
      const ringRadius = size * (0.8 + ringPhase * 0.5);
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

function drawSingularShape(type, size) {
  const col = currentPalette.shapes[type % currentPalette.shapes.length];
  stroke(col);
  strokeWeight(3);
  noFill();
  
  const pulse = sin(frameCount * 0.03) * 0.15 + 1;
  
  switch (type) {
    case 0: // Círculo Singular: mandala
      for (let i = 0; i < 4; i++) {
        circle(0, 0, size * (0.3 + i * 0.25) * pulse);
      }
      for (let a = 0; a < TWO_PI; a += PI / 2) {
        const cx = cos(a) * size * 0.4;
        const cy = sin(a) * size * 0.4;
        circle(cx, cy, size * 0.15);
      }
      break;
      
    case 1: // Cuadrado Singular: cubo giratorio
      rectMode(CENTER);
      const rotSpeed = frameCount * 0.02;
      for (let i = 0; i < 3; i++) {
        push();
        rotate(rotSpeed + i * PI / 6);
        square(0, 0, size * (0.6 + i * 0.15) * pulse);
        pop();
      }
      break;
      
    case 2: // Triángulo Singular: estrella 12 puntas
      beginShape();
      for (let i = 0; i < 12; i++) {
        const angle = -PI / 2 + i * TWO_PI / 12;
        const r = (i % 2 === 0) ? size * 0.5 : size * 0.25;
        vertex(cos(angle) * r * pulse, sin(angle) * r * pulse);
      }
      endShape(CLOSE);
      break;
      
    case 3: // Cruz Singular: estrella 8 puntas
      const sSize = size * 0.5 * pulse;
      line(-sSize, 0, sSize, 0);
      line(0, -sSize, 0, sSize);
      const dd = sSize * 0.85;
      line(-dd, -dd, dd, dd);
      line(-dd, dd, dd, -dd);
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        const x1 = cos(a) * sSize * 0.6;
        const y1 = sin(a) * sSize * 0.6;
        const x2 = cos(a) * sSize * 1.2;
        const y2 = sin(a) * sSize * 1.2;
        line(x1, y1, x2, y2);
      }
      break;
      
    case 4: // Hexágono Singular: panal de abejas
      // Hexágono central
      beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = i * TWO_PI / 6;
        vertex(cos(angle) * size * 0.3 * pulse, sin(angle) * size * 0.3 * pulse);
      }
      endShape(CLOSE);
      // Hexágonos satélite
      for (let h = 0; h < 6; h++) {
        const hAngle = h * TWO_PI / 6;
        const hx = cos(hAngle) * size * 0.45;
        const hy = sin(hAngle) * size * 0.45;
        push();
        translate(hx, hy);
        beginShape();
        for (let i = 0; i < 6; i++) {
          const angle = i * TWO_PI / 6;
          vertex(cos(angle) * size * 0.18 * pulse, sin(angle) * size * 0.18 * pulse);
        }
        endShape(CLOSE);
        pop();
      }
      break;
      
    case 5: // Rombo Singular: cluster de diamantes
      const rotSpeedR = frameCount * 0.015;
      for (let r = 0; r < 4; r++) {
        push();
        rotate(rotSpeedR + r * PI / 2);
        const dist = size * 0.3;
        translate(dist, 0);
        beginShape();
        const rs = size * 0.2 * pulse;
        vertex(0, -rs);
        vertex(rs * 0.6, 0);
        vertex(0, rs);
        vertex(-rs * 0.6, 0);
        endShape(CLOSE);
        pop();
      }
      // Centro
      beginShape();
      const cs = size * 0.25 * pulse;
      vertex(0, -cs);
      vertex(cs * 0.6, 0);
      vertex(0, cs);
      vertex(-cs * 0.6, 0);
      endShape(CLOSE);
      break;
      
    case 6: // Pentágono Singular: espiral de Fibonacci
      // Estrella de 5 puntas doble
      for (let layer = 0; layer < 2; layer++) {
        push();
        rotate(layer * PI / 5);
        beginShape();
        for (let i = 0; i < 10; i++) {
          const angle = -PI / 2 + i * TWO_PI / 10;
          const r = (i % 2 === 0) ? size * (0.5 - layer * 0.15) : size * (0.2 - layer * 0.05);
          vertex(cos(angle) * r * pulse, sin(angle) * r * pulse);
        }
        endShape(CLOSE);
        pop();
      }
      break;
      
    case 7: // Luna Singular: eclipse con anillos
      // Anillos
      for (let i = 0; i < 3; i++) {
        const ringSize = size * (0.6 + i * 0.2) * pulse;
        circle(0, 0, ringSize);
      }
      // Luna central
      fill(currentPalette.bg);
      arc(0, 0, size * 0.5 * pulse, size * 0.5 * pulse, PI / 4, PI + PI / 4);
      noFill();
      break;
      
    case 8: // Espiral Singular: galaxia espiral
      const arms = 4;
      for (let arm = 0; arm < arms; arm++) {
        beginShape();
        for (let a = 0; a < TWO_PI * 1.5; a += 0.1) {
          const r = (a / (TWO_PI * 1.5)) * size / 2 * pulse;
          const offset = arm * TWO_PI / arms + frameCount * 0.02;
          vertex(cos(a + offset) * r, sin(a + offset) * r);
        }
        endShape();
      }
      // Núcleo
      fill(col);
      noStroke();
      circle(0, 0, size * 0.1);
      noFill();
      stroke(col);
      break;
  }
  
  // Campo de fuerza permanente
  const fieldPulse = sin(frameCount * 0.04) * 0.2 + 0.8;
  noFill();
  const fieldCol = color(currentPalette.accent);
  fieldCol.setAlpha(120 * fieldPulse);
  stroke(fieldCol);
  strokeWeight(3);
  circle(0, 0, size * 1.5 * fieldPulse);
  
  // Rayos giratorios
  strokeWeight(1.5);
  for (let i = 0; i < 8; i++) {
    const angle = frameCount * 0.02 + i * PI / 4;
    const r1 = size * 0.6;
    const r2 = size * 0.9;
    const rayAlpha = (sin(frameCount * 0.05 + i) * 0.5 + 0.5) * 150;
    fieldCol.setAlpha(rayAlpha);
    stroke(fieldCol);
    line(cos(angle) * r1, sin(angle) * r1, cos(angle) * r2, sin(angle) * r2);
  }
}

function drawFinalVisual(finalType, size) {
  const pulse = sin(frameCount * 0.04) * 0.1 + 1;
  
  // Representación del cuadrado 2x2
  const halfSize = size * 0.4;
  
  if (finalType === 0) {
    // TITAN - 4 formas iguales convergiendo
    stroke(currentPalette.shapes[0]);
    strokeWeight(2);
    noFill();
    
    // 4 círculos en cuadrado
    for (let i = 0; i < 4; i++) {
      const ox = (i % 2 === 0 ? -1 : 1) * halfSize * 0.6;
      const oy = (i < 2 ? -1 : 1) * halfSize * 0.6;
      circle(ox, oy, size * 0.35 * pulse);
    }
    
    // Ondas gravitacionales
    for (let i = 0; i < 3; i++) {
      const wavePhase = (frameCount * 0.02 + i * 0.3) % 1;
      const waveRadius = size * (0.8 + wavePhase);
      const waveAlpha = 100 * (1 - wavePhase);
      const waveCol = color(currentPalette.accent);
      waveCol.setAlpha(waveAlpha);
      stroke(waveCol);
      strokeWeight(1.5);
      circle(0, 0, waveRadius);
    }
    
  } else if (finalType === 1) {
    // NÚCLEO - 4 formas diferentes girando
    const rotation = frameCount * 0.03;
    
    push();
    rotate(rotation);
    for (let i = 0; i < 4; i++) {
      const angle = i * PI / 2;
      const ox = cos(angle) * halfSize * 0.5;
      const oy = sin(angle) * halfSize * 0.5;
      
      push();
      translate(ox, oy);
      stroke(currentPalette.shapes[i]);
      strokeWeight(2);
      noFill();
      
      const miniSize = size * 0.2;
      switch (i) {
        case 0: circle(0, 0, miniSize); break;
        case 1: square(-miniSize/2, -miniSize/2, miniSize); break;
        case 2: triangle(0, -miniSize/2, -miniSize/2, miniSize/2, miniSize/2, miniSize/2); break;
        case 3: line(-miniSize/2, 0, miniSize/2, 0); line(0, -miniSize/2, 0, miniSize/2); break;
      }
      pop();
    }
    pop();
    
    // Núcleo central
    fill(currentPalette.accent);
    noStroke();
    circle(0, 0, 10 * pulse);
    
    // Pulso de transmutación
    const pulsePhase = (frameCount * 0.02) % 1;
    noFill();
    const pulseCol = color(currentPalette.accent);
    pulseCol.setAlpha(150 * (1 - pulsePhase));
    stroke(pulseCol);
    strokeWeight(2);
    circle(0, 0, size * pulsePhase);
    
  } else if (finalType === 2) {
    // TETRÁMERO - forma dominante expandiéndose
    stroke(currentPalette.shapes[2]);
    strokeWeight(3);
    noFill();
    
    // Triángulo central grande
    beginShape();
    for (let i = 0; i < 3; i++) {
      const angle = -PI / 2 + i * TWO_PI / 3;
      vertex(cos(angle) * size * 0.5 * pulse, sin(angle) * size * 0.5 * pulse);
    }
    endShape(CLOSE);
    
    // Anillos de dominio
    const domPhase = (frameCount * 0.015) % 1;
    const domRadius = size * domPhase;
    const domAlpha = 100 * (1 - domPhase);
    const domCol = color(currentPalette.shapes[2]);
    domCol.setAlpha(domAlpha);
    stroke(domCol);
    strokeWeight(2);
    circle(0, 0, domRadius);
    
    // Mini triángulos siendo absorbidos
    for (let i = 0; i < 4; i++) {
      const absorbAngle = frameCount * 0.02 + i * PI / 2;
      const absorbDist = size * 0.7 * (1 - (frameCount * 0.005 + i * 0.25) % 1);
      const ax = cos(absorbAngle) * absorbDist;
      const ay = sin(absorbAngle) * absorbDist;
      
      push();
      translate(ax, ay);
      scale(0.3);
      stroke(currentPalette.shapes[2]);
      strokeWeight(1);
      triangle(0, -5, -5, 5, 5, 5);
      pop();
    }
  }
}

// ============================================
// INPUT
// ============================================
function keyPressed() {
  if (key === 'p' || key === 'P') {
    currentPaletteIndex = (currentPaletteIndex + 1) % PALETTES.length;
    currentPalette = PALETTES[currentPaletteIndex];
  } else if (key === 'o' || key === 'O') {
    currentPaletteIndex = (currentPaletteIndex - 1 + PALETTES.length) % PALETTES.length;
    currentPalette = PALETTES[currentPaletteIndex];
  } else if (key >= '0' && key <= '8') {
    const shapeIndex = parseInt(key);
    selectedShape = selectedShape === shapeIndex ? null : shapeIndex;
  }
}
