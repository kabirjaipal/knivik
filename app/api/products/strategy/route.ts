import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/auth-server';
import { generateProductStrategy } from '@/lib/services/ai-service';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAuth();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, description, productType } = body;

    if (!name || typeof name !== 'string' || !description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name and description are required for AI analysis' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Product name must be 100 characters or fewer' },
        { status: 400 }
      );
    }
    if (description.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Product description must be 2000 characters or fewer' },
        { status: 400 }
      );
    }

    const strategy = await generateProductStrategy(
      name,
      description,
      session.user.id,
      undefined,
      productType
    );

    return NextResponse.json({ success: true, strategy });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Analyze Product error');
    return NextResponse.json({ success: false, error: 'AI analysis failed' }, { status: 500 });
  }
}
