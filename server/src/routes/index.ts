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
import usageRoutes from './usage.routes.js';
import feedbackRoutes from './feedback.routes.js';
import referralRoutes from './referral.routes.js';
import blogRoutes from './blog.routes.js';
import contactRoutes from './contact.routes.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { checkMaintenanceMode } from '../middleware/maintenance.middleware.js';

const router = Router();

// Mount health routes FIRST so deployment probes get an instant response without DB/Auth checks
router.use('/api', healthRoutes);

// Auth middleware
router.use(optionalAuth);

// Maintenance Mode middleware (intercepts all non-admin routes if active)
router.use(checkMaintenanceMode);

router.use('/api/users', userRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/leads', leadRoutes);
router.use('/api/products', productRoutes);
router.use('/api/alerts', alertRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/webhooks', webhookRoutes);
router.use('/api/billing', billingRoutes);
router.use('/api/usage', usageRoutes);
router.use('/api/feedback', feedbackRoutes);
router.use('/api/referrals', referralRoutes);
router.use('/api/blog', blogRoutes);
router.use('/api/contact', contactRoutes);

export default router;
