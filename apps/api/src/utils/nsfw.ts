import './polyfill.js';
import * as tf from '@tensorflow/tfjs-node';
import * as nsfw from 'nsfwjs';

let nsfwModel: nsfw.NSFWJS | null = null;

/**
 * Initialize and preload the NSFW model into memory
 */
export const initNsfw = async (): Promise<void> => {
  if (!nsfwModel) {
    console.log('[NSFW] Initializing and loading NSFWJS model...');
    try {
      // Load the default MobileNetV2 model from nsfwjs
      nsfwModel = await nsfw.load();
      console.log('[NSFW] NSFWJS model loaded successfully.');
    } catch (error) {
      console.error('[NSFW] Failed to load NSFWJS model:', error);
      throw error;
    }
  }
};

interface NsfwCheckResult {
  isNsfw: boolean;
  predictions: Array<{ className: string; probability: number }>;
}

/**
 * Check if an image buffer contains NSFW content
 */
export const checkNsfw = async (imageBuffer: Buffer): Promise<NsfwCheckResult> => {
  // Ensure model is initialized
  await initNsfw();

  if (!nsfwModel) {
    throw new Error('NSFW model is not loaded');
  }

  let imageTensor: tf.Tensor3D | null = null;

  try {
    // Decode the image buffer into a 3D Tensor (3 channels: RGB)
    imageTensor = tf.node.decodeImage(imageBuffer, 3) as tf.Tensor3D;
  } catch (error) {
    console.error('[NSFW] Image decoding failed:', error);
    throw new Error('Failed to decode image buffer. Please upload a valid image (JPG, PNG, or WEBP).');
  }

  try {
    // Classify the image tensor
    const predictions = await nsfwModel.classify(imageTensor);

    // Explicitly dispose of the tensor to prevent GPU/system memory leaks
    imageTensor.dispose();
    imageTensor = null;

    // Predictions is an array like:
    // [ { className: 'Neutral', probability: 0.98 }, { className: 'Sexy', probability: 0.01 }, ... ]
    const pornProb = predictions.find((p: any) => p.className === 'Porn')?.probability ?? 0;
    const hentaiProb = predictions.find((p: any) => p.className === 'Hentai')?.probability ?? 0;
    const sexyProb = predictions.find((p: any) => p.className === 'Sexy')?.probability ?? 0;

    // Strict e-commerce rules:
    // Block if Porn + Hentai probability is greater than 50%
    // Block if Sexy probability is greater than 85%
    const isNsfw = (pornProb + hentaiProb) > 0.50 || sexyProb > 0.85;

    if (isNsfw) {
      console.warn(`[NSFW] Blocked image upload: Porn=${(pornProb * 100).toFixed(1)}%, Hentai=${(hentaiProb * 100).toFixed(1)}%, Sexy=${(sexyProb * 100).toFixed(1)}%`);
    }

    return {
      isNsfw,
      predictions,
    };
  } catch (error) {
    // Make sure we clean up the tensor if classification fails
    if (imageTensor) {
      imageTensor.dispose();
    }
    console.error('[NSFW] Classification failed:', error);
    throw new Error('Failed to classify image.');
  }
};
