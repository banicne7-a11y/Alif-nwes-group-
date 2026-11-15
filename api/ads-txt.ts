import { generateAdsTxt } from '../src/services/sitemapGenerator.js';

export default async function handler(_req: any, res: any) {
  try {
    const content = await generateAdsTxt();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.statusCode = 200;
    res.end(content);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('# Error generating ads.txt: ' + (err?.message || 'Unknown error'));
  }
}
