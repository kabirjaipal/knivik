import { Router } from 'express';
import { getAlertSettings, updateAlertSettings } from '../controllers/alert.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAlertSettings as any);
router.post('/', updateAlertSettings as any);

export default router;
