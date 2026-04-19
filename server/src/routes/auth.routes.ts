import { Router } from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from '../lib/auth.js';

const router = Router();

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
