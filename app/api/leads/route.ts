import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const leads = await db.client.lead.findMany({
      where: {
        product: {
          userId,
          ...(productId && { id: productId }),
        },
        ...(!productId && {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        }),
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: [
        { intentScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to get leads');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
