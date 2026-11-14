import { generateRobotsTxt } from '../src/services/sitemapGenerator.js';

export default function handler(req: any, res: any) {
  const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || 'official1.online';
  const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
  const rawProto = req.headers?.['x-forwarded-proto'] || 'https';
  const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;
  const baseUrl = `${proto}://${host}`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
  res.statusCode = 200;
  res.end(generateRobotsTxt(baseUrl));
}
