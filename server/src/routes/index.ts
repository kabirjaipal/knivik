import { Router } from 'express';
import userRoutes from './userRoutes.js';
import healthRoutes from './healthRoutes.js';
import authRoutes from './auth.routes.js';
import leadRoutes from './lead.routes.js';
import productRoutes from './product.routes.js';
import alertRoutes from './alert.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import webhookRoutes from './webhook.routes.js';

const router = Router();

router.use('/api/users', userRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/leads', leadRoutes);
router.use('/api/products', productRoutes);
router.use('/api/alerts', alertRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/webhooks', webhookRoutes);
router.use('/api', healthRoutes);

export default router;
