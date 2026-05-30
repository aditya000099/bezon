import { Router } from 'express';
import v1Router from './v1/index.js';

const router = Router();

// Mount all major API modules
router.use('/v1', v1Router);

export default router;
