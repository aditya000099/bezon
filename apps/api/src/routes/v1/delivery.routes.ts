import { Router } from 'express';
import { authenticateUser, requireDeliveryPartner } from '../../middleware/auth.middleware.js';
import {
  getProfile,
  updateProfile,
  updateLocation,
  getAvailableAssignments,
  acceptAssignment,
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
router.get('/orders/available', getAvailableAssignments);
router.post('/orders/:orderId/accept', acceptAssignment);
router.get('/orders/assigned', getQueue);
router.get('/history', getHistory);
router.patch('/assignments/:id/status', updateAssignmentStatus);

export default router;
