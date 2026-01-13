import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 12
// Prompt: Boxes only — Cubo autoconsciente (Meta-Sketch 3D)

// ============================================
// CONFIGURACIÓN
// ============================================
const LOOP_DURATION = 8; // Duración del loop en segundos
const FPS = 60;
const CANVAS_SIZE = 800;
const CUBE_COUNT = 75; // Cantidad media de cubos
const SPACE_SIZE = 600; // Tamaño del espacio 3D

// Pesos para evaluación de identidad
const IDENTITY_WEIGHTS = {
  ISOTROPY: 0.4,
  ORTHOGONALITY: 0.3,
  DEFORMATION: 0.2,
  STABILITY: 0.1
};

// Presets ideológicos
const PRESETS = {
  PERMISSIVE: {
    tolerance: 0.6,
    correctionSpeed: 0.1,
    glitchFrequency: 0.02,
    glitchIntensity: 0.5,
    collectiveDiscipline: 0.3
  },
  AUTHORITARIAN: {
    tolerance: 0.95,
    correctionSpeed: 1.0,
    glitchFrequency: 0.0,
    glitchIntensity: 0.0,
    collectiveDiscipline: 1.0
  },
  CRISIS: {
    tolerance: 0.5,
    correctionSpeed: 0.5,
    glitchFrequency: 0.1,
    glitchIntensity: 0.8,
    collectiveDiscipline: 0.8
  }
};

// ============================================
// CLASE CUBE
// ============================================
class Cube {
  constructor(p, position) {
    this.p = p;
    
    // Estado geométrico
    this.position = position || p.createVector(
      p.random(-SPACE_SIZE / 2, SPACE_SIZE / 2),
      p.random(-SPACE_SIZE / 2, SPACE_SIZE / 2),
      p.random(-SPACE_SIZE / 2, SPACE_SIZE / 2)
    );
    // Escala inicial basada en volumen inicial (1.0)
    const initialVolumeScale = Math.cbrt(1.0);
    this.scale = p.createVector(initialVolumeScale, initialVolumeScale, initialVolumeScale);
    this.rotation = p.createVector(0, 0, 0);
    this.noiseOffset = p.createVector(
      p.random(1000),
      p.random(1000),
      p.random(1000)
    );
    // Velocidad inicial aleatoria para facilitar colisiones
    this.velocity = p.createVector(
      p.random(-0.5, 0.5),
      p.random(-0.5, 0.5),
      p.random(-0.5, 0.5)
    );
    
    // Estado ideológico
    this.idealScale = p.createVector(1, 1, 1);
    this.tolerance = PRESETS.PERMISSIVE.tolerance;
    this.stress = 0;
    this.compliance = 1.0;
    this.correctionForce = 0;
    this.identityScore = 1.0;
    this.previousIdentityScore = 1.0;
    
    // Estado de corrección
    this.isCorrecting = false;
    this.correctionTimer = 0;
    this.tremorOffset = p.createVector(0, 0, 0);
    this.flashIntensity = 0;
    
    // Estado de glitch
    this.glitchActive = false;
    this.glitchTimer = 0;
    this.glitchType = null;
    
    // Estado de fusión
    this.baseSize = 50; // Tamaño base del cubo
    this.fusionCount = 0; // Número de fusiones (para aumentar tonalidad)
    this.volume = 1.0; // Volumen actual (1.0 = volumen base)
    this.toRemove = false; // Marca para eliminar después de fusión
  }
  
