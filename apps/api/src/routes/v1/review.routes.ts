import { Router } from 'express';
import { ReviewController } from '../../controllers/review.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/product/:productId', ReviewController.getProductReviews);
router.get('/product/:productId/summary', ReviewController.getProductReviewSummary);

router.post('/', authenticateUser, ReviewController.createReview);

export default router;
