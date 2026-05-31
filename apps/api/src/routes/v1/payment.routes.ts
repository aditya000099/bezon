import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../../controllers/payment.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Secure all endpoints under customer authenticated sessions
router.use(authenticateUser, requireRole(['customer']));

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);

export default router;
