import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getDashboardStats,
} from '../../controllers/seller.controller.js';
import {
  authenticateUser,
  requireRole,
  requireSeller,
} from '../../middleware/auth.middleware.js';

const router = Router();

// All seller routes require auth and seller role
router.use(authenticateUser, requireSeller);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/stats', getDashboardStats);

export default router;
