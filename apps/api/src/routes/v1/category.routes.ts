import { Router } from 'express';
import { 
  getCategories, 
  createCategory, 
  getAdminCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory 
} from '../../controllers/category.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Public Category Endpoints
router.get('/', getCategories);

// Admin Category Endpoints
router.get('/admin', authenticateUser, requireRole(['admin']), getAdminCategories);
router.get('/:id', authenticateUser, requireRole(['admin']), getCategoryById);
router.post('/', authenticateUser, requireRole(['admin']), createCategory);
router.put('/:id', authenticateUser, requireRole(['admin']), updateCategory);
router.delete('/:id', authenticateUser, requireRole(['admin']), deleteCategory);

export default router;
