import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 15
// Prompt: Shadow Words Alignment

const LOOP_DURATION = 4;
const FPS = 60;
const CANVAS_SIZE = 800;

// Escena simple:
// Cámara mira desde adelante
// Pared a la derecha (plano YZ en X=300)
// Luz a la izquierda abajo
// Fragmentos en medio

const WALL_X = 300;

const sketch = (p) => {
  let fragments = [];
  let wordTargets = []; // Para debug
  let currentWord = "CONTROL";
  let lightPos;
  let targetLightPos;
  let pg;
  let debugMode = false; // Tecla D para activar

  // Luz perfecta: izquierda, abajo
  const PERFECT_LIGHT = { x: -300, y: 150, z: 0 };

  class Fragment {
    constructor(wallY, wallZ) {
      // El target está en la pared (X=WALL_X, Y=wallY, Z=wallZ)
      this.targetY = wallY;
      this.targetZ = wallZ;
      
      this.size = p.random(8, 20);
      this.shape = p.floor(p.random(4));
      this.rot = p.random(p.TWO_PI);
      this.color = p.color(p.random(60, 100), p.random(50, 80), p.random(45, 70));
      
      // Calcular posición para que sombra caiga en target con luz perfecta
      this.calculatePosition();
    }

    calculatePosition() {
      // Línea desde PERFECT_LIGHT hacia (WALL_X, targetY, targetZ)
      const lx = PERFECT_LIGHT.x;
      const ly = PERFECT_LIGHT.y;
      const lz = PERFECT_LIGHT.z;
      
      const tx = WALL_X;
      const ty = this.targetY;
      const tz = this.targetZ;
      
      // Dirección
      const dx = tx - lx;
      const dy = ty - ly;
      const dz = tz - lz;
      
      // Colocar fragmento a 50% del camino
      const t = p.random(0.4, 0.6);
      this.x = lx + dx * t;
      this.y = ly + dy * t;
      this.z = lz + dz * t;
    }

    // Calcular dónde cae la sombra en la pared dada una luz
    getShadow(lx, ly, lz) {
      // Dirección desde luz hacia fragmento
      const dx = this.x - lx;
      const dy = this.y - ly;
      const dz = this.z - lz;
      
      // La pared está en X = WALL_X
      // Encontrar t donde lx + dx*t = WALL_X
      if (dx === 0) return null;
      const t = (WALL_X - lx) / dx;
      if (t < 0) return null;
      
      const shadowY = ly + dy * t;
      const shadowZ = lz + dz * t;
      
      return { y: shadowY, z: shadowZ };
    }

    draw(lx, ly, lz) {
      // Calcular distancia a la luz para brillo
      const dist = p.sqrt(p.sq(this.x - lx) + p.sq(this.y - ly) + p.sq(this.z - lz));
      const maxDist = 500;
      const brightness = p.map(p.constrain(dist, 50, maxDist), 50, maxDist, 2.5, 0.6);
      
      p.push();
      p.translate(this.x, this.y, this.z);
      p.rotateY(this.rot);
      p.rotateX(this.rot * 0.5);
      p.noStroke();
      
      // Color más brillante cuando está cerca de la luz
      const r = p.constrain(p.red(this.color) * brightness, 0, 255);
      const g = p.constrain(p.green(this.color) * brightness, 0, 255);
      const b = p.constrain(p.blue(this.color) * brightness, 0, 255);
      p.fill(r, g, b);
      
      // Añadir specular para brillo metálico
      p.specularMaterial(r * 0.5, g * 0.5, b * 0.5);
      p.shininess(50);
      
      if (this.shape === 0) p.box(this.size);
      else if (this.shape === 1) p.sphere(this.size * 0.5);
      else if (this.shape === 2) p.cylinder(this.size * 0.3, this.size);
      else p.cone(this.size * 0.4, this.size);
      
      p.pop();
    }

    drawShadow(lx, ly, lz) {
      const shadow = this.getShadow(lx, ly, lz);
      if (!shadow) return;
      
      // Distancia al target
      const dist = p.sqrt(p.sq(shadow.y - this.targetY) + p.sq(shadow.z - this.targetZ));
      const maxDist = 30;
      const alignment = p.constrain(1 - dist / maxDist, 0, 1);
      
      const alpha = p.map(alignment, 0, 1, 30, 255);
      const size = p.map(alignment, 0, 1, this.size * 2, this.size * 0.5);
      
      p.push();
      p.translate(WALL_X - 1, shadow.y, shadow.z);
      p.rotateY(p.HALF_PI);
      p.noStroke();
      p.fill(0, alpha);
      p.ellipse(0, 0, size, size);
      p.pop();
    }
  }

  function generateWordTargets(word) {
    const points = [];
    
    // Tamaño según longitud de palabra
    let fontSize;
    if (word === "FE") fontSize = 120;
    else if (word === "ORDEN" || word === "ERROR") fontSize = 50;
    else if (word === "CONTROL") fontSize = 42;
    else fontSize = 50;
    
    pg.background(0);
    pg.fill(255);
    pg.noStroke();
    pg.textAlign(p.CENTER, p.CENTER);
    pg.textSize(fontSize);
    pg.text(word, pg.width / 2, pg.height / 2);
    pg.loadPixels();

    const step = 4;
    
    for (let px = 0; px < pg.width; px += step) {
      for (let py = 0; py < pg.height; py += step) {
        const idx = (px + py * pg.width) * 4;
        if (pg.pixels[idx] > 200) {
          // Mapear a coordenadas de la pared (plano YZ en X=WALL_X)
          // Cámara mira desde -X hacia +X (hacia la derecha)
          // En la pared: Z es horizontal, Y es vertical
          // Para que el texto se lea de izquierda a derecha desde la cámara:
          // - px (izquierda del buffer) debe ir a Z negativo (izquierda en pantalla)
          // - py (arriba del buffer) debe ir a Y negativo (arriba en 3D)
          const wallZ = p.map(px, 0, pg.width, -180, 180);
          const wallY = p.map(py, 0, pg.height, -100, 100);
          points.push({ y: wallY, z: wallZ });
        }
      }
    }
    
    return points;
  }

  function regenerateFragments(word) {
    fragments = [];
    wordTargets = generateWordTargets(word);
    
    for (const t of wordTargets) {
      fragments.push(new Fragment(t.y, t.z));
    }
    
    console.log(`🔤 "${word}" → ${fragments.length} fragmentos`);
  }

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
    p.frameRate(FPS);
    
    pg = p.createGraphics(200, 120);
    pg.pixelDensity(1);
    
    lightPos = p.createVector(PERFECT_LIGHT.x, PERFECT_LIGHT.y, PERFECT_LIGHT.z);
    targetLightPos = lightPos.copy();
    
    regenerateFragments(currentWord);
    
    // duration = 0 para grabación manual indefinida (S para iniciar/detener)
    setupRecorder(p, 0, FPS);
  };

  p.draw = () => {
    p.background(25, 22, 20);
    
    // Suavizar luz
    lightPos.x = p.lerp(lightPos.x, targetLightPos.x, 0.12);
    lightPos.y = p.lerp(lightPos.y, targetLightPos.y, 0.12);
    lightPos.z = p.lerp(lightPos.z, targetLightPos.z, 0.12);
    
    // Cámara: vista frontal para ver la pared completa
    p.camera(
      -450, 0, 0,         // Posición cámara (a la izquierda)
      WALL_X, 0, 0,       // Mirando directamente a la pared
      0, 1, 0
    );
    
    p.ambientLight(50);
    p.pointLight(255, 240, 200, lightPos.x, lightPos.y, lightPos.z);
    
    // Pared
    p.push();
    p.translate(WALL_X, 0, 0);
    p.rotateY(-p.HALF_PI);
    p.noStroke();
    p.fill(245, 242, 235);
    p.plane(500, 400);
    p.pop();
    
    // Suelo
    p.push();
    p.translate(0, 200, 0);
    p.rotateX(p.HALF_PI);
    p.noStroke();
    p.fill(40, 35, 30);
    p.plane(700, 600);
    p.pop();
    
    // Sombras
    for (const f of fragments) {
      f.drawShadow(lightPos.x, lightPos.y, lightPos.z);
    }
    
    // Fragmentos
    for (const f of fragments) {
      f.draw(lightPos.x, lightPos.y, lightPos.z);
    }
    
    // Linterna y haz de luz
    drawFlashlight();
    
    // Debug: mostrar targets en la pared
    if (debugMode) {
      p.push();
      for (const t of wordTargets) {
        p.push();
        p.translate(WALL_X - 2, t.y, t.z);
        p.rotateY(p.HALF_PI);
        p.noStroke();
        p.fill(255, 0, 0, 100);
        p.ellipse(0, 0, 6, 6);
        p.pop();
      }
      p.pop();
    }
    
    // UI
    drawUI();
  };

  function drawFlashlight() {
    p.push();
    p.translate(lightPos.x, lightPos.y, lightPos.z);
    
    // Rotar la linterna para que apunte hacia la pared (+X)
    // rotateZ(-90°) para tumbar horizontal, luego el cilindro apunta a +X
    p.rotateZ(-p.HALF_PI);
    
    // Mango de la linterna (hacia atrás, -X desde la luz)
    p.push();
    p.translate(0, -60, 0); // Mango hacia atrás
    p.noStroke();
    p.fill(35, 32, 30);
    p.cylinder(20, 80);
    // Detalle del mango - grip
    p.fill(25, 22, 20);
    for (let i = 0; i < 5; i++) {
      p.push();
      p.translate(0, -30 + i * 15, 0);
      p.cylinder(22, 5);
      p.pop();
    }
    p.pop();
    
    // Cabeza de la linterna (hacia adelante, hacia la pared)
    p.push();
    p.translate(0, 10, 0);
    p.noStroke();
    p.fill(50, 47, 45);
    p.cylinder(35, 40);
    p.pop();
    
    // Aro metálico (en el frente)
    p.push();
    p.translate(0, 30, 0);
    p.noStroke();
    p.fill(80, 75, 70);
    p.torus(30, 5);
    p.pop();
    
    // Lente brillante (apuntando hacia la pared)
    p.push();
    p.translate(0, 35, 0);
    p.rotateX(p.HALF_PI);
    p.noStroke();
    // Reflejo exterior
    p.fill(255, 250, 220, 100);
    p.circle(0, 0, 60);
    // Centro brillante
    p.fill(255, 255, 240);
    p.circle(0, 0, 40);
    p.pop();
    
    // Bombilla interior (glow)
    p.push();
    p.translate(0, 25, 0);
    p.noStroke();
    p.fill(255, 240, 150, 200);
    p.sphere(15);
    p.pop();
    
    p.pop();
    
    // Haz de luz
    drawLightBeam();
  }

  function drawLightBeam() {
    const beamLength = WALL_X - lightPos.x - 30;
    
    p.push();
    // Posicionar el haz desde la lente de la linterna hacia la pared
    p.translate(lightPos.x + 40, lightPos.y, lightPos.z);
    p.rotateZ(-p.HALF_PI); // Apuntar hacia +X
    
    // Múltiples capas para efecto volumétrico
    p.noStroke();
    
    // Haz exterior difuso
    p.fill(255, 245, 180, 12);
    p.cone(200, beamLength);
    
    // Haz medio
    p.fill(255, 240, 170, 18);
    p.cone(140, beamLength);
    
    // Haz interior más concentrado
    p.fill(255, 250, 200, 25);
    p.cone(80, beamLength);
    
    // Centro del haz muy brillante
    p.fill(255, 255, 230, 35);
    p.cone(30, beamLength);
    
    p.pop();
  }

  function drawUI() {
    p.push();
    p.resetMatrix();
    p.ortho(-CANVAS_SIZE/2, CANVAS_SIZE/2, -CANVAS_SIZE/2, CANVAS_SIZE/2, -1000, 1000);
    p.translate(-CANVAS_SIZE/2, -CANVAS_SIZE/2, 500);
    
    p.fill(180);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text('[1-4] Palabras  [H] Alinear  [D] Debug', 15, 15);
    
    p.fill(debugMode ? p.color(255, 100, 100) : 120);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`"${currentWord}" ${debugMode ? '(DEBUG)' : ''}`, CANVAS_SIZE - 15, 15);
    
    // Mostrar posición de luz
    p.fill(150);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text(`Luz: (${p.floor(lightPos.x)}, ${p.floor(lightPos.y)}, ${p.floor(lightPos.z)})`, 15, CANVAS_SIZE - 15);
    p.pop();
  }

  p.mouseMoved = () => {
    // X fijo, mover Y y Z
    targetLightPos.y = p.map(p.mouseY, 0, CANVAS_SIZE, -150, 300);
    targetLightPos.z = p.map(p.mouseX, 0, CANVAS_SIZE, -200, 200);
  };

  p.mouseDragged = () => {
    targetLightPos.y = p.map(p.mouseY, 0, CANVAS_SIZE, -150, 300);
    targetLightPos.z = p.map(p.mouseX, 0, CANVAS_SIZE, -200, 200);
  };

  p.keyPressed = () => {
    if (p.key === '1') { currentWord = "ORDEN"; regenerateFragments(currentWord); }
    if (p.key === '2') { currentWord = "CONTROL"; regenerateFragments(currentWord); }
    if (p.key === '3') { currentWord = "FE"; regenerateFragments(currentWord); }
    if (p.key === '4') { currentWord = "ERROR"; regenerateFragments(currentWord); }
    
    if (p.key === 'h' || p.key === 'H') {
      targetLightPos.x = PERFECT_LIGHT.x;
      targetLightPos.y = PERFECT_LIGHT.y;
      targetLightPos.z = PERFECT_LIGHT.z;
      console.log('💡 Alineando a posición perfecta:', PERFECT_LIGHT);
    }
    
    if (p.key === 'd' || p.key === 'D') {
      debugMode = !debugMode;
      console.log('Debug:', debugMode);
    }
    
    if (p.key === 's' || p.key === 'S') {
      if (window.isRecording?.()) {
        if (window.stopRecording) {
          window.stopRecording();
          console.log('⏹️ Grabación detenida');
        }
      } else if (window.startRecording) {
        window.startRecording();
        console.log('🔴 Grabación iniciada (pulsa S para detener)');
      }
    }
  };
};

new p5(sketch, document.getElementById('canvas-container'));
