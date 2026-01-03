import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 3
// Prompt: Fibonacci forever - Crecimiento de organismos

// ============================================
// CONFIGURACIÓN
// ============================================
const FPS = 60;
const CANVAS_SIZE = 800;
const GROWTH_INTERVAL = 800; // ms entre generaciones
const MAX_GENERATIONS = 12; // Ahora hasta 12 generaciones
const MIN_TREES = 5;
const MAX_TREES = 15;

// HUD visibility
let showHUD = true;

// ============================================
// SUCESIÓN DE FIBONACCI COMPLETA
// ============================================
const FIBONACCI = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

// ============================================
// PALETA DE COLORES ORGÁNICA
// ============================================
const PALETTE = {
  // Gradiente de madurez: joven → viejo
  young: [46, 196, 182],    // Turquesa vibrante
  mature: [255, 188, 66],   // Ámbar dorado
  old: [115, 89, 73],       // Marrón tierra
  
  // Fondo oscuro tipo noche
  bg: [12, 15, 20],
  bgGlow: [25, 35, 45],
};

// ============================================
// CLASE BRANCH (RAMA)
// ============================================
class Branch {
  constructor(p, x, y, angle, length, generation) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = length;
    this.generation = generation;
    
    // Calcular punto final
    this.endX = x + Math.cos(angle) * length;
    this.endY = y + Math.sin(angle) * length;
    
    // Animación de crecimiento
    this.growthProgress = 0;
    this.targetProgress = 1;
    this.hasSpawned = false;
    
    // Marcador de si esta rama puede seguir creciendo
    this.canGrow = true;
    
    // Grosor basado en generación (más grueso en la base)
    this.thickness = Math.max(1, 10 - generation * 0.7);
    
    // Variación orgánica sutil
    this.wobble = p.random(-0.08, 0.08);
    this.lengthVariation = p.random(0.8, 1.2);
    
    // Aplicar variación
    this.length *= this.lengthVariation;
    this.endX = x + Math.cos(angle + this.wobble) * this.length;
    this.endY = y + Math.sin(angle + this.wobble) * this.length;
  }
  
  update() {
    // Animación suave de crecimiento
    if (this.growthProgress < this.targetProgress) {
      this.growthProgress += 0.1;
      this.growthProgress = Math.min(this.growthProgress, this.targetProgress);
    }
  }
  
  draw() {
    const p = this.p;
    
    if (this.growthProgress <= 0) return;
    
    // Posición actual durante el crecimiento
    const currentEndX = p.lerp(this.x, this.endX, this.growthProgress);
    const currentEndY = p.lerp(this.y, this.endY, this.growthProgress);
    
    // Color basado en generación
    const color = this.getColor();
    
    // Dibujar rama con curva bezier para más organicidad
    p.push();
    
    // Glow sutil
    p.stroke(color[0], color[1], color[2], 40);
    p.strokeWeight(this.thickness + 3);
    p.noFill();
    this.drawBranch(p, currentEndX, currentEndY);
    
    // Rama principal
    p.stroke(color[0], color[1], color[2], 255);
    p.strokeWeight(this.thickness);
    this.drawBranch(p, currentEndX, currentEndY);
    
    // Highlight central
    p.stroke(255, 255, 255, 25);
    p.strokeWeight(this.thickness * 0.25);
    this.drawBranch(p, currentEndX, currentEndY);
    
    p.pop();
  }
  
  drawBranch(p, endX, endY) {
    // Punto de control para curva bezier
    const midX = (this.x + endX) / 2;
    const midY = (this.y + endY) / 2;
    const perpAngle = this.angle + p.HALF_PI;
    const curvature = this.length * 0.08 * Math.sin(this.generation * 0.3);
    const ctrlX = midX + Math.cos(perpAngle) * curvature;
    const ctrlY = midY + Math.sin(perpAngle) * curvature;
    
    p.beginShape();
    p.vertex(this.x, this.y);
    p.quadraticVertex(ctrlX, ctrlY, endX, endY);
    p.endShape();
  }
  
  getColor() {
    const p = this.p;
    const t = this.generation / MAX_GENERATIONS;
    
    // Interpolación tricolor: joven → maduro → viejo
    let color;
    if (t < 0.5) {
      const localT = t * 2;
      color = [
        p.lerp(PALETTE.young[0], PALETTE.mature[0], localT),
        p.lerp(PALETTE.young[1], PALETTE.mature[1], localT),
        p.lerp(PALETTE.young[2], PALETTE.mature[2], localT),
      ];
    } else {
      const localT = (t - 0.5) * 2;
      color = [
        p.lerp(PALETTE.mature[0], PALETTE.old[0], localT),
        p.lerp(PALETTE.mature[1], PALETTE.old[1], localT),
        p.lerp(PALETTE.mature[2], PALETTE.old[2], localT),
      ];
    }
    
    return color;
  }
  
  isFullyGrown() {
    return this.growthProgress >= 0.95;
  }
  
  getEndPoint() {
    return {
      x: this.endX,
      y: this.endY
    };
  }
}

