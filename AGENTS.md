# AGENTS.md

## Commands

| Task | Command |
|---|---|
| Install deps | `bun install` |
| Dev server | `bun run dev` |
| Production build | `bun run build` |
| Preview build | `bun run serve:dist` |
| Type check | `npx tsc --noEmit` |

No lint, format, or test commands exist. No testing framework is installed.

## Tech Stack

- Vanilla JS (`.js` files, type-checked via TypeScript with `allowJs`)
- Vite 7 (bundler, configured via `vite.config.js`)
- Bun (package manager, evidenced by `bun.lock`)
- `@huggingface/transformers` (ONNX model inference in browser)
- PWA with service worker (`public/sw.js`)

## Code Style

### Imports
- ESM named imports only; no default imports
- Relative paths with `.js` extension: `import { createUI } from './ui.js';`
- Side-effect imports for CSS: `import './styles.css';`
- Group imports: side-effect first, then named imports, each alphabetized

### Formatting
- 2-space indentation
- Semicolons on all statements
- Single quotes for strings
- Template literals for interpolation
- Trailing commas in multi-line objects/arrays
- Blank lines between functions and logical blocks

### Naming
- `camelCase` for variables, functions, DOM element IDs
- `PascalCase` for exported factory functions (`createUI`, `createNetworkLed`)
- `set` prefix for setters (`setStatus`, `setSourcePreview`)
- `kebab-case` for CSS classes and custom properties

### Types
- All source files are `.js`; TypeScript checks via `tsconfig.json` (`strict: true`, `allowJs: true`)
- No JSDoc types — rely on inference
- Use optional chaining for DOM elements: `el?.addEventListener(...)`
- Use nullish coalescing: `value ?? fallback`

### Error Handling
- `try/catch/finally` for async operations
- Extract messages: `error instanceof Error ? error.message : String(error)`
- Early returns for guards: `if (!value) { setStatus('…'); return; }`
- Throw descriptive errors: `throw new Error('Unsupported output format.')`
- Silently swallow non-critical errors (e.g., SW registration) with an explanatory comment

## Architecture

- **Factory pattern**: modules export factory functions returning objects with methods
- **Singleton/lazy init**: cache promises so the ONNX model loads only once
- **DOM encapsulation**: query elements once, expose methods that operate on them
- **Event-driven**: all interactions via `addEventListener`
- **State via closure**: module-scoped variables (`selectedImageURL`, `generatedMaskURL`)

## Project Structure

```
src/
  main.js          — app entry, wires UI + model registry + network led
  ui.js            — DOM creation, element refs, UI methods
  models/
    model-registry.js — model selection, init, run, metrics
    shared.js         — shared model utilities
    isnet-onnx.js     — ISNet-ONNX model
    rmbg-14.js        — RMBG-1.4 model
    modnet.js         — MODNet model
    birefnet-lite.js  — BiRefNet-Lite model
    birefnet.js       — BiRefNet model
  network-led.js   — network activity indicator
  pwa.js           — service worker registration
  styles.css       — all styles (CSS custom properties, responsive)
```

## Git

- Do not commit unless explicitly asked
- Never push to remote unless explicitly asked
