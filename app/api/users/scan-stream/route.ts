import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createScanEventStream } from '@/lib/scan-emitter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const userId = session.user.id;

  const dbUser = await db.client.user.findUnique({
    where: { id: userId },
    select: { isScanning: true, lastScanStatus: true },
  });

  const isCurrentlyScanning = Boolean(dbUser?.isScanning);
  const initialStatus = isCurrentlyScanning
    ? (dbUser?.lastScanStatus || 'INITIALIZING')
    : 'IDLE';

  return createScanEventStream({
    req,
    userId,
    initialIsScanning: isCurrentlyScanning,
    initialStatus,
  });
}
