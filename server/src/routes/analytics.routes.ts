import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth as any, getDashboardAnalytics as any);

export default router;
