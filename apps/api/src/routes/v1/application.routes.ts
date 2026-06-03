import { Router } from 'express';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import * as ApplicationController from '../../controllers/application.controller.js';

const router = Router();

// Customer facing routes for applying
router.post('/apply', authenticateUser, ApplicationController.applyToBecomeSeller);
router.get('/status', authenticateUser, ApplicationController.getSellerStatus);

// Admin facing routes for managing applications
router.get('/admin/applications', authenticateUser, requireRole(['admin']), ApplicationController.getApplications);
router.post('/admin/:id/approve', authenticateUser, requireRole(['admin']), ApplicationController.approveSeller);
router.post('/admin/:id/reject', authenticateUser, requireRole(['admin']), ApplicationController.rejectSeller);

export default router;
