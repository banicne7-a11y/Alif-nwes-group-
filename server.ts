import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateStandardSitemapXml,
  generateNewsSitemapXml,
  generateRobotsTxt,
  generateAdsTxt,
} from './src/services/sitemapGenerator';
import { injectSeoIntoHtml } from './src/services/ssrSeoRenderer';
import { resolveMediaAsset } from './src/services/mediaServer';
import { fetchGoogleTrendsFeed, runGeminiEditorialAction } from './src/services/trendsAndAiServer';
import { getEditionFromIsoCountry } from './src/utils/countryEditions';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const BOT_UA_REGEX =
  /(googlebot|adsbot-google|mediapartners-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|whatsapp|telegram|discord|slack|pinterest|skypeuripreview|viber|snapchat|embedly|applebot|crawler|spider|bot)/i;

// Body parser with support for large media / backup payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// Server-Side Gemini 4 Hydrogen AI Endpoints
// -------------------------------------------------------------
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const result = await runGeminiEditorialAction(req.body || {});
    return res.json(result);
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      error: err?.message || 'Gemini AI service error',
    });
  }
});

// -------------------------------------------------------------
// Live Google Trends RSS Fetcher Endpoint
// -------------------------------------------------------------
app.get('/api/trends', async (req, res) => {
  try {
    const geo = String(req.query?.geo || 'US');
    const data = await fetchGoogleTrendsFeed(geo);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to load Google Trends',
    });
  }
});

app.post('/api/trends', async (req, res) => {
  try {
    const geo = String(req.body?.geo || 'US');
    const data = await fetchGoogleTrendsFeed(geo);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to load Google Trends',
    });
  }
});

// -------------------------------------------------------------
// Geo Country Detection Helper (Bot-Safe Auto Edition)
// -------------------------------------------------------------
app.get('/api/geo', (req, res) => {
  const ua = String(req.headers['user-agent'] || '');
  const isBot = BOT_UA_REGEX.test(ua);
  const rawCountry =
    req.query?.geo ||
    req.headers['x-vercel-ip-country'] ||
    req.headers['cf-ipcountry'] ||
    '';
  const countryCode = String(rawCountry).toUpperCase().trim();
  const edition = getEditionFromIsoCountry(countryCode);
  res.json({ countryCode, edition, isBot });
});

