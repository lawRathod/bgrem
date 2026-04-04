import { AutoModel, AutoProcessor, RawImage } from '@huggingface/transformers';
import { tensorMaskToBlob } from './shared.js';

export const meta = {
  modelId: 'onnx-community/BiRefNet_lite-ONNX',
  task: 'image-segmentation',
  license: 'MIT',
  specialty: 'Quality/size balance',
  estimatedSize: 224 * 1024 * 1024,
};

export function createBirefnetLite() {
  let model = null;
  let processor = null;
  let loadPromise = null;

  async function init() {
    if (!loadPromise) {
      loadPromise = Promise.all([
        AutoModel.from_pretrained(meta.modelId, { dtype: 'fp32' }),
        AutoProcessor.from_pretrained(meta.modelId),
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
    name: 'BiRefNet-lite',
    init,
    run,
  };
}
