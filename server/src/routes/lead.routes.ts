import { Router } from 'express';
import { getLeads, generateLeadReply, updateLeadStatus, updateLeadNotes, updateLeadFeedback } from '../controllers/lead.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Protected routes
router.get('/', requireAuth as any, getLeads as any);
router.post('/:id/reply', requireAuth as any, generateLeadReply as any);
router.patch('/:id/status', requireAuth as any, updateLeadStatus as any);
router.patch('/:id/notes', requireAuth as any, updateLeadNotes as any);
router.patch('/:id/feedback', requireAuth as any, updateLeadFeedback as any);

export default router;
