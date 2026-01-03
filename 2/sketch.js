import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 2
// Prompt: Twelve principles of animation - "La bola con intención"

// ============================================
// CONFIGURACIÓN DEL LOOP
// ============================================
const LOOP_DURATION = 4; // Duración del loop en segundos
const RECORDING_DURATION = 20; // Duración de grabación (5 pasadas × 4s)
const FPS = 60;          // Frames por segundo
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

// ============================================
// PARÁMETROS EXPUESTOS (ajustables)
// ============================================
const CONFIG = {
  // Squash & Stretch
  squashIntensity: 0.4,      // Intensidad del squash (0-1)
  stretchIntensity: 0.35,    // Intensidad del stretch (0-1)
  
  // Física y timing
  gravity: 0.8,              // Peso percibido
  bounceDamping: 0.65,       // Amortiguación de rebotes
  
  // Cola
  tailLength: 12,            // Número de segmentos de la cola
  tailDelay: 0.08,           // Retardo entre segmentos
  
  // Exageración
  exaggeration: 1.2,         // Multiplicador de exageración
  
  // Debug
  debugMode: false,          // Mostrar información de debug
  showArc: false,            // Mostrar arco de movimiento
  showPhases: false,         // Mostrar fases de animación
};

// ============================================
// FUNCIONES DE EASING ADICIONALES
// ============================================
const customEasing = {
  // Ease out bounce
  outBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  
  // Ease out elastic
  outElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  // Ease in quad
  inQuad: (t) => t * t,
  
  // Ease out quad
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  
  // Ease in out back (con overshoot)
  inOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
};

// ============================================
// CLASE SHADOW (Sombra)
// ============================================
class Shadow {
  constructor(p) {
    this.p = p;
    this.x = 0;
    this.baseY = CANVAS_HEIGHT * 0.75;
    this.width = 60;
    this.height = 15;
    this.targetWidth = 60;
    this.targetHeight = 15;
    this.alpha = 150;
  }
  
  update(ballX, ballY, ballRadius, groundY) {
    const p = this.p;
    
    // La sombra sigue la posición X de la bola con ligero retardo
    this.x = p.lerp(this.x, ballX, 0.15);
    
    // La altura de la bola afecta el tamaño de la sombra
    const distanceFromGround = groundY - ballY;
    const maxDistance = 200;
    const heightRatio = p.constrain(distanceFromGround / maxDistance, 0, 1);
    
    // Sombra más pequeña y difusa cuando la bola está alta
    const baseSize = ballRadius * 2;
    this.targetWidth = baseSize * (1.5 - heightRatio * 0.8);
    this.targetHeight = 12 * (1 - heightRatio * 0.5);
    
    // Transición suave (acción secundaria con retardo)
    this.width = p.lerp(this.width, this.targetWidth, 0.2);
    this.height = p.lerp(this.height, this.targetHeight, 0.2);
    
    // Alpha basado en altura
    this.alpha = p.lerp(180, 50, heightRatio);
  }
  
  draw() {
    const p = this.p;
    p.push();
    p.noStroke();
    
    // Sombra con gradiente radial simulado (múltiples elipses)
    for (let i = 3; i >= 0; i--) {
      const scale = 1 + i * 0.2;
      const a = this.alpha / (i + 1);
      p.fill(0, 0, 0, a);
      p.ellipse(this.x, this.baseY, this.width * scale, this.height * scale);
    }
    
    p.pop();
  }
}

