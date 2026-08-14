import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';

const VALID_STATUSES = ['NEW', 'QUALIFIED', 'SAVED', 'CONTACTED', 'CONVERTED', 'DISMISSED'];

export async function PATCH(
  req: NextRequest,
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
      include: { product: { select: { userId: true } } },
    });

    if (!lead || lead.product.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Lead not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const { status, notes } = body;

    const updateData: Record<string, any> = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      updateData['status'] = status;
    }

    if (notes !== undefined) {
      if (typeof notes !== 'string' || notes.length > 5000) {
        return NextResponse.json(
          { success: false, error: 'Notes must be a string of 5000 characters or fewer' },
          { status: 400 }
        );
      }
      updateData['notes'] = notes;
    }

    const updated = await db.client.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to update lead');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
      include: { product: { select: { userId: true } } },
    });

    if (!lead || lead.product.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Lead not found or unauthorized' }, { status: 404 });
    }

    await db.client.lead.delete({
      where: { id: leadId },
    });

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to delete lead');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