  // Evaluar identidad cúbica (box-ness)
  evaluateIdentity() {
    // 1. Isotropía (uniformidad de escala)
    const sx = this.scale.x;
    const sy = this.scale.y;
    const sz = this.scale.z;
    const isoDev = (Math.abs(sx - sy) + Math.abs(sy - sz) + Math.abs(sx - sz)) / 3;
    const isoScore = Math.max(0, 1 - isoDev);
    
    // 2. Ortogonalidad (rotaciones múltiplos de 90°)
    const normalizeAngle = (angle) => {
      angle = angle % (Math.PI * 2);
      if (angle < 0) angle += Math.PI * 2;
      return angle;
    };
    
    const rx = normalizeAngle(this.rotation.x);
    const ry = normalizeAngle(this.rotation.y);
    const rz = normalizeAngle(this.rotation.z);
    
    const distTo90 = (angle) => {
      const mod90 = angle % (Math.PI / 2);
      return Math.min(mod90, Math.PI / 2 - mod90);
    };
    
    const rotDev = (distTo90(rx) + distTo90(ry) + distTo90(rz)) / (Math.PI / 2 * 3);
    const orthoScore = Math.max(0, 1 - rotDev);
    
    // 3. Deformación (ruido en vértices)
    const noiseTime = this.p.frameCount * 0.01;
    const deformX = this.p.noise(this.noiseOffset.x + noiseTime) - 0.5;
    const deformY = this.p.noise(this.noiseOffset.y + noiseTime) - 0.5;
    const deformZ = this.p.noise(this.noiseOffset.z + noiseTime) - 0.5;
    const deformDev = (Math.abs(deformX) + Math.abs(deformY) + Math.abs(deformZ)) / 3;
    const deformScore = Math.max(0, 1 - deformDev * 2);
    
    // 4. Estabilidad temporal
    const stabilityDev = Math.abs(this.identityScore - this.previousIdentityScore);
    const stabilityScore = Math.max(0, 1 - stabilityDev * 10);
    
    // Score final ponderado
    const score = 
      isoScore * IDENTITY_WEIGHTS.ISOTROPY +
      orthoScore * IDENTITY_WEIGHTS.ORTHOGONALITY +
      deformScore * IDENTITY_WEIGHTS.DEFORMATION +
      stabilityScore * IDENTITY_WEIGHTS.STABILITY;
    
    return Math.max(0, Math.min(1, score));
  }
  
  // Aplicar corrección violenta
  applyCorrection(correctionSpeed = 0.5) {
    this.isCorrecting = true;
    this.correctionTimer = 10; // Frames de corrección
    this.stress = Math.min(1, this.stress + 0.2);
    
    // Snap agresivo de escala - pero mantener el tamaño basado en volumen
    // Solo corregir si las escalas no son uniformes, no reducir el tamaño total
    const volumeBasedScale = Math.cbrt(this.volume);
    this.scale.x = this.p.lerp(this.scale.x, volumeBasedScale, correctionSpeed);
    this.scale.y = this.p.lerp(this.scale.y, volumeBasedScale, correctionSpeed);
    this.scale.z = this.p.lerp(this.scale.z, volumeBasedScale, correctionSpeed);
    
    // Rotación forzada a múltiplos de 90°
    const snapTo90 = (angle) => {
      const normalized = angle % (Math.PI * 2);
      const mod90 = normalized % (Math.PI / 2);
      const snapped = normalized - mod90;
      if (mod90 > Math.PI / 4) {
        return snapped + Math.PI / 2;
      }
      return snapped;
    };
    
    this.rotation.x = this.p.lerp(this.rotation.x, snapTo90(this.rotation.x), correctionSpeed);
    this.rotation.y = this.p.lerp(this.rotation.y, snapTo90(this.rotation.y), correctionSpeed);
    this.rotation.z = this.p.lerp(this.rotation.z, snapTo90(this.rotation.z), correctionSpeed);
    
    // Colapso volumétrico (overshoot breve) - solo visual, no afecta volumen
    if (this.correctionTimer > 7) {
      // No reducir escala basada en volumen, solo crear efecto visual
      // El volumen se mantiene intacto
    }
    
    // Temblor
    this.tremorOffset.x = this.p.random(-2, 2);
    this.tremorOffset.y = this.p.random(-2, 2);
    this.tremorOffset.z = this.p.random(-2, 2);
    
    // Flash
    this.flashIntensity = 1.0;
  }
  
