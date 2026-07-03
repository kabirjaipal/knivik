import { Resend } from 'resend';
import { config } from './config.js';
import logger from './logger.js';

const resend = new Resend(config.RESEND_API_KEY);

export const renderBaseEmail = ({
  title,
  preheader,
  bodyHtml,
  ctaText,
  ctaUrl,
  footerText,
}: {
  title: string;
  preheader: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f8fafc;
          color: #1e293b;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #f8fafc;
          padding-bottom: 40px;
          padding-top: 40px;
        }
        .container {
          max-width: 600px;
          background-color: #ffffff;
          margin: 0 auto;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .header {
          background-color: #0b0f19;
          padding: 32px;
          text-align: center;
          border-bottom: 4px solid #00dfdf;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.05em;
          text-decoration: none;
        }
        .logo-accent {
          color: #00dfdf;
        }
        .content {
          padding: 40px 32px;
        }
        .title {
          font-size: 22px;
          font-weight: 800;
          color: #0b0f19;
          margin-top: 0;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .text {
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 24px;
        }
        .cta-container {
          text-align: center;
          margin-top: 32px;
          margin-bottom: 32px;
        }
        .button {
          background-color: #5b3df5;
          color: #ffffff !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          display: inline-block;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          box-shadow: 0 4px 6px -1px rgba(91, 61, 245, 0.2), 0 2px 4px -1px rgba(91, 61, 245, 0.1);
        }
        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 32px 0;
        }
        .footer {
          padding: 0 32px 32px 32px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;
        }
        .footer a {
          color: #5b3df5;
          text-decoration: none;
        }
        .footer-logo {
          font-size: 14px;
          font-weight: 800;
          color: #475569;
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <span style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <span class="logo-text">KNIVIK<span class="logo-accent">.</span></span>
          </div>
          <div class="content">
            <h1 class="title">${title}</h1>
            <div class="text">${bodyHtml}</div>
            ${ctaText && ctaUrl ? `
              <div class="cta-container">
                <a href="${ctaUrl}" target="_blank" class="button">${ctaText}</a>
              </div>
            ` : ''}
            <div class="divider"></div>
            <div class="footer">
              <div class="footer-logo">KNIVIK</div>
              <p>${footerText || "This is an automated system email. If you did not trigger this action, you can safely ignore this message."}</p>
              <p style="font-size: 11px; margin-top: 12px; color: #94a3b8; font-style: italic;">This is an automated no-reply email. Please do not reply directly to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Knivik. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `"${config.PROJECT_NAME}" <${config.SMTP_FROM}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    logger.info({ messageId: data?.id }, 'Email sent successfully via Resend SDK');
  } catch (error) {
    logger.error({ error }, 'Failed to send email via Resend SDK');
  }
};
