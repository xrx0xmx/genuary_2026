import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 7
// Prompt: FUNCTIONAL — BOOLEAN GRID OPERATORS (40×40)

// ============================================
// CONFIGURACIÓN DEL LOOP
// ============================================
const LOOP_DURATION = 8; // Duración del loop en segundos
const FPS = 60;           // Frames por segundo (máxima velocidad)
const CANVAS_SIZE = 800; // Tamaño del canvas (cuadrado)

// ============================================
// CONFIGURACIÓN DEL GRID
// ============================================
const GRID_SIZE = 20;           // 40×40 grid
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const OPERATOR_SPAWN_RATE = 0.15; // Probabilidad de spawn por frame (más rápido)
const ROTATION_DURATION = 0.4; // Duración de la rotación en segundos

// ============================================
// COLORES POR OPERADOR
// ============================================
const OPERATOR_COLORS = {
  AND: [255, 100, 100],  // Rojo
  OR: [100, 100, 255],   // Azul
  XOR: [100, 255, 100],  // Verde
  NOT: [255, 255, 100]   // Amarillo
};

const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  
  // Estado del grid
  let grid = [];
  let cellColors = [];
  let cellRotations = []; // Estado de rotación de cada celda
  
  // Inicializar grid
  const initializeGrid = () => {
    grid = [];
    cellColors = [];
    cellRotations = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      grid[i] = [];
      cellColors[i] = [];
      cellRotations[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        //grid[i][j] = Math.random() < 0.5 ? 0 : 1; // Valores aleatorios 0 o 1
        grid[i][j] = 0
        cellColors[i][j] = [255, 255, 255]; // Blanco por defecto
        cellRotations[i][j] = {
          isRotating: false,
          rotationAngle: 0,
          startTime: 0,
          oldColor: [255, 255, 255],
          oldValue: 0
        };
      }
    }
  };
  
  // Obtener vecinos (4 direcciones)
  const getNeighbors = (x, y) => {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // arriba, abajo, izquierda, derecha
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  };
  
  // Iniciar rotación de una celda
  const startCellRotation = (i, j, newColor, newValue) => {
    const rotation = cellRotations[i][j];
    rotation.isRotating = true;
    rotation.startTime = p.millis();
    rotation.oldColor = [...cellColors[i][j]];
    rotation.oldValue = grid[i][j];
    cellColors[i][j] = [...newColor];
    grid[i][j] = newValue;
  };
  
  // Actualizar estado de rotación de una celda
  const updateCellRotation = (i, j) => {
    const rotation = cellRotations[i][j];
    if (!rotation.isRotating) return;
    
    const elapsed = (p.millis() - rotation.startTime) / 1000;
    const progress = Math.min(elapsed / ROTATION_DURATION, 1);
    
    // Usar easing para suavizar la rotación
    const easedProgress = easing.inOutCubic(progress);
    rotation.rotationAngle = easedProgress * p.PI; // 0 a PI (180 grados)
    
    if (progress >= 1) {
      rotation.isRotating = false;
      rotation.rotationAngle = 0;
    }
  };
  
  // Aplicar operador lógico
  const applyOperator = (operator, x, y) => {
    const neighbors = getNeighbors(x, y);
    const color = OPERATOR_COLORS[operator];
    
    if (operator === 'NOT') {
      // NOT es unario: invierte cada vecino
      for (const neighbor of neighbors) {
        const oldValue = grid[neighbor.x][neighbor.y];
        const newValue = 1 - oldValue;
        grid[neighbor.x][neighbor.y] = newValue;
        startCellRotation(neighbor.x, neighbor.y, color, newValue);
      }
    } else {
      // Para operadores binarios, aplicamos entre pares de vecinos
      for (let i = 0; i < neighbors.length - 1; i++) {
        const a = neighbors[i];
        const b = neighbors[i + 1];
        
        let newValue;
        switch (operator) {
          case 'AND':
            newValue = grid[a.x][a.y] & grid[b.x][b.y];
            break;
          case 'OR':
            newValue = grid[a.x][a.y] | grid[b.x][b.y];
            break;
          case 'XOR':
            newValue = grid[a.x][a.y] ^ grid[b.x][b.y];
            break;
          default:
            newValue = grid[a.x][a.y];
        }
        
        // Solo iniciar rotación si el valor cambió
        if (grid[a.x][a.y] !== newValue) {
          startCellRotation(a.x, a.y, color, newValue);
        }
        if (grid[b.x][b.y] !== newValue) {
          startCellRotation(b.x, b.y, color, newValue);
        }
      }
    }
  };
  
  // Spawn aleatorio de operadores (múltiples por frame para máxima velocidad)
  const spawnRandomOperator = () => {
    const numOperators = Math.floor(p.random(1, 4)); // 1-3 operadores por frame
    for (let i = 0; i < numOperators; i++) {
      if (p.random() < OPERATOR_SPAWN_RATE) {
        const x = Math.floor(p.random(GRID_SIZE));
        const y = Math.floor(p.random(GRID_SIZE));
        const operators = ['AND', 'OR', 'XOR', 'NOT'];
        const operator = operators[Math.floor(p.random(operators.length))];
        applyOperator(operator, x, y);
      }
    }
  };

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    p.noStroke();
    
    // Configurar grabador para exportar video
    setupRecorder(p, LOOP_DURATION, FPS);
    
    // Inicializar grid
    initializeGrid();
  };

  // Dibujar un círculo (para valor 0)
  const drawCircle = (size, color) => {
    p.fill(color);
    p.noStroke();
    p.circle(0, 0, size);
  };
  
  // Dibujar una X (para valor 1)
  const drawX = (size, color, strokeWeight) => {
    p.stroke(color);
    p.strokeWeight(strokeWeight);
    p.noFill();
    const halfSize = size / 2;
    p.line(-halfSize, -halfSize, halfSize, halfSize);
    p.line(halfSize, -halfSize, -halfSize, halfSize);
  };
  
  // Dibujar una celda con efecto 3D de rotación (simulado en 2D)
  const drawCell3D = (i, j) => {
    const rotation = cellRotations[i][j];
    const x = i * CELL_SIZE + CELL_SIZE / 2;
    const y = j * CELL_SIZE + CELL_SIZE / 2;
    
    p.push();
    p.translate(x, y);
    
    if (rotation.isRotating) {
      // Simular rotación 3D usando escalado y perspectiva
      const angle = rotation.rotationAngle;
      const scaleY = Math.abs(Math.cos(angle)); // Escala vertical para efecto 3D
      const showingTop = angle < p.PI / 2; // Mostrar cara superior cuando angle < 90°
      
      // Color anterior (cara superior)
      const [oldR, oldG, oldB] = rotation.oldColor;
      const oldValue = rotation.oldValue;
      const oldFinalR = oldValue ? oldR : 255 - (255 - oldR) * 0.3;
      const oldFinalG = oldValue ? oldG : 255 - (255 - oldG) * 0.3;
      const oldFinalB = oldValue ? oldB : 255 - (255 - oldB) * 0.3;
      
      // Color nuevo (cara inferior)
      const [newR, newG, newB] = cellColors[i][j];
      const newValue = grid[i][j];
      const newFinalR = newValue ? newR : 255 - (255 - newR) * 0.3;
      const newFinalG = newValue ? newG : 255 - (255 - newG) * 0.3;
      const newFinalB = newValue ? newB : 255 - (255 - newB) * 0.3;
      
      // Determinar qué cara mostrar según el ángulo de rotación
      const visibleColor = showingTop ? [oldFinalR, oldFinalG, oldFinalB] : [newFinalR, newFinalG, newFinalB];
      const visibleValue = showingTop ? rotation.oldValue : newValue;
      
      // Dibujar la cara visible con efecto de rotación
      p.fill(visibleColor[0], visibleColor[1], visibleColor[2]);
      p.push();
      p.scale(1, scaleY);
      p.rect(-CELL_SIZE / 2 + 0.5, -CELL_SIZE / 2 + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      p.pop();
      
      // Dibujar bordes laterales para efecto de profundidad 3D
      if (scaleY < 0.95) {
        const edgeHeight = (1 - scaleY) * CELL_SIZE * 0.5;
        p.fill(60, 60, 60);
        // Borde superior (cuando muestra la cara superior)
        if (showingTop) {
          p.rect(-CELL_SIZE / 2 + 0.5, -CELL_SIZE / 2 + 0.5 - edgeHeight, CELL_SIZE - 1, edgeHeight);
        }
        // Borde inferior (cuando muestra la cara inferior)
        else {
          p.rect(-CELL_SIZE / 2 + 0.5, CELL_SIZE / 2 - 0.5, CELL_SIZE - 1, edgeHeight);
        }
      }
      
      // Mostrar valor en la cara visible (círculo para 0, X para 1)
      const symbolSize = CELL_SIZE * 0.75 * Math.max(scaleY, 0.3); // 75% del tamaño de celda
      const symbolColor = 0; // Negro para ambos símbolos (mejor contraste)
      
      p.push();
      p.scale(1, scaleY); // Aplicar escala también al símbolo
      if (visibleValue) {
        // Dibujar X
        drawX(symbolSize, symbolColor, CELL_SIZE * 0.08);
      } else {
        // Dibujar círculo
        drawCircle(symbolSize, symbolColor);
      }
      p.pop();
    } else {
      // Celda normal sin rotación
      const [r, g, b] = cellColors[i][j];
      const value = grid[i][j];
      
      // Mezclar color con blanco/negro según el valor
      const finalR = value ? r : 255 - (255 - r) * 0.3;
      const finalG = value ? g : 255 - (255 - g) * 0.3;
      const finalB = value ? b : 255 - (255 - b) * 0.3;
      
      p.fill(finalR, finalG, finalB);
      p.rect(-CELL_SIZE / 2 + 0.5, -CELL_SIZE / 2 + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      
      // Mostrar valor (círculo para 0, X para 1)
      const symbolSize = CELL_SIZE * 0.75; // 75% del tamaño de celda
      const symbolColor = 0; // Negro para ambos símbolos (mejor contraste)
      
      if (value) {
        // Dibujar X
        drawX(symbolSize, symbolColor, CELL_SIZE * 0.08);
      } else {
        // Dibujar círculo
        drawCircle(symbolSize, symbolColor);
      }
    }
    
    p.pop();
  };
  
  p.draw = () => {
    p.background(255);
    
    // Múltiples spawns aleatorios de operadores para máxima velocidad
    for (let i = 0; i < 3; i++) {
      spawnRandomOperator();
    }
    
    // Actualizar y renderizar grid
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        updateCellRotation(i, j);
        drawCell3D(i, j);
      }
    }
  };

  p.keyPressed = () => {
    if (p.key === 's' || p.key === 'S') {
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
