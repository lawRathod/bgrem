import { AutoModel, AutoProcessor, RawImage } from '@huggingface/transformers';
import { tensorMaskToBlob } from './shared.js';

export function createBirefnet(options = {}) {
  let model = null;
  let processor = null;
  let loadPromise = null;

  const device = options.device ?? 'wasm';
  const dtype = options.dtype ?? 'fp16';

  async function init() {
    if (!loadPromise) {
      if (device === 'wasm') {
        throw new Error('BiRefNet requires WebGPU. WASM backend is not supported due to memory constraints.');
      }

      loadPromise = Promise.all([
        AutoModel.from_pretrained('onnx-community/BiRefNet-ONNX', {
          device,
          dtype,
        }),
        AutoProcessor.from_pretrained('onnx-community/BiRefNet-ONNX'),
      ]);
    }

    [model, processor] = await loadPromise;
  }

  async function run(imageUrl) {
    if (!model || !processor) {
      throw new Error('Model not initialized. Call init() first.');
    }

    const image = await RawImage.fromURL(imageUrl);
    const { pixel_values } = await processor(image);
    const { output_image } = await model({ input_image: pixel_values });

    const mask = output_image[0].sigmoid().mul(255).to('uint8');

    return tensorMaskToBlob(mask, image.width, image.height);
  }

  return {
    name: 'BiRefNet',
    init,
    run,
  };
}
