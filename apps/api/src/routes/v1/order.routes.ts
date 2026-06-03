import { Router } from 'express';
import { getOrders, getOrderById, updateOrderStatus, requestOrderPolicyAction, getSellerOrders, getSellerOrderById } from '../../controllers/order.controller.js';
import { authenticateUser, requireSeller, requireCustomer } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all endpoints with session checks
router.use(authenticateUser);

router.get('/seller/me', requireSeller, getSellerOrders);
router.get('/seller/me/:id', requireSeller, getSellerOrderById);

router.get('/', requireCustomer, getOrders);
router.get('/:id', requireCustomer, getOrderById);
router.patch('/:id/status', requireCustomer, updateOrderStatus);
router.post('/:id/policy-action', requireCustomer, requestOrderPolicyAction);

export default router;
