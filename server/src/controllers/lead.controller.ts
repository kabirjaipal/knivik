import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';

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
