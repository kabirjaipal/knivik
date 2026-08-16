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

      // 3. Keep-alive heartbeat ping every 15s to keep proxy connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (_) {
          clearInterval(interval);
        }
      }, 15000);

      const cleanup = () => {
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
