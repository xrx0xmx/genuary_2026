import p5 from 'p5';
import * as brush from 'p5.brush';
import { createLoopHelper, easing } from '../shared/loop.js';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 8
// Prompt: A City. Create a generative metropolis.
// Las Vegas Day Arrival - Generative Metropolis

// ============================================
// CONFIGURACIÓN DEL LOOP
// ============================================
const LOOP_DURATION = 8; // Duración del loop en segundos (para animación sutil)
const FPS = 60;          // Frames por segundo
const CANVAS_WIDTH = 1280;  // Reducido de 1920 manteniendo proporción 16:9
const CANVAS_HEIGHT = 720;  // Reducido de 1080 manteniendo proporción 16:9

// ============================================
// PARÁMETROS CONFIGURABLES
// ============================================
const CONFIG = {
  // Composición
  horizonY: CANVAS_HEIGHT * 0.45,     // Posición del horizonte (por debajo de la mitad, 45%)
  vanishX: CANVAS_WIDTH * 0.5,         // Posición X del punto de fuga (centrado)
  roadWidthNear: CANVAS_WIDTH * 0.6,   // Ancho de carretera en primer plano
  
  // Ciudad
  cityDensity: 25,                     // Número base de edificios por capa
  windowOnProbability: 0.8,            // Probabilidad de ventana visible (día)
  
  // Atmósfera
  hazeStrength: 0.3,                   // Intensidad del halo del horizonte (más sutil de día)
  hazeHeight: 100,                     // Altura del halo
  bloomStrength: 0.2,                  // Intensidad del bloom
  grainAmount: 0.1,                    // Cantidad de grano
  
  // Carretera
  laneDashLengthNear: 40,              // Longitud de guión en primer plano
  laneDashGapNear: 30,                 // Espacio entre guiones en primer plano
  laneBrightness: 0.7,                 // Brillo de las marcas viales
  
  // Pincel para edificios
  brushType: 'pen',                    // Tipo de pincel: 'pen', 'rotring', 'marker', 'charcoal', '2B', 'HB', 'spray', 'cpencil', 'marker2'
  brushWeight: 1.0                     // Grosor del pincel
};

// Tipos de edificios
const BUILDING_TYPES = {
  MODERN_SKYSCRAPER: 'modern_skyscraper',    // Rascacielos moderno rectangular
  OFFICE_BUILDING: 'office_building',        // Edificio de oficinas ancho
  RESIDENTIAL: 'residential',               // Edificio residencial bajo
  TOWER_WITH_ANTENNA: 'tower_antenna',      // Torre con antena/estructura superior
  STEPPED_BUILDING: 'stepped_building'       // Edificio escalonado tipo ziggurat
};

// ============================================
// CLASE BUILDING
// ============================================
class Building {
  constructor(p, x, baseY, width, height, layer, buildingType) {
    this.p = p;
    this.x = x;
    this.baseY = baseY;
    this.width = width;
    this.height = height;
    this.layer = layer; // 0=lejana, 1=media, 2=cercana
    this.buildingType = buildingType;
    
    // La base del edificio siempre está exactamente en el horizonte
    // Sin offset para evitar que floten o se dibujen por debajo
    this.y = baseY;
    
    // Patrón de ventanas
    this.windows = [];
    this.generateWindows();
    
    // Color base según capa (más claro para día)
    const layerBrightness = [120, 150, 180];
    this.baseBrightness = layerBrightness[layer];
    
    // Color del edificio (variación de colores más claros y brillantes)
    const colorVariation = p.random();
    if (colorVariation < 0.3) {
      // Gris claro más brillante
      this.color = [p.random(200, 240), p.random(200, 240), p.random(200, 240)];
    } else if (colorVariation < 0.6) {
      // Azul claro más brillante
      this.color = [p.random(180, 220), p.random(200, 240), p.random(230, 255)];
    } else if (colorVariation < 0.8) {
      // Beige/crema más brillante
      this.color = [p.random(230, 255), p.random(230, 255), p.random(210, 240)];
    } else {
      // Blanco/plateado muy brillante
      this.color = [p.random(240, 255), p.random(240, 255), p.random(240, 255)];
    }
    
    // Propiedades determinísticas del edificio (no cambiar cada frame)
    this.hasRoof = p.random() < 0.5; // Techo inclinado para residencial
  }
  
