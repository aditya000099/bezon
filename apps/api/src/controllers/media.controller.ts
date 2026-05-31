import { Request, Response, NextFunction } from 'express';
import { MediaService } from '../services/media.service.js';

/**
 * Handle image uploads to S3 with robust local fallback
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file supplied for upload.',
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
