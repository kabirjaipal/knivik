import { Router } from 'express';
import { healthCheck, getRequestLogs, getPublicConfig } from '../controllers/healthController.js';
import { basicAuth } from '../middleware/auth.js';

const router = Router();

router.get('/health', healthCheck);
router.get('/config/public', getPublicConfig);
router.get('/logs', basicAuth, getRequestLogs);

export default router;
