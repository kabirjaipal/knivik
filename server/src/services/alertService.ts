import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import config from '../lib/config.js';
import { AlertChannel } from '@prisma/client';
import { hasCapability } from '../lib/plans.js';
import { renderBaseEmail, sendEmail } from '../lib/mailer.js';

export const sendLeadAlert = async (leadId: string) => {
  try {
    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
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
    });

    if (!lead || !lead.product.user.alertSetting) {
      return;
    }

    const { alertSetting } = lead.product.user;

    // 0. Plan Capability Check
    if (!hasCapability(lead.product.user.plan as any, 'canAccessAlerts')) {
      return;
    }

    // 1. Check intent score threshold
    if (lead.intentScore < alertSetting.minIntentScore) {
      return;
    }

    // 2. Webhook (Slack/Discord/Custom)
    if (alertSetting.slackEnabled && alertSetting.slackWebhook) {
      await sendWebhookAlert(alertSetting, lead);
    }

    // 3. Email Alerts (Disabled in favor of Daily Digest)
    // Real-time email alerts are disabled to reduce outbound email costs.
    // Daily digests are aggregated and sent via schedulers/dailyDigest.ts.

  } catch (error) {
    logger.error({ error, leadId }, 'Failed to process lead alert');
  }
};

async function sendWebhookAlert(alertSetting: any, lead: any) {
  const url = alertSetting.slackWebhook;
  const webhookType = alertSetting.webhookType || 'SLACK';

  // SSRF protection: block private/loopback/link-local addresses
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    // Block loopback, private ranges, link-local, and metadata endpoints
    const blockedPatterns = [
      /^localhost$/,
      /^127\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./, /^169\.254\./, /^::1$/, /^\[::1\]$/,
      /^0\.0\.0\.0$/,
      /metadata\.google\.internal/,
    ];
    if (blockedPatterns.some(p => p.test(hostname))) {
      logger.error({ url, leadId: lead.id }, 'SSRF: Blocked webhook URL targeting private/internal address');
      return;
    }
    // Only allow https in production
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      logger.error({ url }, 'Invalid webhook URL protocol');
      return;
    }
  } catch {
    logger.error({ url }, 'Invalid webhook URL');
    return;
  }
  try {
    let payload: any = {};
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const metadata = (lead.metadata as any) || {};
    const qualificationReasoning = metadata.qualificationReasoning || '';

    switch (webhookType) {
      case 'SLACK': {
        const truncatedContent = lead.content && lead.content.length > 500
          ? `${lead.content.slice(0, 500)}...`
          : lead.content;

        let slackText = `🚀 *New High-Intent Lead Detected!*\n`;
        slackText += `*Product:* ${lead.product.name}\n`;
        slackText += `*Platform:* ${lead.platform}\n`;
        slackText += `*Intent Score:* ${lead.intentScore}% (${lead.intentLevel})\n`;
        if (lead.authorUsername) {
          slackText += `*Author:* u/${lead.authorUsername}\n`;
        }
        if (lead.title) {
          slackText += `*Title:* *${lead.title}*\n`;
        }
        slackText += `\n*Content:*\n>>>${truncatedContent}\n\n`;
        if (qualificationReasoning) {
          slackText += `💡 *AI Reasoning:* _${qualificationReasoning}_\n\n`;
        }
        slackText += `<${lead.url}|View Post> | <${config.FRONTEND_URL}/dashboard|Open Dashboard>`;

        payload = { text: slackText };
        break;
      }
      case 'DISCORD': {
        const discContent = lead.content && lead.content.length > 1024
          ? `${lead.content.slice(0, 1024)}...`
          : lead.content;

        payload = {
          content: null,
          embeds: [{
            title: `🚀 New Lead Detected for ${lead.product.name}`,
            url: lead.url,
            color: 5814783, // blurple color
            fields: [
              {
                name: 'Intent Score',
                value: `${lead.intentScore}% (${lead.intentLevel})`,
                inline: true,
              },
              {
                name: 'Platform',
                value: lead.platform,
                inline: true,
              },
              {
                name: 'Author',
                value: lead.authorUsername ? `u/${lead.authorUsername}` : 'Unknown',
                inline: true,
              },
              {
                name: lead.title || 'Post Content',
                value: discContent || '_No content_',
              },
              ...(qualificationReasoning ? [{
                name: '💡 AI Reasoning',
                value: qualificationReasoning,
              }] : []),
            ],
            footer: {
              text: `Knivik Alerts`,
            },
            timestamp: new Date().toISOString()
          }]
        };
        break;
      }
      case 'ZAPIER':
      case 'MAKE':
      case 'CUSTOM':
      default:
        payload = {
          event: 'lead.detected',
          timestamp: new Date().toISOString(),
          data: {
            id: lead.id,
            productId: lead.productId,
            productName: lead.product.name,
            platform: lead.platform,
            externalPostId: lead.externalPostId,
            title: lead.title || null,
            content: lead.content || '',
            url: lead.url,
            authorUsername: lead.authorUsername || null,
            intentScore: lead.intentScore,
            intentLevel: lead.intentLevel,
            detectedBy: lead.detectedBy,
            qualificationReasoning: qualificationReasoning || null,
            postedAt: lead.postedAt ? new Date(lead.postedAt).toISOString() : null,
            createdAt: new Date(lead.createdAt).toISOString(),
            dashboardUrl: `${config.FRONTEND_URL}/dashboard`
          }
        };
        break;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       throw new Error(`Webhook responded with status: ${response.status}`);
    }
    
    // Log successful alert
    await db.client.alertLog.upsert({
      where: {
        alertSettingId_leadId_channel: {
          alertSettingId: lead.product.user.alertSetting.id,
          leadId: lead.id,
          channel: AlertChannel.SLACK,
        }
      },
      create: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.SLACK,
        status: 'sent'
      },
      update: {
        status: 'sent',
        errorMessage: null,
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, url }, 'Webhook alert failed');
    
    // Log failed alert
    await db.client.alertLog.upsert({
      where: {
        alertSettingId_leadId_channel: {
          alertSettingId: lead.product.user.alertSetting.id,
          leadId: lead.id,
          channel: AlertChannel.SLACK,
        }
      },
      create: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.SLACK,
        status: 'failed',
        errorMessage: error.message
      },
      update: {
        status: 'failed',
        errorMessage: error.message
      }
    });
  }
}

