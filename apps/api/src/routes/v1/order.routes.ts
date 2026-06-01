import { Router } from 'express';
import { getOrders, getOrderById, updateOrderStatus } from '../../controllers/order.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all endpoints with session checks
router.use(authenticateUser);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

export default router;
