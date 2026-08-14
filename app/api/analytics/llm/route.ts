import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';

export async function GET() {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;

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

    const data = usageStats.map((stat) => ({
      modelId: stat.modelId,
      action: stat.action,
      inputTokens: stat._sum.inputTokens || 0,
      outputTokens: stat._sum.outputTokens || 0,
      totalTokens: stat._sum.totalTokens || 0,
      requestCount: stat._count.id,
    }));

    const totals = data.reduce(
      (acc, curr) => ({
        inputTokens: acc.inputTokens + curr.inputTokens,
        outputTokens: acc.outputTokens + curr.outputTokens,
        totalTokens: acc.totalTokens + curr.totalTokens,
        requestCount: acc.requestCount + curr.requestCount,
      }),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        breakdown: data.map(({ inputTokens, outputTokens, totalTokens, ...rest }) => rest),
        totals: { requestCount: totals.requestCount },
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get LLM Usage Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
