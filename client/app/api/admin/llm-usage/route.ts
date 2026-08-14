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

    const [logs, totalCount, totals] = await Promise.all([
      db.client.llmUsageLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
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
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
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
