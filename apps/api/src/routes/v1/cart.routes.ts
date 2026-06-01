import { Router } from 'express';
import { getCart, addCartItem, updateCartItemQty, removeCartItem } from '../../controllers/cart.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Secure all endpoints under Customer Role
router.use(authenticateUser, requireRole(['customer']));

router.get('/', getCart);
router.post('/items', addCartItem);
router.put('/items/:id', updateCartItemQty);
router.delete('/items/:id', removeCartItem);

export default router;
