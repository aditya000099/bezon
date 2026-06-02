import { Router } from 'express';
import { getProducts, getProductBySlug, getSellerProducts, createProduct, updateProduct, archiveProduct, getProductCoupons, getRecommendations, getProductById, getProductStats } from '../../controllers/product.controller.js';
import { authenticateUser, requireRole, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Public/Customer Endpoints
router.get('/recommended', optionalAuth, getRecommendations);
router.get('/', optionalAuth, getProducts);
router.get('/seller/me', authenticateUser, requireRole(['seller']), getSellerProducts);

// Merchant Management Endpoints (specific routes before wildcard slug)
router.get('/id/:id', authenticateUser, requireRole(['seller']), getProductById);
router.get('/:id/stats', authenticateUser, requireRole(['seller']), getProductStats);

router.get('/:slug', getProductBySlug);
router.get('/:slug/coupons', optionalAuth, getProductCoupons);

router.post('/', authenticateUser, requireRole(['seller']), createProduct);
router.put('/:id', authenticateUser, requireRole(['seller']), updateProduct);
router.delete('/:id', authenticateUser, requireRole(['seller', 'admin']), archiveProduct);

export default router;
