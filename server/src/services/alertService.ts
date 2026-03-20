import { db } from '../lib/db.js';
import logger from '../lib/logger.js';
import config from '../lib/config.js';
import { AlertChannel } from '@prisma/client';
import nodemailer from 'nodemailer';

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

    // 1. Check intent score threshold
    if (lead.intentScore < alertSetting.minIntentScore) {
      return;
    }

    // 2. Webhook (Slack/Discord)
    if (alertSetting.slackEnabled && alertSetting.slackWebhook) {
      await sendWebhookAlert(alertSetting.slackWebhook, lead);
    }

    // 3. Email (Nodemailer Simulation)
    if (alertSetting.emailEnabled) {
      await sendEmailAlert(lead.product.user.email, lead);
    }

  } catch (error) {
    logger.error({ error, leadId }, 'Failed to process lead alert');
  }
};

async function sendWebhookAlert(url: string, lead: any) {
  try {
    const payload = {
      content: `🚀 **New High-Intent Lead Detected!**\n\n**Product:** ${lead.product.name}\n**Intent Score:** ${lead.intentScore}% (${lead.intentLevel})\n**Content:** ${lead.title || 'Conversation thread'}\n**Platform:** ${lead.platform}\n\n[View Post](${lead.url})\n[Open Dashboard](${config.FRONTEND_URL}/dashboard)`,
      text: `New Lead: ${lead.product.name} - ${lead.intentScore}% intent. ${lead.url}`
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       throw new Error(`Webhook responded with status: ${response.status}`);
    }
    
    // Log the alert
    await db.client.alertLog.create({
      data: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.SLACK,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, url }, 'Webhook alert failed');
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

    // Create log record
    await db.client.alertLog.create({
      data: {
        alertSettingId: lead.product.user.alertSetting.id,
        leadId: lead.id,
        channel: AlertChannel.EMAIL,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message, email }, 'Email alert failed');
  }
}
