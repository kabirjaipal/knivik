import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { z } from 'zod';

const claimReferralSchema = z.object({
  referralCode: z.string().min(2, 'Referral code must be at least 2 characters').max(30, 'Referral code is too long'),
});

const createCodeSchema = z.object({
  code: z.string()
    .min(3, 'Referral code must be at least 3 characters')
    .max(15, 'Referral code must be at most 15 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Referral code can only contain alphanumeric characters, hyphens, and underscores')
    .optional(),
});

const recordPayoutSchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required'),
  amount: z.number().int().min(100, 'Amount must be at least 100 cents'),
  currency: z.literal('USD').default('USD'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

/**
 * Claim a referral code for the currently authenticated user
 * POST /api/referrals/claim
 */
export const claimReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = claimReferralSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid input data', 
        details: parsed.error.issues 
      });
      return;
    }

    // @ts-ignore
    const currentUserId = req.user?.id as string;

    // Check if the user is already referred
    const existingReferral = await db.client.referral.findUnique({
      where: { referredUserId: currentUserId }
    });

    if (existingReferral) {
      res.status(400).json({ 
        success: false, 
        error: 'You have already claimed a referral code or were already referred.' 
      });
      return;
    }

    const { referralCode } = parsed.data;
    const normalizedCode = referralCode.trim().toUpperCase();

    // Find the referral code record and fetch creator's status
    const referralCodeRecord = await db.client.referralCode.findUnique({
      where: { code: normalizedCode },
      include: {
        creator: {
          select: { 
            id: true, 
            referralPartner: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!referralCodeRecord) {
      res.status(404).json({ 
        success: false, 
        error: 'Referral code not found' 
      });
      return;
    }

    // Check if creator is allowed to use referrals (has a ReferralPartner record)
    if (!referralCodeRecord.creator.referralPartner) {
      res.status(400).json({ 
        success: false, 
        error: 'This referral code is currently inactive.' 
      });
      return;
    }

    // Prevent referring oneself
    if (referralCodeRecord.creatorId === currentUserId) {
      res.status(400).json({ 
        success: false, 
        error: 'You cannot use your own referral code' 
      });
      return;
    }

    // Create the referral link record
    const referral = await db.client.referral.create({
      data: {
        referralCodeId: referralCodeRecord.id,
        referredUserId: currentUserId,
        status: 'SIGNED_UP'
      }
    });

    logger.info(
      { referralId: referral.id, referredUserId: currentUserId, code: normalizedCode }, 
      'User claimed a referral code successfully'
    );

    res.status(201).json({
      success: true,
      message: 'Referral code claimed successfully',
      referral
    });
  } catch (error) {
    logger.error({ error }, 'Claim referral controller error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Create a referral code for the currently authenticated creator
 * POST /api/referrals/code
 */
export const createReferralCode = async (req: Request, res: Response): Promise<void> => {
  res.status(400).json({
    success: false,
    error: 'Creating custom referral codes is disabled. Your referral code is automatically assigned.'
  });
};

/**
 * Get stats and payout details for the currently logged-in creator
 * GET /api/referrals/stats
 */
export const getCreatorStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const currentUserId = req.user?.id as string;
    // @ts-ignore
    const allowReferrals = req.user?.allowReferrals as boolean;

    if (!allowReferrals) {
      res.status(403).json({
        success: false,
        error: 'Access Denied. You are not approved to use the referral system.'
      });
      return;
    }

    // Find codes owned by the creator
    let codes = await db.client.referralCode.findMany({
      where: { creatorId: currentUserId },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                plan: true,
                payments: {
                  where: { status: { in: ['paid', 'succeeded', 'success'] } },
                  select: { amount: true, currency: true }
                }
              }
            }
          }
        }
      }
    });

    // If no codes exist, automatically generate exactly one code
    if (codes.length === 0) {
      // @ts-ignore
      const username = req.user?.username as string;
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const generatedCode = `${cleanUsername}${randomSuffix}`;

      // Check if code is already taken, if so append random suffix
      let finalCode = generatedCode;
      const existing = await db.client.referralCode.findUnique({
        where: { code: finalCode }
      });
      if (existing) {
        finalCode = `${cleanUsername}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const newCodeRecord = await db.client.referralCode.create({
        data: {
          code: finalCode,
          creatorId: currentUserId
        },
        include: {
          referrals: {
            include: {
              referredUser: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  createdAt: true,
                  plan: true,
                  payments: {
                    where: { status: { in: ['paid', 'succeeded', 'success'] } },
                    select: { amount: true, currency: true }
                  }
                }
              }
            }
          }
        }
      });
      codes = [newCodeRecord];
    }

    // Compute metrics
    let totalSignups = 0;
    let totalConversions = 0;
    let estimatedEarned = 0;

    const referralsList: any[] = [];

    for (const codeRecord of codes) {
      for (const ref of codeRecord.referrals) {
        totalSignups++;
        const isConverted = ref.status === 'CONVERTED';
        if (isConverted) {
          totalConversions++;
        }

        const referredUser = ref.referredUser;
        if (referredUser) {
          const payments = referredUser.payments;
          if (isConverted && payments) {
            for (const payment of payments) {
              if (payment.currency?.toUpperCase() === 'USD') {
                estimatedEarned += Math.round(payment.amount * 0.30);
              }
            }
          }

          referralsList.push({
            id: ref.id,
            code: codeRecord.code,
            status: ref.status,
            createdAt: ref.createdAt,
            user: {
              id: referredUser.id,
              username: referredUser.username,
              plan: referredUser.plan,
              createdAt: referredUser.createdAt,
            }
          });
        }
      }
    }

    // Retrieve manual payouts history
    const payouts = await db.client.referralPayout.findMany({
      where: { creatorId: currentUserId },
      orderBy: { createdAt: 'desc' }
    });

    const paidCommissions = payouts.reduce((sum, p) => {
      if (p.currency?.toUpperCase() === 'USD') {
        return sum + p.amount;
      }
      return sum;
    }, 0);
    const unpaidCommissions = Math.max(0, estimatedEarned - paidCommissions);

    res.status(200).json({
      success: true,
      stats: {
        totalSignups,
        totalConversions,
        unpaidCommissions,
        paidCommissions,
      },
      codes: codes.map(c => ({ id: c.id, code: c.code, createdAt: c.createdAt })),
      referrals: referralsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      payouts: payouts.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        notes: p.notes,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    logger.error({ error }, 'Get creator stats controller error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Retrieve all payouts and approved creators across the platform (Admin only)
 * GET /api/referrals/admin/payouts
 */
export const getAdminPayouts = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch manual payouts history
    const payouts = await db.client.referralPayout.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 2. Fetch approved creators (users with a ReferralPartner record)
    const approvedCreators = await db.client.user.findMany({
      where: {
        NOT: {
          referralPartner: null
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        role: true,
        referralPartner: {
          select: {
            createdAt: true
          }
        },
        referralCodes: {
          select: {
            id: true,
            code: true,
            referrals: {
              select: {
                id: true,
                status: true,
                referredUser: {
                  select: {
                    payments: {
                      where: { status: { in: ['paid', 'succeeded', 'success'] } },
                      select: { amount: true, currency: true }
                    }
                  }
                }
              }
            }
          }
        },
        referralPayouts: {
          select: {
            amount: true,
            currency: true
          }
        }
      }
    });

    const creatorsWithStats = approvedCreators.map(creator => {
      let totalSignups = 0;
      let totalConversions = 0;
      let totalEarned = 0;

      if (creator.referralCodes) {
        for (const code of creator.referralCodes) {
          if (code.referrals) {
            for (const ref of code.referrals) {
              totalSignups++;
              if (ref.status === 'CONVERTED') {
                totalConversions++;
                const payments = ref.referredUser?.payments;
                if (payments) {
                  for (const payment of payments) {
                    if (payment.currency?.toUpperCase() === 'USD') {
                      totalEarned += Math.round(payment.amount * 0.30);
                    }
                  }
                }
              }
            }
          }
        }
      }

      const totalPaidOut = creator.referralPayouts.reduce((sum, p) => {
        if (p.currency?.toUpperCase() === 'USD') {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      const unpaidBalance = Math.max(0, totalEarned - totalPaidOut);

      return {
        id: creator.id,
        username: creator.username,
        email: creator.email,
        createdAt: creator.createdAt,
        approvedAt: creator.referralPartner?.createdAt,
        role: creator.role,
        referralCode: creator.referralCodes?.[0]?.code ?? null,
        stats: {
          totalSignups,
          totalConversions,
          totalEarned,
          totalPaidOut,
          unpaidBalance
        }
      };
    });

    // Sort creators by approval date (approvedAt) descending
    creatorsWithStats.sort((a, b) => {
      const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      payouts,
      creators: creatorsWithStats
    });
  } catch (error) {
    logger.error({ error }, 'Get admin payouts controller error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Record a manual payment payout to a creator (Admin only)
 * POST /api/referrals/admin/payouts
 */
export const recordAdminPayout = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = recordPayoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid input data', 
        details: parsed.error.issues 
      });
      return;
    }

    const { creatorId, amount, currency, notes } = parsed.data;

    // Verify creator exists and has a ReferralPartner record
    const creator = await db.client.user.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        referralPartner: {
          select: { id: true }
        }
      }
    });

    if (!creator) {
      res.status(404).json({ success: false, error: 'Creator not found' });
      return;
    }

    if (!creator.referralPartner) {
      res.status(400).json({ success: false, error: 'This user is not approved for referrals' });
      return;
    }

    const payout = await db.client.referralPayout.create({
      data: {
        creatorId,
        amount,
        currency,
        status: 'PAID',
        notes: notes || null
      }
    });

    logger.info({ payoutId: payout.id, creatorId, amount }, 'Manual creator payout recorded successfully');

    res.status(201).json({
      success: true,
      message: 'Payout recorded successfully',
      payout
    });
  } catch (error) {
    logger.error({ error }, 'Record payout controller error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Toggle Creator referral access approval (Admin only)
 * POST /api/referrals/admin/users/:id/toggle-referrals
 */
export const toggleCreatorReferralAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await db.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        referralPartner: {
          select: { id: true }
        }
      }
    }) as { id: string; referralPartner: { id: string } | null } | null;

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const isApproved = !!user.referralPartner;

    if (isApproved) {
      // Remove referral partner record (revoke access)
      await db.client.referralPartner.delete({
        where: { userId: id }
      });
    } else {
      // Add referral partner record (grant access)
      await db.client.referralPartner.create({
        data: {
          userId: id
        }
      });
    }

    logger.info({ userId: id, approved: !isApproved }, 'Creator referral approval toggled');

    res.status(200).json({
      success: true,
      message: `User referral access ${!isApproved ? 'enabled' : 'disabled'} successfully`,
      allowReferrals: !isApproved
    });
  } catch (error) {
    logger.error({ error }, 'Toggle creator referral access error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
