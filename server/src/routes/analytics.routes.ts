import { Router } from 'express';
import { getDashboardAnalytics, getLlmUsage } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth as any, getDashboardAnalytics as any);
router.get('/llm', requireAuth as any, getLlmUsage as any);

export default router;
