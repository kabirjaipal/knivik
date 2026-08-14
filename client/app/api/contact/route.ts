import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail, renderBaseEmail } from '@/lib/mailer';
import logger from '@/lib/logger';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    const emailBody = `
      <p>You have received a new contact form submission from the Knivik platform.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 100px;">Sender Name:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${name}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Sender Email:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${email}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Subject:</td>
          <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${subject}</td>
        </tr>
      </table>
      
      <p style="font-weight: 600; color: #64748b; margin-top: 20px; margin-bottom: 8px;">Message:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-size: 14px; color: #334155; white-space: pre-wrap; line-height: 1.6;">
        ${message}
      </div>
    `;

    const htmlTemplate = renderBaseEmail({
      title: 'New Support Message',
      preheader: `Contact form message from ${name} (${subject})`,
      bodyHtml: emailBody,
      footerText: 'This message was sent via the Contact Us form on Knivik. Reply directly to this email to contact the sender.',
    });

    await sendEmail(
      'app.knivik@gmail.com',
      `✉️ [Knivik Contact] ${subject}`,
      htmlTemplate,
      email
    );

    logger.info({ sender: email, subject }, 'Contact form submitted successfully');

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Contact form submission error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
