import { Router } from 'express';
import { getAllPolicies, createPolicy, updatePolicy, togglePolicyActive, deletePolicy } from '../../controllers/policy.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Public — anyone can read active policies (sellers need to list, customers see on product page)
router.get('/', getAllPolicies);

// Admin only — CRUD operations
router.post('/', authenticateUser, requireRole(['admin']), createPolicy);
router.put('/:id', authenticateUser, requireRole(['admin']), updatePolicy);
router.patch('/:id/toggle', authenticateUser, requireRole(['admin']), togglePolicyActive);
router.delete('/:id', authenticateUser, requireRole(['admin']), deletePolicy);

export default router;
