import { Router } from 'express';
import { 
  claimReferral,
  createReferralCode,
  getCreatorStats,
  getAdminPayouts,
  recordAdminPayout,
  toggleCreatorReferralAccess
} from '../controllers/referral.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Creator & referred user routes
router.post('/claim', requireAuth, claimReferral);
router.post('/code', requireAuth, createReferralCode);
router.get('/stats', requireAuth, getCreatorStats);

// Platform Admin routes
router.get('/admin/payouts', requireAuth, requireAdmin, getAdminPayouts);
router.post('/admin/payouts', requireAuth, requireAdmin, recordAdminPayout);
router.post('/admin/users/:id/toggle-referrals', requireAuth, requireAdmin, toggleCreatorReferralAccess);

export default router;
