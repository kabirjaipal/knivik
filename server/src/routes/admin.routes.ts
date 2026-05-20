import { Router } from 'express';
import { 
  getStats,
  getUsers, 
  getLlmUsage, 
  getEngineHealth, 
  getAlertLogs,
  getRevenue,
  getConfig,
  updateConfig,
  getModels,
  updatePlan, 
  toggleUserStatus, 
  deleteUser,
  getLogs,
  getMemoryStats
} from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes require authentication AND admin role
router.use(requireAuth, requireAdmin);

router.get('/stats', getStats);
router.get('/health', getEngineHealth);
router.get('/users', getUsers);
router.get('/alerts', getAlertLogs);
router.get('/revenue', getRevenue);
router.get('/config', getConfig);
router.post('/config', updateConfig);
router.get('/models', getModels);
router.get('/llm-usage', getLlmUsage);
router.get('/logs', getLogs);
router.get('/memory', getMemoryStats);

// User Management Actions
router.post('/users/:id/update-plan', updatePlan);
router.post('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