// ============================================
// CLASE ORGANISM (ORGANISMO/ÁRBOL INDIVIDUAL)
// ============================================
class Organism {
  constructor(p, rootX, rootY, id) {
    this.p = p;
    this.rootX = rootX;
    this.rootY = rootY;
    this.id = id;
    
    // Todas las ramas
    this.branches = [];
    
    // Ramas activas (pueden generar nuevas)
    this.activeBranches = [];
    
    // Generación actual
    this.currentGeneration = 0;
    
    // ¿Este árbol ha terminado de crecer?
    this.isFinished = false;
    
    // Parámetros de crecimiento (variación por árbol)
    this.baseLength = p.random(80, 120);
    this.lengthDecay = p.random(0.65, 0.75);
    this.spreadAngle = p.random(Math.PI / 4, Math.PI / 2.5);
    
    // Crear rama raíz (hacia arriba con ligera variación)
    const rootAngle = -Math.PI / 2 + p.random(-0.15, 0.15);
    const rootBranch = new Branch(
      p,
      rootX,
      rootY,
      rootAngle,
      this.baseLength,
      0
    );
    this.branches.push(rootBranch);
    this.activeBranches.push(rootBranch);
    this.currentGeneration = 1;
  }
  
  // Calcular probabilidad de que una rama PARE de crecer
  // Basado en el número de Fibonacci actual
  getStopProbability() {
    if (this.currentGeneration >= FIBONACCI.length) return 1;
    
    const fibValue = FIBONACCI[this.currentGeneration];
    
    // Probabilidad de parar aumenta con el valor de Fibonacci
    // fib=0 → 0% de parar, fib=89 → ~90% de parar
    const maxFib = 89; // Máximo valor de nuestra sucesión
    const stopProb = (fibValue / maxFib) * 0.95;
    
    return stopProb;
  }
  
  grow() {
    if (this.isFinished) return;
    if (this.currentGeneration >= MAX_GENERATIONS) {
      this.isFinished = true;
      return;
    }
    
    const p = this.p;
    const fibValue = FIBONACCI[Math.min(this.currentGeneration, FIBONACCI.length - 1)];
    const stopProbability = this.getStopProbability();
    
    const newActiveBranches = [];
    let anyBranchGrew = false;
    
    // Cada rama activa decide si genera nuevas ramas
    for (const parentBranch of this.activeBranches) {
      if (!parentBranch.isFullyGrown()) continue;
      if (parentBranch.hasSpawned) continue;
      if (!parentBranch.canGrow) continue;
      
      parentBranch.hasSpawned = true;
      
      // ¿Esta rama decide parar de crecer?
      if (p.random() < stopProbability) {
        parentBranch.canGrow = false;
        continue; // Esta rama no genera hijos
      }
      
      anyBranchGrew = true;
      
      const endPoint = parentBranch.getEndPoint();
      const parentAngle = parentBranch.angle;
      
      // Número de nuevas ramas basado en Fibonacci (limitado para no explotar)
      const numBranches = Math.min(Math.max(1, Math.floor(fibValue / 2) + 1), 4);
      
      // Calcular longitud de las nuevas ramas
      const newLength = this.baseLength * Math.pow(this.lengthDecay, this.currentGeneration);
      
      // Si la longitud es muy pequeña, parar
      if (newLength < 3) {
        parentBranch.canGrow = false;
        continue;
      }
      
      // Distribuir ángulos en abanico
      for (let i = 0; i < numBranches; i++) {
        let angleOffset;
        if (numBranches === 1) {
          angleOffset = p.random(-0.2, 0.2);
        } else {
          angleOffset = p.map(i, 0, numBranches - 1, -this.spreadAngle / 2, this.spreadAngle / 2);
          angleOffset += p.random(-0.1, 0.1);
        }
        
        const newAngle = parentAngle + angleOffset;
        
        const newBranch = new Branch(
          p,
          endPoint.x,
          endPoint.y,
          newAngle,
          newLength,
          this.currentGeneration
        );
        
        this.branches.push(newBranch);
        newActiveBranches.push(newBranch);
      }
    }
    
    // Si ninguna rama creció, este árbol terminó
    if (!anyBranchGrew && newActiveBranches.length === 0) {
      this.isFinished = true;
      console.log(`🌳 Árbol ${this.id} terminó en generación ${this.currentGeneration} (Fib: ${fibValue})`);
      return;
    }
    
    this.activeBranches = newActiveBranches;
    this.currentGeneration++;
  }
  
