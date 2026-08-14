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
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const search = searchParams.get('search');
    const method = searchParams.get('method');
    const statusCode = searchParams.get('statusCode');
    const onlyErrors = searchParams.get('onlyErrors');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (userId) where.userId = userId;
    if (method) where.method = { equals: method, mode: 'insensitive' };

    if (statusCode) {
      if (statusCode === '4xx') {
        where.statusCode = { gte: 400, lte: 499 };
      } else if (statusCode === '5xx') {
        where.statusCode = { gte: 500, lte: 599 };
      } else {
        const codeNum = parseInt(statusCode);
        if (!isNaN(codeNum)) {
          where.statusCode = codeNum;
        }
      }
    }

    if (onlyErrors === 'true') {
      where.OR = [{ statusCode: { gte: 400 } }, { error: { not: null } }];
    }

    if (search) {
      const searchFilter = { contains: search, mode: 'insensitive' as const };
      const matchingUsers = await db.client.user.findMany({
        where: {
          OR: [{ username: searchFilter }, { email: searchFilter }],
        },
        select: { id: true },
      });
      const matchingUserIds = matchingUsers.map((u) => u.id);

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { url: searchFilter },
            { ip: searchFilter },
            { error: searchFilter },
            { userId: searchFilter },
            ...(matchingUserIds.length > 0 ? [{ userId: { in: matchingUserIds } }] : []),
          ],
        },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      db.client.requestLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
    logger.error({ error: error.message }, 'Admin Logs Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
