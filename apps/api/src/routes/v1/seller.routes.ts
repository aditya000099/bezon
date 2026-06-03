import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getDashboardStats,
  getSellerShopBySlug,
} from '../../controllers/seller.controller.js';
import {
  authenticateUser,
  requireSeller,
} from '../../middleware/auth.middleware.js';

const router = Router();

// Public route to view seller shop (no auth required)
router.get('/shop/:shopSlug', getSellerShopBySlug);

// All other seller routes require auth and an approved seller profile
router.use(authenticateUser, requireSeller);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/stats', getDashboardStats);

export default router;
