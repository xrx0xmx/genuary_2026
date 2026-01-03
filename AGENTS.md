# Repository Guidelines

## Project Structure & Module Organization
Each numbered directory (`/1`, `/2`, `/3`, `/4`, …) holds the daily `index.html`, `sketch.js`, and prompt brief. `shared/loop.js` supplies loop helpers, `shared/recorder.js` wires MediaRecorder shortcuts, `scripts/` bundles Node utilities, and `index.html` is the shared Vite entry. Exported renders belong in `outputs/<day>/` alongside any supporting notes.

## Build, Test, and Development Commands
- `npm run dev [-- <day>]`: launches Vite on port 3000; pass a day number to log the target route (e.g., `npm run dev -- 4`).
- `npm run new <day>`: scaffolds a fresh day folder with the HTML/p5 template wired to the shared helpers.
- `npm run build`: produces the static multi-page bundle in `dist/` using the entries discovered by `vite.config.js`.
- `npm run record <day>`: spins up Vite on port 4000, uses Puppeteer to capture PNG frames, and renders `loop.mp4` + `loop.gif` (requires FFmpeg).
- `npm run convert <path/to/loop.webm>`: converts on-device MediaRecorder outputs to MP4.

## Coding Style & Naming Conventions
Stick to modern ES modules with two-space indentation, semicolons, and descriptive camelCase identifiers (`createLoopHelper`, `setupRecorder`). Keep constants screaming snake case near the top of each sketch (`LOOP_DURATION`, `FPS`, `CANVAS_SIZE`) and prefer the easing helpers exported by `shared/loop.js` over ad-hoc math. Use explicit relative imports from each day folder so Vite resolves consistently.

## Testing & Loop Validation
There is no automated test suite; validation is observational. Let each sketch run for several cycles, then capture using the in-sketch `setupRecorder` shortcut (`S`) or `npm run record`. Scrub the resulting GIF/MP4 for dropped frames, color banding, or seams whenever timing constants change.

## Commit & Pull Request Guidelines
Git history follows Conventional Commits con descripciones en castellano (`feat(day4): implement Lowres - pixels as intelligent particles`, `docs: Actualizado README ...`). Prefer `feat(<day>)`, `fix(<day>)`, and `docs` scopes and redacta siempre los mensajes en español para mantener coherencia. Pull requests must mention the prompt/day, outline the commands run, and attach a GIF or MP4 from `outputs/<day>/` so reviewers can judge motion without rebuilding.

## Recording & Export Tips
Keep `shared/recorder.js` wired in every sketch so contributors can capture loops con la tecla `S` usando la MediaRecorder API integrada; al terminar se abre una pestaña con el `.webm` y puedes convertirlo a MP4 con `npm run convert <ruta_al_webm>` o con FFmpeg directamente. Reserva `npm run record <day>` para exportes deterministas (GIF/MP4 automáticos) y comprueba que FFmpeg (`brew install ffmpeg`) esté disponible antes de lanzarlo: el script abrirá `http://localhost:4000/<day>/`, capturará los frames y limpiará la carpeta temporal si lo dejas terminar. Store reusable assets in `shared/` and reference them with relative paths to keep builds reproducible.
