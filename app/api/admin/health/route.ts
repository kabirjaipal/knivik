import { NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const { errorResponse } = await requireAdmin();
    if (errorResponse) return errorResponse;

    const checks = [
      { name: 'Reddit', url: 'https://www.reddit.com/r/saas/.rss' },
      { name: 'HackerNews', url: 'https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=1' },
      { name: 'Twitter/X', url: 'https://nitter.net/search/rss?f=tweets&q=saas' },
    ];

    const results = await Promise.all(
      checks.map(async (c) => {
        try {
          const start = Date.now();
          const response = await fetch(c.url, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Knivik/1.0' },
            signal: AbortSignal.timeout(6000),
          });
          const latency = Date.now() - start;

          let status = 'Operational';
          if (!response.ok) status = 'Degraded';
          if (response.status === 429) status = 'Rate Limited';

          return {
            name: c.name,
            status,
            latency: `${latency}ms`,
            code: response.status,
          };
        } catch (e: any) {
          return {
            name: c.name,
            status: 'Offline',
            latency: 'timeout',
            error: e.message,
          };
        }
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Admin Health Error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
