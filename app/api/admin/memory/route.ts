import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getGlobalIPHealth, resetAllIPProtection } from '@/lib/services/rate-limiter';

export async function GET() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const ipHealth = getGlobalIPHealth();
    const mem = process.memoryUsage();

    return NextResponse.json({
      success: true,
      data: {
        systemMemory: {
          rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
          heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
          heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
          externalMb: Math.round((mem.external / 1024 / 1024) * 10) / 10,
          heapUsagePercent: mem.heapTotal > 0 ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0,
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
        },
        queue: {
          length: 0,
          activeCount: 0,
          isProcessing: false,
          jobs: [],
        },
        sockets: {
          activeConnections: 0,
          clients: [],
        },
        ipProtection: ipHealth,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    resetAllIPProtection();

    return NextResponse.json({
      success: true,
      message: 'All IP protection counters successfully reset.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
