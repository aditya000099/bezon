import { Router } from 'express';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import * as ApplicationController from '../../controllers/application.controller.js';

const router = Router();

// Customer facing routes for applying
router.post('/apply', authenticateUser, ApplicationController.applyToBecomeSeller);
router.get('/status', authenticateUser, ApplicationController.getSellerStatus);

// Customer facing routes for applying (Delivery Partner)
router.post('/delivery/apply', authenticateUser, ApplicationController.applyToBecomeDeliveryPartner);
router.get('/delivery/status', authenticateUser, ApplicationController.getDeliveryPartnerStatus);

// Admin facing routes for managing applications (Seller)
router.get('/admin/applications', authenticateUser, requireRole(['admin']), ApplicationController.getApplications);
router.post('/admin/:id/approve', authenticateUser, requireRole(['admin']), ApplicationController.approveSeller);
router.post('/admin/:id/reject', authenticateUser, requireRole(['admin']), ApplicationController.rejectSeller);
router.post('/admin/:id/suspend', authenticateUser, requireRole(['admin']), ApplicationController.suspendSeller);
router.post('/admin/:id/reactivate', authenticateUser, requireRole(['admin']), ApplicationController.reactivateSeller);

// Admin facing routes for managing applications (Delivery Partner)
router.get('/admin/delivery/applications', authenticateUser, requireRole(['admin']), ApplicationController.getDeliveryApplications);
router.post('/admin/delivery/:id/approve', authenticateUser, requireRole(['admin']), ApplicationController.approveDeliveryPartner);
router.post('/admin/delivery/:id/reject', authenticateUser, requireRole(['admin']), ApplicationController.rejectDeliveryPartner);
router.post('/admin/delivery/:id/suspend', authenticateUser, requireRole(['admin']), ApplicationController.suspendDeliveryPartner);
router.post('/admin/delivery/:id/reactivate', authenticateUser, requireRole(['admin']), ApplicationController.reactivateDeliveryPartner);

export default router;
