import { Router } from 'express';
import { UsageController } from '../controllers/usage.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', UsageController.getUsageStats);
router.get('/history', UsageController.getUsageHistory);

export default router;
