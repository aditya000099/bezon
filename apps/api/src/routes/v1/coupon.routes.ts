import { Router } from 'express';
import { createCoupon, updateCoupon, deleteCoupon, listSellerCoupons, applyCoupon, getCartCoupons } from '../../controllers/coupon.controller.js';
import { authenticateUser, requireRole, requireSeller } from '../../middleware/auth.middleware.js';

const router = Router();

// Seller routes
router.post('/', authenticateUser, requireSeller, createCoupon);
router.get('/seller/me', authenticateUser, requireSeller, listSellerCoupons);
router.put('/:id', authenticateUser, requireSeller, updateCoupon);
router.delete('/:id', authenticateUser, requireSeller, deleteCoupon);

// Customer routes
router.post('/apply', authenticateUser, requireRole(['customer']), applyCoupon);
router.get('/cart', authenticateUser, requireRole(['customer']), getCartCoupons);

export default router;
