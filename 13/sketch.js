import p5 from 'p5';
import { setupRecorder } from '../shared/recorder.js';

// Genuary 2026 - Día 13
// Prompt: LOW-RES SELF PORTRAIT (VIDEO REAL-TIME)
// Autorretrato generativo en tiempo real a partir de la webcam

const LOOP_DURATION = 6;
const FPS = 30;

// Límites globales
const MIN_SEEDS = 30;
const MAX_SEEDS = 400;
const MIN_ANALYSIS_SCALE = 0.1;
const MAX_ANALYSIS_SCALE = 0.5;

// Parámetros por defecto optimizados para 30 FPS
const DEFAULTS = {
  // Captura + preprocesado
  analysisScale: 0.22,
  blurAmount: 0,
  
  // Zona "cara" (elipse centrada)
  faceOvalScaleX: 0.75,
  faceOvalScaleY: 0.95,
  faceFollow: 0.5,
  useFaceOval: false,
  
  // Detección de features (seeds)
  featureStep: 4,
  interestThreshold: 15,
  maxSeeds: 180,
  featureRefreshRate: 10,  // cada N frames
  minSeedSeparation: 1.3,  // multiplicador del featureStep
  
  // Tracking temporal
  trackingRadius: 5,
  trackingStrength: 0.8,
  trackingDropThreshold: 25,
  seedLifetime: 20,
  
  // Malla (triangulación)
  meshRebuildRate: 12,
  meshStabilityBias: 0.6,
  
  // Física 2D
  physicsStrength: 0.6,
  constraintIterations: 3,
  centerAttraction: 0.025,
  repulsion: 0.05,
  
  // Relaxation
  smoothing: 0.1,
  jitterDamping: 0.35,
  
  // Color
  colorMode: 'face',
  colorSmoothing: 0.7,
  
  // Return to origin
  returnStrength: 0.15,
  anchorUpdateRate: 15,
  
  // Voronoi
  voronoiScale: 5,
  voronoiStep: 1,
  
  // Segmentación (fondo/figura)
  fgThreshold: 20,
  fgEdgeThreshold: 25,
  bgLearningRate: 0.03,
  
  // Estética
  strokeWeight: 0.5,
  showStroke: false
};

// Paletas de color para el fondo
const PALETTES = [
  {
    name: 'natural',
    colors: [
      [15, 12, 10],
      [45, 35, 30],
      [90, 75, 65],
      [180, 160, 140],
      [240, 230, 220]
    ]
  },
  {
    name: 'neon',
    colors: [
      [15, 10, 40],
      [70, 25, 110],
      [200, 50, 150],
      [255, 150, 100],
      [255, 230, 150]
    ]
  },
  {
    name: 'cyber',
    colors: [
      [5, 5, 15],
      [10, 40, 80],
      [0, 180, 200],
      [100, 255, 200],
      [220, 255, 250]
    ]
  },
  {
    name: 'infra',
    colors: [
      [5, 0, 10],
      [60, 0, 30],
      [180, 20, 40],
      [255, 100, 50],
      [255, 220, 180]
    ]
  },
  {
    name: 'cosmos',
    colors: [
      [3, 5, 15],
      [30, 25, 100],
      [70, 150, 220],
      [180, 220, 255],
      [255, 250, 240]
    ]
  },
  {
    name: 'monochrome',
    colors: [
      [5, 5, 5],
      [40, 40, 40],
      [100, 100, 100],
      [180, 180, 180],
      [250, 250, 250]
    ]
  }
];

// Presets de variación
const PRESETS = [
  {
    name: 'suave',
    description: 'Más humano, estable',
    maxSeeds: 120,
    smoothing: 0.25,
    returnStrength: 0.25,
    colorSmoothing: 0.85,
    trackingRadius: 4,
    repulsion: 0.03,
    constraintIterations: 4,
    jitterDamping: 0.5
  },
  {
    name: 'expresivo',
    description: 'Más abstracto, dinámico',
    maxSeeds: 250,
    smoothing: 0.08,
    returnStrength: 0.08,
    colorSmoothing: 0.5,
    trackingRadius: 6,
    repulsion: 0.15,
    constraintIterations: 2,
    jitterDamping: 0.2
  },
  {
    name: 'glitch',
    description: 'Identidad inestable',
    maxSeeds: 200,
    smoothing: 0.05,
    returnStrength: 0.04,
    colorSmoothing: 0.3,
    trackingRadius: 2,
    featureRefreshRate: 4,
    repulsion: 0.2,
    trackingDropThreshold: 15,
    seedLifetime: 10
  }
];

// Estados del sistema
const STATE = {
  LIVE: 'LIVE',
  FREEZE: 'FREEZE',
  MUTATE: 'MUTATE',
  CAPTURE: 'CAPTURE'
};

// Modos de render
const MODE = {
  LOWPOLY: 'LOWPOLY',
  VORONOI: 'VORONOI'
};

