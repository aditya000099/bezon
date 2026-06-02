import { Request, Response, NextFunction } from 'express';
import { QAService } from '../services/qa.service.js';

export class QAController {
  // POST /api/v1/qa — Ask a question
  static async askQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await QAService.askQuestion(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Question posted.', data: question });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/qa/answer — Answer a question
  static async postAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const answer = await QAService.answerQuestion(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Answer posted.', data: answer });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/qa/product/:productId — Get questions for a product
  static async getProductQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QAService.getProductQuestions(req.params.productId as string, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        sort: req.query.sort as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/qa/seller — Get questions for seller's products (seller dashboard)
  static async getSellerQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QAService.getSellerQuestions(req.user!.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        productId: req.query.productId as string | undefined,
        filter: req.query.filter as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/qa/seller/products — Get seller's product list for filter dropdown
  static async getSellerProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await QAService.getSellerProducts(req.user!.id);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }
}
