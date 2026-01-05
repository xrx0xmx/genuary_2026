import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 6
// Prompt: Lights on/off - Sloth X-Ray Flashlight
// Linterna digital que revela capas de un perezoso

// ============================================
// CONFIGURACIÓN
// ============================================
const FPS = 60;
const CANVAS_SIZE = 800;

// Sistema de luz
const LIGHT_RADIUS = 120;                // Radio de la linterna
const FEATHER_SIZE = 40;                 // Suavizado del borde

// ============================================
// VARIABLES GLOBALES
// ============================================
let slothLayers = [];                    // Array de imágenes [1, 2, 3]
let imagesLoaded = false;                // Flag de carga

// Dimensiones de renderizado (calculadas en setup para mantener proporción)
let imgDisplayX = 0;
let imgDisplayY = 0;
let imgDisplayW = CANVAS_SIZE;
let imgDisplayH = CANVAS_SIZE;

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  // Precargar las 3 imágenes del sloth
  p.preload = () => {
    for (let i = 1; i <= 3; i++) {
      const img = p.loadImage(
        `../shared/sloth_${i}.png`,
        () => console.log(`✓ sloth_${i}.png cargado`),
        (err) => console.error(`✗ Error cargando sloth_${i}.png:`, err)
      );
      slothLayers.push(img);
    }
  };

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.imageMode(p.CENTER);
    
    // Verificar que las imágenes se cargaron
    imagesLoaded = slothLayers.every(img => img && img.width > 0);
    if (imagesLoaded) {
      console.log('🦥 Todas las imágenes cargadas correctamente');
      
      // Calcular dimensiones de renderizado manteniendo proporción
      const img = slothLayers[0];
      const imgAspect = img.width / img.height;
      
      if (imgAspect > 1) {
        imgDisplayW = CANVAS_SIZE;
        imgDisplayH = CANVAS_SIZE / imgAspect;
        imgDisplayX = 0;
        imgDisplayY = (CANVAS_SIZE - imgDisplayH) / 2;
      } else {
        imgDisplayH = CANVAS_SIZE;
        imgDisplayW = CANVAS_SIZE * imgAspect;
        imgDisplayX = (CANVAS_SIZE - imgDisplayW) / 2;
        imgDisplayY = 0;
      }
    } else {
      console.warn('⚠️ Algunas imágenes no se cargaron');
    }
    
    setupRecorder(p, 10, FPS);
    
    console.log('🔦 Día 6: Sloth X-Ray Flashlight');
    console.log('   Mueve el ratón para revelar la segunda capa');
    console.log('   Haz clic para revelar la tercera capa');
  };

  p.draw = () => {
    p.background(30);
    
    if (!imagesLoaded) {
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text('Cargando imágenes...', p.width / 2, p.height / 2);
      return;
    }
    
    // Dibujar sloth_1 como fondo (siempre visible completo)
    p.push();
    p.tint(255);
    p.image(slothLayers[0], imgDisplayX + imgDisplayW / 2, imgDisplayY + imgDisplayH / 2, imgDisplayW, imgDisplayH);
    p.pop();
    
    // Determinar qué capa mostrar en el círculo de luz
    const revealLayer = p.mouseIsPressed ? 2 : 1; // índice 1 = sloth_2, índice 2 = sloth_3
    const revealImg = slothLayers[revealLayer];
    
    // Dibujar la capa revelada con máscara feathered usando composición
    // Paso 1: Dibujar la imagen revelada en un área temporal
    p.drawingContext.save();
    
    // Recortar al área del círculo (para optimización)
    p.drawingContext.beginPath();
    p.drawingContext.arc(p.mouseX, p.mouseY, LIGHT_RADIUS + FEATHER_SIZE, 0, Math.PI * 2);
    p.drawingContext.closePath();
    p.drawingContext.clip();
    
    // Dibujar la capa revelada
    p.push();
    p.tint(255);
    p.image(revealImg, imgDisplayX + imgDisplayW / 2, imgDisplayY + imgDisplayH / 2, imgDisplayW, imgDisplayH);
    p.pop();
    
    // Paso 2: Aplicar el feather usando destination-in con gradiente
    p.drawingContext.globalCompositeOperation = 'destination-in';
    
    const gradient = p.drawingContext.createRadialGradient(
      p.mouseX, p.mouseY, 0,
      p.mouseX, p.mouseY, LIGHT_RADIUS + FEATHER_SIZE
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(LIGHT_RADIUS / (LIGHT_RADIUS + FEATHER_SIZE), 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    p.drawingContext.fillStyle = gradient;
    p.drawingContext.fillRect(
      p.mouseX - LIGHT_RADIUS - FEATHER_SIZE,
      p.mouseY - LIGHT_RADIUS - FEATHER_SIZE,
      (LIGHT_RADIUS + FEATHER_SIZE) * 2,
      (LIGHT_RADIUS + FEATHER_SIZE) * 2
    );
    
    p.drawingContext.restore();
  };

  p.keyPressed = () => {
    if (p.key === 's' || p.key === 'S') {
      if (window.isRecording?.()) {
        console.warn('⚠️ Ya hay una grabación en curso');
        return;
      }
      if (window.startRecording) {
        console.log('🔴 Iniciando grabación...');
        window.startRecording();
      }
    }
  };
};

new p5(sketch, document.getElementById('canvas-container'));