// ============================================
// CLASE TAIL (Cola/Estela)
// ============================================
class Tail {
  constructor(p, length) {
    this.p = p;
    this.segments = [];
    this.length = length;
    this.springiness = 0.15;
    this.damping = 0.75;
    
    // Inicializar segmentos
    for (let i = 0; i < length; i++) {
      this.segments.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 0,
        targetY: 0,
      });
    }
  }
  
  update(ballX, ballY, velocityX, velocityY) {
    const p = this.p;
    
    // El primer segmento sigue la bola con retardo
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      
      // Target: posición anterior en la cadena
      if (i === 0) {
        seg.targetX = ballX;
        seg.targetY = ballY;
      } else {
        const prev = this.segments[i - 1];
        seg.targetX = prev.x;
        seg.targetY = prev.y;
      }
      
      // Spring physics para follow-through
      const delay = CONFIG.tailDelay * (i + 1);
      const spring = this.springiness / (1 + i * 0.3);
      
      // Calcular fuerza del spring
      const dx = seg.targetX - seg.x;
      const dy = seg.targetY - seg.y;
      
      seg.vx += dx * spring;
      seg.vy += dy * spring;
      
      // Aplicar damping
      seg.vx *= this.damping;
      seg.vy *= this.damping;
      
      // Actualizar posición
      seg.x += seg.vx;
      seg.y += seg.vy;
    }
  }
  
  draw(ballColor) {
    const p = this.p;
    p.push();
    p.noStroke();
    
    // Dibujar segmentos de atrás hacia adelante
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      const progress = i / this.segments.length;
      
      // Tamaño decreciente
      const size = p.lerp(25, 5, progress);
      
      // Alpha decreciente
      const alpha = p.lerp(200, 30, progress);
      
      // Color que desvanece hacia el fondo
      const r = p.red(ballColor);
      const g = p.green(ballColor);
      const b = p.blue(ballColor);
      
      p.fill(r, g, b, alpha);
      p.ellipse(seg.x, seg.y, size, size);
    }
    
    p.pop();
  }
  
  reset(x, y) {
    for (let seg of this.segments) {
      seg.x = x;
      seg.y = y;
      seg.vx = 0;
      seg.vy = 0;
    }
  }
}

// ============================================
// CLASE BALL (Esfera conceptual con ojos minimalistas)
// ============================================
class Ball {
  constructor(p) {
    this.p = p;
    this.baseRadius = 40;
    this.x = -100;
    this.y = CANVAS_HEIGHT * 0.5;
    this.vx = 0;
    this.vy = 0;
    
    // Deformación (squash/stretch)
    this.scaleX = 1;
    this.scaleY = 1;
    this.targetScaleX = 1;
    this.targetScaleY = 1;
    
    // Respiración (micro-variación)
    this.breathPhase = 0;
    
    // Estado de animación
    this.phase = 'enter';
    
    // Color del cuerpo - blanco puro, conceptual
    this.bodyColor = p.color(245, 245, 250);
    
    // Posición de los ojos (offset del centro)
    this.eyeOffsetX = 0;
    this.eyeOffsetY = 0;
    this.targetEyeX = 0;
    this.targetEyeY = 0;
    
    // Parpadeo minimalista
    this.blinkTimer = 0;
    this.blinkDuration = 0.12;
    this.isBlinking = false;
    this.nextBlinkTime = p.random(3, 6);
    
    // Expresión: afecta tamaño y forma de ojos
    this.expression = 0;
    this.targetExpression = 0;
    
    // Para efectos de cejas (no se usan pero se mantienen para compatibilidad)
    this.eyebrowRaise = 0;
    this.targetEyebrowRaise = 0;
  }
  
  // Conservación de volumen
  setSquashStretch(scaleY) {
    this.targetScaleY = scaleY;
    this.targetScaleX = 1 / scaleY;
  }
  
  // Hacia dónde miran los ojos
  lookAt(dirX, dirY) {
    const maxOffset = 5;
    this.targetEyeX = this.p.constrain(dirX * maxOffset, -maxOffset, maxOffset);
    this.targetEyeY = this.p.constrain(dirY * maxOffset, -maxOffset, maxOffset);
  }
  
  setExpression(expr) {
    this.targetExpression = expr;
  }
  
  update(deltaTime) {
    const p = this.p;
    
    // Deformación suave
    this.scaleX = p.lerp(this.scaleX, this.targetScaleX, 0.25);
    this.scaleY = p.lerp(this.scaleY, this.targetScaleY, 0.25);
    
    // Respiración
    this.breathPhase += deltaTime * 2.5;
    
    // Movimiento suave de ojos
    this.eyeOffsetX = p.lerp(this.eyeOffsetX, this.targetEyeX, 0.12);
    this.eyeOffsetY = p.lerp(this.eyeOffsetY, this.targetEyeY, 0.1);
    
    // Expresión suave
    this.expression = p.lerp(this.expression, this.targetExpression, 0.15);
    
    // Parpadeo
    this.blinkTimer += deltaTime;
    if (!this.isBlinking && this.blinkTimer > this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkTimer = 0;
    }
    if (this.isBlinking && this.blinkTimer > this.blinkDuration) {
      this.isBlinking = false;
      this.blinkTimer = 0;
      this.nextBlinkTime = p.random(3, 7);
    }
  }
  
  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.scale(this.scaleX, this.scaleY);
    
