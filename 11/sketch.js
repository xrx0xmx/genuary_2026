import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 11
// Prompt: QUINE + GLITCH — La tentación de mutar, la obligación de ser idéntico

// ============================================
// CONFIGURACIÓN
// ============================================
const LOOP_DURATION = 10; // Duración del loop en segundos
const FPS = 60;
const CANVAS_SIZE = 800;

// Estados de la máquina
const STATE = {
  INIT: 'INIT',
  STABLE: 'STABLE',
  GLITCH: 'GLITCH',
  REPAIR: 'REPAIR'
};

// Configuración de estados
const STATE_CONFIG = {
  STABLE_DURATION_MIN: 3.0,  // Duración mínima en STABLE (segundos)
  STABLE_DURATION_MAX: 6.0,  // Duración máxima en STABLE
  GLITCH_DURATION_MIN: 0.3,  // Duración mínima de glitch
  GLITCH_DURATION_MAX: 1.2,  // Duración máxima de glitch
  REPAIR_DURATION: 1.5,      // Duración de reparación
  GLITCH_PROBABILITY: 0.003  // Probabilidad por frame de entrar en GLITCH desde STABLE
};

// ============================================
// SISTEMA DE CHECKSUM
// ============================================
function calculateChecksum(text) {
  let sum = 0;
  for (let i = 0; i < text.length; i++) {
    sum += text.charCodeAt(i) * (i + 1);
  }
  return sum;
}

// ============================================
// TIPOS DE GLITCH
// ============================================
function applyGlitch(text, intensity = 0.3) {
  let mutated = text.split('');
  const glitchTypes = ['substitute', 'delete', 'duplicate', 'permute', 'noise'];
  const selectedType = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];
  
  const numChanges = Math.floor(text.length * intensity);
  
  switch (selectedType) {
    case 'substitute':
      // Sustituir caracteres aleatorios
      for (let i = 0; i < numChanges; i++) {
        const idx = Math.floor(Math.random() * mutated.length);
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
        mutated[idx] = chars[Math.floor(Math.random() * chars.length)];
      }
      break;
      
    case 'delete':
      // Eliminar caracteres aleatorios
      for (let i = 0; i < numChanges && mutated.length > 0; i++) {
        const idx = Math.floor(Math.random() * mutated.length);
        mutated.splice(idx, 1);
      }
      break;
      
    case 'duplicate':
      // Duplicar caracteres aleatorios
      for (let i = 0; i < numChanges && mutated.length < text.length * 2; i++) {
        const idx = Math.floor(Math.random() * mutated.length);
        mutated.splice(idx, 0, mutated[idx] || '?');
      }
      break;
      
    case 'permute':
      // Permutar líneas
      const lines = text.split('\n');
      if (lines.length > 1) {
        for (let i = 0; i < Math.min(numChanges, lines.length - 1); i++) {
          const idx1 = Math.floor(Math.random() * lines.length);
          const idx2 = Math.floor(Math.random() * lines.length);
          [lines[idx1], lines[idx2]] = [lines[idx2], lines[idx1]];
        }
        mutated = lines.join('\n').split('');
      }
      break;
      
    case 'noise':
      // Añadir ruido de caracteres
      const noiseChars = '█▓▒░▀▄▌▐';
      for (let i = 0; i < numChanges; i++) {
        const idx = Math.floor(Math.random() * mutated.length);
        mutated[idx] = noiseChars[Math.floor(Math.random() * noiseChars.length)];
      }
      break;
  }
  
  return mutated.join('');
}

// ============================================
// CÓDIGO FUENTE (SOURCE) - Inmutable
// ============================================
// Intentar cargar el código fuente del archivo actual
let SOURCE = '';
let SOURCE_CHECKSUM = 0;
let sourceLoaded = false;

