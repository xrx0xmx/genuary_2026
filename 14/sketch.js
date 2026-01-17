/**
 * Sketch 14 — La cuadrícula devora la forma (lectura arquitectónica)
 * Prompt: Everything fits perfectly.
 * 
 * Concepto: Las formas son anteproyectos arquitectónicos que el sistema
 * normativo va regularizando hasta convertirlas en cubos estándar.
 * No hay distopía, hay planeamiento exitoso.
 */

import p5 from 'p5';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// === CONSTANTES ===
const CANVAS_SIZE = 800;
const LOOP_DURATION = 20; // Loop más dinámico
const FPS = 60;
const GRID_SIZE = 5; // 5x5 parcelas
const CELL_SIZE = 90;

// Paleta arquitectónica - colores de maqueta y ciudad real
const PALETTE = {
  hormigon: '#B8B8B0',      // Hormigón claro
  piedraCaliza: '#C9C0B1',   // Piedra caliza
  grisCálido: '#A8A098',     // Gris cálido
  beigeUrbano: '#D4CFC4',    // Beige urbano
  blancoSucio: '#E8E4DC',    // Blanco sucio
  sombra: '#6B6660',         // Sombra suave
  fondo: '#E0DCD4',          // Fondo neutro
  grid: '#9A958C'            // Líneas de trama urbana
};

const COLORES_VOLUMEN = [
  PALETTE.hormigon,
  PALETTE.piedraCaliza,
  PALETTE.grisCálido,
  PALETTE.beigeUrbano,
  PALETTE.blancoSucio
];

// === CLASE VOLUMEN EDIFICABLE ===
class VolumenEdificable {
  constructor(p, gridX, gridY, index) {
    this.p = p;
    this.gridX = gridX;
    this.gridY = gridY;
    this.index = index;
    
    // Posición en el espacio 3D
    this.x = (gridX - (GRID_SIZE - 1) / 2) * CELL_SIZE;
    this.z = (gridY - (GRID_SIZE - 1) / 2) * CELL_SIZE;
    
    // Características iniciales del anteproyecto
    this.normalizacion = 0; // 0 = orgánico, 1 = cubo normativo
    this.velocidadNormalizacion = p.random(0.0002, 0.0005);
    
    // === GESTOS ARQUITECTÓNICOS ESTRAMBÓTICOS ===
    // Variaciones extremas del anteproyecto inicial
    this.retranqueo = p.random(-0.5, 0.5);
    this.redondez = p.random(0.3, 0.9); // Muy redondeado a casi esférico
    this.rotacionGesto = p.random(-p.PI / 4, p.PI / 4); // Rotación agresiva
    this.alturaProporcion = p.random(0.4, 2.5); // Desde achatado hasta torre
    
    // === VARIACIONES ORGÁNICAS EXTREMAS ===
    this.bulge = p.random(0.5, 1.8); // Abultamiento dramático
    this.taper = p.random(0.3, 1.0); // Estrechamiento extremo (pirámide) a recto
    
    // Escala base simple - variación inicial, todos convergen a 0.65
    this.escalaBase = p.random(0.45, 0.75);
    this.twist = p.random(-0.4, 0.4); // Torsión agresiva
    
    // Nuevas deformaciones estrambóticas
    this.skewX = p.random(-0.4, 0.4); // Inclinación lateral
    this.skewZ = p.random(-0.4, 0.4); // Inclinación frontal
    this.squeeze = p.random(0.6, 1.5); // Compresión/expansión en un eje
    this.waviness = p.random(0, 0.3); // Ondulación en la superficie
    this.asymmetry = p.random(-0.3, 0.3); // Asimetría lateral
    
    // === MOVIMIENTO AGRESIVO ===
    this.fase = p.random(p.TWO_PI);
    this.amplitudMovimiento = p.random(5, 15); // Movimiento más amplio
    this.frecuenciaMovimiento = p.random(0.5, 1.5); // Más rápido
    this.amplitudRotacion = p.random(0.05, 0.2); // Rotación durante movimiento
    this.amplitudVertical = p.random(2, 8); // Movimiento vertical (saltos)
    
    // Color del material
    this.colorIndex = Math.floor(p.random(COLORES_VOLUMEN.length));
    this.color = p.color(COLORES_VOLUMEN[this.colorIndex]);
    
    // Tracking de movimiento acumulado
    this.movimientoAcumulado = 0;
    this.posAnteriorX = 0;
    this.posAnteriorZ = 0;
    
    // Estado de interacción
    this.siendoArrastrado = false;
    
    // Offset actual
    this.offsetX = 0;
    this.offsetZ = 0;
    this.offsetY = 0;
    this.rotacionDinamica = 0;
    this.normalizacionBoost = 0;
    
    // Fases de expansión y unificación
    this.expansion = 0;
    this.unificacion = 0;
    this.factorCentro = 0;
  }
  
