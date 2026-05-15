import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import config from '../lib/config.js';
import { AlertChannel } from '@prisma/client';
import nodemailer from 'nodemailer';
import { hasCapability } from '../lib/plans.js';

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
    await db.client.alertLog.create({
      data: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.SLACK,
        status: 'sent'
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, url }, 'Webhook alert failed');
    
    // Log failed alert
    await db.client.alertLog.create({
      data: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.SLACK,
        status: 'failed',
        errorMessage: error.message
      },
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

    const body = `
      <h1>New High-Intent Lead!</h1>
      <p>A new lead has been detected for <strong>${lead.product.name}</strong>.</p>
      <ul>
        <li><strong>Intent Score:</strong> ${lead.intentScore}%</li>
        <li><strong>Intent Level:</strong> ${lead.intentLevel}</li>
        <li><strong>Platform:</strong> ${lead.platform}</li>
      </ul>
      <p><em>"${lead.title || 'Conversation thread'}"</em></p>
      <p><a href="${lead.url}">View Source Post</a></p>
      <p><a href="${config.FRONTEND_URL}/dashboard">Open ${config.PROJECT_NAME} Dashboard</a></p>
    `;

    await transporter.sendMail({
      from: config.SMTP_FROM,
      to: email,
      subject: `🚀 [${config.PROJECT_NAME}] New High-Intent Lead for ${lead.product.name} (${lead.intentScore}%)`,
      html: body,
    });

    // Create success log record
    await db.client.alertLog.create({
      data: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.EMAIL,
        status: 'sent'
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, email }, 'Email alert failed');
    
    // Create failure log record
    await db.client.alertLog.create({
      data: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.EMAIL,
        status: 'failed',
        errorMessage: error.message
      },
    });
  }
}
