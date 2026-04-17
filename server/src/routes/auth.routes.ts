import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleAuthUrl,
  googleCallback,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  loginLimiter,
  registerLimiter,
  authActionLimiter,
} from '../middleware/loginRateLimiter.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', authActionLimiter, forgotPassword);
router.post('/reset-password', authActionLimiter, resetPassword);
router.post('/verify-email', authActionLimiter, verifyEmail);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

// Google OAuth — no rate limit on the initiation redirect; the callback
// cannot be meaningfully rate-limited server-side because it's driven by Google.
router.get('/google', googleAuthUrl);
router.get('/google/callback', googleCallback);

export default router;
