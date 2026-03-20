import { Router } from 'express';
import { registerUser, loginUser, getMe, getAllUsers, getUserById, deleteUser, updatePassword } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', requireAuth as any, getMe as any);
router.put('/password', requireAuth as any, updatePassword as any);
router.get('/', requireAuth as any, requireRole(['admin']) as any, getAllUsers as any);
router.get('/:id', requireAuth as any, requireRole(['admin']) as any, getUserById as any);
router.delete('/:id', requireAuth as any, requireRole(['admin']) as any, deleteUser as any);

export default router;