    // Respiración sutil
    const breath = 1 + Math.sin(this.breathPhase) * 0.01;
    p.scale(breath);
    
    const r = this.baseRadius;
    
    // ============================================
    // CUERPO - Simple y limpio
    // ============================================
    p.noStroke();
    
    // Sombra muy sutil
    p.fill(0, 0, 0, 15);
    p.ellipse(3, 3, r * 2, r * 2);
    
    // Cuerpo principal - blanco limpio
    p.fill(this.bodyColor);
    p.ellipse(0, 0, r * 2, r * 2);
    
    // Borde sutil para definir la forma
    p.noFill();
    p.stroke(200, 200, 210);
    p.strokeWeight(1.5);
    p.ellipse(0, 0, r * 2, r * 2);
    
    // ============================================
    // OJOS - Dos puntos negros, nada más
    // ============================================
    const eyeSpacing = r * 0.32;
    const eyeBaseY = -r * 0.05;
    
    // Tamaño base de los ojos
    const eyeSize = r * 0.18;
    
    // Los ojos se hacen más grandes con expresión positiva (sorpresa)
    // y más pequeños/estirados horizontalmente con expresión negativa
    const expressionScale = 1 + this.expression * 0.3;
    
    // Ajuste por squash: los ojos se separan cuando se aplasta
    const squashAdjust = (this.scaleX - 1) * 0.4;
    
    p.noStroke();
    p.fill(30, 30, 35);
    
    for (let side = -1; side <= 1; side += 2) {
      const baseX = side * (eyeSpacing + squashAdjust * r);
      
      // Posición final del ojo con offset de mirada
      const eyeX = baseX + this.eyeOffsetX * 0.6;
      const eyeY = eyeBaseY + this.eyeOffsetY * 0.4;
      
      if (this.isBlinking) {
        // Parpadeo: línea horizontal
        p.stroke(30, 30, 35);
        p.strokeWeight(2);
        p.line(eyeX - eyeSize * 0.6, eyeY, eyeX + eyeSize * 0.6, eyeY);
      } else {
        // Ojo normal: punto negro
        // Con expresión negativa se estiran horizontalmente
        const eyeW = eyeSize * (this.expression < 0 ? 1.3 : 1) * expressionScale;
        const eyeH = eyeSize * (this.expression < 0 ? 0.6 : 1) * expressionScale;
        
        p.noStroke();
        p.ellipse(eyeX, eyeY, eyeW, eyeH);
      }
    }
    
    p.pop();
  }
  
  getRadius() {
    return this.baseRadius * Math.max(this.scaleX, this.scaleY);
  }
}

