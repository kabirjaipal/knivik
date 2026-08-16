import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import { getSession } from '@/lib/auth-server';

const siteFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000, 'Comment is too long (maximum 1000 characters)').optional().or(z.literal('')),
  category: z.enum(['UI/UX', 'Scraping', 'AI Accuracy', 'Pricing', 'Other']).default('Other'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = siteFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { rating, comment, category } = parsed.data;
    const session = await getSession();
    const userId = session?.user?.id || null;

    const feedback = await db.client.siteFeedback.create({
      data: {
        rating,
        comment: comment || null,
        category,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    }, { status: 201 });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Create feedback error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const feedbacks = await db.client.siteFeedback.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            plan: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      feedbacks,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get feedbacks error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