  /**
   * Actualiza el estado del volumen
   * Fase 1: Deformados → cubos idénticos
   * Fase 2: Cubos se expanden
   * Fase 3: Todo se unifica en un bloque
   */
  update(t) {
    const p = this.p;
    
    // === FASES DEL LOOP (simplificadas) ===
    // Fase 1 (0.0 - 0.5): Normalización (deformado → cubo)
    // Fase 2 (0.5 - 0.7): Pausa - cubos idénticos estables
    // Fase 3 (0.7 - 1.0): Unificación (cubos convergen y se funden)
    
    // === FASE 1: NORMALIZACIÓN ===
    const tNorm = Math.min(1, t / 0.5);
    const desfase = (this.index / 25) * 0.1;
    let tProgreso = Math.max(0, Math.min(1, tNorm * 1.12 - desfase));
    const normBase = easing.inOutCubic(tProgreso);
    
    if (this.siendoArrastrado) {
      this.normalizacionBoost = Math.min(1, this.normalizacionBoost + 0.05);
    }
    this.normalizacion = Math.min(1, normBase + this.normalizacionBoost * 0.3);
    
    // === FASE 2: PAUSA (cubos idénticos) ===
    // Entre t=0.5 y t=0.7, normalizacion=1, unificacion=0 → cubos estables
    this.expansion = 0; // No hay fase de expansión separada
    
    // === FASE 3: UNIFICACIÓN ===
    let unificacion = 0;
    if (t > 0.7) {
      const tUni = Math.min(1, (t - 0.7) / 0.3);
      unificacion = easing.inOutCubic(tUni);
    }
    this.unificacion = unificacion;
    
    // === MOVIMIENTO (solo en fase 1) ===
    const factorMovimiento = Math.pow(1 - this.normalizacion, 2) * (1 - this.expansion);
    const amplitudActual = this.amplitudMovimiento * factorMovimiento;
    const freq = this.frecuenciaMovimiento;
    
    const movX = Math.sin(t * p.TWO_PI * freq + this.fase) * amplitudActual +
                 Math.sin(t * p.TWO_PI * freq * 2.3 + this.fase * 1.7) * amplitudActual * 0.3;
    const movZ = Math.cos(t * p.TWO_PI * freq * 0.8 + this.fase * 0.6) * amplitudActual * 0.7 +
                 Math.sin(t * p.TWO_PI * freq * 1.5 + this.fase * 2.1) * amplitudActual * 0.2;
    const movY = Math.sin(t * p.TWO_PI * freq * 1.2 + this.fase * 0.5) * 
                 this.amplitudVertical * factorMovimiento;
    const rotDinamica = Math.sin(t * p.TWO_PI * freq * 0.7 + this.fase) * 
                        this.amplitudRotacion * factorMovimiento;
    
    this.offsetX = movX * (1 - unificacion);
    this.offsetZ = movZ * (1 - unificacion);
    this.offsetY = movY * (1 - unificacion);
    this.rotacionDinamica = rotDinamica * (1 - unificacion);
    
    // === CARACTERÍSTICAS ===
    const n = this.normalizacion;
    
    // Durante unificación, todo converge al centro
    const posicionCentro = unificacion;
    this.factorCentro = posicionCentro;
    
    // Gestos arquitectónicos
    this.retranqueoActual = p.lerp(this.retranqueo, 0, n) * (1 - unificacion);
    this.redondezActual = p.lerp(this.redondez, 0, n);
    this.rotacionActual = (p.lerp(this.rotacionGesto, 0, n) + this.rotacionDinamica) * (1 - unificacion);
    
    // Variaciones orgánicas
    this.bulgeActual = p.lerp(this.bulge, 1, n);
    this.taperActual = p.lerp(this.taper, 1, n);
    
    // === ESCALA SIMPLE Y CONSISTENTE ===
    // Tamaño objetivo final del cubo normalizado (todos iguales)
    const escalaFinalCubo = 0.65;
    
    // Interpolar directamente de escala inicial a escala final
    // La escala permanece constante después de normalización (sin expansión previa)
    this.escalaActual = p.lerp(this.escalaBase, escalaFinalCubo, n);
    
    // Altura también se normaliza suavemente
    this.alturaActual = p.lerp(this.alturaProporcion, 1, n);
    this.twistActual = p.lerp(this.twist, 0, n) * (1 - unificacion);
    
    // Deformaciones
    this.skewXActual = p.lerp(this.skewX, 0, n) * (1 - unificacion);
    this.skewZActual = p.lerp(this.skewZ, 0, n) * (1 - unificacion);
    this.squeezeActual = p.lerp(this.squeeze, 1, n);
    this.wavinessActual = p.lerp(this.waviness, 0, n);
    this.asymmetryActual = p.lerp(this.asymmetry, 0, n) * (1 - unificacion);
  }
  