  update() {
    for (const branch of this.branches) {
      branch.update();
    }
    
    // Verificar si todas las ramas activas han crecido completamente
    const allGrown = this.activeBranches.every(b => b.isFullyGrown());
    return allGrown;
  }
  
  draw() {
    for (const branch of this.branches) {
      branch.draw();
    }
  }
  
  reset(rootX, rootY) {
    this.rootX = rootX;
    this.rootY = rootY;
    this.branches = [];
    this.activeBranches = [];
    this.currentGeneration = 0;
    this.isFinished = false;
    
    const rootAngle = -Math.PI / 2 + this.p.random(-0.15, 0.15);
    const rootBranch = new Branch(
      this.p,
      rootX,
      rootY,
      rootAngle,
      this.baseLength,
      0
    );
    this.branches.push(rootBranch);
    this.activeBranches.push(rootBranch);
    this.currentGeneration = 1;
  }
}

// ============================================
// PARTÍCULAS DE AMBIENTE (ESPORAS/POLEN)
// ============================================
class Particle {
  constructor(p) {
    this.p = p;
    this.reset();
  }
  
  reset() {
    const p = this.p;
    this.x = p.random(CANVAS_SIZE);
    this.y = p.random(CANVAS_SIZE);
    this.size = p.random(1, 2.5);
    this.alpha = p.random(20, 60);
    this.speed = p.random(0.15, 0.4);
    this.angle = p.random(p.TWO_PI);
    this.wobbleSpeed = p.random(0.008, 0.02);
    this.wobbleAmount = p.random(0.3, 1);
  }
  
  update() {
    const p = this.p;
    this.angle += this.wobbleSpeed;
    this.x += Math.cos(this.angle) * this.wobbleAmount;
    this.y -= this.speed;
    
    if (this.y < -10) {
      this.y = CANVAS_SIZE + 10;
      this.x = p.random(CANVAS_SIZE);
    }
  }
  
