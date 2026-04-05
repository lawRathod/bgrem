# bgrem

Frontend-only PWA that runs Hugging Face background-removal in the browser and exports `mask.png`.

## Install

```bash
bun install
```

## Develop

```bash
bun run dev
```

## Build static app

```bash
bun run build
```

Build output is generated in `dist/`.

## Serve built app later

```bash
bun run serve:dist
```

The app includes:

- PWA manifest and service worker
- runtime cache for app shell and Hugging Face model files
- network status LED (`online`, `fetching`, `offline-ready`)
- side-by-side preview (`original` + `mask`)

## Project structure

- `index.html` - app shell and page markup
- `src/main.js` - app wiring, model registry, and user interactions
- `src/models/model-registry.js` - model selection, initialization, and metrics
- `src/models/shared.js` - shared model utilities
- `src/models/isnet-onnx.js` - ISNet-ONNX model
- `src/models/rmbg-14.js` - RMBG-1.4 model
- `src/models/modnet.js` - MODNet model
- `src/models/birefnet-lite.js` - BiRefNet-Lite model
- `src/models/birefnet.js` - BiRefNet model
- `src/network-led.js` - internet/offline LED states
- `src/ui.js` - DOM state management
- `src/styles.css` - UI styling
- `src/pwa.js` - service worker registration
- `public/sw.js` - service worker caching logic
- `public/manifest.webmanifest` - PWA metadata
