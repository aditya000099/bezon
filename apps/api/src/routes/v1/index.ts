import { Router } from 'express';
import authRouter from './auth.routes.js';

const router = Router();

// Mount all v1 route submodules
router.use('/auth', authRouter);

export default router;
