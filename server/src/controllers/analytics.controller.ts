import { Response } from 'express';
import { db } from '../lib/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';

export const getDashboardAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { status: 401, code: 'UNAUTHORIZED', message: 'User not authenticated', requestId: req.requestId }
    });
    return;
  }

  const userId = req.user.id;

  // 1. Get all products for this user
  const products = await db.client.product.findMany({
    where: { userId },
    select: { id: true, name: true }
  });

  const productIds = products.map(p => p.id);

  if (productIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        leadsOverTime: [],
        intentDistribution: [],
        platformDistribution: [],
        statusDistribution: [],
        totalLeads: 0,
        conversationsScanned: 0
      }
    });
  }

  // 2. Leads over the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const leadsOverTimeRaw = await db.client.lead.findMany({
    where: {
      productId: { in: productIds },
      createdAt: { gte: sevenDaysAgo }
    },
    select: { createdAt: true }
  });

  // Group by day manually for simplicity in JS
  const dailyCounts: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().split('T')[0];
    if (dayKey) {
      dailyCounts[dayKey] = 0;
    }
  }

  leadsOverTimeRaw.forEach(lead => {
    const day = lead.createdAt.toISOString().split('T')[0];
    if (day && dailyCounts[day] !== undefined) {
      dailyCounts[day]++;
    }
  });

  const leadsOverTime = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Intent Distribution
  const intentDistRaw = await db.client.lead.groupBy({
    by: ['intentLevel'],
    where: { productId: { in: productIds } },
    _count: { id: true }
  });

  const intentDistribution = intentDistRaw.map(item => ({
    label: item.intentLevel.replace('_', ' '),
    count: item._count.id
  }));

  // 4. Platform Distribution
  const platformDistRaw = await db.client.lead.groupBy({
    by: ['platform'],
    where: { productId: { in: productIds } },
    _count: { id: true }
  });

  const platformDistribution = platformDistRaw.map(item => ({
    label: item.platform,
    count: item._count.id
  }));

  // 5. Status Distribution
  const statusDistRaw = await db.client.lead.groupBy({
    by: ['status'],
    where: { productId: { in: productIds } },
    _count: { id: true }
  });

  const statusDistribution = statusDistRaw.map(item => ({
    label: item.status,
    count: item._count.id
  }));

  // 6. Total Leads & Scrape Cache (Total Context Scanned)
  const totalLeads = await db.client.lead.count({
    where: { productId: { in: productIds } }
  });

  const conversationsScanned = await db.client.scrapeCache.count();

  res.status(200).json({
    success: true,
    data: {
      leadsOverTime,
      intentDistribution,
      platformDistribution,
      statusDistribution,
      totalLeads,
      conversationsScanned
    },
    requestId: req.requestId
  });
  return;
});
