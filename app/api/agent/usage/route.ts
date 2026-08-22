import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { PLANS } from '@/lib/plans';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await db.client.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const userPlan = (user?.plan || 'FREE') as keyof typeof PLANS;
    const planConfig = PLANS[userPlan] || PLANS.FREE;
    const dailyLimit = planConfig.limits.agentQueriesPerDay;
    const isPro = userPlan === 'PRO';

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyUsage = await db.client.llmUsageLog.count({
      where: {
        userId,
        action: 'agent_chat_stream',
        createdAt: { gte: startOfDay },
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      plan: userPlan,
      isPro,
      dailyUsage,
      dailyLimit,
      remaining: Math.max(0, dailyLimit - dailyUsage),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, '[API] /api/agent/usage failed');
    return NextResponse.json({ success: false, error: 'Failed to fetch usage' }, { status: 500 });
  }
}
