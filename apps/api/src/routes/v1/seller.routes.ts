import { Router } from 'express';
import {
  getSettings,
  updateSettings,
} from '../../controllers/seller.controller.js';
import {
  authenticateUser,
  requireRole,
} from '../../middleware/auth.middleware.js';

const router = Router();

// All seller routes require auth and seller role
router.use(authenticateUser, requireRole(['seller']));

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

export default router;
