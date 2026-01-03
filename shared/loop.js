/**
 * Utilidades para crear loops perfectos en sketches p5.js
 * 
 * Uso:
 *   import { createLoopHelper } from '../shared/loop.js';
 *   
 *   const LOOP_DURATION = 3; // segundos
 *   const loop = createLoopHelper(LOOP_DURATION);
 *   
 *   p.draw = () => {
 *     const t = loop.progress(p); // 0 a 1
 *     const angle = t * p.TWO_PI; // Loop perfecto
 *   };
 */

/**
 * Crea un helper de loop con la duración especificada
 * @param {number} duration - Duración del loop en segundos
 * @param {number} fps - Frames por segundo (default: 60)
 * @returns {Object} Helper con métodos para el loop
 */
export function createLoopHelper(duration, fps = 60) {
  const totalFrames = Math.floor(duration * fps);
  let startTime = null;
  let frameCount = 0;

  return {
    /** Duración total del loop en segundos */
    duration,
    
    /** Frames por segundo */
    fps,
    
    /** Total de frames en un loop completo */
    totalFrames,

    /**
     * Progreso del loop (0 a 1)
     * @param {p5} p - Instancia de p5
     * @returns {number} Valor entre 0 y 1
     */
    progress(p) {
      if (startTime === null) startTime = p.millis();
      const elapsed = (p.millis() - startTime) / 1000;
      return (elapsed % duration) / duration;
    },

    /**
     * Progreso basado en frameCount (más preciso para grabación)
     * @param {p5} p - Instancia de p5
     * @returns {number} Valor entre 0 y 1
     */
    frameProgress(p) {
      return (p.frameCount % totalFrames) / totalFrames;
    },

    /**
     * Tiempo actual dentro del loop (0 a duration)
     * @param {p5} p - Instancia de p5
     * @returns {number} Tiempo en segundos
     */
    time(p) {
      if (startTime === null) startTime = p.millis();
      const elapsed = (p.millis() - startTime) / 1000;
      return elapsed % duration;
    },

    /**
     * Reinicia el loop
     */
    reset() {
      startTime = null;
      frameCount = 0;
    },

    /**
     * Verifica si el loop acaba de completar un ciclo
     * @param {p5} p - Instancia de p5
     * @returns {boolean}
     */
    justCompleted(p) {
      return p.frameCount > 0 && p.frameCount % totalFrames === 0;
    },

    /**
     * Frame actual dentro del loop (0 a totalFrames-1)
     * @param {p5} p - Instancia de p5
     * @returns {number}
     */
    currentFrame(p) {
      return p.frameCount % totalFrames;
    }
  };
}

/**
 * Funciones de easing para suavizar animaciones
 */
export const easing = {
  // Ease in-out suave (sine)
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  
  // Ease in-out cúbico
  inOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  // Ease in-out cuadrático
  inOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  
  // Ease in-out elástico
  inOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 :
      t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  
  // Ping-pong (0 -> 1 -> 0)
  pingPong: (t) => 1 - Math.abs(2 * t - 1),
};

