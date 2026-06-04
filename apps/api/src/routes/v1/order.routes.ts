import { Router } from 'express';
import { getOrders, getOrderById, updateOrderStatus, requestOrderPolicyAction, getSellerOrders, getSellerOrderById, cancelCustomerOrder } from '../../controllers/order.controller.js';
import { exportOrdersPdf, exportOrdersCsv } from '../../controllers/order_export.controller.js';
import { authenticateUser, requireSeller, requireCustomer, requireSellerOrAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all endpoints with session checks
router.use(authenticateUser);

router.get('/seller/me', requireSeller, getSellerOrders);
router.get('/seller/me/:id', requireSeller, getSellerOrderById);

router.get('/', getOrders);
router.post('/export/pdf', requireSellerOrAdmin, exportOrdersPdf);
router.post('/export/csv', requireSellerOrAdmin, exportOrdersCsv);
router.get('/:id', getOrderById);
router.patch('/:id/status', requireSellerOrAdmin, updateOrderStatus);
router.post('/:id/policy-action', requireCustomer, requestOrderPolicyAction);
router.post('/:id/cancel', requireCustomer, cancelCustomerOrder);

export default router;
