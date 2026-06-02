import { Router } from 'express';
import { QAController } from '../../controllers/qa.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Public — view questions for a product
router.get('/product/:productId', QAController.getProductQuestions);

// Seller dashboard — view questions on their own products
router.get('/seller', authenticateUser, requireRole(['seller']), QAController.getSellerQuestions);
router.get('/seller/products', authenticateUser, requireRole(['seller']), QAController.getSellerProducts);

// Authenticated — ask a question or post an answer
router.post('/', authenticateUser, QAController.askQuestion);
router.post('/answer', authenticateUser, QAController.postAnswer);

export default router;
