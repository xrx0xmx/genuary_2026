# Genuary 2026

Proyecto de arte generativo para [Genuary 2026](https://genuary.art/) utilizando **p5.js** y **Vite**.

Cada día de enero tiene su propia carpeta con un sketch único basado en el prompt del día.

---

## Instalación

### Requisitos

- Node.js 18+
- npm

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

## Día 3: Fibonacci forever

**Prompt**: Crea una obra que use la secuencia de Fibonacci de alguna manera

Un bosque orgánico donde cada árbol crece siguiendo patrones basados en la sucesión de Fibonacci. Las ramas se ramifican con probabilidades determinadas por los números de Fibonacci, creando estructuras naturales y únicas.

### Controles

| Tecla | Acción |
|-------|--------|
| `Espacio` / `R` | Reiniciar el bosque |
| `D` | Toggle HUD (información) |
| `S` | Grabar el proceso de crecimiento |

### Características

- **Crecimiento orgánico**: Las ramas crecen gradualmente con animación
- **Probabilidad Fibonacci**: La ramificación sigue la secuencia de Fibonacci
- **Paleta natural**: Gradiente de colores joven → maduro → viejo
- **Partículas ambientales**: Esporas/polen flotando en el ambiente
- **Generación procedural**: Cada bosque es único

---

## Día 4: Lowres

**Prompt**: Una imagen o gráfico de baja resolución, donde los detalles se simplifican o pixelan

Píxeles como partículas inteligentes — Cada píxel de una imagen se convierte en una partícula autónoma que conserva su color original pero se comporta de forma dinámica y reactiva.

### Controles

| Tecla | Acción |
|-------|--------|
| `D` | Toggle HUD (información) |
| `R` | Reiniciar con imagen por defecto |
| `+` / `-` | Aumentar/disminuir resolución del grid |
| `1` / `2` / `3` | Intensidad de repulsión (suave/media/fuerte) |
| `S` | Grabar video |
| **Drag & Drop** | Arrastra una imagen para cargarla |

### Características

- **Carga de imagen**: Soporta JPG, PNG, GIF
- **Grid lowres**: Resolución ajustable (10-80 celdas)
- **Ruido Perlin**: Movimiento orgánico constante
- **Repulsión del cursor**: Las partículas huyen del cursor
- **Física suave**: Retorno gradual a posición original
- **Estética pixelada**: Sin suavizado, píxeles puros

---

## Día 5: Write "Genuary"

**Prompt**: Escribe "Genuary". Evita usar una fuente

Escritura gestual con p5.brush — La palabra "Genuary" emerge del gesto, no del dibujo explícito de caracteres. El usuario define áreas para cada letra y el sistema las dibuja con trazos naturales simulando pincel sobre papel.

### Controles

| Tecla | Acción |
|-------|--------|
| `1-9` | Cambiar tipo de pincel |
| `+` / `-` | Ajustar grosor |
| `[` / `]` | Ajustar vibración |
| `O` / `o` | Ajustar opacidad |
| `X` | Randomizar parámetros |
| `H` | Mostrar/ocultar panel de configuración |
| `R` | Reiniciar |
| `Enter` | Confirmar área de letra |
| `Esc` | Cancelar área pendiente |
| `S` | Grabar |

### Características

- **Trazos naturales**: Usa p5.brush para simular pinceles reales
- **Áreas rotables**: Define y rota el área de cada letra
- **Interpolación Catmull-Rom**: Trayectorias suaves entre puntos
- **Presión variable**: Grosor del trazo varía según el punto
- **Múltiples pinceles**: pen, rotring, marker, charcoal, 2B, HB, spray, cpencil

---

## Día 6: Lights on/off

**Prompt**: Haz algo que cambie cuando enciendes o apagas las "luces digitales"

Sloth X-Ray Flashlight — Una linterna digital que revela capas ocultas de un perezoso. El círculo de luz sigue el ratón mostrando diferentes capas según la interacción.

### Controles

| Tecla/Acción | Resultado |
|--------------|-----------|
| **Mover ratón** | El círculo de luz muestra la segunda capa (sloth_2) |
| **Clic + mover** | El círculo muestra la tercera capa (sloth_3) |
| `S` | Grabar (10 segundos) |

### Características

- **3 capas de sloth**: Fondo siempre visible, capas reveladas con interacción
- **Círculo de luz suave**: Feather gradual en los bordes
- **Sin capa negra**: La imagen base siempre es visible
- **Proporción preservada**: Las imágenes mantienen su aspect ratio

---

## Día 7: Boolean algebra

**Prompt**: Inspírate en el álgebra booleana de cualquier manera

Un sketch basado en operaciones lógicas y compuertas booleanas.

### Controles

| Tecla | Acción |
|-------|--------|
| `S` | Grabar loop |

---

## Día 8: A City

**Prompt**: Crea una metrópolis generativa

Una ciudad procedural que se genera automáticamente con edificios, calles y elementos urbanos.

### Controles

| Tecla | Acción |
|-------|--------|
| `S` | Grabar loop |

---

## Día 9: Crazy Automaton

**Prompt**: Five Broken Worlds / Six Ways to See Them

Un autómata celular "loco" con 5 modos de lógica diferentes y 6 modos de visualización. Cada mundo tiene reglas rotas o alteradas que producen comportamientos únicos.

### Controles

| Tecla | Acción |
|-------|--------|
| `1-5` | Cambiar modo de lógica (Rule-Switching, Paranoid, Emotional, Corrupted, Liar) |
| `Espacio` | Cambiar modo visual (Binary, Colored, Memory, Lie, Field, Broken) |
| `R` | Reset del grid |
| `D` | Toggle modo debug (HUD con información de celdas) |
| `S` | Armar grabación → pulsar R o 1-5 para iniciar |
| `S` (grabando) | Detener grabación manualmente |

### Características

- **5 lógicas rotas**: Rule-Switching, Paranoid, Emotional, Corrupted, Liar
- **6 visualizaciones**: Binary, Colored States, Visible Memory, Visual Lie, Continuous Field, Broken Visual
- **Grabación manual**: Sin límite de tiempo, graba hasta que pulses S de nuevo
- **Debug interactivo**: Hover sobre celdas para ver su estado interno

---

## Día 10: Polar coordinates

**Prompt**: DISEÑO FUNCIONAL (ACTUALIZADO) — Tipografía Polar: Control, Tiempo y Variantes Ideológicas

Sistema de tipografía polar que explora cómo diferentes ideologías visuales afectan la presentación del mismo mensaje. Tres modos contrastantes que comparten la misma arquitectura formal pero expresan visiones del mundo radicalmente diferentes.

### Controles

| Tecla | Acción |
|-------|--------|
| `1` | Modo Autoritario (control absoluto, rígido) |
| `2` | Modo Poético (flujo temporal, orgánico) |
| `3` | Modo Glitch (corrupción, inestabilidad) |
| `D` | Toggle HUD (mostrar/ocultar) |
| `R` | Reiniciar sistema |
| `S` | Grabar loop |

### Características

- **Arquitectura común**: Sistema polar con anillos concéntricos, texto carácter a carácter, conversión polar→cartesiana
- **Centro como poder**: El centro representa autoridad, todos los elementos orbitan alrededor
- **Tres ideologías visuales**:
  - **Autoritario**: Orden perfecto, estabilidad absoluta, control total
  - **Poético**: Oscilaciones suaves, variaciones orgánicas, flujo temporal
  - **Glitch**: Ruido discontinuo, saltos abruptos, corrupción del sistema
- **Interacción mouse**: mouseX controla intensidad del efecto, mouseY controla separación entre anillos
- **Transición ideológica**: Cambios instantáneos sin animaciones suaves

### Concepto

El mismo mensaje "CONTROL TIEMPO PODER" se presenta bajo tres regímenes visuales:

- **Autoritario** → el texto se impone
- **Poético** → el texto se interpreta
- **Glitch** → el texto se cuestiona

El poder está en cómo se organiza, no en el mensaje mismo.

---

## Grabación de loops

La grabación usa **MediaRecorder API** del navegador (no requiere software externo).

Presiona `S` en cualquier sketch para grabar:

1. El sketch espera al inicio del siguiente loop
2. Graba la duración configurada directamente a `.webm`
3. Se abre una nueva pestaña con el video
4. Descarga con el botón o clic derecho → "Guardar video como..."

### Convertir a MP4 (opcional)

Si necesitas formato MP4:

```bash
# Usando el script incluido
npm run convert ~/Downloads/loop_xxxxx.webm

# O manualmente con FFmpeg
ffmpeg -i loop.webm -c:v libx264 loop.mp4
```

> **Nota**: FFmpeg solo es necesario si quieres convertir a MP4. Instalar con `brew install ffmpeg`

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
├── 3/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 4/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 5/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 6/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 7/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 8/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 9/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── 10/
│   ├── index.html
│   ├── sketch.js
│   └── prompt.txt
├── shared/
│   ├── loop.js         # Utilidades para loops perfectos
│   ├── recorder.js     # Wrapper ligero del sistema de grabación
│   ├── recorder-core.js # Implementación del MediaRecorder
│   ├── dr_tapiz.jpeg   # Imagen de ejemplo para día 4
│   ├── sloth_1.png     # Capa 1 del sloth (día 6)
│   ├── sloth_2.png     # Capa 2 del sloth (día 6)
│   └── sloth_3.png     # Capa 3 del sloth (día 6)
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
| 3 | Fibonacci forever | ✅ |
| 4 | Lowres | ✅ |
| 5 | Write "Genuary" | ✅ |
| 6 | Lights on/off | ✅ |
| 7 | Boolean algebra | ✅ |
| 8 | A City | ✅ |
| 9 | Crazy Automaton | ✅ |
| 10 | Polar coordinates | ✅ |

---

## Recursos

- [p5.js Reference](https://p5js.org/reference/)
- [Genuary Prompts](https://genuary.art/)
- [The Coding Train](https://thecodingtrain.com/)
- [12 Principles of Animation](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)

---

*Hecho con p5.js + Vite*
