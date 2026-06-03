import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getSellerShopBySlug,
} from '../../controllers/seller.controller.js';
import {
  authenticateUser,
  requireRole,
} from '../../middleware/auth.middleware.js';

const router = Router();

// Public route to view seller shop (no auth required)
router.get('/shop/:shopSlug', getSellerShopBySlug);

// All other seller routes require auth and seller role
router.use(authenticateUser, requireRole(['seller']));

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

export default router;
