import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import config from '../lib/config.js';
import { renderBaseEmail, sendEmail } from '../lib/mailer.js';
import { AlertChannel } from '@prisma/client';

let intervalId: NodeJS.Timeout | null = null;

export const runDailyDigest = async (): Promise<void> => {
  logger.info('📊 Starting daily leads digest aggregation...');
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch all unsent leads for active products belonging to users with email alerts enabled
    const allLeads = await db.client.lead.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        product: {
          isActive: true,
          user: {
            alertSetting: {
              emailEnabled: true,
            },
          },
        },
        alertLogs: {
          none: {
            channel: AlertChannel.EMAIL,
            status: 'sent',
          },
        },
      },
      include: {
        product: {
          include: {
            user: {
              include: {
                alertSetting: true,
              },
            },
          },
        },
      },
      orderBy: {
        intentScore: 'desc',
      },
    });

    if (allLeads.length === 0) {
      logger.info('📊 No new leads found in the last 24 hours. Skipping daily digest.');
      return;
    }

    // Group leads by User in-memory
    type LeadWithProductAndUser = typeof allLeads[0];
    const leadsByUser = new Map<string, { user: LeadWithProductAndUser['product']['user']; leads: LeadWithProductAndUser[] }>();

    for (const lead of allLeads) {
      const user = lead.product.user;
      if (!user) continue;

      if (!leadsByUser.has(user.id)) {
        leadsByUser.set(user.id, { user, leads: [] });
      }
      leadsByUser.get(user.id)!.leads.push(lead);
    }

    for (const [userId, group] of leadsByUser.entries()) {
      const { user, leads: rawLeads } = group;
      if (!user.alertSetting) continue;

      // Filter leads based on user's specific intent threshold in-memory
      const leads = rawLeads.filter((lead) => lead.intentScore >= user.alertSetting!.minIntentScore);

      if (leads.length === 0) {
        logger.info(`📊 No new qualifying leads for user ${user.email} since yesterday.`);
        continue;
      }

      logger.info(`📊 Sending digest with ${leads.length} leads to ${user.email}...`);

      const rowsHtml = leads
        .map((lead) => {
          const snippet = lead.title || (lead.content && lead.content.length > 70 ? lead.content.substring(0, 70) + '...' : lead.content) || 'Conversation Link';
          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding:12px 10px; color:#0f172a; font-weight:700;">${lead.product.name}</td>
              <td style="padding:12px 10px; color:#475569; text-transform:capitalize; font-weight:500;">${lead.platform}</td>
              <td style="padding:12px 10px; color:#00dfdf; font-weight:700;">${lead.intentScore}% (${lead.intentLevel})</td>
              <td style="padding:12px 10px; color:#475569; font-style:italic; max-width:200px; word-break:break-all;">"${snippet}"</td>
              <td style="padding:12px 10px; text-align:center;">
                <a href="${lead.url}" target="_blank" style="color:#5b3df5; font-weight:700; text-decoration:none; display:inline-block; border: 1px solid #5b3df5; padding: 4px 10px; border-radius: 6px; font-size: 12px; background-color: #faf9ff;">View Post</a>
              </td>
            </tr>
          `;
        })
        .join('');

      const bodyHtml = `
        <p>Here is your daily recap of high-intent leads detected by Knivik in the last 24 hours.</p>
        <table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:14px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color:#f8fafc; text-align:left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:600;">Product</th>
              <th style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:600;">Platform</th>
              <th style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:600;">Intent</th>
              <th style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:600;">Post Content</th>
              <th style="padding:12px 10px; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:600; text-align:center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;

      const htmlTemplate = renderBaseEmail({
        title: `Daily Leads Digest (${leads.length} found)`,
        preheader: `Knivik Digest: ${leads.length} new high-intent leads detected for your products.`,
        bodyHtml,
        ctaText: 'Open Dashboard',
        ctaUrl: `${config.FRONTEND_URL}/dashboard`,
        footerText: `You are receiving this because you enabled Daily Digest email reports for your workspace.`,
      });

      const emailDest = user.alertSetting.emailTarget || user.email;
      await sendEmail(
        emailDest,
        `📊 [${config.PROJECT_NAME}] Daily Leads Digest: ${leads.length} new leads found`,
        htmlTemplate
      );

      // Batch create all alert log records at once (highly optimized)
      try {
        await db.client.alertLog.createMany({
          data: leads.map((lead) => ({
            alertSettingId: user.alertSetting!.id,
            leadId: lead.id,
            channel: AlertChannel.EMAIL,
            status: 'sent',
          })),
          skipDuplicates: true,
        });
      } catch (err) {
        logger.error({ err, userId: user.id }, 'Failed to batch write AlertLog for daily digest leads');
      }
    }
    logger.info('📊 Daily leads digest run completed.');
  } catch (error) {
    logger.error({ error }, 'Failed to run daily digest aggregation');
  }
};

export const start = (): void => {
  if (intervalId) {
    logger.warn('Daily digest scheduler is already running');
    return;
  }

  // Run daily digest aggregation every 24 hours
  const DIGEST_INTERVAL_MS = 24 * 60 * 60 * 1000;
  intervalId = setInterval(runDailyDigest, DIGEST_INTERVAL_MS);
  logger.info('🛰️ Daily digest scheduler registered to run every 24 hours');
};

export const stop = (): void => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('🛰️ Daily digest scheduler stopped');
  }
};
