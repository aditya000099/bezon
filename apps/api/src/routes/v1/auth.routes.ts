import { Router } from 'express';
import { register, login, logout, getMe, updateProfile, forgotPassword, verifyOtp, resetPassword } from '../../controllers/auth.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);
router.put('/profile', authenticateUser, updateProfile);

// Password Reset Endpoints
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;

