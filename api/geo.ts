import { getEditionFromIsoCountry } from '../src/utils/countryEditions.js';

const BOT_UA_REGEX =
  /(googlebot|adsbot-google|mediapartners-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|applebot|crawler|spider|bot)/i;

export default function handler(req: any, res: any) {
  const rawUa = req.headers?.['user-agent'] || '';
  const ua = Array.isArray(rawUa) ? rawUa[0] : String(rawUa);
  const isBot = BOT_UA_REGEX.test(ua);

  const rawCountry =
    req.query?.geo ||
    req.headers?.['x-vercel-ip-country'] ||
    req.headers?.['cf-ipcountry'] ||
    '';
  const countryCode = (Array.isArray(rawCountry) ? rawCountry[0] : String(rawCountry)).toUpperCase().trim();
  const edition = getEditionFromIsoCountry(countryCode);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(JSON.stringify({ countryCode, edition, isBot }));
}
