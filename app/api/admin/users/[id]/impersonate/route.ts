import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id: targetId } = await params;

    if (targetId === session.user.id) {
      return NextResponse.json({ success: false, error: 'You cannot impersonate yourself' }, { status: 400 });
    }

    const targetUser = await db.client.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'admin') {
      return NextResponse.json({ success: false, error: 'Cannot impersonate another administrator' }, { status: 403 });
    }

    const headersList = await headers();
    const result = await auth.api.impersonateUser({
      body: { userId: targetId },
      headers: headersList,
      asResponse: true,
    });

    return result;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Impersonation Error');
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
