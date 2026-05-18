import express, { Router } from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from '../lib/auth.js';
import {
  loginLimiter,
  registerLimiter,
  authActionLimiter,
} from '../middleware/loginRateLimiter.js';
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
} from '../controllers/auth.controller.js';

const router = Router();

// Mount targeted rate limiters for core authentication actions
router.post('/sign-in/email', loginLimiter);
router.post('/sign-up/email', registerLimiter);

// Custom Password Reset and Email Verification Controllers (with explicit JSON body parsing)
router.post('/forgot-password', express.json(), authActionLimiter, forgotPassword);
router.post('/forget-password', express.json(), authActionLimiter, forgotPassword); // Support spelling variation used by Better Auth and rate limit config
router.post('/reset-password', express.json(), authActionLimiter, resetPassword);
router.post('/verify-email', express.json(), verifyEmail);

// Mount Better Auth handler - handles remaining auth routes including:
// - /sign-in/email
// - /sign-up/email
// - /sign-in/social (Google OAuth)
// - /sign-out
// - /session (get current session)
// - /callback (OAuth callback)
router.all("/*splat", toNodeHandler(auth));

export default router;
