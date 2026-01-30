import p5 from 'p5';

// Genuary 2026 - Día 21
// GENERATIVE BAUHAUS POSTER - DONROBOT INDUSTRIES
// Sistema generativo con estética Bauhaus auténtica

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 1000;
const FPS = 30;

// ============================================
// SISTEMA DE SEEDS
// ============================================
function hashSeed(globalSeed, elementId) {
  let hash = globalSeed;
  for (let i = 0; i < elementId.length; i++) {
    hash = ((hash << 5) - hash) + elementId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ============================================
// ELEMENTOS DEL SISTEMA
// ============================================
const ELEMENT_IDS = {
  DOMINANT: 'dominant',
  SECONDARY: 'secondary',
  TYPO_MAIN: 'typoMain',
  TYPO_SECONDARY: 'typoSecondary',
  DATA: 'data',
  PALETTE: 'palette'
};

// Contenido fijo
const SECONDARY_TEXTS = [
  'GENERATIVE SYSTEMS',
  'ART · CODE · AI',
  'ALGORITHMIC DESIGN',
  'VISUAL PRODUCTION'
];

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  let globalSeed = Math.floor(Math.random() * 100000);

  let elements = {
    [ELEMENT_IDS.DOMINANT]: { seed: 0, frozen: false, data: null },
    [ELEMENT_IDS.SECONDARY]: { seed: 0, frozen: false, data: null },
    [ELEMENT_IDS.TYPO_MAIN]: { seed: 0, frozen: false, data: null },
    [ELEMENT_IDS.TYPO_SECONDARY]: { seed: 0, frozen: false, data: null },
    [ELEMENT_IDS.DATA]: { seed: 0, frozen: false, data: null },
    [ELEMENT_IDS.PALETTE]: { seed: 0, frozen: false, data: null }
  };

  let showOverlay = false;
  let showGrid = false;
  let seedInputMode = false;
  let seedInputValue = '';

  // Paleta activa
  let palette = {
    background: '#F5F0E1',
    black: '#1A1A1A',
    primary: '#C41E3A',
    secondary: '#1B4D8C',
    accent: '#F4C430'
  };

  // Tipografía activa
  let typography = {
    name: 'Baumans',
    primary: 'Baumans, sans-serif',
    secondary: 'Jost, sans-serif'
  };

  // Layout activo
  let layout = null;

  // ============================================
  // SETUP
  // ============================================
  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);
    regenerateAll();

    console.log('🎨 DONROBOT INDUSTRIES - Generative Bauhaus Poster');
    console.log('═══════════════════════════════════════════════');
    console.log('Controles:');
    console.log('  1-5  : Freeze/unfreeze elementos');
    console.log('  P    : Freeze paleta');
    console.log('  R    : Reset (regenerar no congelados)');
    console.log('  E    : Exportar PNG');
    console.log('  O    : Toggle overlay debug');
    console.log('  G    : Toggle grid');
    console.log('  S    : Modo input seed');
    console.log('  ↑/↓  : Cambiar seed global');
    console.log('═══════════════════════════════════════════════');
  };

  // ============================================
  // REGENERAR ELEMENTOS
  // ============================================
  function regenerateAll() {
    const orderedIds = [
      ELEMENT_IDS.PALETTE,
      ELEMENT_IDS.DOMINANT,
      ELEMENT_IDS.SECONDARY,
      ELEMENT_IDS.TYPO_MAIN,
      ELEMENT_IDS.TYPO_SECONDARY,
      ELEMENT_IDS.DATA
    ];

    orderedIds.forEach(id => {
      if (!elements[id].frozen) {
        elements[id].seed = hashSeed(globalSeed, id);
        regenerateElement(id);
      }
    });
  }

  function regenerateElement(id) {
    p.randomSeed(elements[id].seed);

    switch(id) {
      case ELEMENT_IDS.PALETTE:
        elements[id].data = generatePalette();
        palette = elements[id].data;
        break;
      case ELEMENT_IDS.DOMINANT:
        elements[id].data = generateDominantShape();
        break;
      case ELEMENT_IDS.SECONDARY:
        elements[id].data = generateSecondaryElements();
        break;
      case ELEMENT_IDS.TYPO_MAIN:
        elements[id].data = generateMainTypo();
        break;
      case ELEMENT_IDS.TYPO_SECONDARY:
        elements[id].data = generateSecondaryTypo();
        break;
      case ELEMENT_IDS.DATA:
        elements[id].data = generateTechnicalData();
        break;
    }
  }

  // ============================================
  // TIPOGRAFÍAS BAUHAUS
  // ============================================
  const bauhausTypographies = [
    { name: 'Baumans', primary: 'Baumans, sans-serif', secondary: 'Jost, sans-serif' },
    { name: 'Bebas Neue', primary: 'Bebas Neue, sans-serif', secondary: 'DM Sans, sans-serif' },
    { name: 'Oswald', primary: 'Oswald, sans-serif', secondary: 'Space Grotesk, sans-serif' },
    { name: 'Archivo Black', primary: 'Archivo Black, sans-serif', secondary: 'Outfit, sans-serif' },
    { name: 'League Spartan', primary: 'League Spartan, sans-serif', secondary: 'Jost, sans-serif' },
    { name: 'Space Grotesk', primary: 'Space Grotesk, sans-serif', secondary: 'DM Sans, sans-serif' },
    { name: 'Outfit', primary: 'Outfit, sans-serif', secondary: 'Jost, sans-serif' },
    { name: 'Syne', primary: 'Syne, sans-serif', secondary: 'Space Grotesk, sans-serif' },
    { name: 'Jost', primary: 'Jost, sans-serif', secondary: 'DM Sans, sans-serif' },
    { name: 'DM Sans', primary: 'DM Sans, sans-serif', secondary: 'Outfit, sans-serif' }
  ];

  // ============================================
  // PALETAS BAUHAUS
  // ============================================
  const bauhausPalettes = [
    { name: 'Bauhaus Primarios', background: '#F5F0E1', black: '#1A1A1A', primary: '#C41E3A', secondary: '#1B4D8C', accent: '#F4C430' },
    { name: 'Kandinsky', background: '#FFFEF5', black: '#0D0D0D', primary: '#E63946', secondary: '#FFB800', accent: '#1D3557' },
    { name: 'Itten Triada', background: '#FAF8F5', black: '#2B2B2B', primary: '#0077B6', secondary: '#E76F51', accent: '#2A9D8F' },
    { name: 'Albers', background: '#F7F3E9', black: '#1C1C1C', primary: '#BC4749', secondary: '#386641', accent: '#F2CC8F' },
    { name: 'Moholy-Nagy', background: '#E8E4DC', black: '#0F0F0F', primary: '#D62828', secondary: '#003049', accent: '#FCBF49' },
    { name: 'Schlemmer', background: '#FDF6E3', black: '#1A1A2E', primary: '#E94560', secondary: '#0F3460', accent: '#F9A825' },
    { name: 'Breuer', background: '#FFFFFF', black: '#212121', primary: '#B71C1C', secondary: '#1565C0', accent: '#F9A825' },
    { name: 'Dessau', background: '#EFEBE9', black: '#263238', primary: '#FF5722', secondary: '#00695C', accent: '#FFC107' }
  ];

  // ============================================
  // SISTEMA DE LAYOUT BAUHAUS
  // ============================================
  function generateLayout() {
    // Ángulos Bauhaus: 0°, 45°, 90°, -45°
    const diagonalAngle = p.random() > 0.5 ? p.PI / 4 : -p.PI / 4;

    // Composición asimétrica con zona dominante
    const compositions = [
      // Diagonal dominante arriba-izquierda a abajo-derecha
      {
        type: 'diagonal-tl-br',
        mainTextPos: { x: 50, y: 60 },
        mainTextRotation: 0,
        verticalTextPos: { x: CANVAS_WIDTH - 60, y: CANVAS_HEIGHT - 200 },
        verticalTextRotation: -p.HALF_PI,
        graphicCenter: { x: CANVAS_WIDTH * 0.6, y: CANVAS_HEIGHT * 0.5 },
        diagonalAngle: diagonalAngle,
        numberPos: { x: CANVAS_WIDTH - 120, y: 100 }
      },
      // Diagonal dominante arriba-derecha a abajo-izquierda
      {
        type: 'diagonal-tr-bl',
        mainTextPos: { x: CANVAS_WIDTH - 50, y: 60 },
        mainTextRotation: 0,
        verticalTextPos: { x: 60, y: CANVAS_HEIGHT - 200 },
        verticalTextRotation: p.HALF_PI,
        graphicCenter: { x: CANVAS_WIDTH * 0.4, y: CANVAS_HEIGHT * 0.5 },
        diagonalAngle: -diagonalAngle,
        numberPos: { x: 100, y: 100 }
      },
      // Texto vertical lateral izquierdo
      {
        type: 'vertical-left',
        mainTextPos: { x: 80, y: CANVAS_HEIGHT / 2 },
        mainTextRotation: -p.HALF_PI,
        verticalTextPos: { x: CANVAS_WIDTH - 60, y: 150 },
        verticalTextRotation: 0,
        graphicCenter: { x: CANVAS_WIDTH * 0.6, y: CANVAS_HEIGHT * 0.55 },
        diagonalAngle: diagonalAngle,
        numberPos: { x: CANVAS_WIDTH - 150, y: CANVAS_HEIGHT - 150 }
      },
      // Texto diagonal
      {
        type: 'diagonal-text',
        mainTextPos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 - 100 },
        mainTextRotation: -p.PI / 12,
        verticalTextPos: { x: 60, y: 100 },
        verticalTextRotation: 0,
        graphicCenter: { x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.7 },
        diagonalAngle: diagonalAngle,
        numberPos: { x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT - 100 }
      }
    ];

    return compositions[Math.floor(p.random(compositions.length))];
  }

  // ============================================
  // GENERAR PALETA
  // ============================================
  function generatePalette() {
    const selectedPalette = bauhausPalettes[Math.floor(p.random(bauhausPalettes.length))];
    const selectedTypo = bauhausTypographies[Math.floor(p.random(bauhausTypographies.length))];

    typography = {
      name: selectedTypo.name,
      primary: selectedTypo.primary,
      secondary: selectedTypo.secondary
    };

    layout = generateLayout();

    console.log(`🎨 Paleta: ${selectedPalette.name}`);
    console.log(`🔤 Tipografía: ${selectedTypo.name}`);
    console.log(`📐 Layout: ${layout.type}`);

    return { ...selectedPalette };
  }

  // ============================================
  // FORMA DOMINANTE - Bauhaus auténtico
  // ============================================
  function generateDominantShape() {
    if (!layout) layout = generateLayout();

    // Formas Bauhaus expandidas: incluye triángulos, anillos, cuartos de círculo
    const types = [
      'circle', 'semicircle', 'quarter-circle',
      'triangle', 'ring', 'arc-thick',
      'rectangle', 'diagonal-bar'
    ];
    const type = types[Math.floor(p.random(types.length))];

    // Tamaño que puede salir del canvas (más impactante)
    const size = p.random(0.6, 0.9) * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT);

    // Posición puede estar parcialmente fuera del canvas
    const center = layout.graphicCenter;
    const offsetRange = size * 0.3;
    const x = center.x + p.random(-offsetRange, offsetRange);
    const y = center.y + p.random(-offsetRange, offsetRange);

    // Rotaciones Bauhaus: 0°, 45°, 90°, etc.
    const rotations = [0, p.PI / 4, p.HALF_PI, p.PI * 3/4, p.PI, -p.PI / 4, -p.HALF_PI];
    const rotation = rotations[Math.floor(p.random(rotations.length))];

    const colors = [palette.black, palette.primary, palette.secondary];
    const color = colors[Math.floor(p.random(colors.length))];

    // Para anillos, necesitamos un color de fondo o segundo color
    const secondColor = p.random() > 0.5 ? palette.accent : palette.background;

    return { type, x, y, size, rotation, color, secondColor };
  }

  // ============================================
  // ELEMENTOS SECUNDARIOS - Líneas, barras, formas
  // ============================================
  function generateSecondaryElements() {
    if (!layout) layout = generateLayout();

    const elements = [];

    // 1. BARRAS DIAGONALES que atraviesan el poster
    if (p.random() > 0.3) {
      const numBars = Math.floor(p.random(1, 4));
      for (let i = 0; i < numBars; i++) {
        const barWidth = p.random(8, 30);
        const barLength = p.random(CANVAS_WIDTH * 0.5, CANVAS_WIDTH * 1.5);
        const angle = layout.diagonalAngle + p.random(-0.1, 0.1);

        elements.push({
          type: 'diagonal-bar',
          x: p.random(-100, CANVAS_WIDTH + 100),
          y: p.random(-100, CANVAS_HEIGHT + 100),
          width: barWidth,
          length: barLength,
          rotation: angle,
          color: [palette.black, palette.primary, palette.secondary, palette.accent][Math.floor(p.random(4))]
        });
      }
    }

    // 2. LÍNEAS HORIZONTALES/VERTICALES gruesas
    if (p.random() > 0.4) {
      const numLines = Math.floor(p.random(2, 6));
      for (let i = 0; i < numLines; i++) {
        const isHorizontal = p.random() > 0.5;
        const thickness = p.random(4, 20);
        const length = p.random(100, isHorizontal ? CANVAS_WIDTH : CANVAS_HEIGHT);

        elements.push({
          type: 'line',
          x: p.random(0, CANVAS_WIDTH),
          y: p.random(0, CANVAS_HEIGHT),
          width: isHorizontal ? length : thickness,
          height: isHorizontal ? thickness : length,
          rotation: 0,
          color: [palette.black, palette.primary, palette.secondary][Math.floor(p.random(3))]
        });
      }
    }

    // 3. CÍRCULOS pequeños/medianos (pueden superponerse)
    if (p.random() > 0.3) {
      const numCircles = Math.floor(p.random(1, 5));
      for (let i = 0; i < numCircles; i++) {
        const size = p.random(20, 120);
        elements.push({
          type: 'circle',
          x: p.random(-size/2, CANVAS_WIDTH + size/2),
          y: p.random(-size/2, CANVAS_HEIGHT + size/2),
          size: size,
          filled: p.random() > 0.3,
          strokeWeight: p.random(3, 12),
          color: [palette.black, palette.primary, palette.secondary, palette.accent][Math.floor(p.random(4))]
        });
      }
    }

    // 4. TRIÁNGULOS
    if (p.random() > 0.5) {
      const numTriangles = Math.floor(p.random(1, 3));
      for (let i = 0; i < numTriangles; i++) {
        const size = p.random(50, 150);
        const rotations = [0, p.PI / 4, p.HALF_PI, p.PI, -p.PI / 4];
        elements.push({
          type: 'triangle',
          x: p.random(0, CANVAS_WIDTH),
          y: p.random(0, CANVAS_HEIGHT),
          size: size,
          rotation: rotations[Math.floor(p.random(rotations.length))],
          color: [palette.black, palette.primary, palette.secondary][Math.floor(p.random(3))]
        });
      }
    }

    // 5. PUNTOS en patrón
    if (p.random() > 0.6) {
      const dotSize = p.random(8, 20);
      const spacing = p.random(30, 60);
      const startX = p.random(50, CANVAS_WIDTH - 200);
      const startY = p.random(50, CANVAS_HEIGHT - 200);
      const cols = Math.floor(p.random(3, 8));
      const rows = Math.floor(p.random(3, 8));
      const dotColor = [palette.black, palette.primary, palette.accent][Math.floor(p.random(3))];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          elements.push({
            type: 'dot',
            x: startX + c * spacing,
            y: startY + r * spacing,
            size: dotSize,
            color: dotColor
          });
        }
      }
    }

    // 6. SEMICÍRCULOS decorativos
    if (p.random() > 0.5) {
      const size = p.random(80, 200);
      const rotations = [0, p.HALF_PI, p.PI, -p.HALF_PI];
      elements.push({
        type: 'semicircle',
        x: p.random() > 0.5 ? 0 : CANVAS_WIDTH,
        y: p.random(100, CANVAS_HEIGHT - 100),
        size: size,
        rotation: rotations[Math.floor(p.random(rotations.length))],
        color: [palette.primary, palette.secondary, palette.accent][Math.floor(p.random(3))]
      });
    }

    return elements;
  }

  // ============================================
  // TIPOGRAFÍA PRINCIPAL - Con rotación
  // ============================================
  function generateMainTypo() {
    if (!layout) layout = generateLayout();

    // Tamaños más extremos para jerarquía Bauhaus
    const fontSizes = [72, 86, 96, 110];
    const fontSize = fontSizes[Math.floor(p.random(fontSizes.length))];

    const colors = [palette.black, palette.primary];
    const color = colors[Math.floor(p.random(colors.length))];

    // Puede tener tracking extremo
    const tracking = p.random() > 0.7 ? p.random(5, 15) : 0;

    return {
      pos: layout.mainTextPos,
      rotation: layout.mainTextRotation,
      fontSize,
      color,
      tracking,
      align: layout.type.includes('tr-bl') ? 'right' : 'left'
    };
  }

  // ============================================
  // TIPOGRAFÍA SECUNDARIA - Texto vertical/diagonal
  // ============================================
  function generateSecondaryTypo() {
    if (!layout) layout = generateLayout();

    const text = SECONDARY_TEXTS[Math.floor(p.random(SECONDARY_TEXTS.length))];

    // Tamaño pequeño para contraste
    const fontSizes = [11, 13, 16, 18];
    const fontSize = fontSizes[Math.floor(p.random(fontSizes.length))];

    const colors = [palette.black, palette.primary, palette.secondary];
    const color = colors[Math.floor(p.random(colors.length))];

    return {
      text,
      pos: layout.verticalTextPos,
      rotation: layout.verticalTextRotation,
      fontSize,
      color
    };
  }

  // ============================================
  // DATOS TÉCNICOS - Números grandes decorativos
  // ============================================
  function generateTechnicalData() {
    if (!layout) layout = generateLayout();

    // Número grande decorativo (año, edición, etc.)
    const decorativeNumbers = ['26', '21', '2026', 'I', 'II', 'III', 'IV'];
    const number = decorativeNumbers[Math.floor(p.random(decorativeNumbers.length))];

    // Tamaño MUY grande para el número
    const numberSize = p.random(120, 200);

    const colors = [palette.black, palette.primary, palette.secondary, palette.accent];
    const numberColor = colors[Math.floor(p.random(colors.length))];

    // Texto técnico pequeño
    const techText = `MADRID · ${p.random() > 0.5 ? 'MMXXVI' : '2026'}`;

    return {
      number,
      numberSize,
      numberColor,
      numberPos: layout.numberPos,
      numberRotation: p.random() > 0.7 ? p.random(-0.2, 0.2) : 0,
      techText,
      techPos: { x: 45, y: CANVAS_HEIGHT - 45 }
    };
  }

  // ============================================
  // DIBUJAR FORMA DOMINANTE
  // ============================================
  function drawDominantShape(data) {
    if (!data) return;

    p.push();
    p.translate(data.x, data.y);
    p.rotate(data.rotation);
    p.noStroke();
    p.fill(data.color);

    const s = data.size;

    switch(data.type) {
      case 'circle':
        p.ellipse(0, 0, s, s);
        break;

      case 'semicircle':
        p.arc(0, 0, s, s, 0, p.PI, p.PIE);
        break;

      case 'quarter-circle':
        p.arc(0, 0, s, s, 0, p.HALF_PI, p.PIE);
        break;

      case 'triangle':
        p.triangle(0, -s/2, -s/2, s/2, s/2, s/2);
        break;

      case 'ring':
        p.fill(data.color);
        p.ellipse(0, 0, s, s);
        p.fill(data.secondColor);
        p.ellipse(0, 0, s * 0.5, s * 0.5);
        break;

      case 'arc-thick':
        p.noFill();
        p.stroke(data.color);
        p.strokeWeight(s * 0.15);
        p.arc(0, 0, s * 0.7, s * 0.7, 0, p.PI + p.HALF_PI);
        break;

      case 'rectangle':
        p.rectMode(p.CENTER);
        p.rect(0, 0, s, s * 0.5);
        break;

      case 'diagonal-bar':
        p.rectMode(p.CENTER);
        p.rect(0, 0, s, s * 0.12);
        break;
    }

    p.pop();
  }

  // ============================================
  // DIBUJAR ELEMENTOS SECUNDARIOS
  // ============================================
  function drawSecondaryElements(elements) {
    if (!elements) return;

    elements.forEach(el => {
      p.push();
      p.translate(el.x, el.y);
      if (el.rotation) p.rotate(el.rotation);

      switch(el.type) {
        case 'diagonal-bar':
          p.noStroke();
          p.fill(el.color);
          p.rectMode(p.CENTER);
          p.rect(0, 0, el.length, el.width);
          break;

        case 'line':
          p.noStroke();
          p.fill(el.color);
          p.rectMode(p.CORNER);
          p.rect(-el.width/2, -el.height/2, el.width, el.height);
          break;

        case 'circle':
          if (el.filled) {
            p.noStroke();
            p.fill(el.color);
          } else {
            p.noFill();
            p.stroke(el.color);
            p.strokeWeight(el.strokeWeight);
          }
          p.ellipse(0, 0, el.size, el.size);
          break;

        case 'triangle':
          p.noStroke();
          p.fill(el.color);
          const s = el.size;
          p.triangle(0, -s/2, -s/2, s/2, s/2, s/2);
          break;

        case 'dot':
          p.noStroke();
          p.fill(el.color);
          p.ellipse(0, 0, el.size, el.size);
          break;

        case 'semicircle':
          p.noStroke();
          p.fill(el.color);
          p.arc(0, 0, el.size, el.size, 0, p.PI, p.PIE);
          break;
      }

      p.pop();
    });
  }

  // ============================================
  // DIBUJAR TIPOGRAFÍA PRINCIPAL
  // ============================================
  function drawMainTypo(data) {
    if (!data) return;

    p.push();
    p.translate(data.pos.x, data.pos.y);
    p.rotate(data.rotation);

    p.fill(data.color);
    p.noStroke();
    p.textFont(typography.primary);
    p.textSize(data.fontSize);
    p.textStyle(p.BOLD);

    if (data.align === 'right') {
      p.textAlign(p.RIGHT, p.TOP);
    } else {
      p.textAlign(p.LEFT, p.TOP);
    }

    const text1 = 'DONROBOT';
    const text2 = 'INDUSTRIES';
    const lineHeight = data.fontSize * 1.05;

    if (data.tracking > 0) {
      drawTextWithTracking(text1, 0, 0, data.tracking);
      drawTextWithTracking(text2, 0, lineHeight, data.tracking);
    } else {
      p.text(text1, 0, 0);
      p.text(text2, 0, lineHeight);
    }

    p.pop();
  }

  function drawTextWithTracking(txt, x, y, tracking) {
    let currentX = x;
    for (let i = 0; i < txt.length; i++) {
      p.text(txt[i], currentX, y);
      currentX += p.textWidth(txt[i]) + tracking;
    }
  }

  // ============================================
  // DIBUJAR TIPOGRAFÍA SECUNDARIA
  // ============================================
  function drawSecondaryTypo(data) {
    if (!data) return;

    p.push();
    p.translate(data.pos.x, data.pos.y);
    p.rotate(data.rotation);

    p.fill(data.color);
    p.noStroke();
    p.textFont(typography.secondary);
    p.textSize(data.fontSize);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);

    p.text(data.text, 0, 0);
    p.pop();
  }

  // ============================================
  // DIBUJAR DATOS TÉCNICOS
  // ============================================
  function drawTechnicalData(data) {
    if (!data) return;

    // Número grande decorativo
    p.push();
    p.translate(data.numberPos.x, data.numberPos.y);
    p.rotate(data.numberRotation);

    p.fill(data.numberColor);
    p.noStroke();
    p.textFont(typography.primary);
    p.textSize(data.numberSize);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(data.number, 0, 0);
    p.pop();

    // Texto técnico pequeño
    p.push();
    p.fill(palette.black);
    p.noStroke();
    p.textFont(typography.secondary);
    p.textSize(11);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text(data.techText, data.techPos.x, data.techPos.y);
    p.pop();
  }

  // ============================================
  // OVERLAY DE DEBUG
  // ============================================
  function drawOverlay() {
    p.push();
    p.fill(0, 220);
    p.noStroke();
    p.rect(10, 10, 250, 320, 5);

    p.fill(255);
    p.textFont('monospace');
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);

    let y = 20;
    const lineHeight = 18;

    p.text('BAUHAUS POSTER DEBUG', 20, y);
    y += lineHeight + 5;
    p.text('─────────────────────────', 20, y);
    y += lineHeight;

    p.text(`Global Seed: ${globalSeed}`, 20, y);
    y += lineHeight;
    p.text(`Layout: ${layout ? layout.type : 'N/A'}`, 20, y);
    y += lineHeight + 5;

    const elementNames = {
      [ELEMENT_IDS.DOMINANT]: '1. Forma Dominante',
      [ELEMENT_IDS.SECONDARY]: '2. Elementos Secundarios',
      [ELEMENT_IDS.TYPO_MAIN]: '3. Tipografía Principal',
      [ELEMENT_IDS.TYPO_SECONDARY]: '4. Tipografía Secundaria',
      [ELEMENT_IDS.DATA]: '5. Datos/Número',
      [ELEMENT_IDS.PALETTE]: 'P. Paleta + Typo'
    };

    Object.keys(elements).forEach(id => {
      const el = elements[id];
      const frozen = el.frozen ? '❄️' : '🔄';
      p.text(`${elementNames[id]} ${frozen}`, 20, y);
      y += lineHeight;
    });

    y += 5;
    p.text('─────────────────────────', 20, y);
    y += lineHeight;

    p.text(`Typo: ${typography.name}`, 20, y);
    y += lineHeight;

    p.text('Paleta:', 20, y);
    y += lineHeight;

    const colors = [palette.background, palette.black, palette.primary, palette.secondary, palette.accent];
    colors.forEach((c, i) => {
      p.fill(c);
      p.stroke(255);
      p.strokeWeight(1);
      p.rect(20 + i * 44, y, 40, 20, 3);
    });

    p.pop();
  }

  // ============================================
  // GRID DE DEBUG
  // ============================================
  function drawGrid() {
    p.push();
    p.stroke(100, 100, 100, 60);
    p.strokeWeight(0.5);

    // Grid modular
    const cellSize = 50;
    for (let x = 0; x <= CANVAS_WIDTH; x += cellSize) {
      p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += cellSize) {
      p.line(0, y, CANVAS_WIDTH, y);
    }

    // Diagonales Bauhaus
    p.stroke(255, 100, 100, 60);
    p.line(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.line(CANVAS_WIDTH, 0, 0, CANVAS_HEIGHT);

    // Centro
    p.stroke(100, 100, 255, 80);
    p.line(CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    p.line(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);

    p.pop();
  }

  // ============================================
  // INPUT DE SEED
  // ============================================
  function drawSeedInput() {
    p.push();
    p.fill(0, 240);
    p.noStroke();
    p.rect(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2 - 40, 240, 80, 8);

    p.textFont(typography.secondary);
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('ENTER SEED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    p.fill(255, 200, 0);
    p.textSize(24);
    p.text(seedInputValue + '_', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
    p.pop();
  }

  // ============================================
  // DRAW PRINCIPAL
  // ============================================
  p.draw = () => {
    p.background(palette.background);

    // Orden de capas para superposición intencional Bauhaus
    // 1. Elementos secundarios (barras, líneas, círculos pequeños)
    drawSecondaryElements(elements[ELEMENT_IDS.SECONDARY].data);

    // 2. Forma dominante (puede superponerse con todo)
    drawDominantShape(elements[ELEMENT_IDS.DOMINANT].data);

    // 3. Número decorativo grande
    drawTechnicalData(elements[ELEMENT_IDS.DATA].data);

    // 4. Tipografía principal (sobre todo)
    drawMainTypo(elements[ELEMENT_IDS.TYPO_MAIN].data);

    // 5. Tipografía secundaria
    drawSecondaryTypo(elements[ELEMENT_IDS.TYPO_SECONDARY].data);

    // UI
    if (showGrid) drawGrid();
    if (showOverlay) drawOverlay();
    if (seedInputMode) drawSeedInput();
  };

  // ============================================
  // EXPORTAR PNG
  // ============================================
  function exportPNG() {
    const wasOverlay = showOverlay;
    const wasGrid = showGrid;
    showOverlay = false;
    showGrid = false;
    p.draw();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `donrobot_bauhaus_${globalSeed}_${timestamp}`;
    p.saveCanvas(filename, 'png');
    console.log(`✅ Exportado: ${filename}.png`);

    showOverlay = wasOverlay;
    showGrid = wasGrid;
  }

  // ============================================
  // TOGGLE FREEZE
  // ============================================
  function toggleFreeze(elementId) {
    elements[elementId].frozen = !elements[elementId].frozen;
    const state = elements[elementId].frozen ? 'FROZEN ❄️' : 'LIVE 🔄';
    console.log(`${elementId}: ${state}`);
  }

  // ============================================
  // CONTROLES DE TECLADO
  // ============================================
  p.keyPressed = () => {
    if (seedInputMode) {
      if (p.keyCode === p.ENTER) {
        const newSeed = parseInt(seedInputValue);
        if (!isNaN(newSeed)) {
          globalSeed = newSeed;
          regenerateAll();
          console.log(`🌱 Seed aplicada: ${globalSeed}`);
        }
        seedInputMode = false;
        seedInputValue = '';
      } else if (p.keyCode === p.ESCAPE) {
        seedInputMode = false;
        seedInputValue = '';
      } else if (p.keyCode === p.BACKSPACE) {
        seedInputValue = seedInputValue.slice(0, -1);
      } else if (p.key >= '0' && p.key <= '9') {
        seedInputValue += p.key;
      }
      return;
    }

    switch(p.key) {
      case '1': toggleFreeze(ELEMENT_IDS.DOMINANT); break;
      case '2': toggleFreeze(ELEMENT_IDS.SECONDARY); break;
      case '3': toggleFreeze(ELEMENT_IDS.TYPO_MAIN); break;
      case '4': toggleFreeze(ELEMENT_IDS.TYPO_SECONDARY); break;
      case '5': toggleFreeze(ELEMENT_IDS.DATA); break;
      case 'p': case 'P': toggleFreeze(ELEMENT_IDS.PALETTE); break;
      case 'r': case 'R':
        globalSeed = Math.floor(Math.random() * 100000);
        regenerateAll();
        console.log(`🔄 Reset - Nueva seed: ${globalSeed}`);
        break;
      case 'e': case 'E': exportPNG(); break;
      case 'o': case 'O':
        showOverlay = !showOverlay;
        console.log(`📊 Overlay: ${showOverlay ? 'ON' : 'OFF'}`);
        break;
      case 'g': case 'G':
        showGrid = !showGrid;
        console.log(`📐 Grid: ${showGrid ? 'ON' : 'OFF'}`);
        break;
      case 's': case 'S':
        seedInputMode = true;
        seedInputValue = '';
        console.log('🌱 Modo input seed activado');
        break;
    }

    if (p.keyCode === p.UP_ARROW) {
      globalSeed++;
      regenerateAll();
      console.log(`⬆️ Seed: ${globalSeed}`);
    }
    if (p.keyCode === p.DOWN_ARROW) {
      globalSeed--;
      regenerateAll();
      console.log(`⬇️ Seed: ${globalSeed}`);
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
