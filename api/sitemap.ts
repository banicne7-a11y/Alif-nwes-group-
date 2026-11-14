import { generateStandardSitemapXml, generateNewsSitemapXml } from '../src/services/sitemapGenerator.js';

export default async function handler(req: any, res: any) {
  try {
    const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || 'official1.online';
    const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    const rawProto = req.headers?.['x-forwarded-proto'] || 'https';
    const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;
    const baseUrl = `${proto}://${host}`;

    const isNews = req.query?.type === 'news' || String(req.url || '').includes('google-news-sitemap');
    const xml = isNews
      ? await generateNewsSitemapXml(baseUrl)
      : await generateStandardSitemapXml(baseUrl);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.statusCode = 200;
    res.end(xml);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Error generating sitemap: ' + (err?.message || 'Unknown error'));
  }
}
