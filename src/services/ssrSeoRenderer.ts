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
  kind: 'article' | 'page';
}

interface SiteSeoConfig {
  adsenseClientId: string;
  searchConsoleCode: string;
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
      parts.push(`<h2>${escapeHtml(content)}</h2>`);
    } else if (type === 'quote') {
      parts.push(`<blockquote>${escapeHtml(content)}</blockquote>`);
    } else if (type === 'paragraph' || type === 'callout') {
      parts.push(`<p>${escapeHtml(content)}</p>`);
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
      if (chunk.startsWith('## ')) {
        return `<h2>${escapeHtml(chunk.slice(3).trim())}</h2>`;
      }
      if (chunk.startsWith('# ')) {
        return `<h2>${escapeHtml(chunk.slice(2).trim())}</h2>`;
      }
      return `<p>${escapeHtml(chunk)}</p>`;
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
    if (!res.ok) return { adsenseClientId: '', searchConsoleCode: '', siteName: 'Alif News 24' };
    const docData: any = await res.json();
    const fields = docData?.fields;
    return {
      adsenseClientId: readStr(fields, 'adsenseClientId').trim(),
      searchConsoleCode: readStr(fields, 'searchConsoleCode').trim(),
      siteName: readStr(fields, 'siteName').trim() || 'Alif News 24',
    };
  } catch {
    return { adsenseClientId: '', searchConsoleCode: '', siteName: 'Alif News 24' };
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
  };
}

export async function injectSeoIntoHtml(
  templateHtml: string,
  options: { type: 'article' | 'page'; slug: string; baseUrl: string }
): Promise<string> {
  const cleanBase = options.baseUrl.replace(/\/+$/, '');
  const [entity, siteCfg] = await Promise.all([
    fetchEntityBySlug(options.type, options.slug),
    fetchSiteConfig(),
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
    if (!html.includes('name="google-adsense-account"')) {
      html = html.replace(/<\/head>/i, `    ${metaAdSense}\n    ${scriptAdSense}\n  </head>`);
    }
  }

  if (!entity) {
    return html;
  }

  const canonicalUrl =
    entity.kind === 'article'
      ? `${cleanBase}/news/${encodeURIComponent(entity.slug)}`
      : `${cleanBase}/page/${encodeURIComponent(entity.slug)}`;

  const fullTitle = `${entity.title} | ${siteCfg.siteName}`;
  const ogImage = entity.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80';

  // Replace title & description
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(entity.description)}" />`
  );

  // Replace OpenGraph & Twitter tags
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(entity.title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(entity.description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:type"[^>]*>/i,
    `<meta property="og:type" content="${entity.kind === 'article' ? 'article' : 'website'}" />`
  );

  const extraHeadTags = [
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(entity.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(entity.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  ].join('\n    ');

  html = html.replace(/<\/head>/i, `    ${extraHeadTags}\n  </head>`);

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
