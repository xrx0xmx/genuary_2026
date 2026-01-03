# Genuary 2026

Proyecto de arte generativo para [Genuary 2026](https://genuary.art/) utilizando **p5.js** y **Vite**.

Cada día de enero tiene su propia carpeta con un sketch único basado en el prompt del día.

## Requisitos

- Node.js 18+
- npm
- FFmpeg (para exportar video)

```bash
# Instalar FFmpeg en macOS
brew install ffmpeg
```

## Instalación

```bash
npm install
```

## Comandos

### Crear un nuevo día

```bash
npm run new <número_día>
```

Ejemplo:
```bash
npm run new 2
```

Esto crea la carpeta `2/` con:
- `index.html` - Página HTML
- `sketch.js` - Sketch p5.js con sistema de loop
- `prompt.txt` - Archivo para guardar el prompt del día

### Desarrollar

```bash
npm run dev -- <número_día>
```

Ejemplo:
```bash
npm run dev -- 1
```

Abre el navegador en `http://localhost:3000` con hot reload automático.

### Grabar loop perfecto

```bash
npm run record <número_día>
```

Ejemplo:
```bash
npm run record 1
```

Genera en `outputs/<día>/`:
- `loop.mp4` - Video para redes sociales
- `loop.gif` - GIF animado

## Sistema de Loops Perfectos

Cada sketch incluye un sistema para crear animaciones que loopean perfectamente:

```javascript
import { createLoopHelper } from '../shared/loop.js';

const LOOP_DURATION = 4; // segundos
const loop = createLoopHelper(LOOP_DURATION, 60);

p.draw = () => {
  const t = loop.frameProgress(p); // 0 a 1
  
  // Usar t para animaciones cíclicas
  const x = p.cos(t * p.TWO_PI) * 100; // Loop perfecto
};
```

### Funciones de easing disponibles

```javascript
import { easing } from '../shared/loop.js';

const t = loop.frameProgress(p);
const smooth = easing.inOutSine(t);     // Suave
const elastic = easing.inOutElastic(t); // Elástico
const bounce = easing.pingPong(t);      // Ida y vuelta
```

## Estructura del proyecto

```
genuary_2026/
├── 1/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── outputs/
│   └── 1/
│       ├── loop.mp4
│       └── loop.gif
├── shared/
│   ├── loop.js        # Utilidades para loops
│   └── recorder.js    # Sistema de grabación
├── scripts/
│   ├── dev.js
│   ├── new-day.js
│   └── record.js
├── package.json
├── vite.config.js
└── README.md
```

## Flujo de trabajo diario

1. Revisa el prompt del día en [genuary.art](https://genuary.art/)
2. Crea la carpeta del día: `npm run new <día>`
3. Guarda el prompt en `<día>/prompt.txt`
4. Inicia el desarrollo: `npm run dev -- <día>`
5. Edita `<día>/sketch.js` y observa los cambios en tiempo real
6. Cuando estés satisfecho: `npm run record <día>`

## Prompts completados

| Día | Prompt | Estado |
|-----|--------|--------|
| 1 | One color, one shape | ✅ |
| 2 | - | ⏳ |
| ... | ... | ... |

## Recursos

- [p5.js Reference](https://p5js.org/reference/)
- [Genuary Prompts](https://genuary.art/)
- [The Coding Train](https://thecodingtrain.com/)

---

*Hecho con p5.js + Vite*