  /**
   * Dibuja el volumen como forma que evoluciona de orgánica a cúbica
   * y finalmente se unifica con los demás
   */
  draw() {
    const p = this.p;
    
    p.push();
    
    // Durante unificación, posición converge al centro
    const posX = p.lerp(this.x, 0, this.factorCentro || 0);
    const posZ = p.lerp(this.z, 0, this.factorCentro || 0);
    
    // Posición base + offset de movimiento + retranqueo
    p.translate(
      posX + this.offsetX + this.retranqueoActual * CELL_SIZE * 0.25,
      -this.offsetY,
      posZ + this.offsetZ
    );
    
    // Rotación gestual que se pierde con normalización
    p.rotateY(this.rotacionActual);
    
    // Inclinaciones estrambóticas (skew simulado con rotaciones)
    p.rotateX(this.skewZActual * 0.3);
    p.rotateZ(this.skewXActual * 0.3);
    
    // Escala base (ya incluye normalización y expansión desde update())
    let tamano = CELL_SIZE * this.escalaActual * 0.9;
    let altura = tamano * this.alturaActual * 1.3;
    
    // Durante unificación, todo converge y crece en un único bloque
    if (this.unificacion > 0) {
      // El bloque final ocupa todo el grid
      const tamanoFinal = CELL_SIZE * GRID_SIZE * 1.1;
      const alturaFinal = CELL_SIZE * 2;
      tamano = p.lerp(tamano, tamanoFinal, this.unificacion);
      altura = p.lerp(altura, alturaFinal, this.unificacion);
    }
    
    // Color converge al mismo tono
    const colorFinal = p.lerpColor(
      this.color,
      p.color(PALETTE.blancoSucio),
      this.normalizacion
    );
    p.fill(colorFinal);
    p.noStroke();
    
    // Solo dibujar un volumen durante unificación (el del centro)
    if (this.unificacion > 0.95 && this.index !== 12) {
      // No dibujar, solo el central se dibuja
      p.pop();
      return;
    }
    
    // Dibujar el volumen
    this.drawVolumen(tamano, altura);
    
    p.pop();
  }
  
