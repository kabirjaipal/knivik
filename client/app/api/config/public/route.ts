import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const configs = await db.client.systemConfig.findMany({
      where: {
        key: { in: ['maintenanceMode', 'registrationEnabled'] },
      },
    });

    const configMap = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value as boolean }), {
      maintenanceMode: false,
      registrationEnabled: true,
    });

    return NextResponse.json({
      success: true,
      data: configMap,
    });
  } catch (_error) {
    return NextResponse.json({
      success: true,
      data: {
        maintenanceMode: false,
        registrationEnabled: true,
      },
    });
  }
}