  generateWindows() {
    const p = this.p;
    let cols, rows, windowSize;
    
    // Ajustar patrón de ventanas según tipo de edificio
    switch (this.buildingType) {
      case BUILDING_TYPES.MODERN_SKYSCRAPER:
        cols = Math.floor(this.width / 12);
        rows = Math.floor(this.height / 18);
        windowSize = p.random(8, 12);
        break;
      case BUILDING_TYPES.OFFICE_BUILDING:
        cols = Math.floor(this.width / 20);
        rows = Math.floor(this.height / 25);
        windowSize = p.random(12, 18);
        break;
      case BUILDING_TYPES.RESIDENTIAL:
        cols = Math.floor(this.width / 15);
        rows = Math.floor(this.height / 20);
        windowSize = p.random(6, 10);
        break;
      case BUILDING_TYPES.TOWER_WITH_ANTENNA:
        cols = Math.floor(this.width / 10);
        rows = Math.floor(this.height / 15);
        windowSize = p.random(6, 10);
        break;
      case BUILDING_TYPES.STEPPED_BUILDING:
        cols = Math.floor(this.width / 18);
        rows = Math.floor(this.height / 22);
        windowSize = p.random(10, 14);
        break;
      default:
        cols = Math.floor(this.width / 15);
        rows = Math.floor(this.height / 20);
        windowSize = p.random(8, 12);
    }
    
    // Calcular bordes del edificio
    const buildingLeft = this.x - this.width / 2;
    const buildingRight = this.x + this.width / 2;
    const buildingTop = this.y - this.height;
    const buildingBottom = this.y;
    
    // Margen mínimo para que las ventanas no toquen los bordes
    const margin = windowSize / 2 + 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (p.random() < CONFIG.windowOnProbability) {
          const windowX = this.x - this.width / 2 + (col + 0.5) * (this.width / cols);
          const windowY = this.y - this.height + (row + 0.5) * (this.height / rows);
          
          // Verificar que la ventana esté completamente dentro del edificio con margen
          if (windowX - windowSize / 2 >= buildingLeft + margin &&
              windowX + windowSize / 2 <= buildingRight - margin &&
              windowY - windowSize / 2 >= buildingTop + margin &&
              windowY + windowSize / 2 <= buildingBottom - margin) {
            // Ventanas oscuras que reflejan el cielo (azul oscuro/negro con reflejo)
            const reflection = p.random(0.3, 0.7);
            // Propiedades determinísticas de la ventana (no cambiar cada frame)
            let hasCross = false;
            let windowStyle = null;
            
            if (this.buildingType === BUILDING_TYPES.RESIDENTIAL) {
              hasCross = p.random() < 0.6; // 60% tienen cruz
            } else if (this.buildingType === BUILDING_TYPES.STEPPED_BUILDING) {
              windowStyle = p.random(); // Estilo de ventana variado
            }
            
            this.windows.push({
              x: windowX,
              y: windowY,
              reflection: reflection, // Factor de reflejo del cielo
              size: windowSize,
              buildingType: this.buildingType, // Guardar tipo para estilo diferente
              hasCross: hasCross, // Si tiene cruz (para residencial)
              windowStyle: windowStyle // Estilo de ventana (para stepped)
            });
          }
        }
      }
    }
  }
  
  draw() {
    const p = this.p;
    
    p.push();
    
    // Dibujar edificio según su tipo
    switch (this.buildingType) {
      case BUILDING_TYPES.MODERN_SKYSCRAPER:
        this.drawModernSkyscraper();
        break;
      case BUILDING_TYPES.OFFICE_BUILDING:
        this.drawOfficeBuilding();
        break;
      case BUILDING_TYPES.RESIDENTIAL:
        this.drawResidential();
        break;
      case BUILDING_TYPES.TOWER_WITH_ANTENNA:
        this.drawTowerWithAntenna();
        break;
      case BUILDING_TYPES.STEPPED_BUILDING:
        this.drawSteppedBuilding();
        break;
    }
    
    // Dibujar ventanas (común para todos los tipos)
    this.drawWindows();
    
    p.pop();
  }
  
  drawModernSkyscraper() {
    const p = this.p;
    const alpha = this.layer === 0 ? 200 : this.layer === 1 ? 230 : 255;
    
    // Configurar pincel
    brush.set(CONFIG.brushType);
    brush.strokeWeight(CONFIG.brushWeight * 2);
    brush.stroke(0, 0, 0); // Borde negro (RGB sin opacidad)
    brush.fill(this.color[0], this.color[1], this.color[2], alpha); // Fill con opacidad
    
    // Cuerpo principal rectangular con p5.brush
    brush.rect(
      this.x - this.width / 2,
      this.y - this.height,
      this.width,
      this.height
    );
    
    // Líneas verticales de estructura con p5.brush
    brush.stroke(180, 180, 200); // RGB sin opacidad (la opacidad se controla con el brush)
    brush.strokeWeight(CONFIG.brushWeight * 0.5);
    brush.noFill();
    for (let i = 1; i < 4; i++) {
      const lineX = this.x - this.width / 2 + (this.width / 4) * i;
      brush.line(lineX, this.y - this.height, lineX, this.y);
    }
  }
  
  drawOfficeBuilding() {
    const p = this.p;
    const alpha = this.layer === 0 ? 200 : this.layer === 1 ? 230 : 255;
    
    // Configurar pincel
    brush.set(CONFIG.brushType);
    brush.strokeWeight(CONFIG.brushWeight * 2);
    brush.stroke(0, 0, 0); // Borde negro (RGB sin opacidad)
    brush.fill(this.color[0], this.color[1], this.color[2], alpha); // Fill con opacidad
    
    // Cuerpo principal más ancho con p5.brush
    brush.rect(
      this.x - this.width / 2,
      this.y - this.height,
      this.width,
      this.height
    );
    
    // Separación horizontal entre pisos con p5.brush
    brush.stroke(150, 150, 170); // RGB sin opacidad
    brush.strokeWeight(CONFIG.brushWeight);
    brush.noFill();
    const floorHeight = this.height / 8;
    for (let i = 1; i < 8; i++) {
      const floorY = this.y - this.height + floorHeight * i;
      brush.line(this.x - this.width / 2, floorY, this.x + this.width / 2, floorY);
    }
  }
  
  drawResidential() {
    const p = this.p;
    const alpha = this.layer === 0 ? 200 : this.layer === 1 ? 230 : 255;
    
    // Configurar pincel
    brush.set(CONFIG.brushType);
    brush.strokeWeight(CONFIG.brushWeight * 2);
    brush.stroke(0, 0, 0); // Borde negro (RGB sin opacidad)
    brush.fill(this.color[0], this.color[1], this.color[2], alpha); // Fill con opacidad
    
    // Cuerpo principal más bajo con p5.brush
    brush.rect(
      this.x - this.width / 2,
      this.y - this.height,
      this.width,
      this.height
    );
    
    // Techo inclinado opcional con p5.brush (usando beginShape/vertex/endShape)
    if (this.hasRoof) {
      brush.fill(Math.floor(this.color[0] * 0.8), Math.floor(this.color[1] * 0.8), Math.floor(this.color[2] * 0.8), alpha);
      brush.stroke(0, 0, 0); // RGB sin opacidad
      brush.strokeWeight(CONFIG.brushWeight * 2);
      brush.beginShape();
      brush.vertex(this.x - this.width / 2, this.y - this.height);
      brush.vertex(this.x + this.width / 2, this.y - this.height);
      brush.vertex(this.x, this.y - this.height - this.height * 0.2);
      brush.endShape(p.CLOSE);
    }
  }
  
  drawTowerWithAntenna() {
    const p = this.p;
    const alpha = this.layer === 0 ? 200 : this.layer === 1 ? 230 : 255;
    
    // Configurar pincel
    brush.set(CONFIG.brushType);
    brush.strokeWeight(CONFIG.brushWeight * 2);
    brush.stroke(0, 0, 0); // Borde negro (RGB sin opacidad)
    brush.fill(this.color[0], this.color[1], this.color[2], alpha); // Fill con opacidad
    
    // Cuerpo principal con p5.brush
    brush.rect(
      this.x - this.width / 2,
      this.y - this.height,
      this.width,
      this.height
    );
    
    // Estructura superior con antena
    const topHeight = this.height * 0.15;
    const topWidth = this.width * 0.6;
    brush.fill(Math.floor(this.color[0] * 0.9), Math.floor(this.color[1] * 0.9), Math.floor(this.color[2] * 0.9), alpha);
    brush.rect(
      this.x - topWidth / 2,
      this.y - this.height - topHeight,
      topWidth,
      topHeight
    );
    
    // Antena con p5.brush
    brush.stroke(0, 0, 0); // RGB sin opacidad
    brush.strokeWeight(CONFIG.brushWeight);
    brush.noFill();
    const antennaHeight = this.height * 0.1;
    brush.line(
      this.x,
      this.y - this.height - topHeight,
      this.x,
      this.y - this.height - topHeight - antennaHeight
    );
    
    // Esfera en la punta de la antena con p5.brush
    brush.fill(200, 200, 220, 200); // Fill con opacidad
    brush.stroke(0, 0, 0); // RGB sin opacidad
    brush.strokeWeight(CONFIG.brushWeight * 0.5);
    brush.circle(this.x, this.y - this.height - topHeight - antennaHeight, 4);
  }
  
  drawSteppedBuilding() {
    const p = this.p;
    const alpha = this.layer === 0 ? 200 : this.layer === 1 ? 230 : 255;
    
    // Configurar pincel
    brush.set(CONFIG.brushType);
    brush.strokeWeight(CONFIG.brushWeight * 2);
    brush.stroke(0, 0, 0, 255); // Borde negro
    
    // Niveles escalonados (3 niveles) con p5.brush
    const levelHeight = this.height / 3;
    const levelWidths = [this.width, this.width * 0.85, this.width * 0.7];
    
    for (let i = 0; i < 3; i++) {
      const levelY = this.y - this.height + levelHeight * i;
      const levelW = levelWidths[i];
      const brightness = 1 - (i * 0.1); // Cada nivel un poco más oscuro
      
      brush.fill(
        Math.floor(this.color[0] * brightness),
        Math.floor(this.color[1] * brightness),
        Math.floor(this.color[2] * brightness),
        alpha
      );
      brush.rect(
        this.x - levelW / 2,
        levelY,
        levelW,
        levelHeight
      );
    }
  }
  
  drawWindows() {
    const p = this.p;
    
    for (const window of this.windows) {
      // Ventanas oscuras que reflejan el cielo azul
      // Reflejo del cielo: azul oscuro con brillo variable
      const skyReflection = window.reflection;
      const r = Math.floor(50 + skyReflection * 100); // Azul oscuro a azul medio
      const g = Math.floor(100 + skyReflection * 80);
      const b = Math.floor(150 + skyReflection * 100);
      
      // Dibujar ventana según el tipo de edificio
      switch (window.buildingType) {
        case BUILDING_TYPES.MODERN_SKYSCRAPER:
          this.drawModernSkyscraperWindow(p, window, r, g, b);
          break;
        case BUILDING_TYPES.OFFICE_BUILDING:
          this.drawOfficeBuildingWindow(p, window, r, g, b);
          break;
        case BUILDING_TYPES.RESIDENTIAL:
          this.drawResidentialWindow(p, window, r, g, b);
          break;
        case BUILDING_TYPES.TOWER_WITH_ANTENNA:
          this.drawTowerWindow(p, window, r, g, b);
          break;
        case BUILDING_TYPES.STEPPED_BUILDING:
          this.drawSteppedBuildingWindow(p, window, r, g, b);
          break;
        default:
          // Ventana cuadrada por defecto
          p.fill(r, g, b, 200);
          p.noStroke();
          p.rect(window.x - window.size / 2, window.y - window.size / 2, window.size, window.size);
      }
    }
  }
  
  drawModernSkyscraperWindow(p, window, r, g, b) {
    // Ventanas rectangulares verticales (más altas que anchas)
    const w = window.size * 0.7;
    const h = window.size * 1.3;
    
    p.fill(r, g, b, 200);
    p.noStroke();
    p.rect(window.x - w / 2, window.y - h / 2, w, h);
    
    // Marco vertical
    p.stroke(80, 80, 100, 150);
    p.strokeWeight(1);
    p.noFill();
    p.rect(window.x - w / 2, window.y - h / 2, w, h);
    
    // División vertical central
    p.line(window.x, window.y - h / 2, window.x, window.y + h / 2);
    p.noStroke();
  }
  
  drawOfficeBuildingWindow(p, window, r, g, b) {
    // Ventanas grandes cuadradas con división horizontal (como ventanas de oficina)
    const size = window.size * 1.2;
    
    p.fill(r, g, b, 200);
    p.noStroke();
    p.rect(window.x - size / 2, window.y - size / 2, size, size);
    
    // Marco grueso
    p.stroke(100, 100, 120, 180);
    p.strokeWeight(2);
    p.noFill();
    p.rect(window.x - size / 2, window.y - size / 2, size, size);
    
    // División horizontal (como ventana de oficina)
    p.strokeWeight(1.5);
    p.line(window.x - size / 2, window.y, window.x + size / 2, window.y);
    p.noStroke();
  }
  
  drawResidentialWindow(p, window, r, g, b) {
    // Ventanas pequeñas con marco grueso, algunas con cruz (ventanas tradicionales)
    const size = window.size;
    const hasCross = window.hasCross || false; // Usar valor guardado, no aleatorio
    
    p.fill(r, g, b, 200);
    p.noStroke();
    p.rect(window.x - size / 2, window.y - size / 2, size, size);
    
    // Marco grueso tradicional
    p.stroke(60, 60, 80, 200);
    p.strokeWeight(2);
    p.noFill();
    p.rect(window.x - size / 2, window.y - size / 2, size, size);
    
    // Cruz en algunas ventanas
    if (hasCross) {
      p.strokeWeight(1.5);
      p.line(window.x - size / 2, window.y, window.x + size / 2, window.y); // Horizontal
      p.line(window.x, window.y - size / 2, window.x, window.y + size / 2); // Vertical
    }
    p.noStroke();
  }
  
  drawTowerWindow(p, window, r, g, b) {
    // Ventanas pequeñas y estrechas verticales (como ranuras)
    const w = window.size * 0.5;
    const h = window.size * 1.5;
    
    p.fill(r, g, b, 200);
    p.noStroke();
    p.rect(window.x - w / 2, window.y - h / 2, w, h);
    
    // Marco delgado vertical
    p.stroke(70, 70, 90, 150);
    p.strokeWeight(1);
    p.noFill();
    p.rect(window.x - w / 2, window.y - h / 2, w, h);
    p.noStroke();
  }
  
  drawSteppedBuildingWindow(p, window, r, g, b) {
    // Ventanas variadas: algunas redondas, algunas con arco superior
    const style = window.windowStyle !== null ? window.windowStyle : 0.5; // Usar valor guardado, no aleatorio
    const size = window.size;
    
    if (style < 0.3) {
      // Ventana redonda
      p.fill(r, g, b, 200);
      p.noStroke();
      p.circle(window.x, window.y, size);
      
      p.stroke(80, 80, 100, 150);
      p.strokeWeight(1.5);
      p.noFill();
      p.circle(window.x, window.y, size);
      p.noStroke();
    } else if (style < 0.6) {
      // Ventana con arco superior (semicírculo arriba, rectángulo abajo)
      const h = size * 0.6;
      const radius = size * 0.5;
      
      p.fill(r, g, b, 200);
      p.noStroke();
      // Parte rectangular
      p.rect(window.x - size / 2, window.y - h / 2 + radius, size, h);
      // Parte semicircular
      p.arc(window.x, window.y - h / 2, size, size * 0.8, p.PI, 0);
      
      // Marco
      p.stroke(80, 80, 100, 150);
      p.strokeWeight(1.5);
      p.noFill();
      p.rect(window.x - size / 2, window.y - h / 2 + radius, size, h);
      p.arc(window.x, window.y - h / 2, size, size * 0.8, p.PI, 0);
      p.noStroke();
    } else {
      // Ventana cuadrada normal pero más grande
      const size2 = size * 1.1;
      p.fill(r, g, b, 200);
      p.noStroke();
      p.rect(window.x - size2 / 2, window.y - size2 / 2, size2, size2);
      
      p.stroke(80, 80, 100, 150);
      p.strokeWeight(1.5);
      p.noFill();
      p.rect(window.x - size2 / 2, window.y - size2 / 2, size2, size2);
      p.noStroke();
    }
  }
}

