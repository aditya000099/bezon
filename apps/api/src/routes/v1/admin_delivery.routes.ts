import { Router } from 'express';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import * as AdminDeliveryController from '../../controllers/admin_delivery.controller.js';

const router = Router();

// Secure all routes under admin role
router.use(authenticateUser, requireRole(['admin']));

router.get('/dashboard', AdminDeliveryController.getDashboardMetrics);
router.get('/deliveries', AdminDeliveryController.getDeliveries);
router.get('/deliveries/:id', AdminDeliveryController.getDeliveryDetails);
router.get('/returns', AdminDeliveryController.getReturnPickups);
router.get('/partners', AdminDeliveryController.getPartners);
router.get('/partners/:id', AdminDeliveryController.getPartnerDetails);
router.get('/exceptions', AdminDeliveryController.getExceptions);
router.get('/city-analytics', AdminDeliveryController.getCityAnalytics);
router.post('/deliveries/:id/reassign', AdminDeliveryController.reassignDelivery);
router.post('/returns/:orderId/reassign', AdminDeliveryController.reassignReturnPickup);

export default router;
