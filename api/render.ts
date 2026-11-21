import fs from 'fs';
import path from 'path';
import { injectSeoIntoHtml } from '../src/services/ssrSeoRenderer.js';
import { getEditionFromIsoCountry } from '../src/utils/countryEditions.js';

const BOT_UA_REGEX =
  /(googlebot|adsbot-google|mediapartners-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|whatsapp|telegram|discord|slack|pinterest|skypeuripreview|viber|snapchat|embedly|applebot|crawler|spider|bot)/i;

export default async function handler(req: any, res: any) {
  try {
    const rawHost = req.headers?.['x-forwarded-host'] || req.headers?.host || 'www.official1.online';
    const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    const rawProto = req.headers?.['x-forwarded-proto'] || 'https';
    const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;
    const baseUrl = `${proto}://${host}`;

    const rawType = String(req.query?.type || 'article').toLowerCase();
    const type: 'article' | 'page' | 'country' | 'home' =
      rawType === 'page'
        ? 'page'
        : rawType === 'country'
        ? 'country'
        : rawType === 'home'
        ? 'home'
        : 'article';
    const slug = String(req.query?.slug || '').trim();
    const country = String(req.query?.country || '').trim().toLowerCase();

    // Auto Geo-Redirect ONLY on root '/' for human visitors from Tier-1 editions (never redirect bots/crawlers!)
    if (type === 'home') {
      const uaHeader = req.headers?.['user-agent'] || '';
      const ua = Array.isArray(uaHeader) ? uaHeader[0] : String(uaHeader);
      const isBot = BOT_UA_REGEX.test(ua);
      const cookieHeader = String(req.headers?.cookie || '');
      const hasOverride =
        req.query?.noredirect === '1' ||
        req.query?.edition === 'global' ||
        cookieHeader.includes('alif_edition_override=global');

      if (!isBot && !hasOverride) {
        const rawGeo =
          req.query?.geo ||
          req.headers?.['x-vercel-ip-country'] ||
          req.headers?.['cf-ipcountry'] ||
          '';
        const geoCode = (Array.isArray(rawGeo) ? rawGeo[0] : String(rawGeo)).toUpperCase().trim();
        const edition = getEditionFromIsoCountry(geoCode);
        if (edition) {
          res.statusCode = 307;
          res.setHeader('Location', `/${edition}`);
          res.setHeader('Vary', 'x-vercel-ip-country, user-agent');
          res.setHeader('Cache-Control', 'no-store');
          res.end();
          return;
        }
      }
    }

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

    const rendered = await injectSeoIntoHtml(templateHtml, {
      type,
      slug,
      country,
      baseUrl,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (type === 'home') {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Vary', 'x-vercel-ip-country, user-agent');
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    res.statusCode = 200;
    res.end(rendered);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Error rendering page: ' + (err?.message || 'Unknown error'));
  }
}
