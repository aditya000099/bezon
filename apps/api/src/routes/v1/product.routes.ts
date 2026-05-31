import { Router } from 'express';
import { getProducts, getProductBySlug, getSellerProducts, createProduct, updateProduct, archiveProduct } from '../../controllers/product.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Product Catalogue Endpoints
router.get('/', getProducts);
router.get('/seller/me', authenticateUser, requireRole(['seller']), getSellerProducts);
router.get('/:slug', getProductBySlug);

// Merchant Management Endpoints
router.post('/', authenticateUser, requireRole(['seller']), createProduct);
router.put('/:id', authenticateUser, requireRole(['seller']), updateProduct);
router.delete('/:id', authenticateUser, requireRole(['seller', 'admin']), archiveProduct);

export default router;
