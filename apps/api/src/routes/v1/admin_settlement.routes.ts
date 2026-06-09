import { Router } from 'express';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import * as adminSettlementController from '../../controllers/admin_settlement.controller.js';

const router = Router();

// All routes require admin role
router.use(authenticateUser, requireRole(['admin']));

router.get('/metrics', adminSettlementController.getAdminSettlementMetrics);
router.get('/transactions', adminSettlementController.getAdminEscrowTransactions);
router.get('/queue', adminSettlementController.getAdminSettlementQueue);
router.post('/process-manual', adminSettlementController.processSettlementsManual);

export default router;
