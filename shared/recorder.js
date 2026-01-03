/**
 * Sistema de grabación de loops usando MediaRecorder API (nativo del navegador)
 * 
 * Uso en sketch:
 *   import { setupRecorder } from '../shared/recorder.js';
 *   
 *   p.setup = () => {
 *     createCanvas(800, 800);
 *     setupRecorder(p, LOOP_DURATION, FPS);
 *   };
 *   
 *   // Presionar 'S' para grabar
 */

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingDuration = 0;
let recordingStartTime = 0;

/**
 * Configura el grabador para un sketch
 * @param {p5} p - Instancia de p5
 * @param {number} duration - Duración del loop en segundos
 * @param {number} fps - Frames por segundo
 */
export function setupRecorder(p, duration, fps = 60) {
  recordingDuration = duration * 1000; // Convertir a milisegundos
  
  // Exponer función global para iniciar grabación
  window.startRecording = () => startRecording(p, duration);
  window.stopRecording = () => stopRecording();
  window.isRecording = () => isRecording;
  
  console.log(`🎬 Recorder configurado: ${duration}s @ ${fps}fps`);
}

/**
 * Inicia la grabación
 * @param {p5} p - Instancia de p5
 * @param {number} duration - Duración en segundos
 */
export function startRecording(p, duration) {
  if (isRecording) {
    console.warn('⚠️ Ya hay una grabación en curso');
    return;
  }

  const canvas = p.canvas || document.querySelector('canvas');
  if (!canvas) {
    console.error('❌ No se encontró el canvas');
    return;
  }

  // Configurar stream del canvas
  const stream = canvas.captureStream(60);
  
  // Configurar MediaRecorder
  const options = { 
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8000000 // 8 Mbps para buena calidad
  };
  
  // Fallback si vp9 no está soportado
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options.mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options.mimeType = 'video/webm';
  }

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    console.error('❌ Error creando MediaRecorder:', e);
    return;
  }

  recordedChunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    // Crear blob y descargar
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    // Crear link de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = `loop_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Limpiar
    URL.revokeObjectURL(url);
    recordedChunks = [];
    
    console.log('✅ Grabación guardada como .webm');
    console.log('💡 Convierte a MP4 con: ffmpeg -i loop.webm -c:v libx264 loop.mp4');
  };

  // Iniciar grabación
  isRecording = true;
  recordingStartTime = Date.now();
  mediaRecorder.start(100); // Chunks cada 100ms
  
  console.log(`🔴 Grabando ${duration} segundos...`);

  // Detener automáticamente después de la duración
  setTimeout(() => {
    if (isRecording) {
      stopRecording();
    }
  }, duration * 1000);
}

/**
 * Detiene la grabación
 */
export function stopRecording() {
  if (!isRecording || !mediaRecorder) {
    return;
  }
  
  isRecording = false;
  mediaRecorder.stop();
  console.log('⏹️ Grabación detenida');
}

/**
 * Verifica si hay una grabación en curso
 * @returns {boolean}
 */
export function isCurrentlyRecording() {
  return isRecording;
}
