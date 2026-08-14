import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const [userCount, productCount, leadCount, activeScans] = await Promise.all([
      db.client.user.count(),
      db.client.product.count(),
      db.client.lead.count(),
      db.client.user.count({ where: { isScanning: true } }),
    ]);

    const leadsToday = await db.client.lead.count({
      where: {
        createdAt: {
          gt: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userCount,
        productCount,
        leadCount,
        leadsToday,
        activeScans,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Stats Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
