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

async function fetchLiveSitemapData(baseUrl: string): Promise<{
  posts: SitemapUrlItem[];
  categories: SitemapUrlItem[];
  pages: SitemapUrlItem[];
}> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const today = new Date().toISOString().slice(0, 10);

  const [postFields, catFields, pageFields] = await Promise.all([
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
    }).catch(() => []),
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

  const posts: SitemapUrlItem[] = postFields
    .map<SitemapUrlItem | null>((f) => {
      const slug = readStringField(f, 'slug') || readStringField(f, 'id');
      if (!slug) return null;
      const updated = readStringField(f, 'updatedAt') || readStringField(f, 'publishedAt');
      const published = readStringField(f, 'publishedAt') || readStringField(f, 'createdAt') || updated;
      return {
        loc: `${cleanBase}/news/${encodeURIComponent(slug)}`,
        lastmod: toIsoDate(updated),
        changefreq: 'hourly',
        priority: '0.9',
        title: readStringField(f, 'title') || slug,
        publishedAt: toIsoDateTime(published),
      };
    })
    .filter((item): item is SitemapUrlItem => item !== null)
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));

  const categories: SitemapUrlItem[] = (catFields.length > 0
    ? catFields.map((f) => readStringField(f, 'slug')).filter(Boolean)
    : ['business', 'politics', 'health', 'sports', 'travels', 'familys', 'science', 'technology', 'religion']
  ).map((slug) => ({
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

  return { posts, categories, pages };
}

export async function generateStandardSitemapXml(baseUrl: string): Promise<string> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const { posts, categories, pages } = await fetchLiveSitemapData(cleanBase);

  const urls: SitemapUrlItem[] = [
    {
      loc: `${cleanBase}/`,
      lastmod: posts[0]?.lastmod || today,
      changefreq: 'always',
      priority: '1.0',
    },
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
Disallow: /admin/
Disallow: /api/

Sitemap: ${cleanBase}/sitemap.xml
Sitemap: ${cleanBase}/google-news-sitemap.xml
`;
}