  // Aplicar glitch
  applyGlitch(type, intensity = 0.5) {
    this.glitchActive = true;
    this.glitchTimer = 30 + this.p.random(30); // 0.5-1 segundo
    this.glitchType = type;
    
    switch (type) {
      case 'scale':
        // Escalas no uniformes
        this.scale.x = 1 + (this.p.random() - 0.5) * intensity;
        this.scale.y = 1 + (this.p.random() - 0.5) * intensity;
        this.scale.z = 1 + (this.p.random() - 0.5) * intensity;
        break;
        
      case 'rotation':
        // Rotaciones oblicuas
        this.rotation.x += (this.p.random() - 0.5) * intensity * Math.PI / 4;
        this.rotation.y += (this.p.random() - 0.5) * intensity * Math.PI / 4;
        this.rotation.z += (this.p.random() - 0.5) * intensity * Math.PI / 4;
        break;
        
      case 'vibration':
        // Vibración en posición
        this.tremorOffset.x = (this.p.random() - 0.5) * intensity * 20;
        this.tremorOffset.y = (this.p.random() - 0.5) * intensity * 20;
        this.tremorOffset.z = (this.p.random() - 0.5) * intensity * 20;
        break;
        
      case 'deformation':
        // Deformación extrema
        this.noiseOffset.x += this.p.random(-100, 100);
        this.noiseOffset.y += this.p.random(-100, 100);
        this.noiseOffset.z += this.p.random(-100, 100);
        break;
    }
  }
  
  // Actualizar estado
  update(globalTolerance, correctionSpeed, glitchFrequency, glitchIntensity) {
    // Actualizar posición con velocidad
    this.position.add(this.velocity);
    
    // Rebote suave en los bordes del espacio
    const halfSpace = SPACE_SIZE / 2;
    if (Math.abs(this.position.x) > halfSpace) {
      this.velocity.x *= -0.8;
      this.position.x = this.p.constrain(this.position.x, -halfSpace, halfSpace);
    }
    if (Math.abs(this.position.y) > halfSpace) {
      this.velocity.y *= -0.8;
      this.position.y = this.p.constrain(this.position.y, -halfSpace, halfSpace);
    }
    if (Math.abs(this.position.z) > halfSpace) {
      this.velocity.z *= -0.8;
      this.position.z = this.p.constrain(this.position.z, -halfSpace, halfSpace);
    }
    
    // Fricción suave
    this.velocity.mult(0.98);
    
    // Actualizar tolerancia global
    this.tolerance = globalTolerance;
    
    // Evaluar identidad
    this.previousIdentityScore = this.identityScore;
    this.identityScore = this.evaluateIdentity();
    
    // Aplicar corrección si es necesario
    if (this.identityScore < this.tolerance && !this.glitchActive) {
      this.applyCorrection(correctionSpeed);
    }
    
    // Actualizar timers
    if (this.isCorrecting) {
      this.correctionTimer--;
      if (this.correctionTimer <= 0) {
        this.isCorrecting = false;
      }
    }
    
    if (this.glitchActive) {
      this.glitchTimer--;
      if (this.glitchTimer <= 0) {
        this.glitchActive = false;
        this.glitchType = null;
      }
    }
    
    // Decaimiento de efectos
    this.stress = Math.max(0, this.stress - 0.01);
    this.flashIntensity = Math.max(0, this.flashIntensity - 0.05);
    this.tremorOffset.mult(0.9);
    
    // Glitch automático
    if (!this.glitchActive && glitchFrequency > 0 && this.p.random() < glitchFrequency) {
      const types = ['scale', 'rotation', 'vibration', 'deformation'];
      this.applyGlitch(types[Math.floor(this.p.random(types.length))], glitchIntensity);
    }
  }
  
  // Renderizar cubo
  render() {
    this.p.push();
    
    // Posición con temblor
    const renderPos = this.p.createVector(
      this.position.x + this.tremorOffset.x,
      this.position.y + this.tremorOffset.y,
      this.position.z + this.tremorOffset.z
    );
    this.p.translate(renderPos.x, renderPos.y, renderPos.z);
    
    // Rotación
    this.p.rotateX(this.rotation.x);
    this.p.rotateY(this.rotation.y);
    this.p.rotateZ(this.rotation.z);
    
    // Color según stress, identidad y fusiones (mayor tonalidad con más fusiones)
    const baseColor = 200;
    const stressColor = this.stress * 100;
    const flashColor = this.flashIntensity * 150;
    // Aumentar tonalidad según número de fusiones (más brillante/intenso)
    const fusionBoost = Math.min(55, this.fusionCount * 15);
    const r = Math.min(255, baseColor - stressColor + flashColor + fusionBoost);
    const g = Math.min(255, baseColor - stressColor * 0.5 + fusionBoost * 0.8);
    const b = Math.min(255, baseColor - stressColor * 0.5 + fusionBoost * 0.6);
    
    this.p.fill(r, g, b);
    this.p.stroke(0);
    this.p.strokeWeight(1);
    
    // Calcular tamaño visual basado SOLO en volumen
    // El volumen determina el tamaño real del cubo
    const volumeScale = Math.cbrt(this.volume);
    const currentSize = this.baseSize * volumeScale;
    
    // No aplicar scale aquí - el tamaño ya está determinado por el volumen
    // Scale se usa solo para evaluación de identidad, no para renderizado visual
    
    // Renderizar cubo con tamaño basado en volumen
    this.p.box(currentSize);
    
    this.p.pop();
  }
  
