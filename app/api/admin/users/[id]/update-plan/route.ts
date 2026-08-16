import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { plan } = body;

    if (!['FREE', 'PRO'].includes(plan)) {
      return NextResponse.json({ success: false, error: 'Invalid plan tier' }, { status: 400 });
    }

    await db.client.user.update({
      where: { id },
      data: { plan },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Update Plan Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