  draw() {
    const p = this.p;
    p.noStroke();
    p.fill(PALETTE.mature[0], PALETTE.mature[1], PALETTE.mature[2], this.alpha);
    p.ellipse(this.x, this.y, this.size);
  }
}

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  let organisms = [];
  let particles = [];
  let lastGrowthTime = 0;
  let growthPhase = true;
  let completionTime = 0;
  let totalBranches = 0;
  let maxGenReached = 0;
  let recordingInProgress = false;
  
  function createOrganisms() {
    organisms = [];
    const numTrees = Math.floor(p.random(MIN_TREES, MAX_TREES + 1));
    
    console.log(`🌲 Creando ${numTrees} árboles...`);
    console.log(`📐 Sucesión de Fibonacci: ${FIBONACCI.join(', ')}`);
    
    // Distribuir árboles a lo largo de la base
    const margin = CANVAS_SIZE * 0.1;
    const availableWidth = CANVAS_SIZE - margin * 2;
    
    for (let i = 0; i < numTrees; i++) {
      let x;
      if (numTrees === 1) {
        x = CANVAS_SIZE / 2;
      } else {
        x = margin + (availableWidth / (numTrees - 1)) * i;
        x += p.random(-20, 20); // Pequeña variación
      }
      
      const y = CANVAS_SIZE * 0.92 + p.random(-10, 10);
      organisms.push(new Organism(p, x, y, i + 1));
    }
  }

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FPS);
    
    // Crear organismos
    createOrganisms();
    
    // Crear partículas de ambiente
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle(p));
    }
    
    // Configurar grabador (duración máxima de seguridad: 60s)
    setupRecorder(p, 60, FPS);
    
    console.log('🌿 Fibonacci Forever: Bosque orgánico');
    console.log('🔄 Pulsa ESPACIO para reiniciar');
    console.log('🎬 Pulsa S para grabar el proceso completo de crecimiento');
  };

  p.draw = () => {
    // Fondo con gradiente radial
    drawBackground();
    
    // Partículas de ambiente
    for (const particle of particles) {
      particle.update();
      particle.draw();
    }
    
    // Actualizar todos los organismos
    let allReady = true;
    let allFinished = true;
    totalBranches = 0;
    maxGenReached = 0;
    
    for (const org of organisms) {
      const ready = org.update();
      if (!ready) allReady = false;
      if (!org.isFinished) allFinished = false;
      totalBranches += org.branches.length;
      maxGenReached = Math.max(maxGenReached, org.currentGeneration);
    }
    
    // Lógica de crecimiento por generaciones
    const currentTime = p.millis();
    if (growthPhase && allReady && currentTime - lastGrowthTime > GROWTH_INTERVAL) {
      for (const org of organisms) {
        org.grow();
      }
      lastGrowthTime = currentTime;
      
      // Verificar si todos terminaron
      if (organisms.every(o => o.isFinished)) {
        growthPhase = false;
        completionTime = currentTime;
        console.log('✨ Todos los árboles han completado su crecimiento!');
      }
    }
    
    // Si estamos grabando y todos terminaron, detener grabación después de 1.5s
    if (recordingInProgress && !growthPhase && window.isRecording && window.isRecording()) {
      if (currentTime - completionTime > 1500) {
        window.stopRecording();
        recordingInProgress = false;
        console.log('🎬 Grabación del proceso completo finalizada');
      }
    }
    
    // Dibujar todos los organismos
    for (const org of organisms) {
      org.draw();
    }
    
    // UI de información
    if (showHUD) {
      drawUI();
    }
  };
  
  function drawBackground() {
    // Gradiente radial oscuro
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE * 0.35;
    const maxRadius = CANVAS_SIZE * 0.9;
    
    // Fondo base
    p.background(PALETTE.bg[0], PALETTE.bg[1], PALETTE.bg[2]);
    
    // Gradiente radial
    for (let r = maxRadius; r > 0; r -= 10) {
      const t = r / maxRadius;
      const c = p.lerpColor(
        p.color(PALETTE.bgGlow[0], PALETTE.bgGlow[1], PALETTE.bgGlow[2]),
        p.color(PALETTE.bg[0], PALETTE.bg[1], PALETTE.bg[2]),
        t
      );
      p.noStroke();
      p.fill(c);
      p.ellipse(cx, cy, r * 2, r * 2);
    }
  }
  
  function drawUI() {
    p.push();
    
    // Panel semi-transparente
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(15, 15, 220, 95, 8);
    
    // Texto
    p.fill(255, 255, 255, 200);
    p.textSize(11);
    p.textFont('monospace');
    
    const activeCount = organisms.filter(o => !o.isFinished).length;
    const currentFib = maxGenReached > 0 && maxGenReached <= FIBONACCI.length 
      ? FIBONACCI[maxGenReached - 1] 
      : '–';
    
    p.text(`Árboles: ${organisms.length} (${activeCount} activos)`, 25, 35);
    p.text(`Generación máx: ${maxGenReached} / ${MAX_GENERATIONS}`, 25, 52);
    p.text(`Fibonacci actual: ${currentFib}`, 25, 69);
    p.text(`Total ramas: ${totalBranches}`, 25, 86);
    
    // Indicador de estado
    if (organisms.every(o => o.isFinished)) {
      p.fill(PALETTE.mature[0], PALETTE.mature[1], PALETTE.mature[2]);
      p.text('✨ Completo', 25, 103);
    }
    
    p.pop();
  }
  
  function restartForest() {
    createOrganisms();
    growthPhase = true;
    lastGrowthTime = p.millis();
    completionTime = 0;
    console.log('🔄 Reiniciando bosque...');
  }
  
  // Teclas de control
  p.keyPressed = () => {
    switch (p.key) {
      case ' ': // Espacio para reiniciar
      case 'r':
      case 'R':
        restartForest();
        break;
        
      case 'd':
      case 'D':
        showHUD = !showHUD;
        console.log(`🖥️ HUD: ${showHUD ? 'ON' : 'OFF'}`);
        break;
        
      case 's':
      case 'S':
        // Reiniciar y grabar el proceso completo
        if (window.isRecording && window.isRecording()) {
          console.log('⚠️ Ya hay una grabación en curso');
        } else if (window.startRecording) {
          restartForest();
          recordingInProgress = true;
          // Pequeño delay para que el canvas se limpie antes de grabar
          setTimeout(() => {
            window.startRecording();
            console.log('🎬 Grabando proceso completo de crecimiento...');
          }, 100);
        }
        break;
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
