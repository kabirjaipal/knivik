import { Router } from 'express';
import userRoutes from './userRoutes.js';
import healthRoutes from './healthRoutes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/api/users', userRoutes);
router.use('/api/auth', authRoutes);
router.use('/api', healthRoutes);

export default router;