const sketch = (p) => {
  // Registrar p5.brush para modo instancia ANTES de setup()
  brush.instance(p);
  
  const loop = createLoopHelper(LOOP_DURATION, FPS);
  
  // Estado de la escena
  let seed = 0;
  let buildings = [];
  let fieldDetails = []; // Detalles del campo (vegetación/piedras)
  let cloudPositions = []; // Posiciones de nubes (determinísticas)
  let grainPositions = []; // Posiciones de grano (determinísticas)
  
  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================
  
  function regenerate() {
    seed = Math.floor(p.random(1000000));
    p.randomSeed(seed);
    p.noiseSeed(seed);
    generateBuildings();
    generateFieldDetails();
    generateClouds();
    generateGrain();
  }
  
  function generateFieldDetails() {
    fieldDetails = [];
    for (let i = 0; i < 200; i++) {
      const x = p.random(CANVAS_WIDTH);
      const y = p.random(CONFIG.horizonY, CANVAS_HEIGHT);
      const size = p.random(2, 4);
      fieldDetails.push({ x, y, size });
    }
  }
  
  function generateClouds() {
    cloudPositions = [];
    for (let i = 0; i < 5; i++) {
      cloudPositions.push({
        x: p.random(CANVAS_WIDTH),
        y: p.random(CONFIG.horizonY * 0.5),
        size: p.random(100, 200),
        alpha: p.random(40, 60)
      });
    }
  }
  
  function generateGrain() {
    grainPositions = [];
    const grainCount = CANVAS_WIDTH * CANVAS_HEIGHT * CONFIG.grainAmount * 0.0001;
    for (let i = 0; i < grainCount; i++) {
      grainPositions.push({
        x: p.random(CANVAS_WIDTH),
        y: p.random(CANVAS_HEIGHT),
        alpha: p.random(10, 30)
      });
    }
  }
  
  function getRoadScaleAtY(y) {
    const distanceFromHorizon = CONFIG.horizonY - y;
    const maxDistance = CANVAS_HEIGHT - CONFIG.horizonY;
    return Math.max(0.01, distanceFromHorizon / maxDistance);
  }
  
  // ============================================
  // GENERACIÓN DE ELEMENTOS
  // ============================================
  
  function generateBuildings() {
    buildings = [];
    
    // Obtener todos los tipos de edificios como array
    const buildingTypesArray = Object.values(BUILDING_TYPES);
    
    for (let layer = 0; layer < 3; layer++) {
      const count = Math.floor(CONFIG.cityDensity * (layer + 1));
      
      for (let i = 0; i < count; i++) {
        const x = p.random(CANVAS_WIDTH);
        
        // Seleccionar tipo de edificio aleatoriamente
        const buildingType = buildingTypesArray[Math.floor(p.random(buildingTypesArray.length))];
        
        let width, height;
        
        // Dimensiones según tipo de edificio
        switch (buildingType) {
          case BUILDING_TYPES.MODERN_SKYSCRAPER:
            width = p.random(30, 70);
            height = p.random(200, 450);
            break;
          case BUILDING_TYPES.OFFICE_BUILDING:
            width = p.random(60, 140);
            height = p.random(120, 280);
            break;
          case BUILDING_TYPES.RESIDENTIAL:
            width = p.random(50, 100);
            height = p.random(80, 160);
            break;
          case BUILDING_TYPES.TOWER_WITH_ANTENNA:
            width = p.random(35, 65);
            height = p.random(250, 500);
            break;
          case BUILDING_TYPES.STEPPED_BUILDING:
            width = p.random(70, 130);
            height = p.random(150, 300);
            break;
          default:
            width = p.random(40, 100);
            height = p.random(100, 250);
        }
        
        // Ajustar tamaño según capa (más pequeños en capas lejanas)
        const layerScale = [0.6, 0.8, 1.0];
        width *= layerScale[layer];
        height *= layerScale[layer];
        
        buildings.push(new Building(
          p,
          x,
          CONFIG.horizonY,
          width,
          height,
          layer,
          buildingType
        ));
      }
    }
    
    // Ordenar por capa para renderizado correcto
    buildings.sort((a, b) => a.layer - b.layer);
  }
  // ============================================
  // FUNCIONES DE RENDERIZADO
  // ============================================
  
  function renderSky() {
    // Gradiente vertical del cielo diurno (azul más brillante y claro)
    for (let y = 0; y < CONFIG.horizonY; y++) {
      const t = y / CONFIG.horizonY;
      // De azul brillante arriba a azul muy claro cerca del horizonte
      const r = p.lerp(150, 220, t);
      const g = p.lerp(210, 240, t);
      const b = p.lerp(255, 255, t);
      
      p.stroke(r, g, b);
      p.strokeWeight(1);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Nubes más visibles (determinísticas)
    p.noStroke();
    for (const cloud of cloudPositions) {
      p.fill(255, 255, 255, cloud.alpha);
      p.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6);
    }
  }
  
  function renderHaze() {
    const hazeY = CONFIG.horizonY;
    const hazeHeight = CONFIG.hazeHeight;
    
    p.push();
    p.noStroke();
    
    // Haze diurno más sutil (blanco/amarillo claro)
    for (let i = 0; i < hazeHeight; i++) {
      const t = i / hazeHeight;
      const alpha = (1 - t) * CONFIG.hazeStrength * 30;
      const r = 255;
      const g = 240;
      const b = 220;
      
      p.fill(r, g, b, alpha);
      p.rect(0, hazeY - i, CANVAS_WIDTH, 1);
    }
    
    p.pop();
  }
  
  function renderSkyline() {
    // Dibujar edificios por capas con p5.brush
    for (const building of buildings) {
      building.draw();
    }
    
    // Forzar renderizado de p5.brush después de dibujar todos los edificios
    brush.reDraw();
  }
  
  function renderField() {
    p.push();
    p.noStroke();
    
    const roadLeft = CONFIG.vanishX - CONFIG.roadWidthNear / 2;
    const roadRight = CONFIG.vanishX + CONFIG.roadWidthNear / 2;
    
    // Campo izquierdo
    for (let y = CONFIG.horizonY; y < CANVAS_HEIGHT; y++) {
      const t = (y - CONFIG.horizonY) / (CANVAS_HEIGHT - CONFIG.horizonY);
      const scale = getRoadScaleAtY(y);
      
      // Calcular bordes de la carretera en esta Y
      const roadWidthAtY = CONFIG.roadWidthNear * scale;
      const roadLeftAtY = CONFIG.vanishX - roadWidthAtY / 2;
      
      // Color con perspectiva atmosférica (día - mucho más claro y visible)
      const baseR = 160;
      const baseG = 150;
      const baseB = 130;
      const horizonR = 200;
      const horizonG = 190;
      const horizonB = 170;
      
      const r = p.lerp(horizonR, baseR, t);
      const g = p.lerp(horizonG, baseG, t);
      const b = p.lerp(horizonB, baseB, t);
      
      // Textura con ruido más visible
      for (let x = 0; x < roadLeftAtY; x += 2) {
        const noiseVal = p.noise(x * 0.01, y * 0.01);
        const brightness = noiseVal * 20; // Aumentado de 10 a 20
        
        p.fill(r + brightness, g + brightness, b + brightness);
        p.rect(x, y, 2, 1);
      }
      
      // Campo derecho
      const roadRightAtY = CONFIG.vanishX + roadWidthAtY / 2;
      for (let x = roadRightAtY; x < CANVAS_WIDTH; x += 2) {
        const noiseVal = p.noise(x * 0.01, y * 0.01);
        const brightness = noiseVal * 20; // Aumentado de 10 a 20
        
        p.fill(r + brightness, g + brightness, b + brightness);
        p.rect(x, y, 2, 1);
      }
    }
    
    // Pequeños detalles (vegetación/piedras) - mucho más visibles de día
    p.fill(120, 100, 80);
    for (const detail of fieldDetails) {
      const scale = getRoadScaleAtY(detail.y);
      
      // Verificar que no esté sobre la carretera
      const roadWidthAtY = CONFIG.roadWidthNear * scale;
      const roadLeftAtY = CONFIG.vanishX - roadWidthAtY / 2;
      const roadRightAtY = CONFIG.vanishX + roadWidthAtY / 2;
      
      if (detail.x < roadLeftAtY || detail.x > roadRightAtY) {
        const size = detail.size * scale;
        p.circle(detail.x, detail.y, size);
      }
    }
    
    p.pop();
  }
  
  function renderRoad() {
    p.push();
    
    const vanishX = CONFIG.vanishX;
    const horizonY = CONFIG.horizonY;
    
    // Dibujar asfalto (trapecio) - más claro de día
    p.noStroke();
    p.fill(60, 60, 65);
    
    // Trapecio desde primer plano hasta punto de fuga
    const roadWidthNear = CONFIG.roadWidthNear;
    const roadLeftNear = vanishX - roadWidthNear / 2;
    const roadRightNear = vanishX + roadWidthNear / 2;
    
    p.beginShape();
    p.vertex(roadLeftNear, CANVAS_HEIGHT);
    p.vertex(roadRightNear, CANVAS_HEIGHT);
    p.vertex(vanishX, horizonY);
    p.endShape(p.CLOSE);
    
    // Textura sutil del asfalto
    p.fill(70, 70, 75, 30);
    for (let y = horizonY + 10; y < CANVAS_HEIGHT; y += 5) {
      const scale = getRoadScaleAtY(y);
      const roadWidthAtY = roadWidthNear * scale;
      const roadLeftAtY = vanishX - roadWidthAtY / 2;
      
      for (let x = roadLeftAtY; x < vanishX + roadWidthAtY / 2; x += 10) {
        const noiseVal = p.noise(x * 0.02, y * 0.02);
        if (noiseVal > 0.5) {
          p.rect(x, y, 3, 2);
        }
      }
    }
    
    // Bordes de la carretera - más visibles de día
    p.stroke(100, 100, 110);
    p.strokeWeight(2);
    p.line(roadLeftNear, CANVAS_HEIGHT, vanishX, horizonY);
    p.line(roadRightNear, CANVAS_HEIGHT, vanishX, horizonY);
    
    // Marcas viales centrales (discontinuas) - amarillas de día
    p.stroke(255, 220, 0, CONFIG.laneBrightness * 255);
    p.strokeWeight(3);
    
    // Dibujar marcas viales con perspectiva correcta
    // Iterar desde el primer plano hacia el horizonte
    let y = CANVAS_HEIGHT;
    let isDash = true; // Alternar entre guión y gap
    
    while (y > horizonY + 5) { // +5 para evitar problemas de precisión
      const scale = getRoadScaleAtY(y);
      
      if (isDash) {
        // Dibujar guión
        const dashLength = CONFIG.laneDashLengthNear * scale;
        const dashEndY = y - dashLength;
        
        if (dashEndY > horizonY) {
          p.line(vanishX, y, vanishX, dashEndY);
        }
        
        y = dashEndY;
        isDash = false; // Siguiente será gap
      } else {
        // Saltar el gap
        const gapLength = CONFIG.laneDashGapNear * scale;
        y -= gapLength;
        isDash = true; // Siguiente será guión
      }
    }
    
    p.pop();
  }
  
  function postFX() {
    // Viñeta
    p.push();
    p.noStroke();
    p.fill(0, CONFIG.grainAmount * 50);
    
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CONFIG.horizonY;
    const maxRadius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    for (let r = maxRadius; r > 0; r -= 10) {
      const alpha = (1 - r / maxRadius) * CONFIG.grainAmount * 50;
      p.fill(0, alpha);
      p.circle(centerX, centerY, r * 2);
    }
    
    // Grano final (determinístico)
    p.fill(255);
    for (const grain of grainPositions) {
      p.fill(255, grain.alpha);
      p.circle(grain.x, grain.y, 1);
    }
    
    p.pop();
  }
  
  // ============================================
  // SETUP Y DRAW
  // ============================================

  p.setup = () => {
    // p5.brush requiere WebGL
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, p.WEBGL);
    p.frameRate(FPS);
    p.colorMode(p.RGB, 255);
    
    // Cargar brush después de crear el canvas WebGL
    brush.load(); // Cargar brush en el canvas principal
    
    // Configurar grabador para exportar video
    setupRecorder(p, LOOP_DURATION, FPS);
    
    // Generar escena inicial
    regenerate();
  };

  p.draw = () => {
    // Limpiar canvas antes de renderizar (evita acumulación de frames en WebGL)
    p.background(150, 210, 255);
    
    // En WebGL, trasladar el origen al esquina superior izquierda
    // para mantener el sistema de coordenadas 2D
    p.push();
    p.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
    
    // Modulación sutil con mouse
    const mouseModX = p.mouseX / CANVAS_WIDTH;
    const mouseModY = p.mouseY / CANVAS_HEIGHT;
    
    const currentVanishX = CONFIG.vanishX + (mouseModX - 0.5) * 100;
    const currentHazeStrength = CONFIG.hazeStrength + (mouseModY - 0.5) * 0.2;
    
    // Guardar configuración temporal
    const originalVanishX = CONFIG.vanishX;
    const originalHazeStrength = CONFIG.hazeStrength;
    
    CONFIG.vanishX = currentVanishX;
    CONFIG.hazeStrength = Math.max(0, Math.min(1, currentHazeStrength));
    
    // Renderizar en orden de capas (edificios detrás del horizonte)
    renderSky();
    renderSkyline();  // Edificios primero, detrás del horizonte
    renderHaze();     // Haze sobre los edificios lejanos
    renderField();     // Campo delante
    renderRoad();      // Carretera delante
    postFX();
    
    // Restaurar configuración
    CONFIG.vanishX = originalVanishX;
    CONFIG.hazeStrength = originalHazeStrength;
    
    p.pop();
  };

  p.keyPressed = () => {
    if (p.key === 'r' || p.key === 'R') {
      regenerate();
      console.log(`🔄 Regenerando con seed: ${seed}`);
    }
    
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
