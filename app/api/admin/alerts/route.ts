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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      db.client.alertLog.findMany({
        take: limit,
        skip,
        orderBy: { sentAt: 'desc' },
        include: {
          lead: {
            select: { title: true, intentScore: true },
          },
          alertSetting: {
            include: {
              user: {
                select: { username: true, email: true },
              },
            },
          },
        },
      }),
      db.client.alertLog.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Alert Logs Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
