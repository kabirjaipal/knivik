import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-server';
import { hasCapability } from '@/lib/plans';

const alertSettingSchema = z.object({
  emailEnabled: z.boolean().default(false),
  emailTarget: z.string().optional().or(z.literal('')),
  slackEnabled: z.boolean().default(false),
  slackWebhook: z.string().url().optional().or(z.literal('')),
  webhookType: z.string().default('SLACK'),
  minIntentScore: z.number().min(0).max(100).default(85),
});

export async function GET() {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;

    let settings = await db.client.alertSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await db.client.alertSetting.create({
        data: { userId, minIntentScore: 85 },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get Alert Settings error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const userId = session.user.id;
    const body = await req.json();
    const parsed = alertSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const user = await db.client.user.findUnique({ where: { id: userId } });

    if (data.emailEnabled || data.slackEnabled || data.slackWebhook) {
      if (!user || !hasCapability(user.plan, 'canAccessAlerts')) {
        return NextResponse.json(
          { success: false, error: 'Automated alerts (Email/Slack/Discord) are only available on premium plans.' },
          { status: 403 }
        );
      }
    }

    const settings = await db.client.alertSetting.upsert({
      where: { userId },
      update: {
        emailEnabled: data.emailEnabled,
        emailTarget: data.emailTarget || null,
        slackEnabled: data.slackEnabled,
        slackWebhook: data.slackWebhook || null,
        webhookType: data.webhookType,
        minIntentScore: data.minIntentScore,
      },
      create: {
        userId,
        emailEnabled: data.emailEnabled,
        emailTarget: data.emailTarget || null,
        slackEnabled: data.slackEnabled,
        slackWebhook: data.slackWebhook || null,
        webhookType: data.webhookType,
        minIntentScore: data.minIntentScore,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Update Alert Settings error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
