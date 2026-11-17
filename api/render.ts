import fs from 'fs';
import path from 'path';
import { injectSeoIntoHtml } from '../src/services/ssrSeoRenderer.js';

export default async function handler(req: any, res: any) {
  try {
    const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || 'www.official1.online';
    const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    const rawProto = req.headers?.['x-forwarded-proto'] || 'https';
    const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;
    const baseUrl = `${proto}://${host}`;

    const type = req.query?.type === 'page' ? 'page' : 'article';
    const slug = String(req.query?.slug || '').trim();

    let templateHtml = '';
    const distHtmlPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(distHtmlPath)) {
      templateHtml = fs.readFileSync(distHtmlPath, 'utf8');
    } else {
      const originRes = await fetch(`${baseUrl}/index.html`, {
        headers: { 'x-alif-internal': '1' },
      });
      if (!originRes.ok) {
        throw new Error(`Unable to load base index.html (${originRes.status})`);
      }
      templateHtml = await originRes.text();
    }

    const rendered = slug
      ? await injectSeoIntoHtml(templateHtml, { type, slug, baseUrl })
      : templateHtml;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.statusCode = 200;
    res.end(rendered);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Error rendering page: ' + (err?.message || 'Unknown error'));
  }
}
