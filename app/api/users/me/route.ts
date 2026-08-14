import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-server';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const user = await db.client.user.findUnique({
      where: { id: session.user.id },
      include: {
        referralPartner: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          allowReferrals: !!user.referralPartner,
        },
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get me error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