// -------------------------------------------------------------
// Media Asset Endpoint (serves uploaded gallery images stored in Firestore)
// -------------------------------------------------------------
app.get('/api/media', async (req, res) => {
  const resolved = await resolveMediaAsset(String(req.query?.id || ''));
  if (resolved.kind === 'binary') {
    res.setHeader('Content-Type', resolved.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(resolved.buffer);
  }
  if (resolved.kind === 'redirect') {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.redirect(302, resolved.location);
  }
  return res.status(404).send('Media asset not found');
});

// -------------------------------------------------------------
// RSS Feed Fetcher & Parser
// -------------------------------------------------------------
app.post('/api/rss/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Feed URL is required' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlifNews24CMS/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const xml = await response.text();

    // Parse simple RSS items using regex for lightweight zero-dependency reliability
    const items: Array<{
      title: string;
      link: string;
      pubDate: string;
      description: string;
      category: string;
      author: string;
      guid: string;
    }> = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 25) {
      const itemBlock = match[1];

      const getTag = (tag: string) => {
        const tMatch = itemBlock.match(new RegExp(`<${tag}[^>]*>(<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i'));
        if (tMatch) {
          return (tMatch[2] !== undefined ? tMatch[2] : tMatch[3] || '').trim();
        }
        return '';
      };

      const title = getTag('title').replace(/<[^>]+>/g, '');
      const link = getTag('link');
      const pubDate = getTag('pubDate') || new Date().toISOString();
      const description = getTag('description').replace(/<[^>]+>/g, '').slice(0, 300);
      const category = getTag('category') || 'General';
      const author = getTag('dc:creator') || getTag('author') || 'Newsroom Wire';
      const guid = getTag('guid') || link || Math.random().toString();

      if (title) {
        items.push({
          title,
          link,
          pubDate,
          description,
          category,
          author,
          guid,
        });
      }
    }

    return res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching RSS feed',
    });
  }
});

// -------------------------------------------------------------
// System Health and Backup Endpoints
// -------------------------------------------------------------
app.get('/api/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY),
    environment: process.env.NODE_ENV || 'development',
  });
});

// -------------------------------------------------------------
// Google Search Console & SEO Endpoints
// -------------------------------------------------------------

// 1. Google HTML File Verification handler (e.g., /google1234567890abcdef.html)
app.get('/google:hash.html', (req, res) => {
  const hash = req.params.hash;
  res.type('html').send(`google-site-verification: google${hash}.html`);
});

// 2. robots.txt endpoint
app.get(['/robots.txt', '/api/robots'], (req, res) => {
  const host = req.get('x-forwarded-host') || req.get('host') || 'official1.online';
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  res.type('text/plain').send(generateRobotsTxt(`${protocol}://${host}`));
});

// 3. Live Firestore-backed sitemap.xml & google-news-sitemap.xml endpoints for Google Search Console
app.get(['/sitemap.xml', '/api/sitemap'], async (req, res) => {
  const host = req.get('x-forwarded-host') || req.get('host') || 'official1.online';
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;
  try {
    const xml =
      req.query?.type === 'news'
        ? await generateNewsSitemapXml(baseUrl)
        : await generateStandardSitemapXml(baseUrl);
    res.type('application/xml').send(xml);
  } catch (err: any) {
    res.status(500).type('text/plain').send(err?.message || 'Error generating sitemap');
  }
});

app.get('/google-news-sitemap.xml', async (req, res) => {
  const host = req.get('x-forwarded-host') || req.get('host') || 'official1.online';
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;
  try {
    const xml = await generateNewsSitemapXml(baseUrl);
    res.type('application/xml').send(xml);
  } catch (err: any) {
    res.status(500).type('text/plain').send(err?.message || 'Error generating news sitemap');
  }
});

// 4. Update Google Search Console verification code & index.html
app.post('/api/seo/verification', (req, res) => {
  try {
    const { code } = req.body;
    let cleanCode = (code || '').trim();
    // Normalize if user pasted entire meta tag or prefix
    const metaMatch = cleanCode.match(/content=["']([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) {
      cleanCode = metaMatch[1];
    }
    if (cleanCode.toLowerCase().startsWith('google-site-verification=')) {
      cleanCode = cleanCode.replace(/^google-site-verification=/i, '');
    }
    cleanCode = cleanCode.replace(/[/"'>]/g, '').trim();

    const indexPath = path.resolve(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
      let indexHtml = fs.readFileSync(indexPath, 'utf8');
      if (indexHtml.includes('name="google-site-verification"')) {
        indexHtml = indexHtml.replace(
          /<meta\s+name="google-site-verification"\s+content="[^"]*"\s*(?:id="[^"]*")?\s*\/?>/i,
          `<meta name="google-site-verification" content="${cleanCode}" id="google-site-verification" />`
        );
      } else {
        indexHtml = indexHtml.replace(
          /<head>/i,
          `<head>\n    <meta name="google-site-verification" content="${cleanCode}" id="google-site-verification" />`
        );
      }
      fs.writeFileSync(indexPath, indexHtml, 'utf8');
    }

    res.json({ success: true, cleanCode });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Dynamic /ads.txt endpoint for Google AdSense domain verification
app.get(['/ads.txt', '/api/ads-txt'], async (_req, res) => {
  try {
    const txt = await generateAdsTxt();
    res.type('text/plain').send(txt);
  } catch (err: any) {
    res.status(500).type('text/plain').send('# Error generating ads.txt: ' + (err?.message || 'Unknown error'));
  }
});

// 6. Update Google AdSense meta tag & Auto-Ads script in index.html
app.post('/api/adsense/verification', (req, res) => {
  try {
    const raw = String(req.body?.publisherId || '').trim();
    const match = raw.match(/(?:ca-)?(pub-\d{10,})/i);
    const cleanId = match ? `ca-${match[1].toLowerCase()}` : '';

    const indexPath = path.resolve(__dirname, 'index.html');
    if (fs.existsSync(indexPath) && cleanId) {
      let indexHtml = fs.readFileSync(indexPath, 'utf8');

      const metaTag = `<meta name="google-adsense-account" content="${cleanId}" id="google-adsense-account" />`;
      if (indexHtml.includes('name="google-adsense-account"')) {
        indexHtml = indexHtml.replace(
          /<meta\s+name="google-adsense-account"\s+content="[^"]*"\s*(?:id="[^"]*")?\s*\/?>/i,
          metaTag
        );
      } else {
        indexHtml = indexHtml.replace(/<head>/i, `<head>\n    ${metaTag}`);
      }

      const scriptTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cleanId}" crossorigin="anonymous" data-alif-adsense="true"></script>`;
      if (indexHtml.includes('data-alif-adsense="true"') || indexHtml.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) {
        indexHtml = indexHtml.replace(
          /<script[^>]*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*><\/script>/i,
          scriptTag
        );
      } else {
        indexHtml = indexHtml.replace(/<\/head>/i, `    ${scriptTag}\n  </head>`);
      }

      fs.writeFileSync(indexPath, indexHtml, 'utf8');
    }

    res.json({ success: true, cleanId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update AdSense tags' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  const maybeRedirectHome = (req: express.Request, res: express.Response): boolean => {
    const ua = String(req.headers['user-agent'] || '');
    const isBot = BOT_UA_REGEX.test(ua);
    const cookieHeader = String(req.headers.cookie || '');
    const hasOverride =
      req.query?.noredirect === '1' ||
      req.query?.edition === 'global' ||
      cookieHeader.includes('alif_edition_override=global');
    if (isBot || hasOverride) return false;
    const rawGeo = req.query?.geo || req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '';
    const edition = getEditionFromIsoCountry(String(rawGeo));
    if (edition) {
      res.redirect(307, `/${edition}`);
      return true;
    }
    return false;
  };

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.get('/', async (req, res, next) => {
      try {
        if (maybeRedirectHome(req, res)) return;
        const host = req.get('x-forwarded-host') || req.get('host') || 'official1.online';
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
        const baseUrl = `${protocol}://${host}`;
        const rawHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        const finalHtml = await injectSeoIntoHtml(transformed, { type: 'home', baseUrl });
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (e) {
        next(e);
      }
    });

    app.get(
      ['/:country(usa|uk|canada|australia)', '/:country(usa|uk|canada|australia)/:slug', '/news/:slug', '/page/:slug'],
      async (req, res, next) => {
        try {
          const host = req.get('x-forwarded-host') || req.get('host') || 'official1.online';
          const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
          const baseUrl = `${protocol}://${host}`;
          const rawHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
          const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
          const country = req.params.country;
          const slug = req.params.slug;
          const type = req.path.startsWith('/page/')
            ? 'page'
            : country && !slug
            ? 'country'
            : 'article';
          const finalHtml = await injectSeoIntoHtml(transformed, {
            type,
            slug,
            country,
            baseUrl,
          });
          res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
        } catch (e) {
          next(e);
        }
      }
    );

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('/', async (req, res) => {
      if (maybeRedirectHome(req, res)) return;
      const host = req.get('x-forwarded-host') || req.get('host') || 'official1.online';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const baseUrl = `${protocol}://${host}`;
      const distHtml = fs.readFileSync(path.resolve(__dirname, 'dist', 'index.html'), 'utf8');
      const finalHtml = await injectSeoIntoHtml(distHtml, { type: 'home', baseUrl });
      res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
    });
    app.get(
      ['/:country(usa|uk|canada|australia)', '/:country(usa|uk|canada|australia)/:slug', '/news/:slug', '/page/:slug'],
      async (req, res) => {
        const host = req.get('x-forwarded-host') || req.get('host') || 'official1.online';
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
        const baseUrl = `${protocol}://${host}`;
        const distHtml = fs.readFileSync(path.resolve(__dirname, 'dist', 'index.html'), 'utf8');
        const country = req.params.country;
        const slug = req.params.slug;
        const type = req.path.startsWith('/page/')
          ? 'page'
          : country && !slug
          ? 'country'
          : 'article';
        const finalHtml = await injectSeoIntoHtml(distHtml, {
          type,
          slug,
          country,
          baseUrl,
        });
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      }
    );
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Alif News 24 CMS running at http://localhost:${PORT}`);
  });
}

startServer();