// ============================================
// ANIMACIÓN PRINCIPAL
// ============================================
const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  
  let ball;
  let tail;
  let shadow;
  
  // Puntos del arco para debug
  let arcPoints = [];
  
  // Sistema de grabación sincronizada
  let waitingToRecord = false;
  
  // Suelo
  const groundY = CANVAS_HEIGHT * 0.75;
  
  // Fases de la animación y sus tiempos (en progreso 0-1)
  const phases = {
    enter:      { start: 0.00, end: 0.15 },
    anticipate: { start: 0.15, end: 0.22 },
    jump:       { start: 0.22, end: 0.45 },
    fall:       { start: 0.45, end: 0.52 },
    impact:     { start: 0.52, end: 0.58 },
    bounce:     { start: 0.58, end: 0.72 },
    settle:     { start: 0.72, end: 0.85 },
    exit:       { start: 0.85, end: 1.00 },
  };
  
  // Obtener fase actual y progreso dentro de esa fase
  function getPhaseInfo(t) {
    for (const [name, timing] of Object.entries(phases)) {
      if (t >= timing.start && t < timing.end) {
        const phaseProgress = (t - timing.start) / (timing.end - timing.start);
        return { name, progress: phaseProgress, timing };
      }
    }
    return { name: 'exit', progress: 1, timing: phases.exit };
  }

  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);
    
    ball = new Ball(p);
    tail = new Tail(p, CONFIG.tailLength);
    shadow = new Shadow(p);
    
    // Configurar grabador (graba 5 pasadas completas)
    setupRecorder(p, RECORDING_DURATION, FPS);
  };

  p.draw = () => {
    const t = loop.frameProgress(p);
    const deltaTime = 1 / FPS;
    
    // Fondo con gradiente sutil
    drawBackground();
    
    // Obtener fase actual
    const phaseInfo = getPhaseInfo(t);
    
    // Actualizar posición y estado de la bola según la fase
    updateBallAnimation(t, phaseInfo);
    
    // Actualizar componentes
    ball.update(deltaTime);
    tail.update(ball.x, ball.y, ball.vx, ball.vy);
    shadow.update(ball.x, ball.y, ball.baseRadius, groundY);
    
    // Guardar punto para debug del arco
    if (CONFIG.showArc && p.frameCount % 2 === 0) {
      arcPoints.push({ x: ball.x, y: ball.y });
      if (arcPoints.length > 200) arcPoints.shift();
    }
    
    // Dibujar suelo
    drawGround();
    
    // Dibujar en orden de profundidad
    shadow.draw();
    tail.draw(ball.bodyColor);
    ball.draw();
    
    // Debug
    if (CONFIG.debugMode) {
      drawDebug(t, phaseInfo);
    }
    
    // Reset del arco cuando el loop reinicia
    if (loop.justCompleted(p)) {
      // Solo limpiar el arco si NO estamos grabando (para acumular trayectorias)
      const isCurrentlyRecording = window.isRecording && window.isRecording();
      if (!isCurrentlyRecording) {
        arcPoints = [];
      }
      tail.reset(ball.x, ball.y);
      
      // Randomizar exaggeration en cada pasada (rango 0.5 - 2.0)
      CONFIG.exaggeration = 0.5 + Math.random() * 1.5;
      console.log(`🎭 Nueva exaggeration: ${CONFIG.exaggeration.toFixed(2)}`);
      
      // Si estamos esperando para grabar, iniciar ahora (sincronizado con el loop)
      if (waitingToRecord && window.startRecording) {
        waitingToRecord = false;
        console.log('🎬 Loop sincronizado - iniciando grabación...');
        window.startRecording();
      }
    }
    
    // Mostrar indicadores de grabación
    // Indicador de "esperando" - solo se muestra antes de grabar, no durante
    if (waitingToRecord) {
      p.push();
      p.fill(255, 200, 100);
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.RIGHT, p.TOP);
      p.text('⏳ Esperando inicio del loop...', CANVAS_WIDTH - 20, 20);
      p.pop();
    }
    // Nota: El indicador de "GRABANDO" se muestra solo en la consola, no en el canvas
    // para que no aparezca en el video final
  };
  
  function drawBackground() {
    // Gradiente de fondo
    const topColor = p.color(25, 25, 35);
    const bottomColor = p.color(45, 45, 60);
    
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(topColor, bottomColor, inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }
  
  function drawGround() {
    // Línea del suelo
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    p.line(0, groundY + 20, CANVAS_WIDTH, groundY + 20);
    
    // Superficie sutil
    p.noStroke();
    p.fill(60, 60, 75, 100);
    p.rect(0, groundY + 20, CANVAS_WIDTH, CANVAS_HEIGHT - groundY);
  }
  
  function updateBallAnimation(t, phaseInfo) {
    const { name, progress } = phaseInfo;
    const ex = CONFIG.exaggeration;
    
    // Posición X base: atraviesa la pantalla
    const startX = -80;
    const endX = CANVAS_WIDTH + 80;
    
    switch (name) {
      case 'enter':
        // Entrada con aceleración (slow in)
        const enterEased = customEasing.outQuad(progress);
        ball.x = p.lerp(startX, CANVAS_WIDTH * 0.25, enterEased);
        ball.y = groundY - ball.baseRadius;
        ball.vx = 5;
        ball.vy = 0;
        
        // Sin deformación inicial, luego ligero squash por velocidad
        ball.setSquashStretch(1 - progress * 0.05);
        
        // Ojos: mira hacia adelante, expresión determinada
        ball.lookAt(1, 0);
        ball.setExpression(0.2);
        ball.targetEyebrowRaise = 0;
        break;
        
      case 'anticipate':
        // Anticipación: squash antes del salto
        ball.x = p.lerp(CANVAS_WIDTH * 0.25, CANVAS_WIDTH * 0.28, progress);
        ball.y = groundY - ball.baseRadius;
        
        // Squash intenso
        const squashAmount = 1 - CONFIG.squashIntensity * ex * easing.inOutSine(progress);
        ball.setSquashStretch(squashAmount);
        ball.vx = 1;
        
        // Ojos: mira hacia arriba preparándose, expresión de esfuerzo
        ball.lookAt(0.5, -1);
        ball.setExpression(-0.5 * progress);
        ball.targetEyebrowRaise = -progress * 0.5;
        break;
        
      case 'jump':
        // Salto parabólico
        const jumpX = p.lerp(CANVAS_WIDTH * 0.28, CANVAS_WIDTH * 0.55, progress);
        
        // Arco parabólico
        const jumpHeight = 180 * ex;
        const jumpY = groundY - ball.baseRadius - Math.sin(progress * Math.PI) * jumpHeight;
        
        ball.x = jumpX;
        ball.y = jumpY;
        ball.vx = 6;
        ball.vy = progress < 0.5 ? -8 : 8;
        
        // Stretch durante el ascenso, normal en el pico, stretch en descenso
        const jumpPhase = Math.sin(progress * Math.PI);
        const stretchAmount = 1 + CONFIG.stretchIntensity * ex * (1 - jumpPhase) * 0.6;
        ball.setSquashStretch(stretchAmount);
        
        // Ojos: mira hacia arriba al subir, hacia abajo al caer
        if (progress < 0.5) {
          ball.lookAt(1, -1 + progress);
          ball.setExpression(0.8); // Emocionado
          ball.targetEyebrowRaise = 1;
        } else {
          ball.lookAt(1, (progress - 0.5) * 2);
          ball.setExpression(0.5);
          ball.targetEyebrowRaise = 0.5;
        }
        break;
        
      case 'fall':
        // Caída con stretch
        ball.x = p.lerp(CANVAS_WIDTH * 0.55, CANVAS_WIDTH * 0.58, progress);
        ball.y = p.lerp(groundY - ball.baseRadius - 30, groundY - ball.baseRadius, 
                        customEasing.inQuad(progress));
        ball.vx = 4;
        ball.vy = 10;
        
        // Stretch en la caída
        ball.setSquashStretch(1 + CONFIG.stretchIntensity * ex * progress);
        
        // Ojos: mira hacia abajo, preocupado
        ball.lookAt(0.5, 1);
        ball.setExpression(0.6 + progress * 0.4); // Más sorprendido mientras cae
        ball.targetEyebrowRaise = 0.8;
        break;
        
      case 'impact':
        // Impacto: squash intenso
        ball.x = p.lerp(CANVAS_WIDTH * 0.58, CANVAS_WIDTH * 0.62, progress);
        ball.y = groundY - ball.baseRadius * (1 - CONFIG.squashIntensity * ex * 0.5);
        ball.vx = 3;
        ball.vy = 0;
        
        // Squash máximo al inicio, recuperación
        const impactSquash = 1 - CONFIG.squashIntensity * ex * (1 - customEasing.outElastic(progress));
        ball.setSquashStretch(Math.max(0.5, impactSquash));
        
        // Ojos: cerrados o apretados por el impacto, luego se recupera
        ball.lookAt(0, 0);
        ball.setExpression(-0.8 * (1 - progress)); // Esfuerzo que se recupera
        ball.targetEyebrowRaise = -0.5 * (1 - progress);
        break;
        
      case 'bounce':
        // Rebote pequeño (timing más lento, sensación de peso)
        const bounceX = p.lerp(CANVAS_WIDTH * 0.62, CANVAS_WIDTH * 0.75, 
                               customEasing.outQuad(progress));
        
        // Rebote más bajo con damping
        const bounceHeight = 60 * CONFIG.bounceDamping * ex;
        const bounceY = groundY - ball.baseRadius - 
                       Math.sin(progress * Math.PI) * bounceHeight * (1 - progress * 0.3);
        
        ball.x = bounceX;
        ball.y = bounceY;
        ball.vx = 3;
        ball.vy = progress < 0.5 ? -4 : 4;
        
        // Deformación reducida
        const bounceDeform = 1 + CONFIG.stretchIntensity * 0.3 * Math.sin(progress * Math.PI);
        ball.setSquashStretch(bounceDeform);
        
        // Ojos: sigue el movimiento del rebote
        ball.lookAt(1, progress < 0.5 ? -0.5 : 0.5);
        ball.setExpression(0.3);
        ball.targetEyebrowRaise = 0.2;
        break;
        
      case 'settle':
        // Estabilización con micro-rebotes
        ball.x = p.lerp(CANVAS_WIDTH * 0.75, CANVAS_WIDTH * 0.85, 
                        customEasing.outQuad(progress));
        
        // Micro-rebotes amortiguados
        const microBounce = Math.sin(progress * Math.PI * 3) * 8 * (1 - progress);
        ball.y = groundY - ball.baseRadius - Math.max(0, microBounce);
        ball.vx = 2;
        ball.vy = 0;
        
        // Ojos: se calma, mira hacia adelante
        ball.lookAt(1, 0);
        ball.setExpression(0.1 * (1 - progress));
        ball.targetEyebrowRaise = 0;
        
        // Volver a forma normal con respiración
        ball.setSquashStretch(1 + Math.sin(progress * Math.PI * 3) * 0.05 * (1 - progress));
        break;
        
      case 'exit':
        // Salida con aceleración (anticipación inversa + aceleración)
        const exitEased = customEasing.inQuad(progress);
        ball.x = p.lerp(CANVAS_WIDTH * 0.85, endX, exitEased);
        ball.y = groundY - ball.baseRadius;
        ball.vx = 6 + progress * 4;
        ball.vy = 0;
        
        // Ligero stretch por velocidad
        ball.setSquashStretch(1 + progress * CONFIG.stretchIntensity * 0.3);
        
        // Ojos: mira determinado hacia adelante, acelerando
        ball.lookAt(1, 0);
        ball.setExpression(0.3 + progress * 0.3); // Cada vez más emocionado
        ball.targetEyebrowRaise = progress * 0.3;
        break;
    }
  }
  
  function drawDebug(t, phaseInfo) {
    p.push();
    
    // Panel de información
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(10, 10, 250, 210, 8);
    
    p.fill(255);
    p.textSize(12);
    p.textFont('monospace');
    p.text(`Fase: ${phaseInfo.name}`, 20, 35);
    p.text(`Progreso fase: ${(phaseInfo.progress * 100).toFixed(1)}%`, 20, 55);
    p.text(`Tiempo total: ${(t * 100).toFixed(1)}%`, 20, 75);
    p.text(`ScaleX: ${ball.scaleX.toFixed(2)}`, 20, 95);
    p.text(`ScaleY: ${ball.scaleY.toFixed(2)}`, 20, 115);
    p.text(`Pos: (${ball.x.toFixed(0)}, ${ball.y.toFixed(0)})`, 20, 135);
    
    // Parámetros ajustables
    p.fill(150, 220, 255);
    p.text(`Squash: ${CONFIG.squashIntensity.toFixed(1)}`, 20, 160);
    p.text(`Stretch: ${CONFIG.stretchIntensity.toFixed(1)}`, 20, 180);
    p.text(`Exaggeration: ${CONFIG.exaggeration.toFixed(1)}`, 20, 200);
    
    // Arco de movimiento (con detección de saltos para evitar líneas horizontales)
    if (CONFIG.showArc && arcPoints.length > 1) {
      p.stroke(255, 100, 100, 100);
      p.strokeWeight(2);
      p.noFill();
      
      // Dibujar segmentos separados cuando hay saltos grandes en X
      p.beginShape();
      let prevPt = arcPoints[0];
      p.vertex(prevPt.x, prevPt.y);
      
      for (let i = 1; i < arcPoints.length; i++) {
        const pt = arcPoints[i];
        const jumpX = Math.abs(pt.x - prevPt.x);
        
        // Si hay un salto grande (bola salió y reentró), terminar segmento y empezar nuevo
        if (jumpX > 200) {
          p.endShape();
          p.beginShape();
        }
        p.vertex(pt.x, pt.y);
        prevPt = pt;
      }
      p.endShape();
    }
    
    // Centro de masa
    p.stroke(0, 255, 0);
    p.strokeWeight(1);
    p.line(ball.x - 10, ball.y, ball.x + 10, ball.y);
    p.line(ball.x, ball.y - 10, ball.x, ball.y + 10);
    
    // Indicador de fase en timeline
    if (CONFIG.showPhases) {
      const timelineY = CANVAS_HEIGHT - 40;
      const timelineWidth = CANVAS_WIDTH - 40;
      
      p.fill(0, 0, 0, 150);
    p.noStroke();
      p.rect(20, timelineY - 10, timelineWidth, 30, 5);
      
      // Fases
      const phaseColors = {
        enter: p.color(100, 200, 100),
        anticipate: p.color(200, 200, 100),
        jump: p.color(100, 150, 255),
        fall: p.color(150, 100, 255),
        impact: p.color(255, 100, 100),
        bounce: p.color(255, 150, 100),
        settle: p.color(200, 150, 200),
        exit: p.color(150, 200, 150),
      };
      
      for (const [name, timing] of Object.entries(phases)) {
        const x1 = 20 + timing.start * timelineWidth;
        const x2 = 20 + timing.end * timelineWidth;
        p.fill(phaseColors[name]);
        p.rect(x1, timelineY - 5, x2 - x1, 20);
        
        p.fill(0);
        p.textSize(8);
        p.text(name.slice(0, 3), x1 + 2, timelineY + 8);
      }
      
      // Indicador de posición actual
      const currentX = 20 + t * timelineWidth;
      p.stroke(255);
      p.strokeWeight(2);
      p.line(currentX, timelineY - 10, currentX, timelineY + 20);
    }
    
    p.pop();
  }

  // ============================================
  // CONTROLES DE TECLADO
    // ============================================
  p.keyPressed = () => {
    switch (p.key) {
      case 'd':
      case 'D':
        CONFIG.debugMode = !CONFIG.debugMode;
        console.log(`🔧 Debug mode: ${CONFIG.debugMode ? 'ON' : 'OFF'}`);
        break;
        
      case 'a':
      case 'A':
        CONFIG.showArc = !CONFIG.showArc;
        arcPoints = [];
        console.log(`📈 Show arc: ${CONFIG.showArc ? 'ON' : 'OFF'}`);
        break;
        
      case 'p':
      case 'P':
        CONFIG.showPhases = !CONFIG.showPhases;
        console.log(`📊 Show phases: ${CONFIG.showPhases ? 'ON' : 'OFF'}`);
        break;
        
      case 's':
      case 'S':
        if (window.startRecording) {
          if (window.isRecording && window.isRecording()) {
            console.log('⚠️ Ya hay una grabación en curso');
          } else if (waitingToRecord) {
            waitingToRecord = false;
            console.log('❌ Grabación cancelada');
          } else {
            waitingToRecord = true;
            console.log(`⏳ Esperando inicio del loop para grabar ${LOOP_DURATION}s...`);
          }
        }
        break;
        
      case '1':
        CONFIG.squashIntensity = Math.min(1, CONFIG.squashIntensity + 0.1);
        console.log(`💥 Squash: ${CONFIG.squashIntensity.toFixed(1)}`);
        break;
        
      case '2':
        CONFIG.squashIntensity = Math.max(0, CONFIG.squashIntensity - 0.1);
        console.log(`💥 Squash: ${CONFIG.squashIntensity.toFixed(1)}`);
        break;
        
      case '3':
        CONFIG.stretchIntensity = Math.min(1, CONFIG.stretchIntensity + 0.1);
        console.log(`↔️ Stretch: ${CONFIG.stretchIntensity.toFixed(1)}`);
        break;
        
      case '4':
        CONFIG.stretchIntensity = Math.max(0, CONFIG.stretchIntensity - 0.1);
        console.log(`↔️ Stretch: ${CONFIG.stretchIntensity.toFixed(1)}`);
        break;
        
      case '5':
        CONFIG.exaggeration = Math.min(2, CONFIG.exaggeration + 0.1);
        console.log(`🎭 Exaggeration: ${CONFIG.exaggeration.toFixed(1)}`);
        break;
        
      case '6':
        CONFIG.exaggeration = Math.max(0.5, CONFIG.exaggeration - 0.1);
        console.log(`🎭 Exaggeration: ${CONFIG.exaggeration.toFixed(1)}`);
        break;
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
