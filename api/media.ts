import { resolveMediaAsset } from '../src/services/mediaServer.js';

export default async function handler(req: any, res: any) {
  const rawId = req.query?.id;
  const mediaId = Array.isArray(rawId) ? rawId[0] : String(rawId || '');
  const resolved = await resolveMediaAsset(mediaId);

  if (resolved.kind === 'binary') {
    res.setHeader('Content-Type', resolved.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.statusCode = 200;
    res.end(resolved.buffer);
    return;
  }

  if (resolved.kind === 'redirect') {
    res.statusCode = 302;
    res.setHeader('Location', resolved.location);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.end();
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Media asset not found');
}
