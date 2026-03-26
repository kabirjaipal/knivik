import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';

/**
 * GET /api/admin/stats
 * Returns high-level system statistics.
 */
export const getStats = async (req: Request, res: Response) => {
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
    const users = await db.client.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        createdAt: true,
        isScanning: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: users });
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
    const logs = await db.client.llmUsageLog.findMany({
      include: {
        model: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Last 100 logs for detail
    });

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
        }))
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
export const getEngineHealth = async (req: Request, res: Response) => {
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
