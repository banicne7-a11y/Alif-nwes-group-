import { fetchGoogleTrendsFeed } from '../src/services/trendsAndAiServer.js';

export default async function handler(req: any, res: any) {
  try {
    const geo =
      (req.method === 'POST' ? req.body?.geo : undefined) ||
      req.query?.geo ||
      'US';

    const data = await fetchGoogleTrendsFeed(String(geo));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, ...data }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to fetch Google Trends feed',
      })
    );
  }
}
