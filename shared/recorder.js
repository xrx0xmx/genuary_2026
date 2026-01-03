/**
 * Wrapper ligero que carga el recorder completo sólo cuando hace falta.
 */

let recorderConfig = null;
let recorderModule = null;
let recorderPromise = null;

function loadRecorderModule() {
  if (!recorderPromise) {
    recorderPromise = import('./recorder-core.js');
  }
  return recorderPromise;
}

async function ensureRecorderReady() {
  if (recorderModule) {
    return recorderModule;
  }
  if (!recorderConfig) {
    throw new Error('setupRecorder debe ejecutarse antes de grabar.');
  }
  const mod = await loadRecorderModule();
  mod.setupRecorder(recorderConfig.p, recorderConfig.duration, recorderConfig.fps);
  recorderModule = mod;
  return recorderModule;
}

function startProxy() {
  const launch = () => {
    try {
      const maybe = recorderModule.startRecording();
      if (maybe?.catch) {
        maybe.catch((err) => console.error('❌ Error iniciando la grabación:', err));
      }
    } catch (err) {
      console.error('❌ Error iniciando la grabación:', err);
    }
  };

  if (recorderModule) {
    launch();
    return;
  }

  ensureRecorderReady().then(launch).catch((err) => {
    console.error('❌ Error cargando el recorder:', err);
  });
}

function stopProxy() {
  if (!recorderModule) return;
  recorderModule.stopRecording();
}

function isRecordingProxy() {
  return recorderModule ? recorderModule.isCurrentlyRecording() : false;
}

export function setupRecorder(p, duration, fps = 60) {
  recorderConfig = { p, duration, fps };
  
  window.startRecording = startProxy;
  window.stopRecording = stopProxy;
  window.isRecording = isRecordingProxy;
  
  console.log(`🎬 Recorder listo: ${duration}s @ ${fps}fps (se cargará al grabar).`);
}
