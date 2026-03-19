import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { generateReply } from '../services/aiService.js';
import { runRedditScraper } from '../services/redditScraper.js';

export const getLeads = async (req: Request, res: Response) => {
  try {
    // @ts-ignore req.user is populated by jwtAuth middleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Fetch leads for the user's products
    const leads = await db.client.lead.findMany({
      where: {
        product: {
          userId: userId,
        },
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

export const triggerScan = async (req: Request, res: Response): Promise<void> => {
   try {
     // @ts-ignore
     const userId = req.user?.id as string;
     if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
     }
     
     // Run synchronously to ensure frontend knows when it's done pulling new objects
     await runRedditScraper(userId);
     res.status(200).json({ success: true, message: 'Scan complete' });
   } catch (error) {
     logger.error({ error }, 'Failed to trigger scan');
     res.status(500).json({ error: 'Failed to execute radar scan' });
   }
};
