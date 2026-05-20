import { Router } from 'express';
import { getMe, getAllUsers, getUserById, deleteUser, deleteMe, updatePassword, getBillingHub, getCustomerPortalUrl, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// Public hybrid endpoint — works without auth (returns prices), richer with auth
router.get('/billing-hub', getBillingHub as any);

// Protected routes
router.get('/me', requireAuth as any, getMe as any);
router.put('/profile', requireAuth as any, updateProfile as any);
router.put('/password', requireAuth as any, updatePassword as any);
router.get('/portal', requireAuth as any, getCustomerPortalUrl as any);
router.delete('/me', requireAuth as any, deleteMe as any);
router.get('/', requireAuth as any, requireRole(['admin']) as any, getAllUsers as any);
router.get('/:id', requireAuth as any, requireRole(['admin']) as any, getUserById as any);
router.delete('/:id', requireAuth as any, requireRole(['admin']) as any, deleteUser as any);

export default router;
