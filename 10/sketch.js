import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 10
// Prompt: DISEÑO FUNCIONAL (ACTUALIZADO) — Tipografía Polar: Control, Tiempo y Variantes Ideológicas

// ============================================
// CONFIGURACIÓN DEL LOOP
// ============================================
const LOOP_DURATION = 8; // Duración del loop en segundos
const FPS = 60;           // Frames por segundo
const CANVAS_SIZE = 800; // Tamaño del canvas (cuadrado)

// ============================================
// CONFIGURACIÓN DEL SISTEMA POLAR
// ============================================
const TEXT_CONTENT = "CONTROL TIEMPO PODER";
const MODES = {
  AUTORITARIO: 1,
  POETICO: 2,
  GLITCH: 3
};

// ============================================
// CLASE CARACTER POLAR
// ============================================
class PolarChar {
  constructor(char, ringIndex, angle, baseRadius, mode) {
    this.char = char;
    this.ringIndex = ringIndex;
    this.baseAngle = angle;
    this.baseRadius = baseRadius;
    this.mode = mode;
    this.isHighlighted = false; // Nueva propiedad para resaltado

    // Propiedades variables por modo
    this.resetForMode();
  }

  resetForMode() {
    // Reset a valores base para cada modo
    this.angle = this.baseAngle;
    this.radius = this.baseRadius;
    this.size = this.calculateSize();
    this.opacity = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.duplicate = false;
    this.isHighlighted = false; // Reset del resaltado
  }

  calculateSize() {
    const baseSize = 16;
    switch (this.mode) {
      case MODES.AUTORITARIO:
        return baseSize;
      case MODES.POETICO:
        return baseSize * (0.8 + Math.sin(this.ringIndex * 0.5) * 0.4);
      case MODES.GLITCH:
        return baseSize * (0.5 + Math.random() * 1.5);
      default:
        return baseSize;
    }
  }

  update(time, mouseInfluence, ringSpacing) {
    const t = time * 0.01; // Tiempo normalizado

    switch (this.mode) {
      case MODES.AUTORITARIO:
        // Control absoluto - nada cambia
        this.angle = this.baseAngle;
        this.radius = this.baseRadius + this.ringIndex * ringSpacing;
        this.opacity = 1.0;
        break;

      case MODES.POETICO:
        // Flujo orgánico
        const organicNoise = Math.sin(t + this.ringIndex * 0.3) * 0.1;
        const distanceFromCenter = this.ringIndex / 10.0; // Normalizado

        this.angle = this.baseAngle + organicNoise;
        this.radius = this.baseRadius + this.ringIndex * ringSpacing +
                     Math.sin(t * 0.5 + this.ringIndex) * 5;
        this.opacity = 0.7 + distanceFromCenter * 0.3;
        this.size = this.calculateSize() * (0.9 + Math.sin(t + this.ringIndex * 0.2) * 0.1);
        break;

      case MODES.GLITCH:
        // Corrupción del sistema
        const glitchSeed = this.ringIndex * 100 + Math.floor(t * 10);

        if (Math.random() < 0.02) { // Saltos angulares abruptos
          this.angle = this.baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
        } else {
          this.angle = this.baseAngle;
        }

        // Variaciones extremas de radio
        this.radius = this.baseRadius + this.ringIndex * ringSpacing +
                     (Math.random() - 0.5) * 20;

        // Caracteres desplazados o duplicados
        this.offsetX = (Math.random() - 0.5) * 10;
        this.offsetY = (Math.random() - 0.5) * 10;
        this.duplicate = Math.random() < 0.1;

        // Opacidad caótica
        this.opacity = Math.random() * 0.8 + 0.2;

        // Tamaño variable extremo
        this.size = this.calculateSize() * (0.3 + Math.random() * 2.0);
        break;
    }

    // Influencia del mouse
    const centerDist = Math.sqrt(Math.pow(this.ringIndex, 2));
    const mouseEffect = mouseInfluence * (1 - centerDist / 10.0);

    if (this.mode !== MODES.AUTORITARIO) {
      this.radius += mouseEffect * 10;
      this.angle += mouseEffect * 0.1;
    }
  }

