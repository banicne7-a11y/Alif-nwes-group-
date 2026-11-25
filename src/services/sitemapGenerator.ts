import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

interface SitemapUrlItem {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  title?: string;
  publishedAt?: string;
}

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(raw?: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : new Date().toISOString().slice(0, 10);
}

function toIsoDateTime(raw?: string): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString();
  }
  return new Date().toISOString();
}

function readStringField(fields: Record<string, any> | undefined, key: string): string {
  return fields?.[key]?.stringValue ? String(fields[key].stringValue) : '';
}

async function runFirestoreQuery(structuredQuery: Record<string, any>): Promise<Array<Record<string, any>>> {
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const apiKey = firebaseConfig.apiKey;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents:runQuery?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  });

  if (!res.ok) {
    throw new Error(`Firestore REST query failed (${res.status})`);
  }

  const rows: any[] = await res.json();
  return rows
    .filter((r) => r && r.document && r.document.fields)
    .map((r) => r.document.fields as Record<string, any>);
}

type SitemapDataPayload = {
  posts: SitemapUrlItem[];
  countryEditions: SitemapUrlItem[];
  categories: SitemapUrlItem[];
  pages: SitemapUrlItem[];
};

const SITEMAP_CACHE_TTL_MS = 15 * 60 * 1000;
const cachedSitemapByBase = new Map<string, { expiresAt: number; data: SitemapDataPayload }>();

