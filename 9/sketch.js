import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 9
// Prompt: Crazy Automaton — Five Broken Worlds / Six Ways to See Them

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================
const LOOP_DURATION = 8; 
const FPS = 30;          
const CANVAS_SIZE = 800;
const GRID_RES = 80;     // Resolución de la grilla (80x80)
const CELL_SIZE = CANVAS_SIZE / GRID_RES;

const LOGIC_MODES = {
  RULE_SWITCHING: 1,
  PARANOID: 2,
  EMOTIONAL: 3,
  CORRUPTED: 4,
  LIAR: 5
};

const VISUAL_MODES = {
  BINARY: 1,
  COLORED: 2,
  MEMORY: 3,
  LIE: 4,
  FIELD: 5,
  BROKEN: 6
};

// ============================================
// CLASE CELL
// ============================================
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.reset();
  }

  reset() {
    this.alive = Math.random() < 0.15 ? 1 : 0;
    this.nextAlive = 0;
    this.age = 0;
    this.stress = 0;
    this.mood = Math.random();
    this.corruption = 0;
    this.visibleState = this.alive;
    this.history = [];
  }

  updateState() {
    if (this.alive === this.nextAlive) {
      if (this.alive === 1) this.age++;
    } else {
      this.age = 0;
      this.stress = Math.min(1, this.stress + 0.2);
    }
    this.alive = this.nextAlive;
    this.stress *= 0.95;
    this.mood = (this.mood + (Math.random() - 0.5) * 0.05 + 1) % 1;
    
    // Guardar historia para visualización de memoria
    this.history.push(this.alive);
    if (this.history.length > 10) this.history.shift();
  }
}

// ============================================
// CLASE GRID
// ============================================
class Grid {
  constructor(res) {
    this.res = res;
    this.cells = [];
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        this.cells.push(new Cell(x, y));
      }
    }
  }

  getCell(x, y) {
    if (x < 0 || x >= this.res || y < 0 || y >= this.res) return null;
    return this.cells[y * this.res + x];
  }

  getNeighbors(x, y, paranoid = false, liar = false) {
    let neighbors = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        let nx = (x + i + this.res) % this.res;
        let ny = (y + j + this.res) % this.res;
        let cell = this.getCell(nx, ny);
        
        let state = cell.alive;
        if (liar) state = cell.visibleState;
        if (paranoid && Math.random() < 0.1) state = 1 - state;
        
        neighbors.push(state);
      }
    }
    return neighbors;
  }

  reset(all = true) {
    this.cells.forEach(c => c.reset());
  }

  update(mode) {
    this.cells.forEach(cell => {
      const neighbors = this.getNeighbors(cell.x, cell.y, 
        mode === LOGIC_MODES.PARANOID, 
        mode === LOGIC_MODES.LIAR
      );
      const count = neighbors.reduce((a, b) => a + b, 0);

      let next = cell.alive;

      switch (mode) {
        case LOGIC_MODES.RULE_SWITCHING:
          // Cambia entre Rule B3/S23 y B36/S23 según posición
          const useB36 = (cell.x + cell.y) % 20 < 10;
          if (cell.alive === 1) {
            next = (count === 2 || count === 3) ? 1 : 0;
          } else {
            next = (count === 3 || (useB36 && count === 6)) ? 1 : 0;
          }
          break;

        case LOGIC_MODES.PARANOID:
          // Percepción corrupta ya manejada en getNeighbors
          if (cell.alive === 1) {
            next = (count === 2 || count === 3) ? 1 : 0;
          } else {
            next = (count === 3) ? 1 : 0;
          }
          break;

        case LOGIC_MODES.EMOTIONAL:
          // Mood influye en reglas
          const moodThreshold = cell.mood > 0.7 ? 1 : (cell.mood < 0.3 ? 4 : 3);
          if (cell.alive === 1) {
            next = (count >= 2 && count <= moodThreshold) ? 1 : 0;
          } else {
            next = (count === 3) ? 1 : 0;
          }
          break;

        case LOGIC_MODES.CORRUPTED:
          // Degradación de reglas
          cell.corruption = Math.min(1, cell.corruption + 0.001);
          if (Math.random() < cell.corruption * 0.1) {
            next = Math.random() < 0.5 ? 1 : 0;
          } else {
            if (cell.alive === 1) {
              next = (count === 2 || count === 3) ? 1 : 0;
            } else {
              next = (count === 3) ? 1 : 0;
            }
          }
          break;

        case LOGIC_MODES.LIAR:
          // Las células muestran un estado distinto al real
          cell.visibleState = Math.random() < 0.2 ? 1 - cell.alive : cell.alive;
          if (cell.alive === 1) {
            next = (count === 2 || count === 3) ? 1 : 0;
          } else {
            next = (count === 3) ? 1 : 0;
          }
          break;
      }

      cell.nextAlive = next;
    });

    this.cells.forEach(c => c.updateState());
  }
}