  display(p, centerX, centerY) {
    const x = centerX + Math.cos(this.angle) * this.radius + this.offsetX;
    const y = centerY + Math.sin(this.angle) * this.radius + this.offsetY;

    p.push();
    p.translate(x, y);

    // Determinar color y tamaño según si está resaltada
    let color;
    let displaySize = this.size;

    if (this.isHighlighted) {
      // Letra resaltada: negra y mucho más grande
      color = [0, 0, 0]; // Negro para destacar
      displaySize = this.size * 4.0; // 4 veces más grande
    } else {
      // Color normal según modo
      switch (this.mode) {
        case MODES.AUTORITARIO:
          color = [0, 0, 0]; // Negro autoritario
          break;
        case MODES.POETICO:
          color = [100, 150, 200]; // Azul poético
          break;
        case MODES.GLITCH:
          color = [255, 0, 0]; // Rojo glitch
          break;
      }
    }

    p.fill(color[0], color[1], color[2], this.opacity * 255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(displaySize);
    p.text(this.char, 0, 0);

    // Duplicado para glitch (solo si no está resaltada para no interferir)
    if (this.duplicate && this.mode === MODES.GLITCH && !this.isHighlighted) {
      p.fill(color[0], color[1], color[2], this.opacity * 100);
      p.text(this.char, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
    }

    p.pop();
  }
}

// ============================================
// CLASE SISTEMA POLAR
// ============================================
class PolarTypeSystem {
  constructor() {
    this.characters = [];
    this.currentMode = MODES.AUTORITARIO;
    this.mouseInfluence = 0;
    this.ringSpacing = 30;
    this.showHUD = true; // Controla la visibilidad del HUD
    this.highlightIndex = 0; // Índice de la letra resaltada actualmente
    this.lastHighlightChange = 0; // Tiempo del último cambio de resaltado
    this.highlightDuration = 400; // Duración del resaltado en ms (doble de rápido)
    this.initializeCharacters();
  }

  initializeCharacters() {
    this.characters = [];
    const words = TEXT_CONTENT.split(' ');
    let charIndex = 0;

    // Crear anillos concéntricos
    for (let ring = 0; ring < 8; ring++) {
      const radius = 80 + ring * this.ringSpacing;
      const charsInRing = Math.max(3, ring * 2 + 4);

      for (let i = 0; i < charsInRing; i++) {
        const angle = (i / charsInRing) * Math.PI * 2;

        // Asignar caracteres del texto
        const char = TEXT_CONTENT[charIndex % TEXT_CONTENT.length];
        charIndex++;

        const polarChar = new PolarChar(char, ring, angle, 80, this.currentMode);
        this.characters.push(polarChar);
      }
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    // Reinicializar caracteres para el nuevo modo
    this.characters.forEach(char => {
      char.mode = mode;
      char.resetForMode();
    });
    console.log(`Modo cambiado a: ${this.getModeName()}`);
  }

  getModeName() {
    switch (this.currentMode) {
      case MODES.AUTORITARIO: return "AUTORITARIO";
      case MODES.POETICO: return "POÉTICO";
      case MODES.GLITCH: return "GLITCH";
      default: return "DESCONOCIDO";
    }
  }

  update(time, mouseX, mouseY) {
    // Calcular influencia del mouse
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
    );
    this.mouseInfluence = distanceFromCenter / (CANVAS_SIZE / 2);

    // Actualizar separación entre anillos
    this.ringSpacing = 20 + (mouseY / CANVAS_SIZE) * 40;

    // Actualizar resaltado secuencial
    if (time - this.lastHighlightChange > this.highlightDuration) {
      this.highlightIndex = (this.highlightIndex + 1) % this.characters.length;
      this.lastHighlightChange = time;
    }

    // Actualizar cada caracter
    this.characters.forEach((char, index) => {
      char.isHighlighted = (index === this.highlightIndex);
      char.update(time, this.mouseInfluence, this.ringSpacing);
    });
  }

  display(p) {
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;

    // Dibujar anillos guía (solo en modo debug o para referencia visual)
    if (this.currentMode !== MODES.AUTORITARIO) {
      p.noFill();
      p.stroke(200, 200, 200, 50);
      p.strokeWeight(1);

      for (let ring = 0; ring < 8; ring++) {
        const radius = 80 + ring * this.ringSpacing;
        p.circle(centerX, centerY, radius * 2);
      }
    }

    // Dibujar centro como "Ojo de Gran Hermano"
    this.drawBigBrotherEye(p, centerX, centerY);

    // Dibujar caracteres
    this.characters.forEach(char => {
      char.display(p, centerX, centerY);
    });

    // HUD del modo actual (solo si está habilitado)
    if (this.showHUD) {
      this.displayHUD(p);
    }
  }

  drawBigBrotherEye(p, centerX, centerY) {
    const eyeRadius = 25;

    p.push();
    p.translate(centerX, centerY);

    // Anillos concéntricos como HAL 9000
    // Anillo exterior - Azul oscuro
    p.fill(0, 50, 150, 200);
    p.noStroke();
    p.circle(0, 0, eyeRadius * 2);

    // Segundo anillo - Rojo oscuro
    p.fill(150, 0, 0, 220);
    p.circle(0, 0, eyeRadius * 1.6);

    // Tercer anillo - Rojo fuerte
    p.fill(255, 0, 0, 240);
    p.circle(0, 0, eyeRadius * 1.2);

    // Centro - Amarillo interior
    p.fill(255, 255, 0, 255);
    p.circle(0, 0, eyeRadius * 0.8);

    // Pupila negra en el centro
    p.fill(0, 0, 0, 255);
    p.circle(0, 0, eyeRadius * 0.4);

    // Brillo/reflejo sutil
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(-3, -3, 3);

    p.pop();
  }

  displayHUD(p) {
    p.push();
    p.resetMatrix();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.noStroke();

    // Fondo HUD
    p.fill(0, 180);
    p.rect(10, 10, 200, 140, 8);

    p.fill(255);
    p.textStyle(p.BOLD);
    p.text("TIPOGRAFÍA POLAR", 20, 25);

    p.textStyle(p.NORMAL);
    p.fill(200);
    p.text(`Modo: ${this.getModeName()}`, 20, 50);
    p.text(`[1] Autoritario`, 20, 70);
    p.text(`[2] Poético`, 20, 85);
    p.text(`[3] Glitch`, 20, 100);
    p.text(`[D] HUD: ${this.showHUD ? 'ON' : 'OFF'}`, 20, 115);
    p.text(`[R] Reiniciar`, 20, 130);

    p.pop();
  }

  reset() {
    this.initializeCharacters();
    this.highlightIndex = 0; // Reiniciar resaltado
    this.lastHighlightChange = 0;
    console.log('Sistema reiniciado');
  }
}

const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);

