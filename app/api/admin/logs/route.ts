import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const skip = (page - 1) * limit;
    const method = searchParams.get('method');
    const statusCode = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;
    const query = searchParams.get('q');

    const where: any = {};
    if (method) where.method = method.toUpperCase();
    if (statusCode) where.statusCode = statusCode;
    if (query) {
      where.OR = [
        { url: { contains: query, mode: 'insensitive' } },
        { requestId: { contains: query, mode: 'insensitive' } },
        { ip: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      db.client.requestLog.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      db.client.requestLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Request Logs Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
