import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import { PLANS, PlanKey } from '../lib/plans.js';
import logger from '../lib/logger.js';

export class UsageController {
  static async getUsageStats(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // 1. Get User and Plan Limits
      const user = await db.client.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });
      const plan = (user?.plan || 'FREE') as PlanKey;
      const planLimits = PLANS[plan].limits;

      // 2. Monthly Lead Usage
      const leadUsage = await db.client.usageRecord.findUnique({
        where: {
          userId_type_month_year: {
            userId,
            type: 'leads',
            month,
            year
          }
        }
      });

      // 3. LLM Token Usage (Current Month)
      const startOfMonth = new Date(year, month - 1, 1);
      const llmLogs = await db.client.llmUsageLog.findMany({
        where: {
          userId,
          createdAt: { gte: startOfMonth }
        },
        include: {
          model: true
        }
      });

      // Aggregate LLM Stats
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      const usageByAction: Record<string, { tokens: number; count: number }> = {};
      const usageByModel: Record<string, { tokens: number; count: number }> = {};

      llmLogs.forEach(log => {
        totalInputTokens += log.inputTokens;
        totalOutputTokens += log.outputTokens;

        // Group by Action
        if (!usageByAction[log.action]) usageByAction[log.action] = { tokens: 0, count: 0 };
        usageByAction[log.action].tokens += log.totalTokens;
        usageByAction[log.action].count += 1;

        // Group by Model
        if (!usageByModel[log.modelId]) usageByModel[log.modelId] = { tokens: 0, count: 0 };
        usageByModel[log.modelId].tokens += log.totalTokens;
        usageByModel[log.modelId].count += 1;
      });

      // 4. Lead Source Breakdown (Current Month)
      const leads = await db.client.lead.findMany({
        where: {
          productId: { in: await db.client.product.findMany({ where: { userId }, select: { id: true } }).then(p => p.map(x => x.id)) },
          createdAt: { gte: startOfMonth }
        },
        select: { platform: true }
      });

      const sourceDistribution: Record<string, number> = {
        'REDDIT': 0,
        'TWITTER': 0,
        'HACKERNEWS': 0,
      };

      leads.forEach(l => {
        if (sourceDistribution[l.platform] !== undefined) {
          sourceDistribution[l.platform]++;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          plan: {
            name: plan,
            limits: planLimits
          },
          leads: {
            used: leadUsage?.count || 0,
            limit: planLimits.leadsPerMonth,
            remaining: Math.max(0, planLimits.leadsPerMonth - (leadUsage?.count || 0)),
            bySource: Object.entries(sourceDistribution).map(([platform, count]) => ({
              platform,
              count,
              percentage: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
            }))
          },
          llm: {
            totalTokens: totalInputTokens + totalOutputTokens,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            usageByAction: Object.entries(usageByAction).map(([action, stats]) => ({
              action,
              tokens: stats.tokens,
              count: stats.count
            })),
            usageByModel: Object.entries(usageByModel).map(([model, stats]) => ({
              model,
              tokens: stats.tokens,
              count: stats.count
            }))
          },
          period: {
            month,
            year
          }
        }
      });
    } catch (error) {
      logger.error({ error, userId }, 'Failed to fetch usage stats');
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUsageHistory(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const logs = await db.client.llmUsageLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          model: true,
          product: { select: { name: true } }
        }
      });

      res.status(200).json({
        success: true,
        data: logs.map(log => ({
          id: log.id,
          action: log.action,
          model: log.modelId,
          tokens: log.totalTokens,
          product: log.product?.name || 'System Task',
          status: log.status,
          createdAt: log.createdAt,
          cost: Number(((log.inputTokens / 1_000_000) * (log.model.inputPrice || 0) + (log.outputTokens / 1_000_000) * (log.model.outputPrice || 0)).toFixed(6))
        }))
      });
    } catch (error) {
      logger.error({ error, userId }, 'Failed to fetch usage history');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
