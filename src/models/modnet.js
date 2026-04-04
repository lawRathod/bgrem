import { env, pipeline } from '@huggingface/transformers';

env.allowLocalModels = false;

export function createModnet(options = {}) {
  let segmenterPromise = null;

  const device = options.device ?? 'wasm';
  const dtype = options.dtype ?? 'fp32';

  async function init() {
    if (!segmenterPromise) {
      segmenterPromise = pipeline('background-removal', 'Xenova/modnet', {
        device,
        dtype,
      });
    }

    await segmenterPromise;
  }

  async function run(imageUrl) {
    const segmenter = await segmenterPromise;
    const output = await segmenter(imageUrl);
    const maskOutput = Array.isArray(output) ? output[0] : output;

    if (typeof maskOutput.toBlob === 'function') {
      return maskOutput.toBlob();
    }

    if (typeof maskOutput.toCanvas === 'function') {
      const canvas = maskOutput.toCanvas();

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not generate PNG blob from canvas.'));
            return;
          }

          resolve(blob);
        }, 'image/png');
      });
    }

    throw new Error('Unsupported output format from model.');
  }

  return {
    name: 'MODNet',
    init,
    run,
  };
}