const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  
  let grid;
  let currentLogicMode;
  let currentVisualMode = VISUAL_MODES.BINARY;
  let debug = false;
  let stepCount = 0;
  let waitingForStart = false;

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    // duration = 0 → grabación manual (hasta pulsar S de nuevo)
    setupRecorder(p, 0, FPS);
    
    grid = new Grid(GRID_RES);
    currentLogicMode = p.floor(p.random(1, 6));
  };

  p.draw = () => {
    p.background(10);
    
    // Actualizar lógica
    grid.update(currentLogicMode);
    stepCount++;

    // Renderizar según modo visual
    render(currentVisualMode);

    // Render HUD (visible if debug is true or if not recording)
    if (debug || !window.isRecording?.()) {
      renderHUD();
    }

    // Render cell details on hover (only in debug mode)
    if (debug) {
      renderDebugInfo();
    }
  };

  const renderHUD = () => {
    p.push();
    p.resetMatrix(); // Ensure HUD is not affected by any translations
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.noStroke();

    // HUD Background (slightly taller if debug is on for FPS)
    p.fill(0, 180);
    p.rect(10, 10, 240, debug ? 180 : 160, 8);

    p.fill(255);
    p.textStyle(p.BOLD);
    p.text("CRAZY AUTOMATON - HUD", 20, 25);
    
    p.textStyle(p.NORMAL);
    p.fill(200);
    p.text(`[1-5] Logic: ${getLogicName(currentLogicMode)}`, 20, 50);
    p.text(`[SPACE] Visual: ${getVisualName(currentVisualMode)}`, 20, 70);
    p.text(`[R] Reset Grid`, 20, 90);
    p.text(`[D] Debug: ${debug ? 'ON' : 'OFF'}`, 20, 110);
    
    // Recording status in HUD
    let recordStatus = "[S] Arm Recording";
    if (waitingForStart) {
      p.fill(255, 100, 100);
      recordStatus = "[S] ARMED → press R or 1-5";
    } else if (window.isRecording?.()) {
      p.fill(255, 0, 0);
      recordStatus = "[S] ● REC (press S to stop)";
    }
    p.text(recordStatus, 20, 130);
    
    p.fill(150);
    p.textSize(11);
    p.text(`Steps: ${stepCount} | Frame: ${p.frameCount}`, 20, 150);
    
    if (debug) {
      p.fill(0, 255, 0);
      p.text(`FPS: ${p.floor(p.frameRate())}`, 20, 165);
    }
    p.pop();
  };

  const renderDebugInfo = () => {
    const gx = p.floor(p.mouseX / CELL_SIZE);
    const gy = p.floor(p.mouseY / CELL_SIZE);
    const cell = grid.getCell(gx, gy);

    if (cell) {
      p.push();
      const infoW = 120;
      const infoH = 90;
      
      // Calculate tooltip position
      let tx = p.mouseX + 15;
      let ty = p.mouseY + 15;
      if (tx + infoW > p.width) tx = p.mouseX - infoW - 15;
      if (ty + infoH > p.height) ty = p.mouseY - infoH - 15;

      p.fill(0, 200);
      p.stroke(0, 255, 0, 150);
      p.strokeWeight(1);
      p.rect(tx, ty, infoW, infoH, 5);

      p.noStroke();
      p.fill(0, 255, 0);
      p.textSize(10);
      p.text(`CELL: ${gx}, ${gy}`, tx + 8, ty + 18);
      
      p.fill(255);
      p.text(`Alive: ${cell.alive}`, tx + 8, ty + 32);
      p.text(`Age: ${cell.age}`, tx + 8, ty + 44);
      p.text(`Mood: ${cell.mood.toFixed(2)}`, tx + 8, ty + 56);
      p.text(`Stress: ${cell.stress.toFixed(2)}`, tx + 8, ty + 68);
      p.text(`Corruption: ${cell.corruption.toFixed(3)}`, tx + 8, ty + 80);
      
      // Highlight current cell
      p.noFill();
      p.stroke(0, 255, 0, 200);
      p.rect(gx * CELL_SIZE, gy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      p.pop();
    }
  };

  const render = (mode) => {
    p.noStroke();
    
    grid.cells.forEach(cell => {
      const px = cell.x * CELL_SIZE;
      const py = cell.y * CELL_SIZE;

      switch (mode) {
        case VISUAL_MODES.BINARY:
          p.fill(cell.alive ? 255 : 30);
          p.rect(px, py, CELL_SIZE, CELL_SIZE);
          break;

        case VISUAL_MODES.COLORED:
          if (cell.alive) {
            p.colorMode(p.HSB);
            p.fill(cell.mood * 360, 80, 90);
            p.rect(px, py, CELL_SIZE, CELL_SIZE);
            p.colorMode(p.RGB);
          } else {
            p.fill(20);
            p.rect(px, py, CELL_SIZE, CELL_SIZE);
          }
          break;

        case VISUAL_MODES.MEMORY:
          const ageAlpha = p.map(cell.age, 0, 50, 50, 255, true);
          const stressSat = p.map(cell.stress, 0, 1, 0, 100);
          p.colorMode(p.HSB);
          if (cell.alive) {
            p.fill(180, stressSat, ageAlpha);
          } else {
            p.fill(0, 0, 20);
          }
          p.rect(px, py, CELL_SIZE, CELL_SIZE);
          p.colorMode(p.RGB);
          break;

        case VISUAL_MODES.LIE:
          // Mix of real and visible state
          if (cell.alive !== cell.visibleState) {
            p.fill(255, 0, 0); // Error/Lie
          } else {
            p.fill(cell.alive ? 255 : 30);
          }
          p.rect(px, py, CELL_SIZE, CELL_SIZE);
          if (p.frameCount % 30 < 15 && cell.visibleState) {
              p.fill(255, 200);
              p.rect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          }
          break;

        case VISUAL_MODES.FIELD:
          // Based on local density
          const neighbors = grid.getNeighbors(cell.x, cell.y);
          const density = neighbors.reduce((a, b) => a + b, 0) / 8;
          p.fill(density * 255, 100, 255 - density * 200);
          p.rect(px, py, CELL_SIZE, CELL_SIZE);
          break;

        case VISUAL_MODES.BROKEN:
          const offset = p.noise(cell.x * 0.1, cell.y * 0.1, p.frameCount * 0.05) * 10;
          if (cell.alive) {
            p.fill(255, 150);
            p.rect(px + offset, py - offset, CELL_SIZE * 1.5, CELL_SIZE * 1.5);
            p.fill(0, 255, 255, 100);
            p.rect(px - offset, py + offset, CELL_SIZE, CELL_SIZE);
          }
          break;
      }
    });
  };

  const getLogicName = (mode) => {
    switch(mode) {
      case LOGIC_MODES.RULE_SWITCHING: return "Rule-Switching";
      case LOGIC_MODES.PARANOID: return "Paranoid";
      case LOGIC_MODES.EMOTIONAL: return "Emotional";
      case LOGIC_MODES.CORRUPTED: return "Corrupted";
      case LOGIC_MODES.LIAR: return "Liar";
      default: return "Unknown";
    }
  };

  const getVisualName = (mode) => {
    switch(mode) {
      case VISUAL_MODES.BINARY: return "Raw Binary";
      case VISUAL_MODES.COLORED: return "Colored States";
      case VISUAL_MODES.MEMORY: return "Visible Memory";
      case VISUAL_MODES.LIE: return "Visual Lie";
      case VISUAL_MODES.FIELD: return "Continuous Field";
      case VISUAL_MODES.BROKEN: return "Broken Visual";
      default: return "Unknown";
    }
  };

  const triggerRecordingIfWaiting = () => {
    if (waitingForStart && window.startRecording) {
      window.startRecording();
      waitingForStart = false;
      console.log("🔴 Reset detected. Recording started (press S to stop).");
    }
  };

  p.keyPressed = () => {
    if (p.key >= '1' && p.key <= '5') {
      currentLogicMode = parseInt(p.key);
      grid.reset();
      stepCount = 0;
      console.log(`Logic Mode changed to: ${currentLogicMode}`);
      triggerRecordingIfWaiting();
    }

    if (p.key === ' ') {
      currentVisualMode = (currentVisualMode % 6) + 1;
      console.log(`Visual Mode changed to: ${currentVisualMode}`);
    }

    if (p.key === 'r' || p.key === 'R') {
      grid.reset();
      stepCount = 0;
      console.log('Grid Reset');
      triggerRecordingIfWaiting();
    }

    if (p.key === 'd' || p.key === 'D') {
      debug = !debug;
    }

    if (p.key === 's' || p.key === 'S') {
      if (window.isRecording?.()) {
        window.stopRecording?.();
        console.log("⏹️ Recording stopped.");
      } else {
        waitingForStart = !waitingForStart;
        if (waitingForStart) {
          console.log("⏳ Armed. Press R or 1-5 to start recording...");
        } else {
          console.log("🚫 Recording disarmed.");
        }
      }
    }
  };
};

new p5(sketch, document.getElementById('canvas-container'));
