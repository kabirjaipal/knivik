import { Request, Response } from 'express';
import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import { z } from 'zod';

const alertSettingSchema = z.object({
  emailEnabled: z.boolean().default(true),
  slackEnabled: z.boolean().default(false),
  slackWebhook: z.string().url().optional().or(z.literal('')),
  minIntentScore: z.number().min(0).max(100).default(70),
});

export const getAlertSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    let settings = await db.client.alertSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Default create if doesn't exist
      settings = await db.client.alertSetting.create({
        data: { userId },
      });
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    logger.error({ error }, 'Get Alert Settings error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAlertSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const parsed = alertSettingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
      return;
    }

    const data = parsed.data;

    const settings = await db.client.alertSetting.upsert({
      where: { userId },
      update: {
        emailEnabled: data.emailEnabled,
        slackEnabled: data.slackEnabled,
        slackWebhook: data.slackWebhook || null,
        minIntentScore: data.minIntentScore,
      },
      create: {
        userId,
        emailEnabled: data.emailEnabled,
        slackEnabled: data.slackEnabled,
        slackWebhook: data.slackWebhook || null,
        minIntentScore: data.minIntentScore,
      },
    });

    res.status(200).json({ success: true, settings });
  } catch (error) {
    logger.error({ error }, 'Update Alert Settings error');
    res.status(500).json({ error: 'Internal server error' });
  }
};
