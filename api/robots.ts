import { generateDynamicRobotsTxt } from '../src/services/sitemapGenerator.js';

export default async function handler(req: any, res: any) {
  const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || 'www.official1.online';
  const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
  const rawProto = req.headers?.['x-forwarded-proto'] || 'https';
  const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;
  const baseUrl = `${proto}://${host}`;

  const txt = await generateDynamicRobotsTxt(baseUrl);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
  res.statusCode = 200;
  res.end(txt);
}
