import { Router } from 'express';
import { createFeedback, getFeedbacks } from '../controllers/feedback.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { feedbackLimiter } from '../middleware/loginRateLimiter.js';

const router = Router();

// Public feedback submission endpoint (protected by anti-spam rate limiter)
router.post('/', feedbackLimiter, createFeedback);

// Admin-only retrieval endpoint
router.get('/', requireAuth, requireAdmin, getFeedbacks);

export default router;
