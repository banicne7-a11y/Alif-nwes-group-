import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

interface SeoEntity {
  title: string;
  subtitle?: string;
  description: string;
  slug: string;
  image?: string;
  authorName?: string;
  publishedAt?: string;
  updatedAt?: string;
  contentHtml?: string;
  targetCountry?: string;
  kind: 'article' | 'page';
}

interface SiteSeoConfig {
  adsenseClientId: string;
  searchConsoleCode: string;
  googleAnalyticsId: string;
  siteName: string;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSafeInlineHtml(raw: string): string {
  const escaped = escapeHtml(raw);
  return escaped
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
}

function readStr(fields: Record<string, any> | undefined, key: string): string {
  return fields?.[key]?.stringValue ? String(fields[key].stringValue) : '';
}

function readBlocksText(fields: Record<string, any> | undefined): string {
  const arr = fields?.blocks?.arrayValue?.values;
  if (!Array.isArray(arr) || arr.length === 0) return '';
  const parts: string[] = [];
  for (const item of arr) {
    const mapFields = item?.mapValue?.fields;
    if (!mapFields) continue;
    const type = readStr(mapFields, 'type');
    const content = readStr(mapFields, 'content');
    if (!content) continue;
    if (type === 'heading') {
      const levelNum = Number(mapFields?.level?.integerValue || 2);
      const tag = levelNum === 4 ? 'h4' : levelNum === 3 ? 'h3' : 'h2';
      parts.push(`<${tag}>${escapeHtml(content.replace(/\*\*/g, ''))}</${tag}>`);
    } else if (type === 'quote') {
      parts.push(`<blockquote>${renderSafeInlineHtml(content)}</blockquote>`);
    } else if (type === 'paragraph' || type === 'callout') {
      parts.push(`<p>${renderSafeInlineHtml(content)}</p>`);
    }
  }
  return parts.join('\n');
}

function formatPlainTextHtml(raw: string): string {
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((chunk) => {
      if (chunk.startsWith('### ')) {
        return `<h3>${escapeHtml(chunk.slice(4).replace(/\*\*/g, '').trim())}</h3>`;
      }
      if (chunk.startsWith('## ')) {
        return `<h2>${escapeHtml(chunk.slice(3).replace(/\*\*/g, '').trim())}</h2>`;
      }
      if (chunk.startsWith('# ')) {
        return `<h2>${escapeHtml(chunk.slice(2).replace(/\*\*/g, '').trim())}</h2>`;
      }
      return `<p>${renderSafeInlineHtml(chunk)}</p>`;
    })
    .join('\n');
}

async function queryFirestore(structuredQuery: Record<string, any>): Promise<Array<Record<string, any>>> {
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const apiKey = firebaseConfig.apiKey;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents:runQuery?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  });

  if (!res.ok) return [];
  const rows: any[] = await res.json();
  return rows
    .filter((r) => r && r.document && r.document.fields)
    .map((r) => r.document.fields as Record<string, any>);
}

async function fetchSiteConfig(): Promise<SiteSeoConfig> {
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const apiKey = firebaseConfig.apiKey;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/config/site_settings?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return { adsenseClientId: '', searchConsoleCode: '', googleAnalyticsId: '', siteName: 'Alif News 24' };
    const docData: any = await res.json();
    const fields = docData?.fields;
    return {
      adsenseClientId: readStr(fields, 'adsenseClientId').trim(),
      searchConsoleCode: readStr(fields, 'searchConsoleCode').trim(),
      googleAnalyticsId: readStr(fields, 'googleAnalyticsId').trim(),
      siteName: readStr(fields, 'siteName').trim() || 'Alif News 24',
    };
  } catch {
    return { adsenseClientId: '', searchConsoleCode: '', googleAnalyticsId: '', siteName: 'Alif News 24' };
  }
}