async function sendEmailAlert(email: string, lead: any) {
  try {
    const bodyHtml = `
      <p>A new high-intent lead matching your search rules was detected on <strong>${lead.platform}</strong>.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #5b3df5; padding: 16px; margin: 20px 0; border-radius: 8px; font-style: italic; color: #334155; font-size: 14px; border: 1px solid #e2e8f0;">
        "${lead.title || 'Conversation thread'}"
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Product:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #0b0f19; text-align: right; border-bottom: 1px solid #f1f5f9;">${lead.product.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Intent Score:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #00dfdf; text-align: right; border-bottom: 1px solid #f1f5f9;">${lead.intentScore}% (${lead.intentLevel})</td>
        </tr>
      </table>
    `;

    const htmlTemplate = renderBaseEmail({
      title: 'New Lead Found',
      preheader: `Knivik alert: a new high-intent lead was found for ${lead.product.name}.`,
      bodyHtml,
      ctaText: 'View Source Post',
      ctaUrl: lead.url,
      footerText: `Sent to ${email} based on your keyword tracking settings for ${lead.product.name}.`
    });

    await sendEmail(
      email,
      `🚀 [${config.PROJECT_NAME}] New Lead: ${lead.product.name} (${lead.intentScore}%)`,
      htmlTemplate
    );

    // Create success log record
    await db.client.alertLog.upsert({
      where: {
        alertSettingId_leadId_channel: {
          alertSettingId: lead.product.user.alertSetting.id,
          leadId: lead.id,
          channel: AlertChannel.EMAIL,
        }
      },
      create: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.EMAIL,
        status: 'sent'
      },
      update: {
        status: 'sent',
        errorMessage: null,
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, email }, 'Email alert failed');
    
    // Create failure log record
    await db.client.alertLog.upsert({
      where: {
        alertSettingId_leadId_channel: {
          alertSettingId: lead.product.user.alertSetting.id,
          leadId: lead.id,
          channel: AlertChannel.EMAIL,
        }
      },
      create: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.EMAIL,
        status: 'failed',
        errorMessage: error.message
      },
      update: {
        status: 'failed',
        errorMessage: error.message
      }
    });
  }
}
