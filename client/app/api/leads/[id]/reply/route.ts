import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';
import { hasCapability } from '@/lib/plans';
import { generateReply } from '@/lib/services/aiService';

export const maxDuration = 45;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id: leadId } = await params;
    const userId = session.user.id;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'Missing lead ID' }, { status: 400 });
    }

    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
      include: {
        product: true,
      },
    });

    if (!lead || lead.product.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Lead not found or unauthorized' }, { status: 404 });
    }

    const user = await db.client.user.findUnique({ where: { id: userId } });
    if (!user || !hasCapability(user.plan, 'canAccessAdvancedAI')) {
      return NextResponse.json(
        { success: false, error: 'AI-generated replies are only available on Pro plans.' },
        { status: 403 }
      );
    }

    const replyText = await generateReply(lead.content, {
      id: lead.product.id,
      userId: lead.product.userId,
      name: lead.product.name,
      ...(lead.product.description && { description: lead.product.description }),
      ...(lead.product.config && { config: lead.product.config }),
    });

    const replyRecord = await db.client.reply.create({
      data: {
        leadId: lead.id,
        userId,
        generatedText: replyText,
      },
    });

    return NextResponse.json({ success: true, generatedText: replyText, replyId: replyRecord.id });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to generate AI reply');
    return NextResponse.json({ success: false, error: 'Failed to communicate with AI Engine' }, { status: 500 });
  }
}
