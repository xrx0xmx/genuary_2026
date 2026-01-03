import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 4
// Prompt: Lowres - Píxeles como partículas inteligentes (Image-based)

// ============================================
// CONFIGURACIÓN
// ============================================
const FPS = 60;
const CANVAS_SIZE = 800;

// Parámetros ajustables
const CONFIG = {
  gridResolution: 40,        // Número de celdas (40x40 = baja resolución)
  cursorRepulsion: 150,      // Radio de repulsión del cursor
  cursorStrength: 80,        // Intensidad de repulsión
  noiseAmplitude: 8,         // Amplitud del ruido Perlin
  noiseSpeed: 0.008,         // Velocidad de animación del ruido
  returnSpeed: 0.08,         // Velocidad de retorno a posición original
  pixelGap: 1,               // Espacio entre píxeles (0 = sin espacio)
  showHUD: true,             // Mostrar/ocultar HUD
};

// Paleta para el fondo
const BG_COLOR = [8, 8, 12];

// ============================================
// CLASE PIXEL PARTICLE
// ============================================
class PixelParticle {
  constructor(p, gridX, gridY, color, cellSize) {
    this.p = p;
    
    // Posición base en el grid
    this.gridX = gridX;
    this.gridY = gridY;
    
    // Posición real (centro del canvas + offset del grid)
    this.baseX = 0;
    this.baseY = 0;
    
    // Posición actual (con desplazamiento)
    this.x = 0;
    this.y = 0;
    
    // Velocidad para física suave
    this.vx = 0;
    this.vy = 0;
    
    // Color original del píxel
    this.r = color[0];
    this.g = color[1];
    this.b = color[2];
    this.a = color[3] !== undefined ? color[3] : 255;
    
    // Tamaño de la celda
    this.cellSize = cellSize;
    
    // Offset único para el ruido Perlin
    this.noiseOffsetX = p.random(1000);
    this.noiseOffsetY = p.random(1000);
    
    // Factor de "vida" individual
    this.lifeFactor = p.random(0.8, 1.2);
  }
  
  setBasePosition(offsetX, offsetY) {
    this.baseX = offsetX + this.gridX * this.cellSize + this.cellSize / 2;
    this.baseY = offsetY + this.gridY * this.cellSize + this.cellSize / 2;
    this.x = this.baseX;
    this.y = this.baseY;
  }
  
  update(mouseX, mouseY, time) {
    const p = this.p;
    
    // 1. Calcular desplazamiento por ruido Perlin
    const noiseX = p.noise(
      this.noiseOffsetX + time * CONFIG.noiseSpeed,
      this.gridY * 0.1
    ) - 0.5;
    const noiseY = p.noise(
      this.noiseOffsetY + time * CONFIG.noiseSpeed,
      this.gridX * 0.1
    ) - 0.5;
    
    const noiseDisplacementX = noiseX * CONFIG.noiseAmplitude * 2 * this.lifeFactor;
    const noiseDisplacementY = noiseY * CONFIG.noiseAmplitude * 2 * this.lifeFactor;
    
    // 2. Calcular repulsión del cursor
    let repulsionX = 0;
    let repulsionY = 0;
    
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < CONFIG.cursorRepulsion && distance > 0) {
      const force = (1 - distance / CONFIG.cursorRepulsion) * CONFIG.cursorStrength;
      repulsionX = (dx / distance) * force;
      repulsionY = (dy / distance) * force;
    }
    
    // 3. Calcular posición objetivo
    const targetX = this.baseX + noiseDisplacementX + repulsionX;
    const targetY = this.baseY + noiseDisplacementY + repulsionY;
    
    // 4. Mover suavemente hacia el objetivo
    this.vx += (targetX - this.x) * CONFIG.returnSpeed;
    this.vy += (targetY - this.y) * CONFIG.returnSpeed;
    
    // Fricción
    this.vx *= 0.85;
    this.vy *= 0.85;
    