async function fetchLiveSitemapData(baseUrl: string): Promise<SitemapDataPayload> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const now = Date.now();
  const cached = cachedSitemapByBase.get(cleanBase);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const today = new Date().toISOString().slice(0, 10);

  let postFields: Array<Record<string, any>>;
  let catFields: Array<Record<string, any>>;
  let pageFields: Array<Record<string, any>>;
  try {
    [postFields, catFields, pageFields] = await Promise.all([
      runFirestoreQuery({
        from: [{ collectionId: 'posts' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'EQUAL',
            value: { stringValue: 'published' },
          },
        },
        limit: 500,
      }),
      runFirestoreQuery({
        from: [{ collectionId: 'categories' }],
        limit: 100,
      }).catch(() => []),
      runFirestoreQuery({
        from: [{ collectionId: 'pages' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'EQUAL',
            value: { stringValue: 'published' },
          },
        },
        limit: 100,
      }).catch(() => []),
    ]);
  } catch (err) {
    if (cached) {
      cached.expiresAt = now + 5 * 60 * 1000;
      return cached.data;
    }
    throw err;
  }

  const posts: SitemapUrlItem[] = postFields
    .map<SitemapUrlItem | null>((f) => {
      const slug = readStringField(f, 'slug') || readStringField(f, 'id');
      if (!slug) return null;
      const targetCountry = readStringField(f, 'targetCountry').toLowerCase().trim();
      const postPath =
        targetCountry === 'usa' ||
        targetCountry === 'uk' ||
        targetCountry === 'canada' ||
        targetCountry === 'australia'
          ? `/${targetCountry}/${encodeURIComponent(slug)}`
          : `/news/${encodeURIComponent(slug)}`;
      const updated = readStringField(f, 'updatedAt') || readStringField(f, 'publishedAt');
      const published = readStringField(f, 'publishedAt') || readStringField(f, 'createdAt') || updated;
      return {
        loc: `${cleanBase}${postPath}`,
        lastmod: toIsoDate(updated),
        changefreq: 'hourly',
        priority: '0.9',
        title: readStringField(f, 'title') || slug,
        publishedAt: toIsoDateTime(published),
      };
    })
    .filter((item): item is SitemapUrlItem => item !== null)
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));

  const countryEditions: SitemapUrlItem[] = ['usa', 'uk', 'canada', 'australia'].map((code) => ({
    loc: `${cleanBase}/${code}`,
    lastmod: posts[0]?.lastmod || today,
    changefreq: 'hourly',
    priority: '0.9',
  }));

  const usedCategoryKeys = new Set<string>();
  const derivedCatSlugs: string[] = [];
  for (const f of postFields) {
    const primaryCat = readStringField(f, 'category');
    const arrCats = Array.isArray(f?.categories?.arrayValue?.values)
      ? f.categories.arrayValue.values.map((v: any) => String(v?.stringValue || '').trim()).filter(Boolean)
      : [];
    for (const rawCat of [primaryCat, ...arrCats]) {
      const norm = String(rawCat || '').toLowerCase().trim();
      if (!norm) continue;
      const slug = norm.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      usedCategoryKeys.add(norm);
      if (slug && !usedCategoryKeys.has(slug)) {
        usedCategoryKeys.add(slug);
        derivedCatSlugs.push(slug);
      }
    }
  }

  const matchedFirestoreSlugs = catFields
    .map((f) => ({
      name: readStringField(f, 'name').toLowerCase().trim(),
      slug: readStringField(f, 'slug').toLowerCase().trim().replace(/(^-|-$)/g, ''),
    }))
    .filter((c) => c.slug && (usedCategoryKeys.has(c.name) || usedCategoryKeys.has(c.slug)))
    .map((c) => c.slug);

  const uniqueCatSlugs = Array.from(
    new Set(matchedFirestoreSlugs.length > 0 ? matchedFirestoreSlugs : derivedCatSlugs)
  );

  const categories: SitemapUrlItem[] = uniqueCatSlugs.map((slug) => ({
    loc: `${cleanBase}/category/${encodeURIComponent(slug)}`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.7',
  }));

  const pages: SitemapUrlItem[] = pageFields
    .map((f) => readStringField(f, 'slug'))
    .filter(Boolean)
    .map((slug) => ({
      loc: `${cleanBase}/page/${encodeURIComponent(slug)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.6',
    }));

  const payload: SitemapDataPayload = { posts, countryEditions, categories, pages };
  cachedSitemapByBase.set(cleanBase, {
    expiresAt: now + SITEMAP_CACHE_TTL_MS,
    data: payload,
  });
  return payload;
}

export async function generateStandardSitemapXml(baseUrl: string): Promise<string> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const { posts, countryEditions, categories, pages } = await fetchLiveSitemapData(cleanBase);

  const urls: SitemapUrlItem[] = [
    {
      loc: `${cleanBase}/`,
      lastmod: posts[0]?.lastmod || today,
      changefreq: 'always',
      priority: '1.0',
    },
    ...countryEditions,
    ...posts,
    ...categories,
    ...pages,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export async function generateNewsSitemapXml(baseUrl: string): Promise<string> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const { posts } = await fetchLiveSitemapData(cleanBase);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${posts
  .slice(0, 100)
  .map(
    (p) => `  <url>
    <loc>${escapeXml(p.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>Alif News 24</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(p.publishedAt || new Date().toISOString())}</news:publication_date>
      <news:title>${escapeXml(p.title || 'Breaking News')}</news:title>
    </news:news>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export function generateRobotsTxt(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `User-agent: *
Allow: /
Allow: /api/media
Disallow: /admin/
Disallow: /api/

Sitemap: ${cleanBase}/sitemap.xml
Sitemap: ${cleanBase}/google-news-sitemap.xml
`;
}

let cachedAdsTxt: { expiresAt: number; value: string } | null = null;

export async function generateAdsTxt(): Promise<string> {
  const now = Date.now();
  if (cachedAdsTxt && now < cachedAdsTxt.expiresAt) {
    return cachedAdsTxt.value;
  }

  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const apiKey = firebaseConfig.apiKey;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/config/site_settings?key=${encodeURIComponent(apiKey)}`;

  let clientId = '';
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      if (cachedAdsTxt) return cachedAdsTxt.value;
    } else {
      const docData: any = await res.json();
      clientId = readStringField(docData?.fields, 'adsenseClientId').trim();
    }
  } catch {
    if (cachedAdsTxt) return cachedAdsTxt.value;
  }

  const pubMatch = clientId.match(/(?:ca-)?(pub-\d{10,})/i);
  const pubId = pubMatch ? pubMatch[1].toLowerCase() : '';
  const isPlaceholder = pubId === 'pub-9386736849071234';

  const result =
    !pubId || isPlaceholder
      ? '# Google AdSense Publisher ID is not configured yet.\n# Add your ca-pub-XXXXXXXXXXXXXXXX ID in Admin Panel -> Ad Placements -> AdSense Domain Verification.\n'
      : `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

  if (pubId && !isPlaceholder) {
    cachedAdsTxt = { expiresAt: now + 60 * 60 * 1000, value: result };
  }
  return result;
}

