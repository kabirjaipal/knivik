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
import billingRoutes from './billing.routes.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Auth middleware
router.use(optionalAuth);

router.use('/api/users', userRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/leads', leadRoutes);
router.use('/api/products', productRoutes);
router.use('/api/alerts', alertRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/webhooks', webhookRoutes);
router.use('/api/billing', billingRoutes);
router.use('/api', healthRoutes);

export default router;