  // Obtener tamaño de bounding box para colisiones
  getBoundingSize() {
    // El tamaño de colisión se basa solo en el volumen
    const currentSize = this.baseSize * Math.cbrt(this.volume);
    return currentSize;
  }
  
  // Detectar colisión con otro cubo
  collidesWith(other) {
    const size1 = this.getBoundingSize();
    const size2 = other.getBoundingSize();
    const radius1 = size1 / 2;
    const radius2 = size2 / 2;
    
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    const dz = this.position.z - other.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    return dist < (radius1 + radius2);
  }
  
  // Fusionar con otro cubo
  fuseWith(other) {
    // Guardar volumen original antes de actualizar
    const thisVolume = this.volume;
    const otherVolume = other.volume;
    const totalVolume = thisVolume + otherVolume;
    
    // Calcular posición promedio (centro de masa)
    this.position.x = (this.position.x * thisVolume + other.position.x * otherVolume) / totalVolume;
    this.position.y = (this.position.y * thisVolume + other.position.y * otherVolume) / totalVolume;
    this.position.z = (this.position.z * thisVolume + other.position.z * otherVolume) / totalVolume;
    
    // Agregar volumen
    this.volume += other.volume;
    
    // Ajustar escala para reflejar el nuevo volumen (mantener forma cúbica)
    // La escala debe ser la raíz cúbica del volumen relativo
    const newVolumeScale = Math.cbrt(this.volume);
    this.scale.set(newVolumeScale, newVolumeScale, newVolumeScale);
    
    // Promediar rotaciones
    this.rotation.x = (this.rotation.x + other.rotation.x) / 2;
    this.rotation.y = (this.rotation.y + other.rotation.y) / 2;
    this.rotation.z = (this.rotation.z + other.rotation.z) / 2;
    
    // Combinar velocidades (promedio ponderado por volumen)
    this.velocity.x = (this.velocity.x * thisVolume + other.velocity.x * otherVolume) / totalVolume;
    this.velocity.y = (this.velocity.y * thisVolume + other.velocity.y * otherVolume) / totalVolume;
    this.velocity.z = (this.velocity.z * thisVolume + other.velocity.z * otherVolume) / totalVolume;
    
    // Incrementar contador de fusiones (para aumentar tonalidad)
    this.fusionCount += other.fusionCount + 1;
    
    // Promediar stress
    this.stress = (this.stress + other.stress) / 2;
    
    // Promediar identidad
    this.identityScore = (this.identityScore + other.identityScore) / 2;
    
    // Marcar el otro cubo para eliminar
    other.toRemove = true;
  }
}

