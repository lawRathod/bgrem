import { AutoModel, AutoProcessor, RawImage } from '@huggingface/transformers';
import { tensorMaskToBlob } from './shared.js';

export const meta = {
  modelId: 'briaai/RMBG-1.4',
  task: 'image-segmentation',
  license: 'CC BY-NC 4.0',
  specialty: 'General purpose, mobile-friendly',
  estimatedSize: 45 * 1024 * 1024,
};

export function createRmbg14() {
  let model = null;
  let processor = null;
  let loadPromise = null;

  async function init() {
    if (!loadPromise) {
      loadPromise = Promise.all([
        AutoModel.from_pretrained(meta.modelId, {
          config: { model_type: 'custom' },
        }),
        AutoProcessor.from_pretrained(meta.modelId, {
          config: {
            do_normalize: true,
            do_pad: false,
            do_rescale: true,
            do_resize: true,
            image_mean: [0.5, 0.5, 0.5],
            image_std: [1, 1, 1],
            resample: 2,
            rescale_factor: 0.00392156862745098,
            size: { width: 1024, height: 1024 },
          },
        }),
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
    const { output } = await model({ input: pixel_values });

    const mask = output[0].mul(255).to('uint8');

    return tensorMaskToBlob(mask, image.width, image.height);
  }

  return {
    name: 'RMBG-1.4',
    init,
    run,
  };
}
