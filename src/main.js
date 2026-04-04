import './styles.css';
import { createModelRegistry } from './models/model-registry.js';
import { createIsnetOnnx } from './models/isnet-onnx.js';
import { createRmbg14 } from './models/rmbg-14.js';
import { createModnet } from './models/modnet.js';
import { createBirefnetLite } from './models/birefnet-lite.js';
import { createBirefnet } from './models/birefnet.js';
import { createUI } from './ui.js';
import { createNetworkLed } from './network-led.js';
import { registerServiceWorker } from './pwa.js';

const ui = createUI();
const networkLed = createNetworkLed(ui.setNetworkState);
const registry = createModelRegistry();

let currentDevice = 'wasm';

function registerModels() {
  registry.registerModel(createIsnetOnnx, { device: currentDevice });
  registry.registerModel(createRmbg14, { device: currentDevice });
  registry.registerModel(createModnet, { device: currentDevice });
  registry.registerModel(createBirefnetLite, { device: currentDevice });
  registry.registerModel(createBirefnet, { device: currentDevice });
}

registerModels();

const availableModels = registry.getAvailableModels();
ui.setModelOptions(availableModels.map((m) => ({ value: m.name, label: m.name })));
ui.setModelValue(registry.getSelectedModel());

ui.modelSelect?.addEventListener('change', () => {
  registry.selectModel(ui.modelSelect.value);
});

ui.deviceSelect?.addEventListener('change', () => {
  currentDevice = ui.deviceSelect.value;
  registry.reset();
  registry.selectModel(ui.modelSelect.value);
  ui.setStatus(`Device switched to ${currentDevice.toUpperCase()}. Click "Generate mask".`);
});

let selectedImageURL = '';

registerServiceWorker();

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
  ui.clearMask();
  ui.setStatus(`${sourceLabel} loaded. Click "Generate mask".`);
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

ui.generateButton?.addEventListener('click', async () => {
  if (!selectedImageURL) {
    ui.setStatus('Please select an image first.');
    return;
  }

  ui.setGenerateLoading(true);
  ui.clearMask();

  try {
    ui.setStatus('Loading model...');
    await registry.init();
    networkLed.markOfflineReady();
    ui.setStatus('Running inference in your browser...');

    const maskBlob = await registry.run(selectedImageURL);
    ui.setMask(maskBlob);
    ui.setStatus('Done. Preview updated and mask.png is ready to download.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.setStatus(`Failed to generate mask: ${message}`);
  } finally {
    ui.setGenerateLoading(false);
  }
});
