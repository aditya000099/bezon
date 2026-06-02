import { Router } from 'express';
import { NotificationController } from '../../controllers/notification.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.get('/', authenticateUser, NotificationController.getUserNotifications);
router.get('/unread-count', authenticateUser, NotificationController.getUnreadCount);
router.patch('/read-all', authenticateUser, NotificationController.markAllAsRead);
router.patch('/:id/read', authenticateUser, NotificationController.markAsRead);

export default router;
