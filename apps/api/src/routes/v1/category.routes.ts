import { Router } from 'express';
import { getCategories, createCategory } from '../../controllers/category.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Category Endpoints
router.get('/', getCategories);
router.post('/', authenticateUser, requireRole(['admin']), createCategory);

export default router;
