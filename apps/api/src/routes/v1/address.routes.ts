import { Router } from 'express';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../../controllers/address.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Address CRUD routes
router.get('/', authenticateUser, getAddresses);
router.post('/', authenticateUser, createAddress);
router.put('/:id', authenticateUser, updateAddress);
router.delete('/:id', authenticateUser, deleteAddress);

export default router;
