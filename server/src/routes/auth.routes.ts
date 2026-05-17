import { Router } from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from '../lib/auth.js';
import {
  loginLimiter,
  registerLimiter,
  authActionLimiter,
} from '../middleware/loginRateLimiter.js';

const router = Router();

// Mount targeted rate limiters for core authentication actions
router.post('/sign-in/email', loginLimiter);
router.post('/sign-up/email', registerLimiter);
router.post('/forget-password', authActionLimiter);
router.post('/reset-password', authActionLimiter);

// Mount Better Auth handler - handles ALL auth routes including:
// - /sign-in/email
// - /sign-up/email
// - /sign-in/social (Google OAuth)
// - /sign-out
// - /session (get current session)
// - /callback (OAuth callback)
// - /forget-password
// - /reset-password
router.all("/*splat", toNodeHandler(auth));

export default router;
