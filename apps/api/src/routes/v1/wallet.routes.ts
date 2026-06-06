import { Router } from 'express';
import { getMyWallet, getTransactions, getAllWallets, manualCredit } from '../../controllers/wallet.controller.js';
import { authenticateUser, requireRole, requireSellerOrAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

// Seller or Admin: own wallet
router.get('/me', authenticateUser, requireSellerOrAdmin, getMyWallet);
router.get('/transactions', authenticateUser, requireSellerOrAdmin, getTransactions);

// Admin only
router.get('/all', authenticateUser, requireRole(['admin']), getAllWallets);
router.post('/manual-credit', authenticateUser, requireRole(['admin']), manualCredit);

export default router;
