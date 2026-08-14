import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const [revenueAggregate, activeSubscriptions, recentPayments, totals, models] = await Promise.all([
      db.client.payment.aggregate({
        where: { status: { in: ['paid', 'succeeded', 'success'] } },
        _sum: { amount: true },
      }),
      db.client.subscription.findMany({ where: { status: 'active' } }),
      db.client.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true, email: true } } },
      }),
      db.client.llmUsageLog.groupBy({
        by: ['modelId'],
        _sum: { inputTokens: true, outputTokens: true },
      }),
      db.client.llmModel.findMany(),
    ]);

    const totalRevenueCents = revenueAggregate._sum.amount ?? 0;
    const totalRevenue = totalRevenueCents / 100;

    const modelMap = new Map(models.map((m) => [m.id, m]));
    let totalLlmCost = 0;
    for (const t of totals) {
      const model = modelMap.get(t.modelId);
      const inputPrice = model?.inputPrice || 0;
      const outputPrice = model?.outputPrice || 0;
      totalLlmCost +=
        ((t._sum.inputTokens || 0) / 1_000_000) * inputPrice +
        ((t._sum.outputTokens || 0) / 1_000_000) * outputPrice;
    }

    const netProfit = totalRevenue - totalLlmCost;

    const mrrCents = activeSubscriptions.reduce((sum, s) => {
      const monthlyAmount = s.billingCycle === 'yearly' || s.billingCycle === 'year' ? 49000 / 12 : 4900;
      return sum + monthlyAmount;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCost: Number(totalLlmCost.toFixed(4)),
        netProfit: Number(netProfit.toFixed(2)),
        mrr: Number((mrrCents / 100).toFixed(2)),
        activeSubscribers: activeSubscriptions.length,
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt,
          user: p.user,
        })),
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Revenue Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
