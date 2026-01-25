import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 20
// Prompt: One Breath Portrait - Retrato con una sola línea continua

// ============================================
// CONFIGURACIÓN
// ============================================
const FPS = 60;
const CANVAS_SIZE = 800;

// Respiración
const BREATH_RATE = 0.05;      // Frecuencia del ciclo de respiración
const MIN_W = 0.2;             // Grosor mínimo del trazo (muy fino para blancos)
const MAX_W = 6.0;             // Grosor máximo del trazo (grueso para negros)

// Espiral
const RADIUS_GROWTH = 0.06;    // Crecimiento del radio por paso (más lento = líneas más juntas)
const ANGLE_SPEED = 0.05;      // Velocidad angular (radianes por paso)
const STEP = 1;                // Incremento del parámetro t

// Deformación
const MAX_DISTORT = 5;         // Deformación máxima en píxeles
const NOISE_SCALE = 0.02;      // Escala del ruido Perlin

// Dibujo progresivo
const DRAW_SPEED = 100;        // Vértices por frame
const T_MAX = 8000;            // Parámetro máximo (más vueltas para cubrir)

// Visual
const BG_COLOR = 255;          // Fondo blanco
const STROKE_COLOR = 0;        // Trazo negro

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  let img = null;
  let imgPixels = null;
  let imgWidth = 0;
  let imgHeight = 0;
  
  // Estado del dibujo
  let currentT = 0;
  let vertices = [];
  let strokeWeights = [];
  let isComplete = false;
  let drawSpeed = DRAW_SPEED;
  
  // Centro del retrato (se ajusta según la imagen)
  let centerX = CANVAS_SIZE / 2;
  let centerY = CANVAS_SIZE / 2;
  
  // UI
  let showHUD = false;

  // ============================================
  // PRELOAD - Cargar imagen
  // ============================================
  p.preload = () => {
    img = p.loadImage('../shared/ruben.png');
  };

  // ============================================
  // SETUP
  // ============================================
  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.background(BG_COLOR);
    
    // Procesar imagen
    processImage();
    
    // Configurar grabador
    setupRecorder(p, 30, FPS);
    
    console.log('🎨 Día 20: One Breath Portrait');
    console.log('📷 Imagen cargada:', imgWidth, 'x', imgHeight);
    console.log('⌨️ Teclas: R = reiniciar, D = HUD, +/- = velocidad, S = grabar');
  };

  // ============================================
  // PROCESAR IMAGEN A ESCALA DE GRISES
  // ============================================
  function processImage() {
    if (!img) return;
    
    // Redimensionar imagen para que quepa en el canvas
    const scale = Math.min(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height) * 0.9;
    imgWidth = Math.floor(img.width * scale);
    imgHeight = Math.floor(img.height * scale);
    
    img.resize(imgWidth, imgHeight);
    img.loadPixels();
    
    // Convertir a escala de grises y almacenar
    imgPixels = new Float32Array(imgWidth * imgHeight);
    
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        const idx = (y * imgWidth + x) * 4;
        const r = img.pixels[idx];
        const g = img.pixels[idx + 1];
        const b = img.pixels[idx + 2];
        
        // Luminosidad perceptual
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        imgPixels[y * imgWidth + x] = brightness;
      }
    }
    
    // Centrar la imagen en el canvas
    centerX = CANVAS_SIZE / 2;
    centerY = CANVAS_SIZE / 2;
  }

  // ============================================
  // OBTENER BRILLO DE LA IMAGEN
  // ============================================
  function getImageBrightness(x, y) {
    // Convertir coordenadas del canvas a coordenadas de imagen
    const imgX = Math.floor(x - (CANVAS_SIZE - imgWidth) / 2);
    const imgY = Math.floor(y - (CANVAS_SIZE - imgHeight) / 2);
    
    // Fuera de la imagen = blanco (sin deformación)
    if (imgX < 0 || imgX >= imgWidth || imgY < 0 || imgY >= imgHeight) {
      return 255;
    }
    
    return imgPixels[imgY * imgWidth + imgX];
  }

  // ============================================
  // CALCULAR PESO DEL TRAZO (RESPIRACIÓN + BRILLO)
  // ============================================
  function computeBreathWeight(t, brightness) {
    // Onda sinusoidal base (respiración)
    const breathPhase = t * BREATH_RATE * p.TWO_PI;
    const breathBase = (p.sin(breathPhase) + 1) / 2; // 0 a 1
    
    // Modulación orgánica con Perlin noise
    const breathNoise = p.noise(t * 0.5) * 0.15;
    
    // Factor de respiración
    const breathFactor = p.constrain(breathBase + breathNoise - 0.1, 0, 1);
    
    // Factor de brillo con contraste aumentado
    // Aplicar curva de contraste para resaltar diferencias
    const normalizedBrightness = brightness / 255;
    const contrastedBrightness = Math.pow(normalizedBrightness, 0.6); // Aumentar contraste
    const brightnessFactor = 1 - contrastedBrightness;
    
    // Combinar: brillo domina, respiración modula sutilmente
    const combined = p.constrain(brightnessFactor * 0.85 + breathFactor * 0.15, 0, 1);
    
    return p.lerp(MIN_W, MAX_W, combined);
  }

  // ============================================
  // CALCULAR DEFORMACIÓN
  // ============================================
  function computeDeformation(x, y, t) {
    // Obtener brillo en esta posición
    const brightness = getImageBrightness(x, y);
    
    // Mapear: oscuro = más deformación, claro = menos
    const deformStrength = p.map(brightness, 0, 255, MAX_DISTORT, 0);
    
    // Aplicar offset con Perlin noise para suavidad
    const noiseX = p.noise(x * NOISE_SCALE, y * NOISE_SCALE, t * 0.01);
    const noiseY = p.noise(x * NOISE_SCALE + 1000, y * NOISE_SCALE, t * 0.01);
    
    const offsetX = (noiseX - 0.5) * 2 * deformStrength;
    const offsetY = (noiseY - 0.5) * 2 * deformStrength;
    
    return { offsetX, offsetY };
  }

  // ============================================
  // CALCULAR POSICIÓN EN LA ESPIRAL
  // ============================================
  function computeSpiralPosition(t) {
    // Radio crece con t
    const radius = t * RADIUS_GROWTH;
    
    // Ángulo crece con t
    const angle = t * ANGLE_SPEED;
    
    // Posición base en la espiral
    const baseX = centerX + radius * p.cos(angle);
    const baseY = centerY + radius * p.sin(angle);
    
    return { baseX, baseY };
  }

  // ============================================
  // GENERAR VÉRTICES
  // ============================================
  function generateVertices(count) {
    for (let i = 0; i < count && currentT < T_MAX; i++) {
      // Posición base en la espiral
      const { baseX, baseY } = computeSpiralPosition(currentT);
      
      // Obtener brillo en la posición base
      const brightness = getImageBrightness(baseX, baseY);
      
      // Deformación basada en la imagen
      const { offsetX, offsetY } = computeDeformation(baseX, baseY, currentT);
      
      // Posición final
      const finalX = baseX + offsetX;
      const finalY = baseY + offsetY;
      
      // Peso del trazo (respiración + brillo)
      const weight = computeBreathWeight(currentT, brightness);
      
      // Almacenar vértice
      vertices.push({ x: finalX, y: finalY });
      strokeWeights.push(weight);
      
      currentT += STEP;
    }
    
    if (currentT >= T_MAX) {
      isComplete = true;
      console.log('✅ Dibujo completado:', vertices.length, 'vértices');
    }
  }

  // ============================================
  // DRAW - Loop principal
  // ============================================
  p.draw = () => {
    // Fondo limpio cada frame (redibujar todo)
    p.background(BG_COLOR);
    
    // Generar nuevos vértices si no está completo
    if (!isComplete) {
      generateVertices(drawSpeed);
    }
    
    // Dibujar la línea continua
    if (vertices.length > 3) {
      drawContinuousLine();
    }
    
    // HUD
    if (showHUD) {
      drawHUD();
    }
  };

  // ============================================
  // DIBUJAR LÍNEA CONTINUA
  // ============================================
  function drawContinuousLine() {
    p.noFill();
    p.stroke(STROKE_COLOR);
    
    // Dibujar segmentos con grosor variable
    // Usamos líneas individuales para poder variar el strokeWeight
    for (let i = 1; i < vertices.length; i++) {
      const prev = vertices[i - 1];
      const curr = vertices[i];
      
      // Interpolar grosor entre vértices
      const weight = (strokeWeights[i - 1] + strokeWeights[i]) / 2;
      p.strokeWeight(weight);
      
      p.line(prev.x, prev.y, curr.x, curr.y);
    }
  }

  // ============================================
  // DIBUJAR HUD
  // ============================================
  function drawHUD() {
    p.push();
    
    // Panel semi-transparente
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(15, 15, 220, 130, 6);
    
    // Texto
    p.fill(255);
    p.textSize(11);
    p.textFont('monospace');
    p.textAlign(p.LEFT, p.TOP);
    
    const progress = Math.min(100, (currentT / T_MAX) * 100).toFixed(1);
    
    p.text(`One Breath Portrait`, 25, 25);
    p.text(`─────────────────────`, 25, 38);
    p.text(`Vértices: ${vertices.length}`, 25, 55);
    p.text(`Progreso: ${progress}%`, 25, 70);
    p.text(`Velocidad: ${drawSpeed} v/frame`, 25, 85);
    p.text(`Estado: ${isComplete ? 'Completado' : 'Dibujando...'}`, 25, 100);
    p.text(`─────────────────────`, 25, 113);
    p.text(`R=reiniciar +/-=velocidad`, 25, 128);
    
    p.pop();
  }

  // ============================================
  // REINICIAR DIBUJO
  // ============================================
  function resetDrawing() {
    currentT = 0;
    vertices = [];
    strokeWeights = [];
    isComplete = false;
    p.background(BG_COLOR);
    console.log('🔄 Dibujo reiniciado');
  }

  // ============================================
  // CONTROLES DE TECLADO
  // ============================================
  p.keyPressed = () => {
    switch (p.key.toLowerCase()) {
      case 'r':
        resetDrawing();
        break;
        
      case 'd':
        showHUD = !showHUD;
        console.log(`🖥️ HUD: ${showHUD ? 'ON' : 'OFF'}`);
        break;
        
      case '+':
      case '=':
        drawSpeed = Math.min(50, drawSpeed + 1);
        console.log(`⚡ Velocidad: ${drawSpeed}`);
        break;
        
      case '-':
      case '_':
        drawSpeed = Math.max(1, drawSpeed - 1);
        console.log(`⚡ Velocidad: ${drawSpeed}`);
        break;
        
      case 's':
        if (window.isRecording?.()) {
          window.stopRecording?.();
          console.log('🎬 Grabación finalizada');
        } else if (window.startRecording) {
          // Reiniciar para grabar desde el inicio
          resetDrawing();
          console.log('🔴 Iniciando grabación...');
          window.startRecording();
        }
        break;
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
