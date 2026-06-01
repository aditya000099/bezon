import { Router } from 'express';
import { getAdminUsers } from '../../controllers/user.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Admin Endpoints
router.get('/admin', authenticateUser, requireRole(['admin']), getAdminUsers);

export default router;
