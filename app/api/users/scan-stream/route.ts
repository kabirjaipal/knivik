import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { scanEmitter } from '@/lib/scan-emitter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const userId = session.user.id;

  const dbUser = await db.client.user.findUnique({
    where: { id: userId },
    select: { isScanning: true },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Tell browser EventSource to auto-reconnect after 3 seconds if disconnected
      controller.enqueue(encoder.encode('retry: 3000\n\n'));

      const isCurrentlyScanning = dbUser?.isScanning ?? false;
      
      // 2. Initial state
      const initialPayload = `data: ${JSON.stringify({
        userId,
        isScanning: isCurrentlyScanning,
        status: isCurrentlyScanning ? 'INITIALIZING' : 'IDLE',
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      const listener = (data: { productId: string; userId: string; isScanning: boolean; status: string }) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (_) {}
      };

      scanEmitter.on(`user:${userId}`, listener);

      // 3. Heartbeat + Database Sync Polling (for multi-container serverless support)
      let isClosed = false;
      let wasScanningState = isCurrentlyScanning;

      const interval = setInterval(async () => {
        if (isClosed) return;
        try {
          // Check DB state across separate serverless lambda containers
          const userState = await db.client.user.findUnique({
            where: { id: userId },
            select: { isScanning: true, lastScanStatus: true },
          });

          if (userState?.isScanning) {
            wasScanningState = true;
          } else if (wasScanningState && userState && !userState.isScanning) {
            // Only emit completion if a scan was actively running during this session
            wasScanningState = false;
            const finalPayload = `data: ${JSON.stringify({
              userId,
              isScanning: false,
              status: userState.lastScanStatus || 'SUCCESS',
            })}\n\n`;
            controller.enqueue(encoder.encode(finalPayload));
          }

          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (_) {
          // Keep stream alive
        }
      }, 5000);

      const cleanup = () => {
        isClosed = true;
        clearInterval(interval);
        scanEmitter.off(`user:${userId}`, listener);
      };

      req.signal.addEventListener('abort', cleanup);
    },
    cancel() {
      // Stream cancelled by client
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  });
}
