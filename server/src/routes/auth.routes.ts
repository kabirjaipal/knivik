import { Router } from 'express';
import { register, login, logout, getMe, forgotPassword, resetPassword, verifyEmail, googleAuthUrl, googleCallback } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { loginLimiter } from '../middleware/loginRateLimiter.js';

const router = Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

// OAuth
router.get('/google', googleAuthUrl);
router.get('/google/callback', googleCallback);

export default router;
