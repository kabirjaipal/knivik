import { Response } from 'express';
import { db } from '../lib/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { PLANS, PlanKey } from '../lib/plans.js';

export const getDashboardAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { status: 401, code: 'UNAUTHORIZED', message: 'User not authenticated', requestId: req.requestId }
    });
    return;
  }

  const userId = req.user.id;
  const range = 30;

  // 1. Get all products for this user
  const products = await db.client.product.findMany({
    where: { userId },
    select: { id: true, name: true }
  });

  const productIds = products.map(p => p.id);

  // 7. Advanced ROI Analytics (Pro feature flag) - check this early
  const user = await db.client.user.findUnique({ where: { id: userId } });
  const isAdvancedAnalyticsEnabled = user?.plan !== 'FREE';
  const plan = (user?.plan || 'FREE') as PlanKey;
  const planLimits = PLANS[plan].limits;

  // 2. Fetch Usage Stats Monthly Leads
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
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

  // 3. LLM Usage Log aggregation
  const llmUsageLogs = await db.client.llmUsageLog.groupBy({
    by: ['modelId', 'action'],
    where: { userId },
    _count: { id: true },
  });
  const llmBreakdown = llmUsageLogs.map(stat => ({
    modelId: stat.modelId,
    action: stat.action,
    requestCount: stat._count.id,
  }));
  const totalRequestCount = llmBreakdown.reduce((sum, curr) => sum + curr.requestCount, 0);
  const llmUsage = {
    breakdown: llmBreakdown,
    totals: { requestCount: totalRequestCount }
  };

  // 4. Source Distribution (Reddit, Twitter, HN, GitHub, Bluesky leads from the current month)
  const startOfMonth = new Date(year, month - 1, 1);
  const sourceDistribution: Record<string, number> = {
    'REDDIT': 0,
    'TWITTER': 0,
    'HACKERNEWS': 0,
    'GITHUB': 0,
    'BLUESKY': 0,
  };

  if (productIds.length > 0) {
    const leadsCurrentMonth = await db.client.lead.findMany({
      where: {
        productId: { in: productIds },
        createdAt: { gte: startOfMonth }
      },
      select: { platform: true }
    });

    leadsCurrentMonth.forEach(l => {
      if (sourceDistribution[l.platform] !== undefined) {
        sourceDistribution[l.platform]++;
      }
    });
  }

  const leadsCurrentMonthCount = Object.values(sourceDistribution).reduce((sum, count) => sum + count, 0);

  const usageStats = {
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
        percentage: leadsCurrentMonthCount > 0 ? Math.round((count / leadsCurrentMonthCount) * 100) : 0
      }))
    }
  };

  if (productIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        leadsOverTime: [],
        intentDistribution: [],
        platformDistribution: [],
        statusDistribution: [],
        sentimentDistribution: [],
        peakActivityHours: [],
        topKeywords: [],
        leadVelocity: 0,
        totalLeads: 0,
        conversationsScanned: 0,
        averageIntentScore: 0,
        topProduct: null,
        activeProductsCount: 0,
        isAdvancedAnalyticsEnabled,
        leadConversionRate: 0,
        llmUsage,
        usageStats
      }
    });
  }

  // 2. Leads over the requested range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - range);

  const leadsOverTimeRaw = await db.client.lead.findMany({
    where: {
      productId: { in: productIds },
      createdAt: { gte: startDate }
    },
    select: { createdAt: true }
  });

  // Group by day manually
  const dailyCounts: Record<string, number> = {};
  for (let i = 0; i < range; i++) {
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

  // 6. Conversations scanned (total)
  const conversationsScanned = await db.client.scrapeCache.count();

  // 7. Average Intent Score
  const avgIntentRaw = await db.client.lead.aggregate({
    where: { productId: { in: productIds } },
    _avg: { intentScore: true }
  });
  const averageIntentScore = Math.round(avgIntentRaw._avg.intentScore || 0);

  // 8. Top Performing Product
  const topProductRaw = await db.client.lead.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1
  });

  let topProduct = null;
  if (topProductRaw.length > 0) {
    const p = products.find(prod => prod.id === topProductRaw[0].productId);
    topProduct = {
      name: p?.name || 'Unknown',
      count: topProductRaw[0]._count.id
    };
  }

  // 9. Peak Activity & Intent Tone (Consolidated Query to fix Prisma groupBy TS bug)
  const allLeads = await db.client.lead.findMany({
    where: { productId: { in: productIds } },
    select: { createdAt: true, intentLevel: true }
  });
  
  // Calculate Peak Activity Hours
  const hourCounts = new Array(24).fill(0);
  // Calculate Intent Level Distribution (Buyer Tone)
  const intentLevelCounts: Record<string, number> = {};

  allLeads.forEach(lead => {
    // Hour calc
    const hour = new Date(lead.createdAt).getHours();
    hourCounts[hour]++;

    // Intent calc
    const level = lead.intentLevel || 'NEUTRAL';
    intentLevelCounts[level] = (intentLevelCounts[level] || 0) + 1;
  });

  const peakActivityHours = hourCounts.map((count, hour) => ({ hour, count }));
  const sentimentDistribution = Object.entries(intentLevelCounts).map(([label, count]) => ({
    label: label.replace('_', ' '), // e.g. BUY_NOW -> BUY NOW
    count
  }));

  // 11. Top Keywords (simple word frequency)
  const recentLeads = await db.client.lead.findMany({
    where: { productId: { in: productIds } },
    select: { content: true },
    take: 100,
    orderBy: { createdAt: 'desc' }
  });
  
  const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'your', 'from', 'have', 'what', 'some', 'they']);
  const wordFreq: Record<string, number> = {};
  recentLeads.forEach(l => {
    const words = l.content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    words.forEach(w => {
      if (w.length > 3 && !stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
  });
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ label: word, count }));

  // 12. Lead Velocity (Growth Rate - always based on 7-day windows)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const leadsLast7 = await db.client.lead.count({
    where: { productId: { in: productIds }, createdAt: { gte: sevenDaysAgo } }
  });
  const leadsPrev7 = await db.client.lead.count({
    where: { productId: { in: productIds }, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
  });
  
  let leadVelocity = 0;
  if (leadsPrev7 > 0) {
    leadVelocity = Math.round(((leadsLast7 - leadsPrev7) / leadsPrev7) * 100);
  } else if (leadsLast7 > 0) {
    leadVelocity = 100; // First week growth
  }

  const totalConverted = statusDistRaw.find(s => s.status === 'CONVERTED')?._count.id || 0;
  const leadConversionRate = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      leadsOverTime,
      intentDistribution,
      platformDistribution,
      statusDistribution,
      sentimentDistribution,
      peakActivityHours,
      topKeywords,
      leadVelocity,
      totalLeads,
      conversationsScanned,
      averageIntentScore,
      topProduct,
      activeProductsCount: products.length,
      isAdvancedAnalyticsEnabled,
      leadConversionRate,
      llmUsage,
      usageStats
    },
    requestId: req.requestId
  });
  return;
});

export const getLlmUsage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const userId = req.user.id;

  // Aggregate usage stats
  const usageStats = await db.client.llmUsageLog.groupBy({
    by: ['modelId', 'action'],
    where: { userId },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
    },
    _count: { id: true },
  });

  const data = usageStats.map(stat => {
    return {
      modelId: stat.modelId,
      action: stat.action,
      inputTokens: stat._sum.inputTokens || 0,
      outputTokens: stat._sum.outputTokens || 0,
      totalTokens: stat._sum.totalTokens || 0,
      requestCount: stat._count.id,
    };
  });

  const totals = data.reduce((acc, curr) => ({
    inputTokens: acc.inputTokens + curr.inputTokens,
    outputTokens: acc.outputTokens + curr.outputTokens,
    totalTokens: acc.totalTokens + curr.totalTokens,
    requestCount: acc.requestCount + curr.requestCount,
  }), { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 });

  res.status(200).json({
    success: true,
    data: {
      breakdown: data.map(({ inputTokens, outputTokens, totalTokens, ...rest }) => rest),
      totals: { requestCount: totals.requestCount }
    }
  });
});