  /**
   * Dibuja un volumen que interpola entre forma orgánica estrambótica y cubo
   */
  drawVolumen(width, height) {
    const p = this.p;
    const segments = 16; // Más segmentos para deformaciones suaves
    const heightSegments = 12;
    
    // Factor de redondez para las esquinas
    const cornerRadius = width * 0.5 * this.redondezActual;
    
    // Elevar el volumen para que esté sobre el plano
    p.translate(0, -height / 2, 0);
    
    // Dibujar capa por capa (de abajo a arriba)
    for (let h = 0; h < heightSegments; h++) {
      const y1 = (h / heightSegments) * height - height / 2;
      const y2 = ((h + 1) / heightSegments) * height - height / 2;
      
      // Calcular parámetros para esta altura
      const hNorm1 = h / heightSegments;
      const hNorm2 = (h + 1) / heightSegments;
      
      // Taper (estrechamiento)
      const scale1 = 1 - (1 - this.taperActual) * hNorm1;
      const scale2 = 1 - (1 - this.taperActual) * hNorm2;
      
      // Bulge (abultamiento en el centro)
      const bulge1 = 1 + (this.bulgeActual - 1) * Math.sin(hNorm1 * Math.PI);
      const bulge2 = 1 + (this.bulgeActual - 1) * Math.sin(hNorm2 * Math.PI);
      
      // Twist (torsión)
      const twist1 = this.twistActual * hNorm1 * p.PI * 1.5;
      const twist2 = this.twistActual * hNorm2 * p.PI * 1.5;
      
      // Squeeze (compresión en un eje)
      const squeeze = this.squeezeActual;
      
      // Ondulación vertical
      const wave1 = 1 + this.wavinessActual * Math.sin(hNorm1 * Math.PI * 4);
      const wave2 = 1 + this.wavinessActual * Math.sin(hNorm2 * Math.PI * 4);
      
      const w1 = width * scale1 * bulge1 * wave1;
      const w2 = width * scale2 * bulge2 * wave2;
      
      p.beginShape(p.TRIANGLE_STRIP);
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * p.TWO_PI;
        
        // Puntos con todas las deformaciones
        const pt1 = this.superellipsePointDeformed(angle + twist1, w1 / 2, cornerRadius, squeeze, hNorm1);
        const pt2 = this.superellipsePointDeformed(angle + twist2, w2 / 2, cornerRadius, squeeze, hNorm2);
        
        p.vertex(pt1.x, y1, pt1.z);
        p.vertex(pt2.x, y2, pt2.z);
      }
      
      p.endShape();
    }
    
    // Tapa superior
    const topScale = Math.max(0.1, this.taperActual);
    const topWidth = Math.max(2, width * topScale);
    const topTwist = this.twistActual * p.PI * 1.5;
    
