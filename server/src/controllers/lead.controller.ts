import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { generateReply } from '../services/aiService.js';

export const getLeads = async (req: Request, res: Response) => {
  try {
    // @ts-ignore req.user is populated by jwtAuth middleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const productId = req.query['productId'] as string | undefined;

    // Fetch leads for the user's products. If no specific product is requested, limit to last 24 hours.
    const leads = await db.client.lead.findMany({
      relationLoadStrategy: 'join',
      where: {
        product: {
          userId: userId,
          ...(productId && { id: productId }),
        },
        ...(!productId && {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        }),
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Only need the most recent draft
        },
      },
      orderBy: [
        { intentScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100, // Limit to recent 100 leads for dashboard
    });

    res.status(200).json({ success: true, leads });
  } catch (error) {
    logger.error({ error }, 'Failed to get leads');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateLeadReply = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    const leadId = req.params['id'] as string;

    if (!userId || !leadId) {
      res.status(401).json({ error: 'Unauthorized or missing ID' });
      return;
    }

    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
      include: {
         product: true
      }
    });

    if (!lead || lead.product.userId !== userId) {
      res.status(404).json({ error: 'Lead not found or unauthorized' });
      return;
    }

    // Plan check for AI Replies
    const user = await db.client.user.findUnique({ where: { id: userId } });
    const { hasCapability } = await import('../lib/plans.js');
    if (!user || !hasCapability(user.plan as any, 'canAccessAdvancedAI')) {
      res.status(403).json({ error: 'AI-generated replies are only available on Pro plans.' });
      return;
    }

    // Call OpenAI LLM Generator
    const replyText = await generateReply(lead.content, {
       name: lead.product.name,
       ...(lead.product.description && { description: lead.product.description }),
       ...(lead.product.aiConfig && { aiConfig: lead.product.aiConfig })
    });

    // Optionally save it as a drafting history
    const replyRecord = await db.client.reply.create({
      data: {
        leadId: lead.id,
        userId: userId,
        generatedText: replyText,
      }
    });

    res.status(200).json({ success: true, generatedText: replyText, replyId: replyRecord.id });
  } catch (error) {
    logger.error({ error }, 'Failed to generate AI reply');
    res.status(500).json({ error: 'Failed to communicate with AI Engine' });
  }
};

const VALID_STATUSES = ['NEW', 'QUALIFIED', 'SAVED', 'CONTACTED', 'CONVERTED', 'DISMISSED'];

export const updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    const leadId = req.params['id'] as string;
    const { status } = req.body;

    if (!userId || !leadId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    // Ownership check
    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
      include: { product: { select: { userId: true } } },
    });
    if (!lead || lead.product.userId !== userId) {
      res.status(404).json({ error: 'Lead not found or unauthorized' });
      return;
    }

    const updated = await db.client.lead.update({
      where: { id: leadId },
      data: { status },
    });
    res.status(200).json({ success: true, lead: updated });
  } catch (error) {
    logger.error({ error }, 'Failed to update lead status');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLeadNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    const leadId = req.params['id'] as string;
    const { notes } = req.body;

    if (!userId || !leadId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (typeof notes !== 'string') { res.status(400).json({ error: 'notes must be a string' }); return; }
    if (notes.length > 5000) { res.status(400).json({ error: 'notes must be 5000 characters or fewer' }); return; }

    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
      include: { product: { select: { userId: true } } },
    });
    if (!lead || lead.product.userId !== userId) {
      res.status(404).json({ error: 'Lead not found or unauthorized' });
      return;
    }

    const updated = await db.client.lead.update({
      where: { id: leadId },
      data: { notes },
    });
    res.status(200).json({ success: true, lead: updated });
  } catch (error) {
    logger.error({ error }, 'Failed to update lead notes');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLeadFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    const leadId = req.params['id'] as string;
    const { feedback } = req.body; // 1 (Good), -1 (Bad), 0 (Reset)

    if (!userId || !leadId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (![1, -1, 0].includes(feedback)) {
      res.status(400).json({ error: 'Invalid feedback value. Must be 1, -1, or 0.' });
      return;
    }

    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
      include: { product: { select: { userId: true } } },
    });

    if (!lead || lead.product.userId !== userId) {
      res.status(404).json({ error: 'Lead not found or unauthorized' });
      return;
    }

    const updated = await db.client.lead.update({
      where: { id: leadId },
      data: { feedback: feedback === 0 ? null : feedback },
    });

    res.status(200).json({ success: true, lead: updated });
  } catch (error) {
    logger.error({ error }, 'Failed to update lead feedback');
    res.status(500).json({ error: 'Internal server error' });
  }
};
