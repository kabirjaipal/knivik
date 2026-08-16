import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-server';

const blogPostValidationSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(100),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().min(1, 'Cover image is required'),
  readTime: z.string().min(1, 'Read time is required').max(50),
  category: z.string().min(1, 'Category is required').max(100),
  tags: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const published = searchParams.get('published');

    const statusFilter = published === 'true' ? { status: 'PUBLISHED' as const } : undefined;
    const categoryFilter = category ? { category: String(category) } : undefined;

    const posts = await db.client.blogPost.findMany({
      where: {
        ...statusFilter,
        ...categoryFilter,
      },
      orderBy: { date: 'desc' },
      include: {
        createdBy: {
          select: {
            username: true,
            displayUsername: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get all blog posts error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    const body = await req.json();
    const parsed = blogPostValidationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid inputs', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await db.client.blogPost.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A blog post with this slug already exists' },
        { status: 400 }
      );
    }

    const post = await db.client.blogPost.create({
      data: {
        ...parsed.data,
        createdById: userId,
      },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Create blog post error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
