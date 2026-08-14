import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';
import { dodo } from '@/lib/dodo';
import config from '@/lib/config';

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    let portalUrl = '';

    const user = await db.client.user.findUnique({
      where: { id: userId },
      select: { dodoCustomerId: true },
    });

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (user?.dodoCustomerId) {
      try {
        const dodoSession = await dodo.customers.customerPortal.create(user.dodoCustomerId, {
          return_url: `${origin}/dashboard/billing`,
        });
        portalUrl = dodoSession.link;
      } catch (err: any) {
        logger.error({ err: err.message, userId }, 'Failed to generate Dodo portal session');
      }
    }

    if (!portalUrl) {
      portalUrl =
        config.NODE_ENV === 'production'
          ? 'https://customer.dodopayments.com'
          : 'https://test.customer.dodopayments.com';
    }

    return NextResponse.json({
      success: true,
      data: { url: portalUrl },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get portal error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
