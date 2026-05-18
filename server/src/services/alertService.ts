import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import config from '../lib/config.js';
import { AlertChannel } from '@prisma/client';
import nodemailer from 'nodemailer';
import { hasCapability } from '../lib/plans.js';
import { renderBaseEmail } from '../lib/mailer.js';

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

    // 3. Email (Nodemailer Simulation)
    if (alertSetting.emailEnabled) {
      const emailDest = alertSetting.emailTarget || lead.product.user.email;
      await sendEmailAlert(emailDest, lead);
    }

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

    switch (webhookType) {
      case 'SLACK':
        payload = {
          text: `🚀 *New High-Intent Lead Detected!*\n*Product:* ${lead.product.name}\n*Intent Score:* ${lead.intentScore}%\n*Content:* ${lead.title || 'Conversation thread'}\n<${lead.url}|View Post> | <${config.FRONTEND_URL}/dashboard|Open Dashboard>`,
        };
        break;
      case 'DISCORD':
        payload = {
          content: null,
          embeds: [{
            title: `🚀 New Lead: ${lead.product.name}`,
            description: `**Intent Score:** ${lead.intentScore}%\n**Platform:** ${lead.platform}\n\n${lead.title || 'Conversation thread'}`,
            url: lead.url,
            color: 5814783,
          }]
        };
        break;
      case 'ZAPIER':
      case 'MAKE':
      case 'CUSTOM':
      default:
        payload = {
          event: 'lead.detected',
          data: {
            id: lead.id,
            intentScore: lead.intentScore,
            intentLevel: lead.intentLevel,
            platform: lead.platform,
            title: lead.title,
            url: lead.url,
            productName: lead.product.name,
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
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });

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

    await transporter.sendMail({
      from: config.SMTP_FROM,
      to: email,
      subject: `🚀 [${config.PROJECT_NAME}] New Lead: ${lead.product.name} (${lead.intentScore}%)`,
      html: htmlTemplate,
    });

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
