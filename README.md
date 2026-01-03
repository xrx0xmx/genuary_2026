# Genuary 2026

Proyecto de arte generativo para [Genuary 2026](https://genuary.art/) utilizando **p5.js** y **Vite**.

Cada día de enero tiene su propia carpeta con un sketch único basado en el prompt del día.

---

## Instalación

### Requisitos

- Node.js 18+
- npm
- FFmpeg (opcional, para convertir video)

```bash
# Instalar FFmpeg en macOS
brew install ffmpeg
```

### Pasos

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd genuary_2026

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000/`

---

## Instrucciones de uso

### Navegación

- **Página principal**: `http://localhost:3000/` — Grid con todos los días
- **Día específico**: `http://localhost:3000/1/`, `http://localhost:3000/2/`, etc.

### Comandos generales

```bash
npm run dev          # Inicia el servidor de desarrollo
npm run new <día>    # Crea un nuevo día (ej: npm run new 3)
npm run build        # Compila para producción
```

---

## Día 1: One color, one shape

**Prompt**: Un color, una forma

Un sketch minimalista que explora variaciones de un círculo azul con movimiento orbital y efectos de desvanecimiento.

### Controles

| Tecla | Acción |
|-------|--------|
| `S` | Grabar loop (6 segundos) |

---

## Día 2: Twelve principles of animation

**Prompt**: Los 12 principios de animación

"La bola con intención" — Un monigote esférico que demuestra los principios clásicos de animación: squash & stretch, anticipación, arcos, timing, follow-through, y más.

### Controles

| Tecla | Acción |
|-------|--------|
| `D` | Toggle modo debug (HUD con información) |
| `A` | Toggle visualización del arco de movimiento |
| `P` | Toggle visualización de fases |
| `1` | Aumentar intensidad de squash |
| `2` | Disminuir intensidad de squash |
| `3` | Aumentar intensidad de stretch |
| `4` | Disminuir intensidad de stretch |
| `5` | Aumentar exaggeration |
| `6` | Disminuir exaggeration |
| `S` | Grabar loop (20 segundos, 5 pasadas) |

### Características

- **Squash & Stretch**: La bola se deforma según su movimiento
- **Anticipación**: Pausa antes del salto
- **Arcos**: Trayectoria parabólica natural
- **Timing**: Aceleración y desaceleración realistas
- **Follow-through**: La cola sigue el movimiento con retardo
- **Acción secundaria**: Sombra que reacciona a la altura
- **Exageración**: Intensidad variable en cada pasada

---

## Grabación de loops

Presiona `S` en cualquier sketch para iniciar la grabación:

1. El sketch esperará al inicio del siguiente loop
2. Grabará la duración configurada
3. Se abrirá una nueva pestaña con el video
4. Haz clic en "Descargar" o clic derecho → "Guardar video como..."

### Convertir a MP4

```bash
ffmpeg -i loop.webm -c:v libx264 loop.mp4
```

---

## Estructura del proyecto

```
genuary_2026/
├── index.html          # Página principal con grid de días
├── 1/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 2/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── shared/
│   ├── loop.js         # Utilidades para loops perfectos
│   └── recorder.js     # Sistema de grabación
├── scripts/
│   ├── dev.js
│   ├── new-day.js
│   └── record.js
├── package.json
└── vite.config.js
```

---

## Sistema de Loops Perfectos

Cada sketch incluye un sistema para crear animaciones que loopean perfectamente:

```javascript
import { createLoopHelper } from '../shared/loop.js';

const LOOP_DURATION = 4; // segundos
const loop = createLoopHelper(LOOP_DURATION, 60);

p.draw = () => {
  const t = loop.frameProgress(p); // 0 a 1
  
  // Usar t para animaciones cíclicas
  const x = p.cos(t * p.TWO_PI) * 100;
};
```

### Funciones de easing

```javascript
import { easing } from '../shared/loop.js';

easing.inOutSine(t)     // Suave
easing.inOutElastic(t)  // Elástico
easing.pingPong(t)      // Ida y vuelta
```

---

## Prompts completados

| Día | Prompt | Estado |
|-----|--------|--------|
| 1 | One color, one shape | ✅ |
| 2 | Twelve principles of animation | ✅ |
| 3 | ... | ⏳ |

---

## Recursos

- [p5.js Reference](https://p5js.org/reference/)
- [Genuary Prompts](https://genuary.art/)
- [The Coding Train](https://thecodingtrain.com/)
- [12 Principles of Animation](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)

---

*Hecho con p5.js + Vite*
