import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service.js';

export class ReviewController {
  static async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const review = await ReviewService.createReview(userId, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  static async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const result = await ReviewService.getProductReviews(productId, req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getProductReviewSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId as string;
      const summary = await ReviewService.getProductReviewSummary(productId);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}
