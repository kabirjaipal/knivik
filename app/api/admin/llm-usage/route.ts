import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const [logs, totalCount, totals, allModels] = await Promise.all([
      db.client.llmUsageLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          model: true,
          user: {
            select: { username: true, email: true },
          },
          product: {
            select: { name: true },
          },
        },
      }),
      db.client.llmUsageLog.count(),
      db.client.llmUsageLog.aggregate({
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
        },
        _avg: {
          latencyMs: true,
        },
      }),
      db.client.llmModel.findMany(),
    ]);

    // Create pricing map
    const modelPriceMap: Record<string, { inputPrice: number; outputPrice: number }> = {};
    for (const m of allModels) {
      modelPriceMap[m.id] = {
        inputPrice: m.inputPrice,
        outputPrice: m.outputPrice,
      };
    }

    const getCost = (modelId: string, inTokens: number, outTokens: number) => {
      const prices = modelPriceMap[modelId] || {
        inputPrice: modelId.includes('8b') ? 0.05 : 0.59,
        outputPrice: modelId.includes('8b') ? 0.08 : 0.79,
      };
      return ((inTokens * prices.inputPrice) + (outTokens * prices.outputPrice)) / 1_000_000;
    };

    // Calculate model distribution & cost over fetched or aggregated logs
    const modelStatsMap: Record<string, { modelId: string; requestCount: number; tokens: number; cost: number }> = {};
    let totalCost = 0;

    const recentLogs = logs.map((log) => {
      const logCost = getCost(log.modelId, log.inputTokens, log.outputTokens);
      totalCost += logCost;

      if (!modelStatsMap[log.modelId]) {
        modelStatsMap[log.modelId] = {
          modelId: log.modelId,
          requestCount: 0,
          tokens: 0,
          cost: 0,
        };
      }
      modelStatsMap[log.modelId].requestCount += 1;
      modelStatsMap[log.modelId].tokens += log.totalTokens;
      modelStatsMap[log.modelId].cost += logCost;

      return {
        id: log.id,
        action: log.action,
        model: log.modelId,
        tokens: log.totalTokens,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        latencyMs: log.latencyMs || 0,
        cost: logCost,
        status: log.status,
        errorMessage: log.errorMessage,
        user: log.user,
        product: log.product,
        createdAt: log.createdAt.toISOString(),
      };
    });

    const statsByModel = Object.values(modelStatsMap);

    return NextResponse.json({
      success: true,
      data: {
        totalCost,
        statsByModel,
        recentLogs,
        logs: recentLogs,
        totals: {
          totalTokens: totals._sum.totalTokens || 0,
          inputTokens: totals._sum.inputTokens || 0,
          outputTokens: totals._sum.outputTokens || 0,
          avgLatencyMs: Math.round(totals._avg.latencyMs || 0),
        },
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin LLM Usage Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
