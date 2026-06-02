import { Router } from 'express';
import { getWishlist, toggleWishlist } from '../../controllers/wishlist.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Secure all endpoints under customer authenticated sessions
router.use(authenticateUser, requireRole(['customer']));

router.get('/', getWishlist);
router.post('/toggle/:productId', toggleWishlist);

export default router;
