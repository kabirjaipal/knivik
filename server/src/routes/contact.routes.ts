import { Router } from 'express';
import { submitContactForm } from '../controllers/contact.controller.js';
import { contactLimiter } from '../middleware/loginRateLimiter.js';

const router = Router();

// Submit contact form (public, rate limited)
router.post('/', contactLimiter, submitContactForm);

export default router;
