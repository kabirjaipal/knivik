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

// Rate-limited auth routes — limiter runs first, then Better Auth handles the request
const baHandler = toNodeHandler(auth) as express.RequestHandler;
router.post('/sign-in/email', loginLimiter, baHandler);
router.post('/sign-up/email', registerLimiter, baHandler);

// Custom Password Reset and Email Verification Controllers (with explicit JSON body parsing)
router.post('/forgot-password', express.json(), authActionLimiter, forgotPassword);
router.post('/forget-password', express.json(), authActionLimiter, forgotPassword);
router.post('/reset-password', express.json(), authActionLimiter, resetPassword);
router.post('/verify-email', express.json(), verifyEmail);

// Better Auth handler — catches all other auth routes:
// - /sign-in/social (Google OAuth), /sign-out, /session, /callback, etc.
router.all('/*splat', baHandler);

export default router;
