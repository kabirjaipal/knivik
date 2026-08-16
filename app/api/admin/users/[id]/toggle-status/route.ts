import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const user = await db.client.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const currentMetadata = (user.metadata as any) || {};
    const isSuspended = !currentMetadata.suspended;

    await db.client.user.update({
      where: { id },
      data: {
        metadata: {
          ...currentMetadata,
          suspended: isSuspended,
          suspendedAt: isSuspended ? new Date() : null,
        },
      },
    });

    return NextResponse.json({ success: true, suspended: isSuspended });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Toggle Status Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
