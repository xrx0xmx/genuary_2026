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
  console.log(`💡 Presiona 'S' para grabar. El video se abrirá en nueva pestaña.`);
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
    // Crear blob
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const filename = `loop_${Date.now()}.webm`;
    
    console.log(`✅ Grabación completada: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Método 1: Abrir en nueva pestaña (el usuario puede guardar con clic derecho)
    const videoWindow = window.open('', '_blank');
    if (videoWindow) {
      videoWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { 
              margin: 0; 
              background: #1a1a1a; 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              font-family: system-ui, sans-serif;
              color: #fff;
            }
            video { 
              max-width: 90vw; 
              max-height: 70vh; 
              border-radius: 8px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .info {
              margin-top: 20px;
              text-align: center;
            }
            .download-btn {
              display: inline-block;
              margin-top: 15px;
              padding: 12px 24px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              cursor: pointer;
            }
            .download-btn:hover {
              background: #45a049;
            }
            .tip {
              margin-top: 15px;
              color: #888;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <video src="${url}" autoplay loop controls></video>
          <div class="info">
            <a class="download-btn" href="${url}" download="${filename}">
              ⬇️ Descargar ${filename}
            </a>
            <p class="tip">
              Si el botón no funciona: clic derecho en el video → "Guardar video como..."
            </p>
          </div>
        </body>
        </html>
      `);
      videoWindow.document.close();
    }
    
    // Método 2: Intentar descarga directa también
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      
      // Usar un pequeño delay para evitar race conditions
      setTimeout(() => {
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
      }, 100);
    } catch (e) {
      console.log('ℹ️ Descarga directa no disponible, usa la pestaña abierta.');
    }
    
    recordedChunks = [];
    
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