    p.beginShape();
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * p.TWO_PI;
      const pt = this.superellipsePointDeformed(angle + topTwist, topWidth / 2, cornerRadius * topScale, this.squeezeActual, 1);
      p.vertex(pt.x, height / 2, pt.z);
    }
    p.endShape(p.CLOSE);
    
    // Tapa inferior
    p.beginShape();
    for (let i = segments - 1; i >= 0; i--) {
      const angle = (i / segments) * p.TWO_PI;
      const pt = this.superellipsePointDeformed(angle, width / 2, cornerRadius, this.squeezeActual, 0);
      p.vertex(pt.x, -height / 2, pt.z);
    }
    p.endShape(p.CLOSE);
  }
  
  /**
   * Calcula un punto en una superelipse (interpola entre círculo y cuadrado)
   */
  superellipsePoint(angle, radius, cornerRadius) {
    const p = this.p;
    
    // Proteger contra valores extremos
    const safeRadius = Math.max(1, Math.abs(radius));
    const safeCornerRadius = Math.max(0, Math.min(cornerRadius, safeRadius * 0.95));
    
    // n controla la forma: 2 = círculo, >2 = cuadrado
    // Limitar n entre 2 y 10 para evitar formas de estrella
    const n = Math.max(2, Math.min(10, p.map(safeCornerRadius, 0, safeRadius, 8, 2)));
    
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    // Signed power para superelipse
    const signedPow = (base, exp) => Math.sign(base) * Math.pow(Math.abs(base), exp);
    
    const factor = 2 / n;
    
    return {
      x: safeRadius * signedPow(cosA, factor),
      z: safeRadius * signedPow(sinA, factor)
    };
  }
  
  /**
   * Calcula un punto con deformaciones adicionales (squeeze, asymmetry)
   */
  superellipsePointDeformed(angle, radius, cornerRadius, squeeze, heightNorm) {
    const p = this.p;
    
    // Proteger contra valores extremos
    const safeRadius = Math.max(1, Math.abs(radius));
    const safeCornerRadius = Math.max(0, Math.min(cornerRadius, safeRadius * 0.95));
    
    // Base superelipse: n controla la forma (2 = círculo, >2 = cuadrado)
    // Limitar n entre 2 y 10 para evitar formas de estrella (n < 2)
    const n = Math.max(2, Math.min(10, p.map(safeCornerRadius, 0, safeRadius, 8, 2)));
    
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    const signedPow = (base, exp) => Math.sign(base) * Math.pow(Math.abs(base), exp);
    const factor = 2 / n;
    
    let x = safeRadius * signedPow(cosA, factor);
    let z = safeRadius * signedPow(sinA, factor);
    
    // Aplicar squeeze (compresión en un eje) con límites
    const safeSqueeze = Math.max(0.3, Math.min(2, squeeze));
    x *= safeSqueeze;
    
    // Aplicar asimetría (desplazamiento lateral que varía con altura)
    x += this.asymmetryActual * safeRadius * heightNorm * 0.5;
    
    // Ondulación radial basada en ángulo (limitada)
    const waveRadial = 1 + Math.min(0.3, this.wavinessActual) * 0.4 * Math.sin(angle * 3);
    x *= waveRadial;
    z *= waveRadial;
    
    return { x, z };
  }
  
  /**
   * Dibuja la sombra proyectada
   */
  drawShadow() {
    const p = this.p;
    
    // No dibujar sombras individuales durante unificación final
    if (this.unificacion > 0.95 && this.index !== 12) {
      return;
    }
    
    p.push();
    
    // Durante unificación, sombra también converge al centro
    const posX = p.lerp(this.x, 0, this.factorCentro || 0);
    const posZ = p.lerp(this.z, 0, this.factorCentro || 0);
    
    const shadowOffset = 10 + this.offsetY * 0.5;
    
    p.translate(
      posX + this.offsetX + this.retranqueoActual * CELL_SIZE * 0.25 + shadowOffset,
      0.5,
      posZ + this.offsetZ + shadowOffset
    );
    
    p.rotateX(p.HALF_PI);
    p.rotateZ(this.rotacionActual - this.rotacionDinamica);
    
    let tamano = CELL_SIZE * this.escalaActual * 0.9;
    
    // Durante unificación, sombra crece
    if (this.unificacion > 0) {
      const tamanoFinal = CELL_SIZE * GRID_SIZE * 0.9;
      tamano = p.lerp(tamano, tamanoFinal, this.unificacion);
    }
    
    const sombra = p.color(PALETTE.sombra);
    const alturaFactor = Math.max(0.3, 1 - this.offsetY * 0.02);
    sombra.setAlpha((30 + this.normalizacion * 30) * alturaFactor);
    
    p.fill(sombra);
    p.noStroke();
    
    const cornerRadius = tamano * 0.5 * this.redondezActual;
    
    p.beginShape();
    const segments = 16;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * p.TWO_PI;
      const pt = this.superellipsePointDeformed(angle, tamano / 2 * 0.85, cornerRadius * 0.85, this.squeezeActual, 0);
      p.vertex(pt.x, pt.z);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
}

