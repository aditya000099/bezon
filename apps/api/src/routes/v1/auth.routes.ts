import { Router } from 'express';
import { register, login, logout, getMe } from '../../controllers/auth.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);

export default router;