  let polarSystem;
  let startTime;

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.textFont('monospace');

    // Configurar grabador para exportar video
    setupRecorder(p, LOOP_DURATION, FPS);

    // Inicializar sistema
    polarSystem = new PolarTypeSystem();
    startTime = p.millis();
  };

  p.draw = () => {
    p.background(255);

    const currentTime = p.millis() - startTime;

    // Actualizar sistema polar
    polarSystem.update(currentTime, p.mouseX, p.mouseY);

    // Renderizar
    polarSystem.display(p);
  };

  p.keyPressed = () => {
    if (p.key === '1') {
      polarSystem.setMode(MODES.AUTORITARIO);
    } else if (p.key === '2') {
      polarSystem.setMode(MODES.POETICO);
    } else if (p.key === '3') {
      polarSystem.setMode(MODES.GLITCH);
    } else if (p.key === 'd' || p.key === 'D') {
      polarSystem.showHUD = !polarSystem.showHUD;
      console.log(`HUD ${polarSystem.showHUD ? 'activado' : 'desactivado'}`);
    } else if (p.key === 'r' || p.key === 'R') {
      polarSystem.reset();
    } else if (p.key === 's' || p.key === 'S') {
      if (window.isRecording?.()) {
        console.warn('⚠️ Ya hay una grabación en curso');
        return;
      }
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