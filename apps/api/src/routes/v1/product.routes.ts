import { Router } from 'express';
import { getProducts, getProductBySlug, getSellerProducts, createProduct, updateProduct, archiveProduct, getProductCoupons } from '../../controllers/product.controller.js';
import { authenticateUser, requireRole, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Product Catalogue Endpoints
router.get('/', getProducts);
router.get('/seller/me', authenticateUser, requireRole(['seller']), getSellerProducts);
router.get('/:slug', getProductBySlug);
router.get('/:slug/coupons', optionalAuth, getProductCoupons);

// Merchant Management Endpoints
router.post('/', authenticateUser, requireRole(['seller']), createProduct);
router.put('/:id', authenticateUser, requireRole(['seller']), updateProduct);
router.delete('/:id', authenticateUser, requireRole(['seller', 'admin']), archiveProduct);

export default router;
