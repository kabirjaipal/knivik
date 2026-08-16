import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const where: any = {
      NOT: { id: currentUserId },
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { username: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, totalCount] = await Promise.all([
      db.client.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          plan: true,
          createdAt: true,
          isScanning: true,
          metadata: true,
          referralPartner: {
            select: { id: true },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.client.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);
    const productsWithLeadCounts = await db.client.product.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        _count: {
          select: { leads: true },
        },
      },
    });

    const userLeadCountsMap = new Map<string, number>();
    for (const item of productsWithLeadCounts) {
      const current = userLeadCountsMap.get(item.userId) || 0;
      userLeadCountsMap.set(item.userId, current + (item._count?.leads || 0));
    }

    const mappedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      plan: u.plan,
      createdAt: u.createdAt,
      isScanning: u.isScanning,
      metadata: u.metadata,
      allowReferrals: !!u.referralPartner,
      _count: {
        products: u._count?.products || 0,
        leads: userLeadCountsMap.get(u.id) || 0,
      },
    }));

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Users Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
