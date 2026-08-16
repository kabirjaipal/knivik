import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const configs = await db.client.systemConfig.findMany();
    const configMap = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value as any }), {});

    const defaults = {
      maintenanceMode: false,
      registrationEnabled: true,
      aiModelVersatile: 'llama-3.3-70b-versatile',
      aiModelLite: 'llama-3.1-8b-instant',
    };

    return NextResponse.json({ success: true, data: { ...defaults, ...configMap } });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Get Config Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof key !== 'string' || key.length > 128) {
      return NextResponse.json({ success: false, error: 'Invalid config key' }, { status: 400 });
    }
    if (value === undefined || value === null) {
      return NextResponse.json({ success: false, error: 'Config value is required' }, { status: 400 });
    }

    await db.client.systemConfig.upsert({
      where: { key },
      update: { value },
      create: {
        id: `config-${key}`,
        key,
        value,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Update Config Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
