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
    const statusGroup = searchParams.get('statusGroup'); // '2xx', '3xx', '4xx', '5xx', 'errors', 'all'
    const statusCodeParam = searchParams.get('status') || searchParams.get('statusCode');
    const statusCode = statusCodeParam ? parseInt(statusCodeParam, 10) : undefined;
    const hasError = searchParams.get('hasError');
    const timeRange = searchParams.get('timeRange'); // '15m', '1h', '24h', '7d', '30d', 'all'
    const query = searchParams.get('q');
    const userId = searchParams.get('userId');
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    // Method filter
    if (method && method !== 'ALL') {
      where.method = method.toUpperCase();
    }

    // Status code and status group filters
    if (statusCode && !isNaN(statusCode)) {
      where.statusCode = statusCode;
    } else if (statusGroup && statusGroup !== 'ALL') {
      if (statusGroup === '2xx') {
        where.statusCode = { gte: 200, lte: 299 };
      } else if (statusGroup === '3xx') {
        where.statusCode = { gte: 300, lte: 399 };
      } else if (statusGroup === '4xx') {
        where.statusCode = { gte: 400, lte: 499 };
      } else if (statusGroup === '5xx') {
        where.statusCode = { gte: 500, lte: 599 };
      } else if (statusGroup === 'errors') {
        where.OR = [
          { statusCode: { gte: 400 } },
          { error: { not: null } },
        ];
      }
    }

    // Has error filter
    if (hasError === 'true') {
      if (!where.OR) {
        where.OR = [
          { statusCode: { gte: 400 } },
          { error: { not: null } },
        ];
      }
    }

    // Time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let since: Date | undefined;
      if (timeRange === '15m') {
        since = new Date(now.getTime() - 15 * 60 * 1000);
      } else if (timeRange === '1h') {
        since = new Date(now.getTime() - 60 * 60 * 1000);
      } else if (timeRange === '24h') {
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (timeRange === '7d') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30d') {
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (since) {
        where.createdAt = { gte: since };
      }
    }

    // Specific User ID
    if (userId) {
      where.userId = userId;
    }

    // Text search
    if (query && query.trim()) {
      const q = query.trim();
      const searchConditions = [
        { url: { contains: q, mode: 'insensitive' } },
        { requestId: { contains: q, mode: 'insensitive' } },
        { ip: { contains: q, mode: 'insensitive' } },
        { error: { contains: q, mode: 'insensitive' } },
        { userId: { contains: q, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const IMPORTANT_HEADER_KEYS = new Set([
      'content-type',
      'authorization',
      'user-agent',
      'origin',
      'referer',
      'x-forwarded-for',
      'x-real-ip',
      'x-request-id',
      'accept',
    ]);

    // Query logs, total count, and summary counts concurrently
    const [logs, totalCount, successCount, clientErrorCount, serverErrorCount] = await Promise.all([
      db.client.requestLog.findMany({
        where,
        select: {
          id: true,
          requestId: true,
          method: true,
          url: true,
          ip: true,
          userId: true,
          statusCode: true,
          requestBody: true,
          responseBody: true,
          headers: true,
          query: true,
          error: true,
          createdAt: true,
        },
        take: limit,
        skip,
        orderBy: { createdAt: sortOrder },
      }),
      db.client.requestLog.count({ where }),
      db.client.requestLog.count({
        where: { ...where, statusCode: { gte: 200, lte: 299 } },
      }).catch(() => 0),
      db.client.requestLog.count({
        where: { ...where, statusCode: { gte: 400, lte: 499 } },
      }).catch(() => 0),
      db.client.requestLog.count({
        where: { ...where, statusCode: { gte: 500, lte: 599 } },
      }).catch(() => 0),
    ]);

    // Enrich with user info (email & username) for logs that have userId
    const uniqueUserIds = Array.from(
      new Set(logs.map((l: { userId: string | null }) => l.userId).filter(Boolean))
    ) as string[];

    let userMap: Record<string, { email: string; username: string }> = {};
    if (uniqueUserIds.length > 0) {
      try {
        const users = await db.client.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: { id: true, email: true, username: true },
        });
        userMap = users.reduce((acc: Record<string, { email: string; username: string }>, u: { id: string; email: string; username: string }) => {
          acc[u.id] = { email: u.email, username: u.username };
          return acc;
        }, {});
      } catch {
        // Fallback gracefully if user lookup fails
      }
    }

    const enrichedLogs = logs.map((log: { userId: string | null; headers: any; [key: string]: any }) => {
      let prunedHeaders = null;
      if (log.headers && typeof log.headers === 'object') {
        const pruned: Record<string, any> = {};
        for (const [k, v] of Object.entries(log.headers)) {
          const keyLower = k.toLowerCase();
          if (
            IMPORTANT_HEADER_KEYS.has(keyLower) ||
            keyLower.startsWith('x-') ||
            keyLower.startsWith('auth') ||
            keyLower.includes('token') ||
            keyLower.includes('api')
          ) {
            pruned[k] = v;
          }
        }
        if (Object.keys(pruned).length > 0) {
          prunedHeaders = pruned;
        }
      }

      return {
        id: log.id,
        requestId: log.requestId,
        method: log.method,
        url: log.url,
        ip: log.ip,
        userId: log.userId,
        user: log.userId && userMap[log.userId] ? userMap[log.userId] : null,
        statusCode: log.statusCode,
        requestBody: log.requestBody,
        responseBody: log.responseBody,
        headers: prunedHeaders,
        query: log.query,
        error: log.error,
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedLogs,
      stats: {
        total: totalCount,
        successCount,
        clientErrorCount,
        serverErrorCount,
        errorCount: clientErrorCount + serverErrorCount,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Request Logs Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

