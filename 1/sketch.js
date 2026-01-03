import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 1
// Prompt: One color, one shape.

// ============================================
// CONFIGURACIÓN DEL LOOP
// ============================================
const LOOP_DURATION = 20; // Duración total del video en segundos
const FPS = 60;           // Frames por segundo
const CANVAS_SIZE = 800;  // Tamaño del canvas (cuadrado)

// Velocidad de animación: cuántos ciclos completos en LOOP_DURATION
// Ej: 5 = la animación hace 5 vueltas en 20 segundos (como si fuera 4s por vuelta)
const CYCLES = 5;

// HUD visibility
let showHUD = true;

// Obtener hue desde URL (?hue=120) o usar valor por defecto
function getInitialHue() {
  const params = new URLSearchParams(window.location.search);
  const hueParam = params.get('hue');
  if (hueParam !== null) {
    const hue = parseFloat(hueParam);
    if (!isNaN(hue)) {
      return hue % 360; // Normalizar a 0-360
    }
  }
  return 220; // Azul por defecto
}

const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  
  // Hue actual (0-360) - desde URL o valor por defecto
  let currentHue = getInitialHue();
  
  // Colores
  let colorCentral;
  let colorBase;
  
  // Configuración de órbitas
  const numCirclesMain = 12;      // Órbita principal
  const numCirclesInner = 8;      // Órbita interior (cerca del centro)
  const numCirclesOuter = 16;     // Órbita exterior
  
  // Colores aleatorios para órbitas exterior e interior
  let outerColors = [];
  let innerColors = [];

  // Función para regenerar todos los colores con un nuevo hue
  function regenerateColors(hue) {
    currentHue = hue;
    
    // Colores base y central con el nuevo hue
    colorCentral = p.color(hue, 80, 95);
    colorBase = p.color(hue, 20, 25);
    
    // Regenerar colores aleatorios para órbita exterior
    outerColors = [];
    for (let i = 0; i < numCirclesOuter; i++) {
      const randomProgress = p.random(0, 1);
      outerColors.push(p.lerpColor(colorBase, colorCentral, randomProgress));
    }
    
    // Regenerar colores aleatorios para órbita interior
    innerColors = [];
    for (let i = 0; i < numCirclesInner; i++) {
      const randomProgress = p.random(0, 1);
      innerColors.push(p.lerpColor(colorBase, colorCentral, randomProgress));
    }
  }

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.noStroke();
    p.colorMode(p.HSB, 360, 100, 100, 100);
    
    // Generar colores iniciales
    regenerateColors(currentHue);
    
    // Configurar grabador para exportar video
    setupRecorder(p, LOOP_DURATION, FPS);
  };

  p.draw = () => {
    // t base va de 0 a 1 en LOOP_DURATION segundos
    const tBase = loop.frameProgress(p);
    // t multiplicado para mantener la velocidad visual deseada
    const t = (tBase * CYCLES) % 1;
    
    // Estela sutil: fondo semi-transparente
    p.fill(0, 0, 8, 15);
    p.rect(0, 0, p.width, p.height);
    
    // ============================================
    // ÓRBITA EXTERIOR (rotación inversa, colores aleatorios)
    // ============================================
    const outerOrbitRadius = CANVAS_SIZE * 0.42;
    const outerCircleSize = CANVAS_SIZE * 0.025;
    
    for (let i = 0; i < numCirclesOuter; i++) {
      // Rotación inversa (-t)
      const angle = (i / numCirclesOuter) * p.TWO_PI - t * p.TWO_PI;
      
      const x = p.width / 2 + p.cos(angle) * outerOrbitRadius;
      const y = p.height / 2 + p.sin(angle) * outerOrbitRadius;
      
      // Color aleatorio de la paleta
      const circleColor = outerColors[i];
      const alpha = p.lerp(40, 80, p.brightness(circleColor) / 100);
      
      p.fill(p.hue(circleColor), p.saturation(circleColor), p.brightness(circleColor), alpha);
      p.ellipse(x, y, outerCircleSize, outerCircleSize);
    }
    
    // ============================================
    // ÓRBITA PRINCIPAL (rotación normal, degradado)
    // ============================================
    for (let i = 0; i < numCirclesMain; i++) {
      const angle = (i / numCirclesMain) * p.TWO_PI + t * p.TWO_PI;
      
      // Progreso cromático: 0 (tenue) a 1 (intenso)
      const colorProgress = i / (numCirclesMain - 1);
      
      // Efecto de respiración sincronizado
      const breathePhase = (t + i / numCirclesMain) % 1;
      const breathe = p.sin(breathePhase * p.TWO_PI) * 0.3 + 1;
      
      // Radio orbital que pulsa
      const orbitRadius = CANVAS_SIZE * 0.25 + p.sin(t * p.TWO_PI * 2) * 20;
      
      const x = p.width / 2 + p.cos(angle) * orbitRadius;
      const y = p.height / 2 + p.sin(angle) * orbitRadius;
      
      // Tamaño proporcional al progreso cromático
      const baseSize = CANVAS_SIZE * 0.08;
      const maxSize = CANVAS_SIZE * 0.14;
      const size = p.lerp(baseSize, maxSize, colorProgress) * breathe;
      
      // Color con transparencia gradual
      const circleColor = p.lerpColor(colorBase, colorCentral, colorProgress);
      const alpha = p.lerp(40, 100, colorProgress);
      
      // Glow: capas difuminadas (más intensas para círculos brillantes)
      const glowLayers = Math.floor(p.lerp(1, 3, colorProgress));
      for (let g = glowLayers; g >= 0; g--) {
        const glowSize = size * (1 + g * 0.5);
        const glowAlpha = alpha / (g + 1) * 0.6;
        p.fill(p.hue(circleColor), p.saturation(circleColor), p.brightness(circleColor), glowAlpha);
        p.ellipse(x, y, glowSize, glowSize);
      }
      
      // Círculo principal
      p.fill(p.hue(circleColor), p.saturation(circleColor), p.brightness(circleColor), alpha);
      p.ellipse(x, y, size, size);
    }
    
    // ============================================
    // ÓRBITA INTERIOR (rotación inversa, colores aleatorios)
    // ============================================
    const innerOrbitRadius = CANVAS_SIZE * 0.12;
    const innerCircleSize = CANVAS_SIZE * 0.02;
    
    for (let i = 0; i < numCirclesInner; i++) {
      // Rotación inversa (-t) y más rápida
      const angle = (i / numCirclesInner) * p.TWO_PI - t * p.TWO_PI * 1.5;
      
      const x = p.width / 2 + p.cos(angle) * innerOrbitRadius;
      const y = p.height / 2 + p.sin(angle) * innerOrbitRadius;
      
      // Color aleatorio de la paleta
      const circleColor = innerColors[i];
      const alpha = p.lerp(50, 90, p.brightness(circleColor) / 100);
      
      p.fill(p.hue(circleColor), p.saturation(circleColor), p.brightness(circleColor), alpha);
      p.ellipse(x, y, innerCircleSize, innerCircleSize);
    }
    
    // ============================================
    // CÍRCULO CENTRAL con glow intenso
    // ============================================
    const centralBreath = p.sin(t * p.TWO_PI) * 0.15 + 1;
    const centralSize = CANVAS_SIZE * 0.16 * centralBreath;
    
    // Glow del centro (múltiples capas)
    for (let g = 4; g >= 0; g--) {
      const glowSize = centralSize * (1 + g * 0.4);
      const glowAlpha = 100 / (g + 1) * 0.5;
      p.fill(p.hue(colorCentral), p.saturation(colorCentral), p.brightness(colorCentral), glowAlpha);
      p.ellipse(p.width / 2, p.height / 2, glowSize, glowSize);
    }
    
    // Centro sólido
    p.fill(colorCentral);
    p.ellipse(p.width / 2, p.height / 2, centralSize, centralSize);
    
    // Núcleo brillante
    p.fill(currentHue, 30, 100, 80);
    p.ellipse(p.width / 2, p.height / 2, centralSize * 0.4, centralSize * 0.4);
  };

  // ============================================
  // INTERACCIÓN
  // ============================================
  p.keyPressed = () => {
    // SPACE: Cambiar color aleatorio
    if (p.key === ' ') {
      const newHue = p.random(360);
      regenerateColors(newHue);
      console.log(`🎨 Nuevo color: Hue ${Math.round(newHue)}°`);
    }
    
    // D: Toggle HUD
    if (p.key === 'd' || p.key === 'D') {
      showHUD = !showHUD;
      console.log(`🖥️ HUD: ${showHUD ? 'ON' : 'OFF'}`);
    }
    
    // S: Grabar loop
    if (p.key === 's' || p.key === 'S') {
      if (window.startRecording) {
        console.log(`🔴 Iniciando grabación de ${LOOP_DURATION}s...`);
        window.startRecording();
      } else {
        console.warn('⚠️ Recorder no disponible');
      }
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