async function fetchEntityBySlug(kind: 'article' | 'page', slug: string): Promise<SeoEntity | null> {
  const collectionId = kind === 'article' ? 'posts' : 'pages';
  const docs = await queryFirestore({
    from: [{ collectionId }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'status' },
              op: 'EQUAL',
              value: { stringValue: 'published' },
            },
          },
          {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: slug },
            },
          },
        ],
      },
    },
    limit: 1,
  }).catch(() => []);

  if (!docs || docs.length === 0) return null;
  const f = docs[0];
  const title = readStr(f, 'title');
  if (!title) return null;

  const rawContent = readStr(f, 'content');
  const blocksHtml = readBlocksText(f);
  const contentHtml = blocksHtml || (rawContent ? formatPlainTextHtml(rawContent) : '');
  const description =
    readStr(f, 'seoDescription') ||
    readStr(f?.seo?.mapValue?.fields, 'description') ||
    readStr(f, 'excerpt') ||
    readStr(f, 'subtitle') ||
    title;

  return {
    kind,
    title,
    subtitle: readStr(f, 'subtitle'),
    description: description.slice(0, 300),
    slug: readStr(f, 'slug') || slug,
    image: readStr(f, 'featuredImage'),
    authorName: readStr(f, 'authorName') || 'Alif News 24 Editorial Desk',
    publishedAt: readStr(f, 'publishedAt') || readStr(f, 'createdAt'),
    updatedAt: readStr(f, 'updatedAt'),
    contentHtml,
    targetCountry: readStr(f, 'targetCountry').toLowerCase().trim(),
  };
}

const COUNTRY_META: Record<string, { label: string; title: string; desc: string }> = {
  usa: {
    label: 'United States Edition',
    title: 'USA Breaking News, Trends & Analysis',
    desc: 'Latest trending American news, economy, politics, tech, and verified headlines on Alif News 24 USA Edition.',
  },
  uk: {
    label: 'United Kingdom Edition',
    title: 'UK Breaking News, Trends & Analysis',
    desc: 'Latest trending United Kingdom news, business, politics, and verified stories on Alif News 24 UK Edition.',
  },
  canada: {
    label: 'Canada Edition',
    title: 'Canada Breaking News, Trends & Analysis',
    desc: 'Latest trending Canadian news, finance, tech, and national updates on Alif News 24 Canada Edition.',
  },
  australia: {
    label: 'Australia Edition',
    title: 'Australia Breaking News, Trends & Analysis',
    desc: 'Latest trending Australian news, economy, lifestyle, and national coverage on Alif News 24 Australia Edition.',
  },
};

const DEFAULT_SOCIAL_IMAGE =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop&q=85&fm=jpg';

function resolveAbsoluteSocialImage(rawImg: string, cleanBase: string): string {
  const trimmed = String(rawImg || '').trim();
  const abs = trimmed.startsWith('/') ? `${cleanBase}${trimmed}` : trimmed;
  if (abs && !abs.startsWith('data:')) {
    return abs;
  }
  return DEFAULT_SOCIAL_IMAGE;
}

