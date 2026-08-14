import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id: userId } = await params;
    const body = await req.json();
    const { plan, role, allowReferrals } = body;

    const updateData: Record<string, any> = {};
    if (plan) updateData['plan'] = plan;
    if (role) updateData['role'] = role;

    const updatedUser = await db.client.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (allowReferrals !== undefined) {
      if (allowReferrals) {
        await db.client.referralPartner.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });
      } else {
        await db.client.referralPartner.deleteMany({
          where: { userId },
        });
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Update User Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { id: userId } = await params;

    if (userId === session.user.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    await db.client.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Delete User Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