    // Aplicar velocidad
    this.x += this.vx;
    this.y += this.vy;
  }
  
  draw() {
    const p = this.p;
    const size = this.cellSize - CONFIG.pixelGap;
    
    // Calcular desplazamiento para efectos visuales sutiles
    const displacement = Math.sqrt(
      Math.pow(this.x - this.baseX, 2) + 
      Math.pow(this.y - this.baseY, 2)
    );
    
    // Brillo ligeramente aumentado cuando hay movimiento
    const brightnessFactor = 1 + displacement * 0.002;
    
    p.noStroke();
    p.fill(
      Math.min(255, this.r * brightnessFactor),
      Math.min(255, this.g * brightnessFactor),
      Math.min(255, this.b * brightnessFactor),
      this.a
    );
    
    // Dibujar como rectángulo (estética pixelada)
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, size, size);
  }
}

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  let particles = [];
  let img = null;
  let imageLoaded = false;
  let cellSize = 0;
  let gridWidth = 0;
  let gridHeight = 0;
  let offsetX = 0;
  let offsetY = 0;
  let loadingAngle = 0;
  
  // Imagen por defecto (ruta local)
  const DEFAULT_IMAGE = '../shared/dr_tapiz.jpeg';
  
  // Para drag & drop
  let dragOver = false;

  function processImage() {
    if (!img) return;
    
    particles = [];
    
    // Calcular tamaño de celda basado en la resolución del grid
    const maxGridSize = CONFIG.gridResolution;
    
    // Mantener proporción de la imagen
    const imgAspect = img.width / img.height;
    
    if (imgAspect >= 1) {
      // Imagen horizontal o cuadrada
      gridWidth = maxGridSize;
      gridHeight = Math.floor(maxGridSize / imgAspect);
    } else {
      // Imagen vertical
      gridHeight = maxGridSize;
      gridWidth = Math.floor(maxGridSize * imgAspect);
    }
    
    // Calcular tamaño de celda para que quepa en el canvas
    const maxDisplaySize = CANVAS_SIZE * 0.85;
    cellSize = Math.floor(Math.min(
      maxDisplaySize / gridWidth,
      maxDisplaySize / gridHeight
    ));
    
    // Calcular offset para centrar
    const totalWidth = gridWidth * cellSize;
    const totalHeight = gridHeight * cellSize;
    offsetX = (CANVAS_SIZE - totalWidth) / 2;
    offsetY = (CANVAS_SIZE - totalHeight) / 2;
    
    // Redimensionar imagen para extraer colores
    img.resize(gridWidth, gridHeight);
    img.loadPixels();
    
    // Crear partículas desde los píxeles
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const idx = (y * gridWidth + x) * 4;
        const r = img.pixels[idx];
        const g = img.pixels[idx + 1];
        const b = img.pixels[idx + 2];
        const a = img.pixels[idx + 3];
        
        // Ignorar píxeles completamente transparentes
        if (a < 10) continue;
        
        const particle = new PixelParticle(
          p,
          x, y,
          [r, g, b, a],
          cellSize
        );
        particle.setBasePosition(offsetX, offsetY);
        particles.push(particle);
      }
    }
    
    imageLoaded = true;
    console.log(`✨ Imagen procesada: ${gridWidth}×${gridHeight} píxeles (${particles.length} partículas)`);
  }

  function loadImageFromURL(url) {
    imageLoaded = false;
    console.log('📷 Cargando imagen...');
    
    p.loadImage(
      url,
      (loadedImg) => {
        img = loadedImg;
        processImage();
      },
      () => {
        console.error('❌ Error cargando imagen. Usando imagen de respaldo.');
        // Crear una imagen de gradiente como respaldo
        createFallbackImage();
      }
    );
  }
  
  function createFallbackImage() {
    // Crear una imagen de gradiente como respaldo
    const size = 100;
    img = p.createImage(size, size);
    img.loadPixels();
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        
        // Gradiente con patrones interesantes
        const cx = x - size / 2;
        const cy = y - size / 2;
        const dist = Math.sqrt(cx * cx + cy * cy);
        const angle = Math.atan2(cy, cx);
        
        // Crear un patrón tipo mandala
        const r = Math.sin(dist * 0.1 + angle * 3) * 127 + 128;
        const g = Math.cos(dist * 0.15 - angle * 2) * 127 + 128;
        const b = Math.sin(angle * 5 + dist * 0.08) * 127 + 128;
        
        img.pixels[idx] = r;
        img.pixels[idx + 1] = g;
        img.pixels[idx + 2] = b;
        img.pixels[idx + 3] = 255;
      }
    }
    
    img.updatePixels();
    processImage();
  }

  function handleFileDrop(file) {
    if (file.type === 'image') {
      console.log('📁 Archivo recibido:', file.name);
      img = p.loadImage(file.data, () => {
        processImage();
      });
    } else {
      console.warn('⚠️ Por favor, arrastra un archivo de imagen (JPG, PNG, GIF)');
    }
    dragOver = false;
  }

  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.noSmooth(); // Sin suavizado para estética pixelada
    
    // Configurar drag & drop
    canvas.drop(handleFileDrop);
    canvas.dragOver(() => { dragOver = true; });
    canvas.dragLeave(() => { dragOver = false; });
    
    // Cargar imagen por defecto
    loadImageFromURL(DEFAULT_IMAGE);
    
    // Configurar grabador
    setupRecorder(p, 10, FPS);
    
    console.log('🎨 Día 4: Lowres - Píxeles como partículas');
    console.log('🖱️ Mueve el cursor para interactuar');
    console.log('📁 Arrastra una imagen para cargarla');
    console.log('⌨️ Teclas: R = reset, +/- = resolución, S = grabar');
  };

  p.draw = () => {
    const time = p.millis();
    
    // Fondo
    p.background(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]);
    
    if (!imageLoaded) {
      // Pantalla de carga
      drawLoadingScreen(time);
      return;
    }
    
    // Overlay de drag & drop
    if (dragOver) {
      drawDropOverlay();
    }
    
    // Actualizar y dibujar partículas
    for (const particle of particles) {
      particle.update(p.mouseX, p.mouseY, time);
      particle.draw();
    }
    
    // UI mínima
    if (CONFIG.showHUD) {
      drawUI();
    }
  };
  
  function drawLoadingScreen(time) {
    loadingAngle += 0.05;
    
    p.push();
    p.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    
    // Spinner animado
    p.noFill();
    p.strokeWeight(3);
    
    for (let i = 0; i < 8; i++) {
      const angle = loadingAngle + (i * p.TWO_PI / 8);
      const alpha = ((i + 1) / 8) * 255;
      p.stroke(255, 255, 255, alpha);
      
      const x1 = Math.cos(angle) * 30;
      const y1 = Math.sin(angle) * 30;
      const x2 = Math.cos(angle) * 50;
      const y2 = Math.sin(angle) * 50;
      
      p.line(x1, y1, x2, y2);
    }
    
    // Texto
    p.noStroke();
    p.fill(255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('Cargando imagen...', 0, 80);
    
    p.pop();
  }
  
  function drawDropOverlay() {
    p.push();
    p.fill(50, 100, 200, 100);
    p.noStroke();
    p.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text('Suelta la imagen aquí', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    p.pop();
  }
  
  function drawUI() {
    p.push();
    
    // Panel semi-transparente
    p.fill(0, 0, 0, 120);
    p.noStroke();
    p.rect(15, 15, 200, 70, 6);
    
    // Texto
    p.fill(255, 255, 255, 180);
    p.textSize(10);
    p.textFont('monospace');
    p.textAlign(p.LEFT, p.TOP);
    
    p.text(`Grid: ${gridWidth}×${gridHeight}`, 25, 25);
    p.text(`Partículas: ${particles.length}`, 25, 40);
    p.text(`Celda: ${cellSize}px`, 25, 55);
    p.text(`Arrastra imagen para cambiar`, 25, 70);
    
    p.pop();
  }
  
  // Controles de teclado
  p.keyPressed = () => {
    switch (p.key) {
      case 'd':
      case 'D':
        CONFIG.showHUD = !CONFIG.showHUD;
        console.log(`🖥️ HUD: ${CONFIG.showHUD ? 'ON' : 'OFF'}`);
        break;
        
      case 'r':
      case 'R':
        // Reprocesar imagen actual
        if (img) {
          // Recargar la imagen original para reprocesarla
          loadImageFromURL(DEFAULT_IMAGE);
        }
        break;
        
      case '+':
      case '=':
        // Aumentar resolución
        CONFIG.gridResolution = Math.min(80, CONFIG.gridResolution + 5);
        if (img) {
          loadImageFromURL(DEFAULT_IMAGE);
        }
        console.log(`📊 Resolución: ${CONFIG.gridResolution}`);
        break;
        
      case '-':
      case '_':
        // Disminuir resolución
        CONFIG.gridResolution = Math.max(10, CONFIG.gridResolution - 5);
        if (img) {
          loadImageFromURL(DEFAULT_IMAGE);
        }
        console.log(`📊 Resolución: ${CONFIG.gridResolution}`);
        break;
        
      case 's':
      case 'S':
        // Grabar
        if (window.startRecording && !window.isRecording?.()) {
          window.startRecording();
          console.log('🎬 Grabando...');
        } else if (window.stopRecording && window.isRecording?.()) {
          window.stopRecording();
          console.log('🎬 Grabación finalizada');
        }
        break;
        
      case '1':
        CONFIG.cursorStrength = 40;
        console.log('🖱️ Repulsión: Suave');
        break;
        
      case '2':
        CONFIG.cursorStrength = 80;
        console.log('🖱️ Repulsión: Media');
        break;
        
      case '3':
        CONFIG.cursorStrength = 150;
        console.log('🖱️ Repulsión: Fuerte');
        break;
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
