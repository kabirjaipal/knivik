import nodemailer from 'nodemailer';
import { config } from './config.js';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"${config.PROJECT_NAME}" <${config.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info({ messageId: info.messageId }, 'Email sent successfully via Nodemailer');
  } catch (error) {
    logger.error({ error }, 'Failed to send email via Nodemailer');
    // We do not throw the error here to avoid crashing the forgot-password endpoint if SMTP is misconfigured during local dev
  }
};
