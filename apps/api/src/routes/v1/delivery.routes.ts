import { Router } from 'express';
import { authenticateUser, requireDeliveryPartner } from '../../middleware/auth.middleware.js';
import {
  getProfile,
  updateProfile,
  updateLocation,
  getQueue,
  getHistory,
  updateAssignmentStatus,
} from '../../controllers/delivery.controller.js';

const router = Router();

// Secure routes under delivery partner credentials
router.use(authenticateUser, requireDeliveryPartner);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/location', updateLocation);
router.get('/queue', getQueue);
router.get('/history', getHistory);
router.patch('/assignments/:id/status', updateAssignmentStatus);

export default router;
