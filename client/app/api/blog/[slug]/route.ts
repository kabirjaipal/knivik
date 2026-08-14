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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await db.client.blogPost.findFirst({
      where: {
        OR: [{ id: slug }, { slug: slug }],
      },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get blog post by slug error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { slug: id } = await params;
    const body = await req.json();
    const parsed = blogPostValidationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid inputs', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existingPost = await db.client.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
    }

    if (parsed.data.slug !== existingPost.slug) {
      const slugConflict = await db.client.blogPost.findUnique({
        where: { slug: parsed.data.slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'A blog post with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const updated = await db.client.blogPost.update({
      where: { id },
      data: {
        ...parsed.data,
      },
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Update blog post error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const { slug: id } = await params;

    const existing = await db.client.blogPost.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
    }

    await db.client.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Delete blog post error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
