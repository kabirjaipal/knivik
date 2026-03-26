import { Router } from 'express';
import { getStats, getUsers, getLlmUsage, getEngineHealth } from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes require authentication AND admin role
router.use(requireAuth, requireAdmin);

router.get('/stats', getStats);
router.get('/health', getEngineHealth);
router.get('/users', getUsers);
router.get('/llm-usage', getLlmUsage);

export default router;
