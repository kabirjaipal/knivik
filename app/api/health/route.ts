import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const start = Date.now();
    await db.client.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`,
      },
      uptime: process.uptime(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: {
          status: 'error',
          error: error.message,
        },
      },
      { status: 503 }
    );
  }
}
