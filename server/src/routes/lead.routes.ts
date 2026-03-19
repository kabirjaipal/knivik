import { Router } from 'express';
import { getLeads, generateLeadReply } from '../controllers/lead.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Protected routes
router.get('/', requireAuth as any, getLeads as any);
router.post('/:id/reply', requireAuth as any, generateLeadReply as any);

export default router;
