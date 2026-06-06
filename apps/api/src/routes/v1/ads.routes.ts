import { Router } from 'express';
import {
  createCampaign, getMyCampaigns, updateCampaign, deleteCampaign,
  getCampaignStats, getSponsoredProducts, recordAdClick, getAdminCampaigns,
} from '../../controllers/ads.controller.js';
import { authenticateUser, optionalAuth, requireSeller, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Seller campaign management
router.post('/campaigns', authenticateUser, requireSeller, createCampaign);
router.get('/campaigns/me', authenticateUser, requireSeller, getMyCampaigns);
router.put('/campaigns/:id', authenticateUser, requireSeller, updateCampaign);
router.delete('/campaigns/:id', authenticateUser, requireSeller, deleteCampaign);
router.get('/campaigns/:id/stats', authenticateUser, requireSeller, getCampaignStats);

// Public: get sponsored products and record clicks
router.post('/sponsored', optionalAuth, getSponsoredProducts);
router.post('/click/:campaignId', optionalAuth, recordAdClick);

// Admin
router.get('/admin/campaigns', authenticateUser, requireRole(['admin']), getAdminCampaigns);

export default router;