function injectSocialMetaTags(
  inputHtml: string,
  params: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage: string;
    ogType: 'website' | 'article';
  }
): string {
  let out = inputHtml;
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  out = out.replace(/<meta\s+property=["']og:(?:url|title|description|type|image|image:width|image:height|image:alt)["'][^>]*>\s*/gi, '');
  out = out.replace(/<meta\s+name=["']twitter:(?:card|title|description|image)["'][^>]*>\s*/gi, '');

  const tags = [
    `<link rel="canonical" href="${escapeHtml(params.canonicalUrl)}" />`,
    `<meta property="og:url" content="${escapeHtml(params.canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(params.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(params.description)}" />`,
    `<meta property="og:type" content="${params.ogType}" />`,
    `<meta property="og:image" content="${escapeHtml(params.ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(params.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(params.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(params.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(params.ogImage)}" />`,
  ].join('\n    ');

  return out.replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

async function fetchCountryPosts(
  country: string
): Promise<Array<{ title: string; slug: string; excerpt: string; targetCountry: string; featuredImage: string }>> {
  const docs = await queryFirestore({
    from: [{ collectionId: 'posts' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'published' },
      },
    },
    limit: 60,
  }).catch(() => []);

  return docs
    .map((f) => ({
      title: readStr(f, 'title'),
      slug: readStr(f, 'slug') || readStr(f, 'id'),
      excerpt: readStr(f, 'excerpt') || readStr(f, 'subtitle'),
      targetCountry: readStr(f, 'targetCountry').toLowerCase().trim(),
      featuredImage: readStr(f, 'featuredImage'),
      publishedAt: readStr(f, 'publishedAt') || readStr(f, 'createdAt'),
    }))
    .filter((p) => {
      if (!p.title || !p.slug) return false;
      if (country === 'global') return true;
      if (country === 'usa') return p.targetCountry === 'usa' || !p.targetCountry;
      return p.targetCountry === country;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 20);
}

export async function injectSeoIntoHtml(
  templateHtml: string,
  options: { type: 'article' | 'page' | 'country' | 'home'; slug?: string; country?: string; baseUrl: string }
): Promise<string> {
  const cleanBase = options.baseUrl.replace(/\/+$/, '');
  const countryKey = (options.country || '').toLowerCase().trim();
  const [entity, siteCfg, countryPosts] = await Promise.all([
    options.type === 'article' || options.type === 'page'
      ? fetchEntityBySlug(options.type, options.slug || '')
      : Promise.resolve(null),
    fetchSiteConfig(),
    options.type === 'country' && countryKey
      ? fetchCountryPosts(countryKey)
      : options.type === 'home'
      ? fetchCountryPosts('global')
      : Promise.resolve([]),
  ]);

  let html = templateHtml;

  // Inject dynamic Google Search Console & AdSense verification meta/script if configured
  const pubMatch = siteCfg.adsenseClientId.match(/(?:ca-)?(pub-\d{10,})/i);
  const adsenseId = pubMatch ? `ca-${pubMatch[1].toLowerCase()}` : '';
  const isRealAdSense = Boolean(adsenseId && adsenseId !== 'ca-pub-9386736849071234');

  if (siteCfg.searchConsoleCode) {
    html = html.replace(
      /<meta\s+name="google-site-verification"[^>]*>/i,
      `<meta name="google-site-verification" content="${escapeHtml(siteCfg.searchConsoleCode)}" id="google-site-verification" />`
    );
  }

  if (isRealAdSense) {
    const metaAdSense = `<meta name="google-adsense-account" content="${escapeHtml(adsenseId)}" id="google-adsense-account" />`;
    const scriptAdSense = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseId)}" crossorigin="anonymous" data-alif-adsense="true"></script>`;
    if (html.includes('name="google-adsense-account"')) {
      html = html.replace(/<meta\s+name="google-adsense-account"[^>]*>/i, metaAdSense);
      if (html.includes('data-alif-adsense="true"')) {
        html = html.replace(
          /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"]+"[^>]*data-alif-adsense="true"><\/script>/i,
          scriptAdSense
        );
      } else {
        html = html.replace(/<\/head>/i, `    ${scriptAdSense}\n  </head>`);
      }
    } else {
      html = html.replace(/<\/head>/i, `    ${metaAdSense}\n    ${scriptAdSense}\n  </head>`);
    }
  }

  const gaMatch = siteCfg.googleAnalyticsId.match(/\b(G-[A-Z0-9]{6,})\b/i);
  const gaId = gaMatch ? gaMatch[1].toUpperCase() : '';
  const isRealGa = Boolean(gaId && gaId !== 'G-AN24820921');
  if (isRealGa) {
    if (html.includes('data-alif-ga="true"')) {
      html = html.replace(
        /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]+" data-alif-ga="true"><\/script>/i,
        `<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}" data-alif-ga="true"></script>`
      );
      html = html.replace(
        /<script data-alif-ga-init="true">[\s\S]*?<\/script>/i,
        `<script data-alif-ga-init="true">window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('js',new Date());gtag('config','${escapeHtml(gaId)}');</script>`
      );
    } else {
      const gaTag = `<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}" data-alif-ga="true"></script>\n    <script data-alif-ga-init="true">window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('js',new Date());gtag('config','${escapeHtml(gaId)}');</script>`;
      html = html.replace(/<\/head>/i, `    ${gaTag}\n  </head>`);
    }
  }

  if (options.type === 'home') {
    const homeTitle = `${siteCfg.siteName} - America's 24/7 Live News Portal`;
    const homeDesc =
      'Around-the-clock independent investigative journalism, US politics, business, tech, sports, and world news.';
    html = injectSocialMetaTags(html, {
      title: homeTitle,
      description: homeDesc,
      canonicalUrl: `${cleanBase}/`,
      ogImage: DEFAULT_SOCIAL_IMAGE,
      ogType: 'website',
    });

    const listMarkup = countryPosts
      .map((p) => {
        const href =
          p.targetCountry === 'usa' || p.targetCountry === 'uk' || p.targetCountry === 'canada' || p.targetCountry === 'australia'
            ? `/${p.targetCountry}/${encodeURIComponent(p.slug)}`
            : `/news/${encodeURIComponent(p.slug)}`;
        return `<li style="margin-bottom:16px;"><a href="${escapeHtml(href)}" style="font-size:20px;font-weight:700;color:#0f172a;text-decoration:none;">${escapeHtml(p.title)}</a><p style="margin:4px 0 0;color:#475569;font-size:14px;">${escapeHtml(p.excerpt)}</p></li>`;
      })
      .join('\n');

    const homeBody = `
    <div id="root">
      <main style="max-width:860px;margin:40px auto;padding:0 20px;font-family:Georgia,serif;color:#0f172a;line-height:1.6;">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#dc2626;font-weight:700;">${escapeHtml(siteCfg.siteName)} · Alif Sheen Group</p>
        <h1 style="font-size:32px;line-height:1.25;margin:8px 0 12px;">${escapeHtml(siteCfg.siteName)} — 24/7 International News</h1>
        <nav style="margin-bottom:24px;display:flex;gap:12px;flex-wrap:wrap;font-size:14px;">
          <a href="/usa">USA Edition</a>
          <a href="/uk">UK Edition</a>
          <a href="/canada">Canada Edition</a>
          <a href="/australia">Australia Edition</a>
        </nav>
        <ul style="list-style:none;padding:0;margin:0;">${listMarkup}</ul>
      </main>
    </div>`;

    html = html.replace(/<div\s+id="root"\s*><\/div>/i, homeBody);
    return html;
  }

  if (options.type === 'country' && COUNTRY_META[countryKey]) {
    const meta = COUNTRY_META[countryKey];
    const canonicalUrl = `${cleanBase}/${countryKey}`;
    const fullTitle = `${meta.title} | ${siteCfg.siteName}`;
    const leadPostImage = countryPosts.find((p) => p.featuredImage && !p.featuredImage.startsWith('data:'))?.featuredImage || '';
    const countryOgImage = resolveAbsoluteSocialImage(leadPostImage, cleanBase);

    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
    html = html.replace(
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${escapeHtml(meta.desc)}" />`
    );
    html = injectSocialMetaTags(html, {
      title: fullTitle,
      description: meta.desc,
      canonicalUrl,
      ogImage: countryOgImage,
      ogType: 'website',
    });

    const listMarkup = countryPosts
      .map((p) => {
        const href =
          p.targetCountry === 'usa' || p.targetCountry === 'uk' || p.targetCountry === 'canada' || p.targetCountry === 'australia'
            ? `/${p.targetCountry}/${encodeURIComponent(p.slug)}`
            : `/news/${encodeURIComponent(p.slug)}`;
        return `<li style="margin-bottom:16px;"><a href="${escapeHtml(href)}" style="font-size:20px;font-weight:700;color:#0f172a;text-decoration:none;">${escapeHtml(p.title)}</a><p style="margin:4px 0 0;color:#475569;font-size:14px;">${escapeHtml(p.excerpt)}</p></li>`;
      })
      .join('\n');

    const countryBody = `
    <div id="root">
      <main style="max-width:860px;margin:40px auto;padding:0 20px;font-family:Georgia,serif;color:#0f172a;line-height:1.6;">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#dc2626;font-weight:700;">${escapeHtml(siteCfg.siteName)} · ${escapeHtml(meta.label)}</p>
        <h1 style="font-size:32px;line-height:1.25;margin:8px 0 12px;">${escapeHtml(meta.title)}</h1>
        <p style="color:#475569;margin-bottom:24px;">${escapeHtml(meta.desc)}</p>
        <ul style="list-style:none;padding:0;margin:0;">${listMarkup}</ul>
      </main>
    </div>`;

    html = html.replace(/<div\s+id="root"\s*><\/div>/i, countryBody);
    return html;
  }

  if (!entity) {
    return html;
  }

  const effectiveCountry =
    entity.targetCountry === 'usa' ||
    entity.targetCountry === 'uk' ||
    entity.targetCountry === 'canada' ||
    entity.targetCountry === 'australia'
      ? entity.targetCountry
      : countryKey === 'usa' || countryKey === 'uk' || countryKey === 'canada' || countryKey === 'australia'
      ? countryKey
      : '';

  const canonicalUrl =
    entity.kind === 'article'
      ? effectiveCountry
        ? `${cleanBase}/${effectiveCountry}/${encodeURIComponent(entity.slug)}`
        : `${cleanBase}/news/${encodeURIComponent(entity.slug)}`
      : `${cleanBase}/page/${encodeURIComponent(entity.slug)}`;

  const fullTitle = `${entity.title} | ${siteCfg.siteName}`;
  const ogImage = resolveAbsoluteSocialImage(entity.image || '', cleanBase);

  // Replace title & description
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(entity.description)}" />`
  );

  html = injectSocialMetaTags(html, {
    title: entity.title,
    description: entity.description,
    canonicalUrl,
    ogImage,
    ogType: entity.kind === 'article' ? 'article' : 'website',
  });

  // Replace JSON-LD Schema.org block with rich NewsArticle / WebPage schema
  const jsonLd =
    entity.kind === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: entity.title,
          description: entity.description,
          image: [ogImage],
          datePublished: entity.publishedAt || undefined,
          dateModified: entity.updatedAt || entity.publishedAt || undefined,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
          author: [
            {
              '@type': 'Person',
              name: entity.authorName || siteCfg.siteName,
            },
          ],
          publisher: {
            '@type': 'NewsMediaOrganization',
            name: siteCfg.siteName,
            url: cleanBase,
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: entity.title,
          description: entity.description,
          url: canonicalUrl,
        };

  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n    ${JSON.stringify(jsonLd)}\n    </script>`
  );

  // Inject clean semantic fallback article markup inside #root so Googlebot / social crawlers
  // immediately read the full headline & story even before JS hydration replaces #root.
  const preRenderedBody = `
    <div id="root">
      <main style="max-width:760px;margin:40px auto;padding:0 20px;font-family:Georgia,serif;color:#0f172a;line-height:1.7;">
        <article>
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#dc2626;font-weight:700;">${escapeHtml(siteCfg.siteName)}</p>
          <h1 style="font-size:32px;line-height:1.25;margin:10px 0 14px;">${escapeHtml(entity.title)}</h1>
          ${entity.subtitle ? `<p style="font-size:18px;color:#475569;margin-bottom:20px;">${escapeHtml(entity.subtitle)}</p>` : ''}
          ${entity.image ? `<img src="${escapeHtml(entity.image)}" alt="${escapeHtml(entity.title)}" style="max-width:100%;height:auto;border-radius:12px;margin-bottom:24px;" />` : ''}
          <div>${entity.contentHtml || `<p>${escapeHtml(entity.description)}</p>`}</div>
        </article>
      </main>
    </div>`;

  html = html.replace(/<div\s+id="root"\s*><\/div>/i, preRenderedBody);

  return html;
}
