import { Router } from 'express';
import { getProducts, getProductBySlug, getSellerProducts, createProduct, updateProduct, archiveProduct, getProductCoupons, getRecommendations, getProductById, getProductStats, getDeliveryEstimate } from '../../controllers/product.controller.js';
import { authenticateUser, requireRole, requireSeller, requireSellerOrAdmin, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Public/Customer Endpoints
router.get('/recommended', optionalAuth, getRecommendations);
router.get('/', optionalAuth, getProducts);
router.get('/seller/me', authenticateUser, requireSeller, getSellerProducts);

// Merchant Management Endpoints (specific routes before wildcard slug)
router.get('/id/:id', authenticateUser, requireSeller, getProductById);
router.get('/:id/stats', authenticateUser, requireSeller, getProductStats);
router.get('/:id/delivery-estimate', optionalAuth, getDeliveryEstimate);

router.get('/:slug', getProductBySlug);

router.get('/:slug/coupons', optionalAuth, getProductCoupons);

router.post('/', authenticateUser, requireSeller, createProduct);
router.put('/:id', authenticateUser, requireSeller, updateProduct);
router.delete('/:id', authenticateUser, requireSellerOrAdmin, archiveProduct); // requireSeller logic in controller can handle seller vs admin, or wait...

export default router;