// ============================================
// SKETCH PRINCIPAL
// ============================================
const sketch = (p) => {
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  
  // Sistema global
  let cubes = [];
  let cameraMode = 'orbital'; // 'orbital' | 'fixed'
  let cameraAngle = 0;
  let currentPreset = PRESETS.PERMISSIVE;
  
  // Variables globales del sistema
  let globalTolerance = PRESETS.PERMISSIVE.tolerance;
  let correctionSpeed = PRESETS.PERMISSIVE.correctionSpeed;
  let glitchFrequency = PRESETS.PERMISSIVE.glitchFrequency;
  let glitchIntensity = PRESETS.PERMISSIVE.glitchIntensity;
  let collectiveDiscipline = PRESETS.PERMISSIVE.collectiveDiscipline;
  
  // Comportamiento colectivo
  let avgIdentity = 1.0;
  let mostStableCube = null;

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
    p.frameRate(FPS);
    
    // Inicializar cubos
    cubes = [];
    for (let i = 0; i < CUBE_COUNT; i++) {
      cubes.push(new Cube(p));
    }
    
    // Configurar iluminación
    p.ambientLight(30, 30, 30); // Mínima luz ambiente
    p.directionalLight(255, 255, 255, 0.5, -1, -0.5); // Luz direccional dura
    
    // Configurar recorder con duración 0 (grabación indefinida hasta que quede 1 cubo)
    setupRecorder(p, 0, FPS);
    
    console.log('📦 Sistema de cubos autoconscientes inicializado');
    console.log('⌨️ Controles:');
    console.log('   G: Glitch global');
    console.log('   H: Hiper-normalización');
    console.log('   R: Reset total');
    console.log('   1-3: Presets (Permisivo, Autoritario, Crisis)');
    console.log('   C: Alternar cámara');
    console.log('   S: Grabar');
  };

  p.draw = () => {
    const t = loop.frameProgress(p);
    
    // Fondo monocromo
    p.background(10, 10, 12);
    
    // Actualizar cámara orbital
    if (cameraMode === 'orbital') {
      cameraAngle = t * p.TWO_PI;
      const radius = SPACE_SIZE * 1.5;
      const camX = Math.cos(cameraAngle) * radius;
      const camY = SPACE_SIZE * 0.3;
      const camZ = Math.sin(cameraAngle) * radius;
      p.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
    } else {
      p.camera(0, 0, SPACE_SIZE * 1.5, 0, 0, 0, 0, 1, 0);
    }
    
    // Calcular identidad promedio y cubo más estable
    let totalIdentity = 0;
    let maxIdentity = 0;
    mostStableCube = null;
    
    for (const cube of cubes) {
      totalIdentity += cube.identityScore;
      if (cube.identityScore > maxIdentity) {
        maxIdentity = cube.identityScore;
        mostStableCube = cube;
      }
    }
    
    avgIdentity = totalIdentity / cubes.length;
    
    // Sistema reactivo: más caos → más control
    if (avgIdentity < 0.7) {
      globalTolerance = Math.max(0.5, globalTolerance * 0.999);
      correctionSpeed = Math.min(1.0, correctionSpeed * 1.001);
    }
    
    // Comportamiento colectivo: convergencia hacia el más estable
    if (mostStableCube && collectiveDiscipline > 0) {
      for (const cube of cubes) {
        if (cube !== mostStableCube && cube.identityScore < avgIdentity) {
          // Influencia sutil hacia la posición del más estable
          const influence = (1 - cube.identityScore) * collectiveDiscipline * 0.01;
          cube.position.lerp(mostStableCube.position, influence);
        }
      }
    }
    
    // Actualizar cubos
    for (const cube of cubes) {
      cube.update(globalTolerance, correctionSpeed, glitchFrequency, glitchIntensity);
    }
    
    // Detectar y procesar colisiones
    const cubesToRemove = [];
    for (let i = 0; i < cubes.length; i++) {
      if (cubes[i].toRemove) {
        cubesToRemove.push(i);
        continue;
      }
      
      for (let j = i + 1; j < cubes.length; j++) {
        if (cubes[j].toRemove) continue;
        
        if (cubes[i].collidesWith(cubes[j])) {
          // Fusionar cubos
          cubes[i].fuseWith(cubes[j]);
          cubesToRemove.push(j);
          break; // Solo una fusión por cubo por frame
        }
      }
    }
    
    // Eliminar cubos fusionados (en orden inverso para mantener índices)
    cubesToRemove.sort((a, b) => b - a);
    for (const index of cubesToRemove) {
      cubes.splice(index, 1);
    }
    
    // Renderizar cubos
    for (const cube of cubes) {
      cube.render();
    }
    
    // Detener grabación automáticamente cuando solo quede 1 cubo
    if (window.isRecording?.() && cubes.length === 1) {
      console.log('🎬 Grabación completada: Solo queda 1 cubo');
      window.stopRecording();
    }
    
    // Contagio de glitches entre cubos cercanos
    if (glitchFrequency > 0) {
      for (let i = 0; i < cubes.length; i++) {
        if (cubes[i].glitchActive && p.random() < 0.1) {
          for (let j = 0; j < cubes.length; j++) {
            if (i !== j && !cubes[j].glitchActive) {
              const dx = cubes[i].position.x - cubes[j].position.x;
              const dy = cubes[i].position.y - cubes[j].position.y;
              const dz = cubes[i].position.z - cubes[j].position.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist < 100 && p.random() < 0.3) {
                cubes[j].applyGlitch(cubes[i].glitchType, glitchIntensity * 0.5);
              }
            }
          }
        }
      }
    }
  };
  
  // Aplicar preset
  function applyPreset(preset) {
    currentPreset = preset;
    globalTolerance = preset.tolerance;
    correctionSpeed = preset.correctionSpeed;
    glitchFrequency = preset.glitchFrequency;
    glitchIntensity = preset.glitchIntensity;
    collectiveDiscipline = preset.collectiveDiscipline;
    
    // Aplicar a todos los cubos
    for (const cube of cubes) {
      cube.tolerance = globalTolerance;
    }
    
    console.log('🎛️ Preset aplicado:', Object.keys(PRESETS).find(k => PRESETS[k] === preset));
  }
  
  // Glitch global
  function applyGlobalGlitch() {
    const types = ['scale', 'rotation', 'vibration', 'deformation'];
    const type = types[Math.floor(p.random(types.length))];
    const count = Math.floor(cubes.length * 0.3); // 30% de los cubos
    
    for (let i = 0; i < count; i++) {
      const cube = cubes[Math.floor(p.random(cubes.length))];
      cube.applyGlitch(type, glitchIntensity);
    }
    
    console.log('💥 Glitch global aplicado:', type);
  }
  
  // Hiper-normalización
  function hyperNormalize() {
    for (const cube of cubes) {
      // Resetear volumen y fusiones
      cube.volume = 1.0;
      cube.fusionCount = 0;
      // Escala basada en volumen
      const volumeScale = Math.cbrt(cube.volume);
      cube.scale.set(volumeScale, volumeScale, volumeScale);
      cube.rotation.set(0, 0, 0);
      cube.stress = 0;
      cube.glitchActive = false;
      cube.glitchTimer = 0;
      cube.tremorOffset.set(0, 0, 0);
      cube.flashIntensity = 0;
      cube.identityScore = 1.0;
      cube.previousIdentityScore = 1.0;
    }
    console.log('✨ Hiper-normalización aplicada');
  }
  
  // Reset total
  function resetAll() {
    cubes = [];
    for (let i = 0; i < CUBE_COUNT; i++) {
      cubes.push(new Cube(p));
    }
    applyPreset(currentPreset);
    console.log('🔄 Reset total');
  }

  p.keyPressed = () => {
    if (p.key === 'g' || p.key === 'G') {
      applyGlobalGlitch();
    } else if (p.key === 'h' || p.key === 'H') {
      hyperNormalize();
    } else if (p.key === 'r' || p.key === 'R') {
      resetAll();
    } else if (p.key === '1') {
      applyPreset(PRESETS.PERMISSIVE);
    } else if (p.key === '2') {
      applyPreset(PRESETS.AUTHORITARIAN);
    } else if (p.key === '3') {
      applyPreset(PRESETS.CRISIS);
    } else if (p.key === 'c' || p.key === 'C') {
      cameraMode = cameraMode === 'orbital' ? 'fixed' : 'orbital';
      console.log('📷 Modo cámara:', cameraMode);
    } else if (p.key === 's' || p.key === 'S') {
      if (window.isRecording?.()) {
        // Si ya está grabando, detener manualmente
        console.log('⏹️ Deteniendo grabación manualmente...');
        window.stopRecording();
        return;
      }
      if (window.startRecording) {
        console.log('🔴 Iniciando grabación hasta que quede 1 cubo...');
        console.log(`📊 Cubos actuales: ${cubes.length}`);
        window.startRecording();
      } else {
        console.warn('⚠️ Recorder no disponible');
      }
    }
  };
};

// Inicializar p5 en modo instancia
new p5(sketch, document.getElementById('canvas-container'));
