import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required to delete account' }, { status: 400 });
    }

    try {
      await auth.api.signInEmail({
        body: {
          email: session.user.email,
          password,
        },
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    }

    await db.client.user.delete({
      where: { id: session.user.id },
    });

    logger.info({ userId: session.user.id }, 'User deleted own account');
    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Delete account error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
