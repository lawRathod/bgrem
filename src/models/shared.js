import { RawImage } from '@huggingface/transformers';

export async function tensorMaskToBlob(maskTensor, origWidth, origHeight) {
  const mask = await RawImage.fromTensor(maskTensor).resize(origWidth, origHeight);

  const canvas = new OffscreenCanvas(origWidth, origHeight);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(origWidth, origHeight);

  for (let i = 0; i < mask.data.length; i++) {
    imageData.data[4 * i] = 255;
    imageData.data[4 * i + 1] = 255;
    imageData.data[4 * i + 2] = 255;
    imageData.data[4 * i + 3] = mask.data[i];
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.convertToBlob({ type: 'image/png' });
}