// === SKETCH PRINCIPAL ===
const sketch = (p) => {
  let loop;
  let volumenes = [];
  let draggingVolumen = null;
  let grabacionAutomatica = false; // Para detener cuando llegue al estado estable
  
  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.WEBGL);
    p.frameRate(FPS);
    
    loop = createLoopHelper(LOOP_DURATION, FPS);
    setupRecorder(p, LOOP_DURATION, FPS);
    
    // Crear la trama urbana con volúmenes
    initVolumenes();
    
    console.log('🏗️ Sketch 14: La cuadrícula devora la forma');
    console.log('   Pulsa S para reiniciar y grabar hasta el estado estable');
    console.log('   Pulsa R para reiniciar sin grabar');
    console.log('   Arrastra volúmenes para acelerar su normalización');
  };
  
  function initVolumenes() {
    volumenes = [];
    let index = 0;
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      for (let gy = 0; gy < GRID_SIZE; gy++) {
        volumenes.push(new VolumenEdificable(p, gx, gy, index++));
      }
    }
  }
  
  p.draw = () => {
    const t = loop.progress(p);
    
    // Detectar estado estable (unificación completa) para detener grabación automática
    if (grabacionAutomatica && t >= 0.98) {
      if (window.isRecording && window.isRecording()) {
        window.stopRecording();
        grabacionAutomatica = false;
        console.log('✅ Grabación completada - estado estable alcanzado');
      }
    }
    
    // Detectar reinicio del loop para regenerar volúmenes
    if (loop.justCompleted(p)) {
      initVolumenes();
    }
    
    // Fondo de planimetría
    p.background(PALETTE.fondo);
    
    // === CONFIGURACIÓN DE CÁMARA (vista de render de concurso) ===
    // Isométrica con ligera variación
    const camAngle = p.PI / 4 + Math.sin(t * p.TWO_PI) * 0.015;
    const camHeight = 450 + Math.sin(t * p.TWO_PI * 0.5) * 15;
    const camDist = 650;
    
    p.camera(
      Math.cos(camAngle) * camDist,
      -camHeight,
      Math.sin(camAngle) * camDist,
      0, -20, 0,
      0, 1, 0
    );
    
    // === ILUMINACIÓN (render de concurso) ===
    // Luz ambiente difusa - hora indeterminada
    p.ambientLight(160, 155, 148);
    
    // Luz direccional suave (como de cielo nublado)
    p.directionalLight(200, 198, 190, 0.4, 0.8, -0.2);
    p.directionalLight(140, 138, 132, -0.3, 0.3, 0.4);
    
    // Luz de relleno sutil
    p.pointLight(180, 175, 168, 0, -300, 0);
    
    // === DIBUJAR PLANO BASE (trama urbana) ===
    drawTramaUrbana();
    
    // === ACTUALIZAR Y DIBUJAR VOLÚMENES ===
    // Primero actualizar todos
    for (const vol of volumenes) {
      vol.update(t);
    }
    
    // Fase de unificación basada en tiempo global (sincronizado con update())
    // La unificación empieza en t > 0.7
    const enFaseUnificacion = t > 0.7;
    const nivelUnificacion = enFaseUnificacion ? Math.min(1, (t - 0.7) / 0.3) : 0;
    
    // Si estamos en fase de unificación muy avanzada (>90%), solo dibujar el bloque único
    if (nivelUnificacion > 0.9) {
      // Solo el bloque unificado, sin volúmenes individuales
      drawBloqueUnificado(nivelUnificacion);
    } else if (enFaseUnificacion) {
      // Transición: volúmenes convergiendo + bloque apareciendo encima
      for (const vol of volumenes) {
        vol.drawShadow();
      }
      for (const vol of volumenes) {
        vol.draw();
      }
      // Superponer el bloque unificado (solo aparece cuando nivel > 0.5)
      drawBloqueUnificado(nivelUnificacion);
    } else {
      // Dibujar sombras y volúmenes normalmente
      for (const vol of volumenes) {
        vol.drawShadow();
      }
      for (const vol of volumenes) {
        vol.draw();
      }
    }
  };
  
  function drawBloqueUnificado(nivel) {
    // Solo dibujar cuando nivel > 0.5 para evitar aparición prematura
    if (nivel < 0.5) return;
    
    // Ajustar nivel para que empiece desde 0 cuando nivel global = 0.5
    const nivelAjustado = (nivel - 0.5) / 0.5; // 0 a 1
    
    // Bloque monolítico que cubre todo el grid
    const tamanoFinal = CELL_SIZE * GRID_SIZE * 1.05;
    const alturaFinal = CELL_SIZE * 1.8;
    
    // El bloque crece desde el centro
    const tamano = p.lerp(0, tamanoFinal, easing.inOutCubic(nivelAjustado));
    const altura = p.lerp(0, alturaFinal, easing.inOutCubic(nivelAjustado));
    
    if (tamano < 10) return; // No dibujar si es muy pequeño
    
    // Sombra del bloque
    if (nivelAjustado > 0.3) {
      p.push();
      p.translate(20, 1, 20);
      p.rotateX(p.HALF_PI);
      const sombra = p.color(PALETTE.sombra);
      sombra.setAlpha(Math.floor(60 * (nivelAjustado - 0.3) / 0.7));
      p.fill(sombra);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(0, 0, tamano * 0.9, tamano * 0.9);
      p.pop();
    }
    
    // Volumen redondeado (como los cubos normalizados)
    p.push();
    p.translate(0, -altura / 2, 0);
    
    // Color blanco sucio con transparencia que aumenta
    const color = p.color(PALETTE.blancoSucio);
    const alpha = Math.floor(p.lerp(150, 255, nivelAjustado));
    color.setAlpha(alpha);
    p.fill(color);
    p.noStroke();
    
    // Dibujar volumen redondeado (superelipsoide con n=4 para esquinas suaves)
    drawVolumenRedondeado(tamano, altura);
    
    p.pop();
  }
  
  /**
   * Dibuja un volumen con esquinas redondeadas para el bloque final
   */
  function drawVolumenRedondeado(width, height) {
    const segments = 16;
    const heightSegments = 12;
    const cornerRadius = width * 0.08; // Redondeo sutil
    const n = 4; // Superelipse para esquinas suaves (más alto = más cuadrado)
    
    // Función para punto de superelipse
    function superellipsePoint(angle, rx, ry, n) {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const x = Math.sign(cosA) * rx * Math.pow(Math.abs(cosA), 2/n);
      const y = Math.sign(sinA) * ry * Math.pow(Math.abs(sinA), 2/n);
      return { x, y };
    }
    
    // Dibujar cuerpo principal (caras laterales)
    for (let j = 0; j < heightSegments; j++) {
      const y1 = p.map(j, 0, heightSegments, -height/2, height/2);
      const y2 = p.map(j + 1, 0, heightSegments, -height/2, height/2);
      
      p.beginShape(p.TRIANGLE_STRIP);
      for (let i = 0; i <= segments; i++) {
        const angle = p.map(i, 0, segments, 0, p.TWO_PI);
        const radius = width / 2 - cornerRadius;
        
        const pt = superellipsePoint(angle, radius, radius, n);
        
        p.vertex(pt.x, y1, pt.y);
        p.vertex(pt.x, y2, pt.y);
      }
      p.endShape();
    }
    
    // Tapa superior
    p.beginShape(p.TRIANGLE_FAN);
    p.vertex(0, -height/2, 0);
    for (let i = 0; i <= segments; i++) {
      const angle = p.map(i, 0, segments, 0, p.TWO_PI);
      const radius = width / 2 - cornerRadius;
      const pt = superellipsePoint(angle, radius, radius, n);
      p.vertex(pt.x, -height/2, pt.y);
    }
    p.endShape();
    
    // Tapa inferior
    p.beginShape(p.TRIANGLE_FAN);
    p.vertex(0, height/2, 0);
    for (let i = segments; i >= 0; i--) {
      const angle = p.map(i, 0, segments, 0, p.TWO_PI);
      const radius = width / 2 - cornerRadius;
      const pt = superellipsePoint(angle, radius, radius, n);
      p.vertex(pt.x, height/2, pt.y);
    }
    p.endShape();
  }
  
  function drawTramaUrbana() {
    p.push();
    p.translate(0, 1, 0);
    p.rotateX(p.HALF_PI);
    
    // Plano base
    p.fill(PALETTE.fondo);
    p.noStroke();
    const planoSize = CELL_SIZE * (GRID_SIZE + 1.5);
    p.rectMode(p.CENTER);
    p.rect(0, 0, planoSize, planoSize);
    
    // Líneas de la trama urbana
    p.stroke(PALETTE.grid);
    p.strokeWeight(0.8);
    
    const offset = (GRID_SIZE * CELL_SIZE) / 2;
    
    // Líneas verticales de parcela
    for (let i = 0; i <= GRID_SIZE; i++) {
      const x = i * CELL_SIZE - offset;
      p.line(x, -offset - CELL_SIZE * 0.3, x, offset + CELL_SIZE * 0.3);
    }
    
    // Líneas horizontales de parcela
    for (let i = 0; i <= GRID_SIZE; i++) {
      const y = i * CELL_SIZE - offset;
      p.line(-offset - CELL_SIZE * 0.3, y, offset + CELL_SIZE * 0.3, y);
    }
    
    // Marcas sutiles en intersecciones (mojones urbanísticos)
    p.fill(PALETTE.grid);
    p.noStroke();
    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let j = 0; j <= GRID_SIZE; j++) {
        const x = i * CELL_SIZE - offset;
        const y = j * CELL_SIZE - offset;
        p.ellipse(x, y, 3, 3);
      }
    }
    
    p.pop();
  }
  
  // === INTERACCIÓN ===
  p.mousePressed = () => {
    // Proyectar mouse a espacio 3D (simplificado para vista isométrica)
    const mx = (p.mouseX - CANVAS_SIZE/2) * 0.8;
    const mz = (p.mouseY - CANVAS_SIZE/2) * 0.9;
    
    // Encontrar volumen más cercano
    let minDist = Infinity;
    let closest = null;
    
    for (const vol of volumenes) {
      const dx = vol.x - mx;
      const dz = vol.z - mz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < CELL_SIZE * 0.5 && dist < minDist) {
        minDist = dist;
        closest = vol;
      }
    }
    
    if (closest) {
      draggingVolumen = closest;
      draggingVolumen.siendoArrastrado = true;
    }
  };
  
  p.mouseDragged = () => {
    if (draggingVolumen) {
      // Movimiento acelera normalización
      draggingVolumen.movimientoAcumulado += 0.08;
    }
  };
  
  p.mouseReleased = () => {
    if (draggingVolumen) {
      draggingVolumen.siendoArrastrado = false;
      draggingVolumen = null;
    }
  };
  
  p.keyPressed = () => {
    if (p.key === 's' || p.key === 'S') {
      // Si ya está grabando, detener
      if (window.isRecording && window.isRecording()) {
        window.stopRecording();
        grabacionAutomatica = false;
        console.log('⏹️ Grabación detenida manualmente');
      } else {
        // Reset + iniciar grabación automática
        loop.reset();
        initVolumenes();
        grabacionAutomatica = true;
        console.log('🎬 Reiniciando y grabando hasta estado estable...');
        // Pequeño delay para asegurar que el reset se procesa
        setTimeout(() => {
          window.startRecording();
        }, 50);
      }
    }
    
    // R para reiniciar sin grabar
    if (p.key === 'r' || p.key === 'R') {
      loop.reset();
      initVolumenes();
      grabacionAutomatica = false;
      console.log('🔄 Volúmenes reiniciados');
    }
  };
};

// === INICIALIZACIÓN ===
new p5(sketch, document.getElementById('canvas-container'));
