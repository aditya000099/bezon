import { Request, Response, NextFunction } from 'express';
import { MediaService } from '../services/media.service.js';
import { checkNsfw } from '../utils/nsfw.js';
// @ts-ignore
import { CompositeDetector } from '@zubenelakrab/blurry/src/detector/composite.js';

/**
 * Handle image uploads to S3 with robust local fallback
 */
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file supplied for upload.',
      });
    }

    // Check for blurry image using @zubenelakrab/blurry
    try {
      const detector = new CompositeDetector();
      const scores = await detector.calculateBlurScore(file.buffer);
      console.log(`[BlurDetector] Image composite score: ${scores.composite}`);

      const isBlurry = detector.isBlurry(scores, 50);

      if (isBlurry) {
        return res.status(400).json({
          success: false,
          message: `Image upload rejected: Image is too blurry. Please upload a sharper image.`,
        });
      }
    } catch (blurError: any) {
      console.warn(
        '[BlurDetector] Image blur check failed or unsupported format:',
        blurError.message,
      );
      // We continue on error so we don't block valid uploads if the package errors
    }

    // Scan the image for NSFW content before uploading
    const moderation = await checkNsfw(file.buffer);
    if (moderation.isNsfw) {
      return res.status(400).json({
        success: false,
        message: 'Image upload rejected: NSFW content detected.',
      });
    }

    const result = await MediaService.uploadImage(file);

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export default uploadImage;
