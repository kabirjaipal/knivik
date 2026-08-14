import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const models = await db.client.llmModel.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ success: true, data: models });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Get Models Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
