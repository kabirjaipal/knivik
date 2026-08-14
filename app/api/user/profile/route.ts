import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';

export async function PUT(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    const body = await req.json();
    const { username, metadata } = body;

    const updateData: Record<string, any> = {};
    if (username) updateData['username'] = username;
    if (metadata !== undefined) updateData['metadata'] = metadata;

    const updatedUser = await db.client.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Update profile error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
