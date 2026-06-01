import { Router } from 'express';
import { createCoupon, updateCoupon, deleteCoupon, listSellerCoupons, applyCoupon, getCartCoupons } from '../../controllers/coupon.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Seller routes
router.post('/', authenticateUser, requireRole(['seller']), createCoupon);
router.get('/seller/me', authenticateUser, requireRole(['seller']), listSellerCoupons);
router.put('/:id', authenticateUser, requireRole(['seller']), updateCoupon);
router.delete('/:id', authenticateUser, requireRole(['seller']), deleteCoupon);

// Customer routes
router.post('/apply', authenticateUser, requireRole(['customer']), applyCoupon);
router.get('/cart', authenticateUser, requireRole(['customer']), getCartCoupons);

export default router;
