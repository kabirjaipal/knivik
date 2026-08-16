import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleNotesUpdate(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleNotesUpdate(req, params);
}

async function handleNotesUpdate(
  req: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const { id: leadId } = await params;
    const userId = session.user.id;
    const body = await req.json();
    const { notes } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'Missing lead ID' }, { status: 400 });
    }

    if (typeof notes !== 'string' || notes.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Notes must be a string of 5000 characters or fewer' },
        { status: 400 }
      );
    }

    const lead = await db.client.lead.findUnique({
      where: { id: leadId },
      include: { product: { select: { userId: true } } },
    });

    if (!lead || lead.product.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Lead not found or unauthorized' }, { status: 404 });
    }

    const updated = await db.client.lead.update({
      where: { id: leadId },
      data: { notes },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to update lead notes');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
