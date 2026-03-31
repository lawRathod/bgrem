import './styles.css';
import { createMaskFromImageUrl, getSegmenter } from './segmenter';
import { createUI } from './ui';
import { createNetworkLed } from './network-led';
import { registerServiceWorker } from './pwa';

const ui = createUI();
const networkLed = createNetworkLed(ui.setNetworkState);

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
    ui.setStatus('Loading segmentation model...');
    await getSegmenter();
    ui.setStatus('Running segmentation in your browser...');

    const maskBlob = await createMaskFromImageUrl(selectedImageURL);
    ui.setMask(maskBlob);
    networkLed.markOfflineReady();
    ui.setStatus('Done. Preview updated and mask.png is ready to download.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ui.setStatus(`Failed to generate mask: ${message}`);
  } finally {
    ui.setGenerateLoading(false);
  }
});