const sketch = (p) => {
  // Buffers y video
  let video;
  let analysisBuffer;
  let camBuffer;
  let voronoiBuffer;
  
  // Dimensiones
  let faceCenter = { x: 0, y: 0 };
  let analysisSize = { w: 0, h: 0 };
  let videoSize = { w: 0, h: 0 };
  let renderRect = { x: 0, y: 0, w: 0, h: 0 };
  
  // Seeds y malla
  let seeds = [];
  let meshTriangles = [];
  let meshEdges = [];
  let needsMeshRebuild = true;
  
  // Estado
  let params = { ...DEFAULTS };
  let state = STATE.LIVE;
  let mode = MODE.LOWPOLY;
  let presetIndex = 0;
  let paletteIndex = 0;
  let showHelp = true;
  let showDebug = false;
  
  // Contadores
  let lastAnchorUpdate = 0;
  let lastFeatureRefresh = 0;
  let lastMeshRebuild = 0;
  
  // Modelo de fondo
  let bgModel = null;
  let bgInitialized = false;
  let bgPaletteBuffer;
  
  // FPS tracking
  let fpsHistory = [];
  let avgFps = 30;
  
  // ============================================
  // UTILIDADES
  // ============================================
  
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist2 = (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2;
  
  // ============================================
  // SEED FACTORY
  // ============================================
  
  const createSeed = (x, y, luma, fixed = false) => ({
    pos: { x, y },
    prev: { x, y },
    anchor: { x, y },
    luma,
    color: [128, 128, 128],
    bgColor: [0, 0, 0],
    isForeground: true,
    misses: 0,
    fixed,
    age: 0
  });
  
  // ============================================
  // BUFFER MANAGEMENT
  // ============================================
  
  const ensureBuffers = () => {
    if (!video || video.width === 0 || video.height === 0) return false;
    
    const nextVideoW = video.width;
    const nextVideoH = video.height;
    
    if (nextVideoW !== videoSize.w || nextVideoH !== videoSize.h) {
      videoSize = { w: nextVideoW, h: nextVideoH };
      camBuffer = p.createGraphics(videoSize.w, videoSize.h);
      camBuffer.pixelDensity(1);
    }
    
    const nextAnalysisW = Math.max(1, Math.floor(videoSize.w * params.analysisScale));
    const nextAnalysisH = Math.max(1, Math.floor(videoSize.h * params.analysisScale));
    
    if (nextAnalysisW !== analysisSize.w || nextAnalysisH !== analysisSize.h) {
      analysisSize = { w: nextAnalysisW, h: nextAnalysisH };
      analysisBuffer = p.createGraphics(analysisSize.w, analysisSize.h);
      analysisBuffer.pixelDensity(1);
      faceCenter = { x: analysisSize.w * 0.5, y: analysisSize.h * 0.5 };
      bgModel = null;
      bgInitialized = false;
      bgPaletteBuffer = p.createGraphics(analysisSize.w, analysisSize.h);
      bgPaletteBuffer.pixelDensity(1);
      needsMeshRebuild = true;
      seeds = [];
    }
    
    const nextVoronoiW = Math.max(1, Math.floor(p.width / params.voronoiScale));
    const nextVoronoiH = Math.max(1, Math.floor(p.height / params.voronoiScale));
    
    if (!voronoiBuffer || voronoiBuffer.width !== nextVoronoiW || voronoiBuffer.height !== nextVoronoiH) {
      voronoiBuffer = p.createGraphics(nextVoronoiW, nextVoronoiH);
      voronoiBuffer.pixelDensity(1);
    }
    
    return true;
  };
  
  const computeRenderRect = () => {
    if (!videoSize.w || !videoSize.h) return;
    const scale = Math.max(p.width / videoSize.w, p.height / videoSize.h);
    renderRect.w = videoSize.w * scale;
    renderRect.h = videoSize.h * scale;
    renderRect.x = (p.width - renderRect.w) * 0.5;
    renderRect.y = (p.height - renderRect.h) * 0.5;
  };
  
  // ============================================
  // COORDINATE TRANSFORMS
  // ============================================
  
  const analysisToVideo = (x, y) => ({
    x: (x / analysisSize.w) * videoSize.w,
    y: (y / analysisSize.h) * videoSize.h
  });
  
  const analysisToRender = (x, y) => {
    const videoPos = analysisToVideo(x, y);
    return {
      x: renderRect.x + (videoPos.x / videoSize.w) * renderRect.w,
      y: renderRect.y + (videoPos.y / videoSize.h) * renderRect.h
    };
  };
  
  // ============================================
  // PIXEL ACCESS
  // ============================================
  
  const getPixelIndex = (x, y, width) => (y * width + x) * 4;
  
  const getLuma = (x, y, pixels, width, height) => {
    const ix = clamp(Math.floor(x), 0, width - 1);
    const iy = clamp(Math.floor(y), 0, height - 1);
    const idx = getPixelIndex(ix, iy, width);
    return 0.2126 * pixels[idx] + 0.7152 * pixels[idx + 1] + 0.0722 * pixels[idx + 2];
  };
  
  const getGradient = (x, y, pixels, width, height) => {
    const l1 = getLuma(x + 1, y, pixels, width, height);
    const l2 = getLuma(x - 1, y, pixels, width, height);
    const l3 = getLuma(x, y + 1, pixels, width, height);
    const l4 = getLuma(x, y - 1, pixels, width, height);
    return Math.abs(l1 - l2) + Math.abs(l3 - l4);
  };
  
  const getColor = (x, y, pixels, width, height) => {
    const ix = clamp(Math.floor(x), 0, width - 1);
    const iy = clamp(Math.floor(y), 0, height - 1);
    const idx = getPixelIndex(ix, iy, width);
    return [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
  };
  
  // ============================================
  // FACE OVAL (zona de interés)
  // ============================================
  
  const insideOval = (x, y) => {
    if (!params.useFaceOval) return true;
    const dx = x - faceCenter.x;
    const dy = y - faceCenter.y;
    const rx = analysisSize.w * params.faceOvalScaleX * 0.5;
    const ry = analysisSize.h * params.faceOvalScaleY * 0.5;
    if (rx === 0 || ry === 0) return false;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  };
  
  const updateFaceCenter = (pixels) => {
    if (params.faceFollow <= 0) return;
    
    const step = Math.max(2, params.featureStep);
    let sumX = 0, sumY = 0, sumW = 0;
    
    for (let y = step; y < analysisSize.h - step; y += step) {
      for (let x = step; x < analysisSize.w - step; x += step) {
        const g = getGradient(x, y, pixels, analysisSize.w, analysisSize.h);
        if (g < params.interestThreshold) continue;
        sumX += x * g;
        sumY += y * g;
        sumW += g;
      }
    }
    
    if (sumW > 0) {
      faceCenter.x = lerp(faceCenter.x, sumX / sumW, params.faceFollow * 0.1);
      faceCenter.y = lerp(faceCenter.y, sumY / sumW, params.faceFollow * 0.1);
    }
  };
  
  // ============================================
  // BOUNDARY SEEDS (bordes del frame)
  // ============================================
  
  const addBoundarySeeds = (collection) => {
    const pad = 2;
    const step = Math.max(8, params.featureStep * 3);
    const corners = [
      { x: pad, y: pad },
      { x: analysisSize.w - 1 - pad, y: pad },
      { x: analysisSize.w - 1 - pad, y: analysisSize.h - 1 - pad },
      { x: pad, y: analysisSize.h - 1 - pad }
    ];
    
    // Añadir esquinas
    corners.forEach(c => collection.push(createSeed(c.x, c.y, 0, true)));
    
    // Añadir bordes
    for (let x = pad + step; x < analysisSize.w - pad - step; x += step) {
      collection.push(createSeed(x, pad, 0, true));
      collection.push(createSeed(x, analysisSize.h - 1 - pad, 0, true));
    }
    for (let y = pad + step; y < analysisSize.h - pad - step; y += step) {
      collection.push(createSeed(pad, y, 0, true));
      collection.push(createSeed(analysisSize.w - 1 - pad, y, 0, true));
    }
  };
  
  // ============================================
  // FEATURE DETECTION (NO cada frame)
  // ============================================
  
  const detectFeatures = () => {
    if (!analysisBuffer) return;
    
    analysisBuffer.loadPixels();
    const pixels = analysisBuffer.pixels;
    updateFaceCenter(pixels);
    
    const newSeeds = [];
    const minSep = params.featureStep * params.minSeedSeparation;
    const minSep2 = minSep * minSep;
    
    // Muestreo por gradiente de interés
    for (let y = params.featureStep; y < analysisSize.h - params.featureStep; y += params.featureStep) {
      for (let x = params.featureStep; x < analysisSize.w - params.featureStep; x += params.featureStep) {
        if (!insideOval(x, y)) continue;
        
        const g = getGradient(x, y, pixels, analysisSize.w, analysisSize.h);
        if (g < params.interestThreshold) continue;
        
        // Probabilidad basada en interés
        if (p.random() > g / 80) continue;
        
        // Verificar separación mínima
        let tooClose = false;
        for (let i = 0; i < newSeeds.length; i++) {
          if (dist2(newSeeds[i].pos.x, newSeeds[i].pos.y, x, y) < minSep2) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;
        
        const luma = getLuma(x, y, pixels, analysisSize.w, analysisSize.h);
        newSeeds.push(createSeed(x, y, luma));
        
        if (newSeeds.length >= params.maxSeeds) break;
      }
      if (newSeeds.length >= params.maxSeeds) break;
    }
    
    // Añadir seeds en zonas de bajo interés si hay pocos
    if (newSeeds.length < params.maxSeeds * 0.5) {
      for (let y = params.featureStep * 2; y < analysisSize.h - params.featureStep * 2; y += params.featureStep * 2) {
        for (let x = params.featureStep * 2; x < analysisSize.w - params.featureStep * 2; x += params.featureStep * 2) {
          if (!insideOval(x, y)) continue;
          if (p.random() > 0.3) continue;
          
          let tooClose = false;
          for (let i = 0; i < newSeeds.length; i++) {
            if (dist2(newSeeds[i].pos.x, newSeeds[i].pos.y, x, y) < minSep2 * 4) {
              tooClose = true;
              break;
            }
          }
          if (tooClose) continue;
          
          const luma = getLuma(x, y, pixels, analysisSize.w, analysisSize.h);
          newSeeds.push(createSeed(x, y, luma));
          
          if (newSeeds.length >= params.maxSeeds) break;
        }
        if (newSeeds.length >= params.maxSeeds) break;
      }
    }
    
    addBoundarySeeds(newSeeds);
    seeds = newSeeds;
    needsMeshRebuild = true;
    lastFeatureRefresh = p.frameCount;
  };
  
  // ============================================
  // TRACKING TEMPORAL (por frame, ligero)
  // ============================================
  
  const trackSeeds = () => {
    if (!analysisBuffer) return;
    
    analysisBuffer.loadPixels();
    const pixels = analysisBuffer.pixels;
    const tracked = [];
    
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      seed.age++;
      
      if (seed.fixed) {
        tracked.push(seed);
        continue;
      }
      
      // Buscar mejor match en radio de tracking
      let bestX = seed.pos.x;
      let bestY = seed.pos.y;
      let bestScore = Infinity;
      let bestLuma = seed.luma;
      
      for (let dy = -params.trackingRadius; dy <= params.trackingRadius; dy++) {
        for (let dx = -params.trackingRadius; dx <= params.trackingRadius; dx++) {
          const cx = seed.pos.x + dx;
          const cy = seed.pos.y + dy;
          
          if (cx < 0 || cx >= analysisSize.w || cy < 0 || cy >= analysisSize.h) continue;
          if (!insideOval(cx, cy)) continue;
          
          const luma = getLuma(cx, cy, pixels, analysisSize.w, analysisSize.h);
          const score = Math.abs(luma - seed.luma);
          
          if (score < bestScore) {
            bestScore = score;
            bestX = cx;
            bestY = cy;
            bestLuma = luma;
          }
        }
      }
      
      // Actualizar misses
      if (bestScore > params.trackingDropThreshold) {
        seed.misses++;
      } else {
        seed.misses = Math.max(0, seed.misses - 1);
      }
      
      // Eliminar si pierde tracking
      if (seed.misses > params.seedLifetime) continue;
      
      // Interpolar posición
      seed.pos.x = lerp(seed.pos.x, bestX, params.trackingStrength);
      seed.pos.y = lerp(seed.pos.y, bestY, params.trackingStrength);
      seed.luma = lerp(seed.luma, bestLuma, 0.5);
      
      tracked.push(seed);
    }
    
    seeds = tracked;
  };
  
  // ============================================
  // MESH (TRIANGULACIÓN) - NO cada frame
  // ============================================
  
  const buildMesh = () => {
    if (seeds.length < 3) {
      meshTriangles = [];
      meshEdges = [];
      return;
    }
    
    const points = seeds.map(s => ({ x: s.pos.x, y: s.pos.y }));
    meshTriangles = delaunay(points);
    meshEdges = edgesFromTriangles(meshTriangles);
    needsMeshRebuild = false;
    lastMeshRebuild = p.frameCount;
  };
  
  const edgesFromTriangles = (triangles) => {
    const edgeMap = new Map();
    
    const addEdge = (a, b) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!edgeMap.has(key)) edgeMap.set(key, { a, b });
    };
    
    triangles.forEach(tri => {
      addEdge(tri[0], tri[1]);
      addEdge(tri[1], tri[2]);
      addEdge(tri[2], tri[0]);
    });
    
    return Array.from(edgeMap.values()).map(edge => {
      const s0 = seeds[edge.a];
      const s1 = seeds[edge.b];
      const dx = s1.pos.x - s0.pos.x;
      const dy = s1.pos.y - s0.pos.y;
      return { ...edge, rest: Math.hypot(dx, dy) };
    });
  };
  
  // ============================================
  // FÍSICA 2D (por frame, optimizada)
  // ============================================
  
  const applyPhysics = () => {
    // Verlet integration + constraints
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      
      if (seed.fixed) {
        seed.pos.x = seed.anchor.x;
        seed.pos.y = seed.anchor.y;
        seed.prev.x = seed.anchor.x;
        seed.prev.y = seed.anchor.y;
        continue;
      }
      
      // Velocidad con damping
      const vx = (seed.pos.x - seed.prev.x) * (1 - params.jitterDamping);
      const vy = (seed.pos.y - seed.prev.y) * (1 - params.jitterDamping);
      
      seed.prev.x = seed.pos.x;
      seed.prev.y = seed.pos.y;
      
      // Integración
      seed.pos.x += vx * params.physicsStrength;
      seed.pos.y += vy * params.physicsStrength;
      
      // Atracción al centro
      seed.pos.x += (faceCenter.x - seed.pos.x) * params.centerAttraction;
      seed.pos.y += (faceCenter.y - seed.pos.y) * params.centerAttraction;
      
      // Return to anchor
      seed.pos.x = lerp(seed.pos.x, seed.anchor.x, params.returnStrength);
      seed.pos.y = lerp(seed.pos.y, seed.anchor.y, params.returnStrength);
      
      // Smoothing temporal
      seed.pos.x = lerp(seed.pos.x, seed.prev.x, params.smoothing);
      seed.pos.y = lerp(seed.pos.y, seed.prev.y, params.smoothing);
    }
    
    // Constraint iterations
    for (let iter = 0; iter < params.constraintIterations; iter++) {
      // Edge constraints
      for (let i = 0; i < meshEdges.length; i++) {
        const edge = meshEdges[i];
        const a = seeds[edge.a];
        const b = seeds[edge.b];
        if (!a || !b) continue;
        
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const dist = Math.max(0.001, Math.hypot(dx, dy));
        const diff = (dist - edge.rest) / dist * 0.5;
        
        const offsetX = dx * diff;
        const offsetY = dy * diff;
        
        if (!a.fixed) {
          a.pos.x += offsetX;
          a.pos.y += offsetY;
        }
        if (!b.fixed) {
          b.pos.x -= offsetX;
          b.pos.y -= offsetY;
        }
        
        // Repulsión si están muy cerca
        if (params.repulsion > 0 && dist < edge.rest * 0.7) {
          const repel = ((edge.rest * 0.7 - dist) / dist) * params.repulsion;
          if (!a.fixed) {
            a.pos.x -= dx * repel * 0.5;
            a.pos.y -= dy * repel * 0.5;
          }
          if (!b.fixed) {
            b.pos.x += dx * repel * 0.5;
            b.pos.y += dy * repel * 0.5;
          }
        }
      }
      
      // Boundary constraints
      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        if (seed.fixed) continue;
        
        if (params.useFaceOval) {
          const rx = analysisSize.w * params.faceOvalScaleX * 0.5;
          const ry = analysisSize.h * params.faceOvalScaleY * 0.5;
          const dx = seed.pos.x - faceCenter.x;
          const dy = seed.pos.y - faceCenter.y;
          const norm = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
          if (norm > 1) {
            const scale = 1 / Math.sqrt(norm);
            seed.pos.x = faceCenter.x + dx * scale;
            seed.pos.y = faceCenter.y + dy * scale;
          }
        } else {
          seed.pos.x = clamp(seed.pos.x, 1, analysisSize.w - 2);
          seed.pos.y = clamp(seed.pos.y, 1, analysisSize.h - 2);
        }
      }
    }
  };
  
  // ============================================
  // ANCHORS UPDATE
  // ============================================
  
  const updateAnchors = () => {
    if (p.frameCount - lastAnchorUpdate < params.anchorUpdateRate) return;
    lastAnchorUpdate = p.frameCount;
    
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      if (seed.fixed) continue;
      seed.anchor.x = lerp(seed.anchor.x, seed.pos.x, 0.5);
      seed.anchor.y = lerp(seed.anchor.y, seed.pos.y, 0.5);
    }
  };
  
  // ============================================
  // COLOR SAMPLING
  // ============================================
  
  const sampleColors = () => {
    if (!camBuffer) return;
    
    camBuffer.loadPixels();
    const pixels = camBuffer.pixels;
    
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const videoPos = analysisToVideo(seed.pos.x, seed.pos.y);
      const color = getColor(videoPos.x, videoPos.y, pixels, videoSize.w, videoSize.h);
      
      // Smooth color transition
      seed.color[0] = lerp(seed.color[0], color[0], params.colorSmoothing);
      seed.color[1] = lerp(seed.color[1], color[1], params.colorSmoothing);
      seed.color[2] = lerp(seed.color[2], color[2], params.colorSmoothing);
    }
  };
  
  // ============================================
  // SEGMENTACIÓN FONDO/FIGURA
  // ============================================
  
  const samplePalette = (luma, palette) => {
    const t = (luma / 255) * (palette.length - 1);
    const i = Math.floor(t);
    const f = t - i;
    const c0 = palette[i] || palette[0];
    const c1 = palette[Math.min(i + 1, palette.length - 1)];
    return [
      lerp(c0[0], c1[0], f),
      lerp(c0[1], c1[1], f),
      lerp(c0[2], c1[2], f)
    ];
  };
  
  const updateSegmentation = () => {
    if (!analysisBuffer || !bgPaletteBuffer) return;
    
    analysisBuffer.loadPixels();
    const pixels = analysisBuffer.pixels;
    const total = analysisSize.w * analysisSize.h;
    
    // Inicializar modelo de fondo
    if (!bgModel || bgModel.length !== total * 3) {
      bgModel = new Float32Array(total * 3);
      bgInitialized = false;
    }
    
    // Actualizar modelo de fondo
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const modelIdx = i * 3;
      
      if (!bgInitialized) {
        bgModel[modelIdx] = r;
        bgModel[modelIdx + 1] = g;
        bgModel[modelIdx + 2] = b;
      }
      
      const br = bgModel[modelIdx];
      const bg = bgModel[modelIdx + 1];
      const bb = bgModel[modelIdx + 2];
      const diff = (Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb)) / 3;
      
      // Solo actualizar modelo si es fondo
      if (diff < params.fgThreshold) {
        bgModel[modelIdx] = lerp(br, r, params.bgLearningRate);
        bgModel[modelIdx + 1] = lerp(bg, g, params.bgLearningRate);
        bgModel[modelIdx + 2] = lerp(bb, b, params.bgLearningRate);
      }
    }
    bgInitialized = true;
    
    // Generar buffer de paleta para fondo
    const palette = PALETTES[paletteIndex]?.colors || PALETTES[0].colors;
    bgPaletteBuffer.loadPixels();
    const palettePixels = bgPaletteBuffer.pixels;
    
    for (let i = 0; i < total; i++) {
      const modelIdx = i * 3;
      const br = bgModel[modelIdx];
      const bg = bgModel[modelIdx + 1];
      const bb = bgModel[modelIdx + 2];
      const luma = 0.2126 * br + 0.7152 * bg + 0.0722 * bb;
      const [pr, pg, pb] = samplePalette(luma, palette);
      
      const idx = i * 4;
      palettePixels[idx] = pr;
      palettePixels[idx + 1] = pg;
      palettePixels[idx + 2] = pb;
      palettePixels[idx + 3] = 255;
    }
    bgPaletteBuffer.updatePixels();
    
    // Actualizar estado foreground de seeds
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const ix = clamp(Math.floor(seed.pos.x), 0, analysisSize.w - 1);
      const iy = clamp(Math.floor(seed.pos.y), 0, analysisSize.h - 1);
      const pixelIdx = getPixelIndex(ix, iy, analysisSize.w);
      const modelIdx = (iy * analysisSize.w + ix) * 3;
      
      if (seed.fixed) {
        seed.isForeground = false;
      } else {
        const r = pixels[pixelIdx];
        const g = pixels[pixelIdx + 1];
        const b = pixels[pixelIdx + 2];
        const br = bgModel[modelIdx];
        const bg = bgModel[modelIdx + 1];
        const bb = bgModel[modelIdx + 2];
        const diff = (Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb)) / 3;
        const edge = getGradient(ix, iy, pixels, analysisSize.w, analysisSize.h);
        seed.isForeground = diff > params.fgThreshold || edge > params.fgEdgeThreshold;
      }
      
      // Color de fondo desde paleta
      const luma = 0.2126 * bgModel[modelIdx] + 0.7152 * bgModel[modelIdx + 1] + 0.0722 * bgModel[modelIdx + 2];
      const [pr, pg, pb] = samplePalette(luma, palette);
      seed.bgColor[0] = lerp(seed.bgColor[0], pr, 0.3);
      seed.bgColor[1] = lerp(seed.bgColor[1], pg, 0.3);
      seed.bgColor[2] = lerp(seed.bgColor[2], pb, 0.3);
    }
  };
  
  // ============================================
  // RENDER: LOW-POLY
  // ============================================
  
  const drawLowPoly = () => {
    if (params.showStroke) {
      p.stroke(0, 30);
      p.strokeWeight(params.strokeWeight);
    } else {
      p.noStroke();
    }
    
    for (let i = 0; i < meshTriangles.length; i++) {
      const [ia, ib, ic] = meshTriangles[i];
      const a = seeds[ia];
      const b = seeds[ib];
      const c = seeds[ic];
      if (!a || !b || !c) continue;
      
      // Determinar si es foreground
      const fg = a.isForeground || b.isForeground || c.isForeground;
      
      // Color promedio de los vértices
      const ca = fg ? a.color : a.bgColor;
      const cb = fg ? b.color : b.bgColor;
      const cc = fg ? c.color : c.bgColor;
      
      const r = (ca[0] + cb[0] + cc[0]) / 3;
      const g = (ca[1] + cb[1] + cc[1]) / 3;
      const bl = (ca[2] + cb[2] + cc[2]) / 3;
      
      p.fill(r, g, bl);
      
      const ra = analysisToRender(a.pos.x, a.pos.y);
      const rb = analysisToRender(b.pos.x, b.pos.y);
      const rc = analysisToRender(c.pos.x, c.pos.y);
      
      p.triangle(ra.x, ra.y, rb.x, rb.y, rc.x, rc.y);
    }
  };
  
  // ============================================
  // RENDER: VORONOI
  // ============================================
  
  const drawVoronoi = () => {
    if (!voronoiBuffer || seeds.length === 0) return;
    
    voronoiBuffer.noStroke();
    voronoiBuffer.background(0);
    
    const scaleX = voronoiBuffer.width / p.width;
    const scaleY = voronoiBuffer.height / p.height;
    
    // Cache de posiciones transformadas
    const cached = seeds.map(seed => {
      const pos = analysisToRender(seed.pos.x, seed.pos.y);
      return {
        x: pos.x * scaleX,
        y: pos.y * scaleY,
        color: seed.isForeground ? seed.color : seed.bgColor
      };
    });
    
    // Render por bloques
    const step = params.voronoiStep;
    for (let y = 0; y < voronoiBuffer.height; y += step) {
      for (let x = 0; x < voronoiBuffer.width; x += step) {
        let closest = null;
        let best = Infinity;
        
        for (let i = 0; i < cached.length; i++) {
          const d2 = dist2(cached[i].x, cached[i].y, x, y);
          if (d2 < best) {
            best = d2;
            closest = cached[i];
          }
        }
        
        if (!closest) continue;
        voronoiBuffer.fill(closest.color[0], closest.color[1], closest.color[2]);
        voronoiBuffer.rect(x, y, step, step);
      }
    }
    
    p.push();
    p.noSmooth();
    p.image(voronoiBuffer, 0, 0, p.width, p.height);
    p.pop();
  };
  
  // ============================================
  // RENDER: FONDO PSICODÉLICO
  // ============================================
  
  const drawPsyBackground = () => {
    if (!bgPaletteBuffer) return;
    p.push();
    p.noSmooth();
    p.image(bgPaletteBuffer, renderRect.x, renderRect.y, renderRect.w, renderRect.h);
    p.pop();
  };
  
  // ============================================
  // STATE UPDATE
  // ============================================
  
  const updateState = () => {
    if (state === STATE.FREEZE) return;
    
    // Feature detection (pesado, NO cada frame)
    if (seeds.length === 0 || p.frameCount - lastFeatureRefresh >= params.featureRefreshRate) {
      detectFeatures();
    } else {
      trackSeeds();
    }
    
    // Mesh rebuild (pesado, NO cada frame)
    const seedCountChanged = Math.abs(seeds.length - meshTriangles.length * 0.5) > 10;
    if (needsMeshRebuild || seedCountChanged || p.frameCount - lastMeshRebuild >= params.meshRebuildRate) {
      buildMesh();
    }
    
    // Physics, anchors, colors (ligero, cada frame)
    updateAnchors();
    applyPhysics();
    sampleColors();
  };
  
  // ============================================
  // PRESETS
  // ============================================
  
  const applyPreset = (index) => {
    const preset = PRESETS[index];
    Object.keys(preset).forEach(key => {
      if (key !== 'name' && key !== 'description') {
        params[key] = preset[key];
      }
    });
    needsMeshRebuild = true;
  };
  
  const randomizeParams = () => {
    params.maxSeeds = Math.floor(p.random(80, 280));
    params.smoothing = p.random(0.03, 0.25);
    params.returnStrength = p.random(0.02, 0.25);
    params.colorSmoothing = p.random(0.3, 0.9);
    params.repulsion = p.random(0.02, 0.2);
    params.trackingRadius = Math.floor(p.random(2, 8));
    needsMeshRebuild = true;
  };
  
  // ============================================
  // UI OVERLAY
  // ============================================
  
  const updateFps = () => {
    fpsHistory.push(p.frameRate());
    if (fpsHistory.length > 30) fpsHistory.shift();
    avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
  };
  
  const drawHelpOverlay = () => {
    const presetName = PRESETS[presetIndex]?.name || 'custom';
    const paletteName = PALETTES[paletteIndex]?.name || 'natural';
    const modeStr = mode === MODE.LOWPOLY ? 'Low-poly' : 'Voronoi';
    const stateStr = state === STATE.FREEZE ? '⏸ FREEZE' : '▶ LIVE';
    
    const lines = [
      `🎭 LOW-RES SELF PORTRAIT`,
      ``,
      `${stateStr} | ${modeStr} | ${presetName}`,
      `Paleta: ${paletteName} | FPS: ${avgFps.toFixed(1)}`,
      `Seeds: ${seeds.length}/${params.maxSeeds}`,
      ``,
      `─── CONTROLES ───`,
      `1: Low-poly`,
      `2: Voronoi`,
      `3: Freeze/Unfreeze`,
      `R: Cambiar preset`,
      `P: Cambiar paleta`,
      `X: Randomizar`,
      `[: - seeds | ]: + seeds`,
      `-: - resolución | +: + resolución`,
      `O: Toggle óvalo cara`,
      `T: Toggle stroke`,
      `S: Snapshot | Shift+S: Grabar`,
      `D: Ocultar ayuda`
    ];
    
    p.push();
    p.noStroke();
    
    const padding = 16;
    const lineHeight = 20;
    const boxWidth = 280;
    const boxHeight = padding * 2 + lineHeight * lines.length;
    
    // Fondo semitransparente
    p.fill(0, 0, 0, 180);
    p.rect(16, 16, boxWidth, boxHeight, 12);
    
    // Texto
    p.fill(255);
    p.textSize(13);
    p.textFont('monospace');
    p.textAlign(p.LEFT, p.TOP);
    
    for (let i = 0; i < lines.length; i++) {
      const alpha = lines[i].startsWith('─') ? 120 : 255;
      p.fill(255, alpha);
      p.text(lines[i], 16 + padding, 16 + padding + i * lineHeight);
    }
    
    p.pop();
  };
  
  const drawDebugOverlay = () => {
    p.push();
    p.noStroke();
    p.fill(255, 0, 0);
    p.textSize(10);
    
    // Dibujar seeds como puntos
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const pos = analysisToRender(seed.pos.x, seed.pos.y);
      p.fill(seed.isForeground ? [0, 255, 0] : [255, 0, 0]);
      p.ellipse(pos.x, pos.y, 4, 4);
    }
    
    // Óvalo de cara
    if (params.useFaceOval) {
      p.noFill();
      p.stroke(255, 255, 0, 100);
      p.strokeWeight(2);
      const center = analysisToRender(faceCenter.x, faceCenter.y);
      const rx = (params.faceOvalScaleX * analysisSize.w * 0.5 / analysisSize.w) * renderRect.w;
      const ry = (params.faceOvalScaleY * analysisSize.h * 0.5 / analysisSize.h) * renderRect.h;
      p.ellipse(center.x, center.y, rx * 2, ry * 2);
    }
    
    p.pop();
  };
  
  // ============================================
  // P5.JS LIFECYCLE
  // ============================================
  
  p.setup = () => {
    p.pixelDensity(1);
    // Asegurar dimensiones pares para compatibilidad con codecs de video
    const size = Math.floor(Math.min(p.windowWidth, p.windowHeight) / 2) * 2;
    p.createCanvas(size, size);
    p.frameRate(FPS);
    
    // Captura de video
    video = p.createCapture({ video: { facingMode: 'user' }, audio: false });
    video.size(640, 480);
    video.hide();
    
    setupRecorder(p, LOOP_DURATION, FPS);
    applyPreset(0);
  };
  
  p.draw = () => {
    p.background(10);
    
    if (!ensureBuffers()) return;
    computeRenderRect();
    
    if (!analysisBuffer || !camBuffer) return;
    
    // Capturar frame
    analysisBuffer.image(video, 0, 0, analysisSize.w, analysisSize.h);
    if (params.blurAmount > 0) {
      analysisBuffer.filter(p.BLUR, params.blurAmount);
    }
    camBuffer.image(video, 0, 0, videoSize.w, videoSize.h);
    
    // Actualizar estado
    if (state === STATE.LIVE || state === STATE.MUTATE) {
      updateState();
    }
    
    // Segmentación y fondo
    updateSegmentation();
    
    // Render según modo
    if (mode === MODE.LOWPOLY) {
      drawPsyBackground();
      drawLowPoly();
    } else {
      drawVoronoi();
    }
    
    // Debug overlay
    if (showDebug) {
      drawDebugOverlay();
    }
    
    // Help overlay
    if (showHelp) {
      updateFps();
      drawHelpOverlay();
    }
  };
  
  p.keyPressed = () => {
    switch (p.key) {
      case '1':
        mode = MODE.LOWPOLY;
        break;
      case '2':
        mode = MODE.VORONOI;
        break;
      case '3':
        state = state === STATE.FREEZE ? STATE.LIVE : STATE.FREEZE;
        break;
      case 'd':
      case 'D':
        showHelp = !showHelp;
        break;
      case 'g':
      case 'G':
        showDebug = !showDebug;
        break;
      case 'p':
      case 'P':
        paletteIndex = (paletteIndex + 1) % PALETTES.length;
        break;
      case 'r':
      case 'R':
        presetIndex = (presetIndex + 1) % PRESETS.length;
        applyPreset(presetIndex);
        state = STATE.MUTATE;
        setTimeout(() => { if (state === STATE.MUTATE) state = STATE.LIVE; }, 500);
        break;
      case 'x':
      case 'X':
        randomizeParams();
        break;
      case 'o':
      case 'O':
        params.useFaceOval = !params.useFaceOval;
        break;
      case 't':
      case 'T':
        params.showStroke = !params.showStroke;
        break;
      case '[':
        params.maxSeeds = Math.max(MIN_SEEDS, params.maxSeeds - 20);
        needsMeshRebuild = true;
        break;
      case ']':
        params.maxSeeds = Math.min(MAX_SEEDS, params.maxSeeds + 20);
        needsMeshRebuild = true;
        break;
      case '-':
        params.analysisScale = Math.max(MIN_ANALYSIS_SCALE, params.analysisScale - 0.02);
        break;
      case '+':
      case '=':
        params.analysisScale = Math.min(MAX_ANALYSIS_SCALE, params.analysisScale + 0.02);
        break;
      case 's':
      case 'S':
        if (p.keyIsDown(p.SHIFT)) {
          if (window.isRecording?.()) {
            console.warn('⚠️ Ya hay una grabación en curso');
            return;
          }
          if (window.startRecording) {
            console.log(`🔴 Iniciando grabación de ${LOOP_DURATION}s...`);
            window.startRecording();
          }
        } else {
          p.saveCanvas(`dia-13-lowres-portrait-${Date.now()}`, 'png');
        }
        break;
    }
  };
  
  p.windowResized = () => {
    const size = Math.floor(Math.min(p.windowWidth, p.windowHeight) / 2) * 2;
    p.resizeCanvas(size, size);
    computeRenderRect();
  };
  
  // ============================================
  // TRIANGULACIÓN DELAUNAY (Bowyer-Watson)
  // ============================================
  
  const delaunay = (points) => {
    const triangles = [];
    if (points.length < 3) return triangles;
    
    // Bounding box
    let minX = points[0].x, minY = points[0].y;
    let maxX = points[0].x, maxY = points[0].y;
    
    for (let i = 1; i < points.length; i++) {
      minX = Math.min(minX, points[i].x);
      minY = Math.min(minY, points[i].y);
      maxX = Math.max(maxX, points[i].x);
      maxY = Math.max(maxY, points[i].y);
    }
    
    const dx = maxX - minX;
    const dy = maxY - minY;
    const delta = Math.max(dx, dy);
    const midx = (minX + maxX) * 0.5;
    const midy = (minY + maxY) * 0.5;
    
    // Super triángulo
    const p0 = { x: midx - 20 * delta, y: midy - delta };
    const p1 = { x: midx, y: midy + 20 * delta };
    const p2 = { x: midx + 20 * delta, y: midy - delta };
    
    const superIndex = points.length;
    const pts = points.concat([p0, p1, p2]);
    let triangulation = [[superIndex, superIndex + 1, superIndex + 2]];
    
    // Insertar puntos uno a uno
    for (let i = 0; i < points.length; i++) {
      const point = pts[i];
      const badTriangles = [];
      
      for (let t = 0; t < triangulation.length; t++) {
        const tri = triangulation[t];
        if (circumcircleContains(point, pts[tri[0]], pts[tri[1]], pts[tri[2]])) {
          badTriangles.push(tri);
        }
      }
      
      const polygon = [];
      for (let t = 0; t < badTriangles.length; t++) {
        const tri = badTriangles[t];
        addBoundaryEdge(polygon, tri[0], tri[1]);
        addBoundaryEdge(polygon, tri[1], tri[2]);
        addBoundaryEdge(polygon, tri[2], tri[0]);
      }
      
      triangulation = triangulation.filter(tri => !badTriangles.includes(tri));
      
      for (let e = 0; e < polygon.length; e++) {
        const edge = polygon[e];
        triangulation.push([edge[0], edge[1], i]);
      }
    }
    
    // Filtrar triángulos que tocan el super triángulo
    for (let i = 0; i < triangulation.length; i++) {
      const tri = triangulation[i];
      if (tri[0] < superIndex && tri[1] < superIndex && tri[2] < superIndex) {
        triangles.push(tri);
      }
    }
    
    return triangles;
  };
  
  const addBoundaryEdge = (polygon, a, b) => {
    for (let i = 0; i < polygon.length; i++) {
      const edge = polygon[i];
      if ((edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a)) {
        polygon.splice(i, 1);
        return;
      }
    }
    polygon.push([a, b]);
  };
  
  const circumcircleContains = (pnt, a, b, c) => {
    const ax = a.x, ay = a.y;
    const bx = b.x, by = b.y;
    const cx = c.x, cy = c.y;
    
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 1e-10) return false;
    
    const ax2ay2 = ax * ax + ay * ay;
    const bx2by2 = bx * bx + by * by;
    const cx2cy2 = cx * cx + cy * cy;
    
    const ux = (ax2ay2 * (by - cy) + bx2by2 * (cy - ay) + cx2cy2 * (ay - by)) / d;
    const uy = (ax2ay2 * (cx - bx) + bx2by2 * (ax - cx) + cx2cy2 * (bx - ax)) / d;
    
    const dx = ux - ax;
    const dy = uy - ay;
    const r2 = dx * dx + dy * dy;
    
    const px = pnt.x - ux;
    const py = pnt.y - uy;
    
    return px * px + py * py <= r2;
  };
};

new p5(sketch, document.getElementById('canvas-container'));
