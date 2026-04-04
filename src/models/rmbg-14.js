import { AutoModel, AutoProcessor, RawImage } from '@huggingface/transformers';

export function createRmbg14() {
  let model = null;
  let processor = null;
  let loadPromise = null;

  async function init() {
    if (!loadPromise) {
      loadPromise = Promise.all([
        AutoModel.from_pretrained('briaai/RMBG-1.4', {
          config: { model_type: 'custom' },
        }),
        AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
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

    const mask = await RawImage.fromTensor(
      output[0].mul(255).to('uint8'),
    ).resize(image.width, image.height);

    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.toCanvas(), 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    for (let i = 0; i < mask.data.length; i++) {
      imageData.data[4 * i + 3] = mask.data[i];
    }

    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.convertToBlob({ type: 'image/png' }).then((blob) => {
        if (!blob) {
          reject(new Error('Could not generate PNG blob from canvas.'));
          return;
        }

        resolve(blob);
      });
    });
  }

  return {
    name: 'RMBG-1.4',
    init,
    run,
  };
}
