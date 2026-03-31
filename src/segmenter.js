import { env, pipeline } from '@huggingface/transformers';

env.allowLocalModels = false;

let segmenterPromise = null;

export async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = pipeline('background-removal', 'onnx-community/ISNet-ONNX');
  }

  return segmenterPromise;
}

export async function createMaskFromImageUrl(imageUrl) {
  const segmenter = await getSegmenter();
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
