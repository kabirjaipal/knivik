import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';

/**
 * GET /api/admin/stats
 * Returns high-level system statistics.
 */
export const getStats = async (_req: Request, res: Response) => {
  try {
    const [userCount, productCount, leadCount, activeScans] = await Promise.all([
      db.client.user.count(),
      db.client.product.count(),
      db.client.lead.count(),
      db.client.user.count({ where: { isScanning: true } })
    ]);

    const leadsToday = await db.client.lead.count({
      where: {
        createdAt: {
          gt: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    res.json({
      success: true,
      data: {
        userCount,
        productCount,
        leadCount,
        leadsToday,
        activeScans
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Stats Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/admin/users
 * Returns list of all users with their plan and product count.
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)); // Cap at 100
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, totalCount] = await Promise.all([
      db.client.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          plan: true,
          createdAt: true,
          isScanning: true,
          metadata: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.client.user.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Users Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/admin/llm-usage
 * Aggregates LLM costs system-wide.
 */
export const getLlmUsage = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50)); // Cap at 200
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      db.client.llmUsageLog.findMany({
        include: {
          model: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.client.llmUsageLog.count()
    ]);
    
    // Aggregate totals
    const totals = await db.client.llmUsageLog.groupBy({
      by: ['modelId'],
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true
      },
      _count: {
        id: true
      }
    });

    // Fetch models to get pricing
    const models = await db.client.llmModel.findMany();
    const modelMap = new Map(models.map(m => [m.id, m]));

    let totalCost = 0;
    const statsByModel = totals.map(t => {
      const model = modelMap.get(t.modelId);
      const inputPrice = model?.inputPrice || 0;
      const outputPrice = model?.outputPrice || 0;
      
      const cost = ((t._sum.inputTokens || 0) / 1_000_000 * inputPrice) + 
                   ((t._sum.outputTokens || 0) / 1_000_000 * outputPrice);
      
      totalCost += cost;

      return {
        modelId: t.modelId,
        requestCount: t._count.id,
        tokens: t._sum.totalTokens,
        cost: Number(cost.toFixed(6))
      };
    });

    res.json({
      success: true,
      data: {
        totalCost: Number(totalCost.toFixed(4)),
        statsByModel,
        recentLogs: logs.map(l => ({
          id: l.id,
          action: l.action,
          model: l.modelId,
          tokens: l.totalTokens,
          cost: Number((((l.inputTokens / 1_000_000) * (l.model.inputPrice)) + ((l.outputTokens / 1_000_000) * (l.model.outputPrice))).toFixed(6)),
          status: l.status,
          createdAt: l.createdAt
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin LLM Usage Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/admin/health
 * Checks real-time health of scraper gateways.
 */
export const getEngineHealth = async (_req: Request, res: Response) => {
  try {
    const checks = [
      { name: 'Reddit', url: 'https://www.reddit.com/r/saas/.rss' },
      { name: 'HackerNews', url: 'https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=1' },
      { name: 'Twitter/X', url: 'https://nitter.net/search/rss?f=tweets&q=saas' },
      { name: 'LinkedIn', url: 'https://html.duckduckgo.com/html/?q=site:linkedin.com/posts' },
      { name: 'ProductHunt', url: 'https://html.duckduckgo.com/html/?q=site:producthunt.com/discussions' },
    ];

    const results = await Promise.all(checks.map(async (c) => {
      try {
        const start = Date.now();
        const response = await fetch(c.url, { 
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Knivik/1.0' },
          signal: AbortSignal.timeout(6000) 
        });
        const latency = Date.now() - start;
        
        // Some gateways return 403/429 but are technically "up", 
        // but we'll flag any non-200 as Degraded.
        let status = 'Operational';
        if (!response.ok) status = 'Degraded';
        if (response.status === 429) status = 'Rate Limited';
        
        return { 
          name: c.name, 
          status, 
          latency: `${latency}ms`,
          code: response.status 
        };
      } catch (e: any) {
        return { 
          name: c.name, 
          status: 'Offline', 
          latency: 'timeout', 
          error: e.message 
        };
      }
    }));

    res.json({ success: true, data: results });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Health Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * POST /api/admin/users/:id/update-plan
 * Manually changes a user's subscription tier.
 */
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { plan } = req.body; // 'FREE' or 'PRO'

    if (!['FREE', 'PRO'].includes(plan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan tier' });
    }

    await db.client.user.update({
      where: { id },
      data: { plan }
    });

    logger.info({ adminId: (req as any).user?.id, targetUserId: id, newPlan: plan }, 'Admin updated user plan');
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.params.id }, 'Admin Update Plan Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * POST /api/admin/users/:id/toggle-status
 * Suspends or activates a user.
 */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await db.client.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Use metadata to store suspension status if not in schema, 
    // or we can use a dedicated field. Checking schema... 
    // Role is 'user' or 'admin'. We can't suspend via role easily.
    // Let's check if there's an isActive field.
    
    // For now, we'll use metadata.suspended = true/false
    const currentMetadata = (user.metadata as any) || {};
    const isSuspended = !currentMetadata.suspended;

    await db.client.user.update({
      where: { id },
      data: {
        metadata: {
          ...currentMetadata,
          suspended: isSuspended,
          suspendedAt: isSuspended ? new Date() : null
        }
      }
    });

    logger.info({ adminId: (req as any).user?.id, targetUserId: id, isSuspended }, 'Admin toggled user suspension');
    res.json({ success: true, suspended: isSuspended });
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.params.id }, 'Admin Toggle Status Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes a user and all their data.
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Safety: Don't allow deleting yourself
    if (id === (req as any).user?.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    await db.client.user.delete({ where: { id } });

    logger.info({ adminId: (req as any).user?.id, deletedUserId: id }, 'Admin deleted user account');
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error: error.message, userId: req.params.id }, 'Admin Delete User Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/admin/leads
 * Returns a global list of recent leads for oversight.
 */
export const getLeads = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)); // Cap at 100
    const skip = (page - 1) * limit;

    const [leads, totalCount] = await Promise.all([
      db.client.lead.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              user: {
                select: { username: true, email: true }
              }
            }
          }
        }
      }),
      db.client.lead.count()
    ]);

    res.json({ 
      success: true, 
      data: leads,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Global Leads Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/admin/alerts
 * Returns a global list of alert delivery attempts.
 */
export const getAlertLogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)); // Cap at 100
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      db.client.alertLog.findMany({
        take: limit,
        skip,
        orderBy: { sentAt: 'desc' },
        include: {
          lead: {
            select: { title: true, intentScore: true }
          },
          alertSetting: {
            include: {
              user: {
                select: { username: true, email: true }
              }
            }
          }
        }
      }),
      db.client.alertLog.count()
    ]);

    res.json({ 
      success: true, 
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Alert Logs Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/admin/revenue
 * Aggregates revenue and subscription metrics.
 */
export const getRevenue = async (_req: Request, res: Response) => {
  try {
    const [revenueAggregate, activeSubscriptions, recentPayments] = await Promise.all([
      // Use aggregate instead of findMany to avoid loading all rows into memory
      db.client.payment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      db.client.subscription.findMany({ where: { status: 'active' } }),
      db.client.payment.findMany({ 
        take: 10, 
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true, email: true } } }
      })
    ]);

    const totalRevenueCents = revenueAggregate._sum.amount ?? 0;
    
    // Simple MRR calculation based on active subscriptions
    // In a real app, this would be more complex (handling annual vs monthly)
    const mrrCents = activeSubscriptions.reduce((sum, s) => {
      // Assuming PRO is $49/mo or $490/yr
      const monthlyAmount = s.billingCycle === 'year' ? (49000 / 12) : 4900; 
      return sum + monthlyAmount;
    }, 0);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenueCents / 100,
        mrr: mrrCents / 100,
        activeSubscribers: activeSubscriptions.length,
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt,
          user: p.user
        }))
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Revenue Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/admin/config
 * Returns global system configuration.
 */
export const getConfig = async (_req: Request, res: Response) => {
  try {
    const configs = await db.client.systemConfig.findMany();
    const configMap = configs.reduce((acc, c) => ({ ...acc, [c.key]: (c.value as any) }), {});
    
    // Default configs if none exist
    const defaults = {
      maintenanceMode: false,
      registrationEnabled: true,
      aiModelVersatile: 'llama-3.3-70b-versatile',
      aiModelLite: 'llama-3.1-8b-instant'
    };

    res.json({ success: true, data: { ...defaults, ...configMap } });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Get Config Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * POST /api/admin/config
 * Updates global system configuration.
 */
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;

    // Validate key and value are present and sane types
    if (!key || typeof key !== 'string' || key.length > 128) {
      return res.status(400).json({ success: false, error: 'Invalid config key' });
    }
    if (value === undefined || value === null) {
      return res.status(400).json({ success: false, error: 'Config value is required' });
    }

    await db.client.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    logger.info({ adminId: (req as any).user?.id, key, value }, 'Admin updated system configuration');
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Update Config Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
/**
 * GET /api/admin/models
 * Returns list of available LLM models.
 */
export const getModels = async (_req: Request, res: Response) => {
  try {
    const models = await db.client.llmModel.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' }
    });
    res.json({ success: true, data: models });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Get Models Error');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
