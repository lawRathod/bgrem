import './styles.css';
import { env } from '@huggingface/transformers';
import { createModelRegistry } from './models/model-registry.js';
import { createIsnetOnnx, meta as isnetMeta } from './models/isnet-onnx.js';
import { createRmbg14, meta as rmbgMeta } from './models/rmbg-14.js';
import { createModnet, meta as modnetMeta } from './models/modnet.js';
import { createBirefnetLite, meta as birefnetLiteMeta } from './models/birefnet-lite.js';
import { createBirefnet, meta as birefnetMeta } from './models/birefnet.js';
import { createUI } from './ui.js';
import { createNetworkLed } from './network-led.js';
import { registerServiceWorker } from './pwa.js';

env.allowLocalModels = false;
env.backends.onnx.wasm.proxy = true;
env.backends.onnx.wasm.wasmPaths =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.0-dev.20251116-b39e144322/dist/';

const ui = createUI();
const networkLed = createNetworkLed(ui.setNetworkState);
const registry = createModelRegistry();

const modelEntries = [
  { create: createIsnetOnnx, meta: isnetMeta },
  { create: createRmbg14, meta: rmbgMeta },
  { create: createModnet, meta: modnetMeta },
];

function registerModels() {
  for (const entry of modelEntries) {
    registry.registerModel(entry.create, entry.meta);
  }
}

registerModels();

const availableModels = registry.getAvailableModels();
ui.setModelOptions(availableModels.map((m) => ({ value: m.name, label: m.name })));
ui.setModelValue(registry.getSelectedModel());

ui.modelSelect?.addEventListener('change', () => {
  registry.selectModel(ui.modelSelect.value);
});

async function fetchModelSizes() {
  const updatedLabels = availableModels.map((m) => {
    const modelMeta = registry.getModelMeta(m.name);
    const displayBytes = modelMeta?.estimatedSize;

    if (displayBytes) {
      const mb = (displayBytes / (1024 * 1024)).toFixed(0);
      return { value: m.name, label: `${m.name} (${mb} MB)` };
    }

    return { value: m.name, label: m.name };
  });

  ui.setModelOptions(updatedLabels);
}

fetchModelSizes();

let selectedImageURL = '';
let currentMode = 'single';
let benchmarkResults = [];

registerServiceWorker();

ui.clearBenchmark?.addEventListener('click', () => {
  benchmarkResults = [];
  ui.setBenchmarkResults([]);
  ui.setModelInfo('');
});

document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    ui.setMode(currentMode);
    ui.setModelInfo('');
    if (currentMode === 'single') {
      ui.setStatus(selectedImageURL ? 'Image loaded. Click "Generate".' : 'Select an image to begin.');
    } else {
      ui.setStatus(selectedImageURL ? 'Image loaded. Click "Generate" to run all models.' : 'Select an image to begin.');
    }
  });
});

function clearSelectedImageURL() {
  if (!selectedImageURL) {
    return;
  }

  URL.revokeObjectURL(selectedImageURL);
  selectedImageURL = '';
}

function useSelectedImageBlob(blob, sourceLabel) {
  clearSelectedImageURL();
  selectedImageURL = URL.createObjectURL(blob);
  ui.setSourcePreview(selectedImageURL);
  ui.clearMasks();
  ui.setStatus(`${sourceLabel} loaded. Click "Generate".`);
}

ui.imageInput?.addEventListener('change', () => {
  const file = ui.imageInput.files?.[0];
  if (!file) {
    return;
  }

  useSelectedImageBlob(file, 'Image');
});

ui.loadUrlButton?.addEventListener('click', async () => {
  const rawURL = ui.imageUrlInput.value.trim();
  if (!rawURL) {
    ui.setStatus('Please enter an image URL.');
    return;
  }

  let parsedURL;
  try {
    parsedURL = new URL(rawURL);
  } catch {
    ui.setStatus('Invalid URL. Use a full URL like https://example.com/image.jpg');
    return;
  }

  if (!['http:', 'https:'].includes(parsedURL.protocol)) {
    ui.setStatus('URL must start with http:// or https://');
    return;
  }

  ui.setUrlLoading(true);
  try {
    const response = await fetch(parsedURL.toString());
    if (!response.ok) {
      throw new Error(`Image fetch failed (${response.status})`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      throw new Error('URL did not return an image file.');
    }

    const imageBlob = await response.blob();
    useSelectedImageBlob(imageBlob, 'URL image');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.setStatus(`Could not load image from URL: ${message}`);
  } finally {
    ui.setUrlLoading(false);
  }
});

ui.imageUrlInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    ui.loadUrlButton?.click();
  }
});

ui.setStatus('Select an image to begin.');

function yieldToPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function formatMs(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

function formatBytes(bytes) {
  if (!bytes) {
    return '—';
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

async function runSingleModel() {
  ui.setGenerateLoading(true);

  try {
    ui.setStatus('Loading model…');
    await yieldToPaint();
    const { cached } = await registry.init();
    networkLed.markOfflineReady();
    ui.setStatus('Running inference…');

    const maskBlob = await registry.run(selectedImageURL);
    ui.addMaskCard(registry.getSelectedModel(), maskBlob);

    const metrics = registry.getMetrics();
    const parts = [
      metrics.name,
      cached ? '(cached)' : '',
      `Load: ${formatMs(metrics.loadTimeMs)}`,
      `Inference: ${formatMs(metrics.inferenceTimeMs)}`,
      metrics.license,
    ].filter(Boolean);

    ui.setModelInfo(parts.join('  ·  '));
    ui.setStatus('Done.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.setStatus(`Failed: ${message}`);
  } finally {
    ui.setGenerateLoading(false);
  }
}

async function runBenchmark() {
  benchmarkResults = [];
  ui.setBenchmarkResults([]);
  ui.setGenerateLoading(true);
  ui.clearMasks();

  for (const entry of modelEntries) {
    const name = entry.create().name;
    registry.selectModel(name);
    registry.reset();

    ui.setStatus(`Running ${name}…`);
    await yieldToPaint();

    const t0 = performance.now();
    try {
      await registry.init();
      const maskBlob = await registry.run(selectedImageURL);
      const totalMs = performance.now() - t0;
      const metrics = registry.getMetrics();

      benchmarkResults.push({
        name,
        size: formatBytes(entry.meta.estimatedSize),
        loadTime: formatMs(metrics.loadTimeMs),
        inferenceTime: formatMs(metrics.inferenceTimeMs),
        totalTime: formatMs(totalMs),
        license: metrics.license,
        status: 'OK',
      });

      ui.addMaskCard(name, maskBlob);
    } catch (error) {
      const totalMs = performance.now() - t0;
      const message = error instanceof Error ? error.message : String(error);

      benchmarkResults.push({
        name,
        size: formatBytes(entry.meta.estimatedSize),
        loadTime: '—',
        inferenceTime: '—',
        totalTime: formatMs(totalMs),
        license: entry.meta.license,
        status: `Error: ${message.slice(0, 40)}`,
      });
    }

    ui.setBenchmarkResults(benchmarkResults);
  }

  networkLed.markOfflineReady();
  ui.setGenerateLoading(false);
  ui.setStatus(`Benchmark complete — ${benchmarkResults.filter((r) => r.status === 'OK').length}/${benchmarkResults.length} succeeded.`);
}

ui.generateButton?.addEventListener('click', async () => {
  if (!selectedImageURL) {
    ui.setStatus('Please select an image first.');
    return;
  }

  if (currentMode === 'benchmark') {
    await runBenchmark();
  } else {
    await runSingleModel();
  }
});
