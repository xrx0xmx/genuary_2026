/**
 * Implementación principal del recorder usando MediaRecorder (nativo del navegador).
 * Este módulo se carga dinámicamente desde shared/recorder.js para evitar inflar el bundle.
 */

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recorderTimeout = null;

const recorderState = {
  p: null,
  duration: 0, // segundos
  fps: 60,
};

function resetChunks() {
  recordedChunks = [];
}

function createRecorder(canvas) {
  const stream = canvas.captureStream(recorderState.fps || 60);
  const options = {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8_000_000,
  };

  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options.mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options.mimeType = 'video/webm';
  }

  try {
    return new MediaRecorder(stream, options);
  } catch (error) {
    console.error('❌ Error creando MediaRecorder:', error);
    return null;
  }
}

function handleSave() {
  if (!recordedChunks.length) {
    console.warn('⚠️ No se grabaron datos.');
    return;
  }

  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const filename = `loop_${Date.now()}.webm`;

  console.log(`✅ Grabación completada: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

  // Abrir reproductor en pestaña nueva
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body {
            margin: 0;
            background: #1a1a1a;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
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
          }
          .tip {
            margin-top: 12px;
            color: #aaa;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <video src="${url}" autoplay loop controls></video>
        <div class="info">
          <a class="download-btn" href="${url}" download="${filename}">⬇️ Descargar ${filename}</a>
          <p class="tip">Si falla el botón, usa clic derecho → “Guardar video como…”</p>
        </div>
      </body>
      </html>
    `);
    win.document.close();
  }

  // Intentar descarga directa
  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    requestAnimationFrame(() => {
      a.click();
      setTimeout(() => document.body.removeChild(a), 200);
    });
  } catch (error) {
    console.log('ℹ️ Descarga directa no disponible:', error);
  }

  console.log('💡 Convierte a MP4 con: npm run convert <ruta_al_webm>');
  resetChunks();
}

export function setupRecorder(p, duration, fps = 60) {
  recorderState.p = p;
  recorderState.duration = duration;
  recorderState.fps = fps;

  window.startRecording = () => startRecording();
  window.stopRecording = () => stopRecording();
  window.isRecording = () => isRecording;

  console.log(`🎬 Recorder configurado: ${duration}s @ ${fps}fps`);
  console.log('💡 Presiona "S" para grabar. El video se abrirá en una nueva pestaña.');
}

export function startRecording() {
  if (!recorderState.p) {
    console.error('❌ Recorder no inicializado.');
    return;
  }
  if (isRecording) {
    console.warn('⚠️ Ya hay una grabación en curso');
    return;
  }

  const canvas = recorderState.p.canvas || document.querySelector('canvas');
  if (!canvas) {
    console.error('❌ No se encontró el canvas');
    return;
  }

  const recorder = createRecorder(canvas);
  if (!recorder) {
    return;
  }

  resetChunks();

  recorder.ondataavailable = (event) => {
    if (event.data?.size) {
      recordedChunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    handleSave();
    mediaRecorder = null;
  };

  mediaRecorder = recorder;
  mediaRecorder.start(100);
  isRecording = true;

  if (recorderTimeout) {
    clearTimeout(recorderTimeout);
  }
  recorderTimeout = setTimeout(() => {
    if (isRecording) {
      stopRecording();
    }
  }, recorderState.duration * 1000);

  console.log(`🔴 Grabando ${recorderState.duration}s...`);
}

export function stopRecording() {
  if (!isRecording || !mediaRecorder) {
    return;
  }

  isRecording = false;
  try {
    mediaRecorder.stop();
  } catch (error) {
    console.error('❌ Error al detener el recorder:', error);
  }

  if (recorderTimeout) {
    clearTimeout(recorderTimeout);
    recorderTimeout = null;
  }
}

export function isCurrentlyRecording() {
  return isRecording;
}