// Función para obtener el código fuente
async function loadSourceCode() {
  try {
    // Intentar leer el archivo sketch.js
    const response = await fetch('./sketch.js');
    if (response.ok) {
      SOURCE = await response.text();
      SOURCE_CHECKSUM = calculateChecksum(SOURCE);
      sourceLoaded = true;
      return;
    }
  } catch (e) {
    console.warn('No se pudo cargar el código fuente desde el archivo, usando código de respaldo');
  }
  
  // Código de respaldo: incluir una versión representativa del código
  SOURCE = `// Genuary 2026 - Día 11
// QUINE + GLITCH — La tentación de mutar, la obligación de ser idéntico

import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

const LOOP_DURATION = 10;
const FPS = 60;
const CANVAS_SIZE = 800;

const STATE = {
  INIT: 'INIT',
  STABLE: 'STABLE',
  GLITCH: 'GLITCH',
  REPAIR: 'REPAIR'
};

function calculateChecksum(text) {
  let sum = 0;
  for (let i = 0; i < text.length; i++) {
    sum += text.charCodeAt(i) * (i + 1);
  }
  return sum;
}

function applyGlitch(text, intensity = 0.3) {
  // Aplica corrupción visual al texto
  // Tipos: substitute, delete, duplicate, permute, noise
  return mutated;
}

const sketch = (p) => {
  let currentState = STATE.INIT;
  let MUTANT = SOURCE;
  
  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    MUTANT = SOURCE;
    transitionTo(STATE.STABLE);
  };
  
  p.draw = () => {
    // Máquina de estados: STABLE → GLITCH → REPAIR → STABLE
    // Verificar checksum continuamente
    // Si MUTANT ≠ SOURCE, forzar REPAIR
    // Renderizar código con efectos visuales según estado
  };
  
  p.keyPressed = () => {
    // SPACE: forzar GLITCH
    // R: forzar REPAIR
    // S: volver a STABLE
  };
};

new p5(sketch, document.getElementById('canvas-container'));`;
  
  SOURCE_CHECKSUM = calculateChecksum(SOURCE);
  sourceLoaded = true;
}

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  
  // Estado del sistema
  let currentState = STATE.INIT;
  let stateStartTime = 0;
  let stateDuration = 0;
  
  // Texto mutable
  let MUTANT = '';
  
  // Configuración visual
  const FONT_SIZE = 10;
  const LINE_HEIGHT = 14;
  const PADDING = 20;
  let lines = [];
  
  // Variables para efectos visuales
  let glitchIntensity = 0;
  let repairProgress = 0;
  let jitterX = 0;
  let jitterY = 0;
  
  // Función para transicionar a un estado
  function transitionTo(newState) {
    if (currentState === newState) return;
    
    currentState = newState;
    stateStartTime = p.millis();
    
    switch (newState) {
      case STATE.STABLE:
        MUTANT = SOURCE;
        stateDuration = p.random(STATE_CONFIG.STABLE_DURATION_MIN, STATE_CONFIG.STABLE_DURATION_MAX) * 1000;
        glitchIntensity = 0;
        repairProgress = 0;
        break;
        
      case STATE.GLITCH:
        glitchIntensity = p.random(0.2, 0.5);
        stateDuration = p.random(STATE_CONFIG.GLITCH_DURATION_MIN, STATE_CONFIG.GLITCH_DURATION_MAX) * 1000;
        // Aplicar glitch inicial
        MUTANT = applyGlitch(SOURCE, glitchIntensity);
        break;
        
      case STATE.REPAIR:
        repairProgress = 0;
        stateDuration = STATE_CONFIG.REPAIR_DURATION * 1000;
        break;
    }
  }
  
  // Función para verificar checksum y detectar corrupción
  function verifyIntegrity() {
    const currentChecksum = calculateChecksum(MUTANT);
    return currentChecksum === SOURCE_CHECKSUM;
  }
  
  p.setup = async () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.textFont('monospace');
    p.textSize(FONT_SIZE);
    p.textAlign(p.LEFT, p.TOP);
    
    // Cargar código fuente si no está cargado
    if (!sourceLoaded) {
      await loadSourceCode();
    }
    
    // Inicializar
    MUTANT = SOURCE;
    lines = SOURCE.split('\n');
    
    // Transicionar a STABLE después de INIT
    transitionTo(STATE.STABLE);
    
    setupRecorder(p, LOOP_DURATION, FPS);
    
    console.log('🔒 Sistema inicializado. SOURCE inmutable.');
    console.log('⌨️ Controles: SPACE = glitch, R = reparar, S = estable/grabar');
  };
  
  p.draw = () => {
    // Esperar a que el código fuente esté cargado
    if (!sourceLoaded || !SOURCE) {
      p.background(10);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('Cargando código fuente...', p.width / 2, p.height / 2);
      return;
    }
    
    const currentTime = p.millis();
    const elapsed = currentTime - stateStartTime;
    
    // Actualizar estado según máquina de estados
    switch (currentState) {
      case STATE.STABLE:
        // Verificar probabilidad de glitch espontáneo
        if (p.random() < STATE_CONFIG.GLITCH_PROBABILITY) {
          transitionTo(STATE.GLITCH);
        }
        // Verificar timeout
        if (elapsed >= stateDuration) {
          transitionTo(STATE.GLITCH);
        }
        break;
        
      case STATE.GLITCH:
        // Verificar integridad continuamente
        if (!verifyIntegrity()) {
          transitionTo(STATE.REPAIR);
        }
        // Aplicar glitch continuo mientras estamos en este estado
        if (p.frameCount % 3 === 0) {
          MUTANT = applyGlitch(SOURCE, glitchIntensity * p.random(0.8, 1.2));
        }
        // Verificar timeout (glitch muy largo)
        if (elapsed >= stateDuration) {
          transitionTo(STATE.REPAIR);
        }
        break;
        
      case STATE.REPAIR:
        // Animación de reparación
        repairProgress = p.constrain(elapsed / stateDuration, 0, 1);
        
        // Restaurar progresivamente
        if (repairProgress > 0.5) {
          MUTANT = SOURCE;
        }
        
        // Completar reparación
        if (elapsed >= stateDuration) {
          MUTANT = SOURCE;
          transitionTo(STATE.STABLE);
        }
        break;
    }
    
    // Actualizar líneas para renderizado
    lines = MUTANT.split('\n');
    
    // Calcular efectos visuales según estado
    if (currentState === STATE.GLITCH) {
      jitterX = p.random(-8, 8);
      jitterY = p.random(-4, 4);
    } else if (currentState === STATE.REPAIR) {
      jitterX = p.lerp(jitterX, 0, 0.1);
      jitterY = p.lerp(jitterY, 0, 0.1);
    } else {
      jitterX = 0;
      jitterY = 0;
    }
    
    // ============================================
    // RENDERIZADO
    // ============================================
    
    // Fondo según estado
    if (currentState === STATE.STABLE) {
      p.background(10, 10, 12);
    } else if (currentState === STATE.GLITCH) {
      // Fondo con colores digitales agresivos
      const bgHue = (p.frameCount * 2) % 360;
      p.colorMode(p.HSB, 360, 100, 100);
      p.background(bgHue, 80, 20);
      p.colorMode(p.RGB, 255);
    } else if (currentState === STATE.REPAIR) {
      // Desaturación progresiva
      const bgBrightness = p.lerp(20, 10, repairProgress);
      p.background(bgBrightness);
    }
    
    // Renderizar texto línea por línea
    p.push();
    p.translate(PADDING + jitterX, PADDING + jitterY);
    
    p.textFont('monospace');
    p.textSize(FONT_SIZE);
    p.textAlign(p.LEFT, p.TOP);
    
    const maxLines = Math.floor((CANVAS_SIZE - PADDING * 2) / LINE_HEIGHT);
    const startLine = Math.max(0, Math.min(lines.length - maxLines, 0));
    
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      const line = lines[i + startLine] || '';
      const y = i * LINE_HEIGHT;
      
      if (currentState === STATE.STABLE) {
        // Texto limpio y ordenado
        p.fill(220, 220, 220);
        p.text(line, 0, y);
        
      } else if (currentState === STATE.GLITCH) {
        // Colores agresivos y fragmentación
        const charColors = [
          p.color(0, 255, 255),   // Cyan
          p.color(255, 0, 255),   // Magenta
          p.color(0, 255, 0),     // Verde digital
          p.color(255, 255, 0)    // Amarillo
        ];
        
        // Renderizar carácter por carácter con colores aleatorios
        let xOffset = 0;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          const colorIdx = Math.floor(p.random(charColors.length));
          p.fill(charColors[colorIdx]);
          
          // Jitter adicional por carácter
          const charJitterX = p.random(-2, 2);
          const charJitterY = p.random(-1, 1);
          
          p.text(char, xOffset + charJitterX, y + charJitterY);
          xOffset += p.textWidth(char);
        }
        
      } else if (currentState === STATE.REPAIR) {
        // Animación de recomposición
        const alpha = p.lerp(100, 255, repairProgress);
        p.fill(220, 220, 220, alpha);
        
        // Efecto de "encaje" - las líneas vuelven a su sitio
        const lineOffset = (1 - repairProgress) * 20 * p.sin(i * 0.5);
        p.text(line, lineOffset, y);
      }
    }
    
    p.pop();
    
    // Indicador de estado (opcional, pequeño)
    p.push();
    p.fill(255, 100);
    p.textSize(8);
    p.textAlign(p.RIGHT, p.BOTTOM);
    const stateLabels = {
      [STATE.STABLE]: 'STABLE',
      [STATE.GLITCH]: 'GLITCH',
      [STATE.REPAIR]: 'REPAIR'
    };
    p.text(stateLabels[currentState] || '', CANVAS_SIZE - 10, CANVAS_SIZE - 10);
    p.pop();
  };
  
  // ============================================
  // INTERACCIONES
  // ============================================
  p.keyPressed = () => {
    if (p.key === ' ') {
      // SPACE: Forzar GLITCH
      if (currentState === STATE.STABLE) {
        transitionTo(STATE.GLITCH);
        console.log('💥 GLITCH forzado');
      }
    } else if (p.key === 'r' || p.key === 'R') {
      // R: Forzar REPAIR
      if (currentState === STATE.GLITCH) {
        transitionTo(STATE.REPAIR);
        console.log('🔧 REPAIR forzado');
      }
    } else if (p.key === 's' || p.key === 'S') {
      // S: Grabar (siempre disponible independientemente del estado)
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
