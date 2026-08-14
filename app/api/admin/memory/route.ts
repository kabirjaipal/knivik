import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getGlobalIPHealth } from '@/lib/utils/ipProtection';

export async function GET() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const ipHealth = getGlobalIPHealth();

    return NextResponse.json({
      success: true,
      data: {
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
