import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { z } from 'zod';

const siteFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000, 'Comment is too long (maximum 1000 characters)').optional().or(z.literal('')),
  category: z.enum(['UI/UX', 'Scraping', 'AI Accuracy', 'Pricing', 'Other']).default('Other'),
});

/**
 * Submit feedback about the application
 * POST /api/feedback
 */
export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = siteFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid input data', 
        details: parsed.error.issues 
      });
      return;
    }

    const { rating, comment, category } = parsed.data;
    // req.user is attached by auth middleware if user is authenticated
    // @ts-ignore
    const userId = req.user?.id as string | undefined;

    const feedback = await db.client.siteFeedback.create({
      data: {
        rating,
        comment: comment || null,
        category,
        userId: userId || null,
      },
    });

    logger.info({ feedbackId: feedback.id, userId }, 'User feedback submitted successfully');

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    logger.error({ error }, 'Create feedback controller error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Retrieve all user feedbacks (Admin only)
 * GET /api/feedback
 */
export const getFeedbacks = async (_req: Request, res: Response): Promise<void> => {
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

    res.status(200).json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    logger.error({ error }, 'Get feedbacks controller error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
