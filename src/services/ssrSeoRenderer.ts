import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

interface SeoEntity {
  title: string;
  seoTitle?: string;
  subtitle?: string;
  description: string;
  slug: string;
  category?: string;
  tags?: string[];
  image?: string;
  imageAlt?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCardType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  schemaType?: string;
  breadcrumbTitle?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  howToSteps?: Array<{ title: string; description: string }>;
  redirectUrl?: string;
  redirectType?: '301' | '302';
  authorName?: string;
  publishedAt?: string;
  updatedAt?: string;
  contentHtml?: string;
  targetCountry?: string;
  kind: 'article' | 'page';
}

interface RedirectEntry {
  sourcePath: string;
  targetUrl: string;
  type: '301' | '302' | '410';
  active: boolean;
}

interface SiteSeoConfig {
  adsenseClientId: string;
  searchConsoleCode: string;
  googleAnalyticsId: string;
  siteName: string;
  titleSeparator: string;
  homeSeoTitle: string;
  homeSeoDescription: string;
  defaultOgTitle: string;
  defaultOgDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  bingVerificationCode: string;
  yandexVerificationCode: string;
  publisherName: string;
  publisherLogo: string;
  defaultArticleSchema: string;
  defaultRobots: string;
  enableBreadcrumbs: boolean;
  enableOrganizationSchema: boolean;
  noindexSearchResults: boolean;
  seoRedirects: RedirectEntry[];
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
    .replace(
      /\[([^\]\n]+)\]\((https?:\/\/[^\s)&]+(?:&amp;[^\s)]+)*)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(
      /\[([^\]\n]+)\]\((\/[^\s)]+)\)/g,
      '<a href="$2">$1</a>'
    )
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
}

function readStr(fields: Record<string, any> | undefined, key: string): string {
  return fields?.[key]?.stringValue ? String(fields[key].stringValue) : '';
}

function readBool(fields: Record<string, any> | undefined, key: string, fallback: boolean): boolean {
  if (fields?.[key] && typeof fields[key].booleanValue === 'boolean') {
    return fields[key].booleanValue;
  }
  return fallback;
}

function cleanStrayLeadingHash(raw: string): string {
  return String(raw || '').replace(/^#{1,4}(?=[A-Z\u0980-\u09FF][a-zA-Z\u0980-\u09FF\s,.'’-]{15,})/gm, '');
}

const SSR_CAMEL_CASE_WHITELIST = new Set([
  'youtube', 'linkedin', 'paypal', 'github', 'tiktok', 'wordpress', 'javascript',
  'typescript', 'macbook', 'whatsapp', 'playstation', 'powerpoint', 'sharepoint',
  'onedrive', 'cloudflare', 'openai', 'deepmind', 'chatgpt', 'spacex', 'quickbooks',
  'godaddy', 'fedex', 'mastercard', 'blackberry', 'dreamworks', 'soundcloud',
  'jetblue', 'airbnb', 'ebay', 'iphone', 'ipad', 'ios', 'macos', 'tvos', 'watchos',
]);

function splitGluedHeadingLineSsr(line: string): string {
  const m = line.match(/^(#{1,4})\s+(.+)$/);
  if (!m) return line;
  const hashes = m[1];
  const rest = m[2].trim();

  const qMatch = rest.match(/^([^?\n!]{3,115}[?!])([A-Z0-9"“'(\u0980-\u09FF].{12,})$/);
  if (qMatch) {
    return `${hashes} ${qMatch[1].trim()}\n\n${qMatch[2].trim()}`;
  }

  const dupMatch = rest.match(/^(.*?\b([A-Z][a-z]{2,}))(\2\b.{10,})$/);
  if (dupMatch && dupMatch[1].length <= 115) {
    return `${hashes} ${dupMatch[1].trim()}\n\n${dupMatch[3].trim()}`;
  }

  const digitBound = rest.match(/^(.{4,110}?\d)([A-Z][a-z]{1,}\s+.{15,})$/);
  if (digitBound) {
    return `${hashes} ${digitBound[1].trim()}\n\n${digitBound[2].trim()}`;
  }

  const camelRegex = /([a-z]{2,})([A-Z][a-z]{1,}\s+|(?:A|I)\s+[a-z])/g;
  let cm: RegExpExecArray | null;
  while ((cm = camelRegex.exec(rest)) !== null) {
    const splitPos = cm.index + cm[1].length;
    if (splitPos < 4 || splitPos > 120) continue;
    const before = rest.slice(0, splitPos);
    const after = rest.slice(splitPos);
    if (after.length < 20) continue;
    const prevWordMatch = before.match(/([A-Za-z]+)$/);
    const nextWordMatch = after.match(/^([A-Za-z]+)/);
    const combined = `${prevWordMatch?.[1] || ''}${nextWordMatch?.[1] || ''}`.toLowerCase();
    if (SSR_CAMEL_CASE_WHITELIST.has(combined)) continue;
    return `${hashes} ${before.trim()}\n\n${after.trim()}`;
  }

  return line;
}

function expandCollapsedMarkdownSsr(rawText: string): string {
  let text = String(rawText || '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  text = text.replace(/([.!?:)"”])(\|\s*[^|\n]+\|\s*[^|\n]*\|)/g, '$1\n\n$2');
  text = text.replace(/\|\s*\|(?=(?:[-:]{2,}|[^|\n]+\|))/g, '|\n|');

  text = text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        const lastPipe = trimmed.lastIndexOf('|');
        if (lastPipe > 0 && lastPipe < trimmed.length - 1) {
          const tablePart = trimmed.slice(0, lastPipe + 1).trim();
          const trailing = trimmed.slice(lastPipe + 1).trim();
          if (trailing) {
            return `${tablePart}\n\n${trailing}`;
          }
        }
      }
      return line;
    })
    .join('\n');

  text = text.replace(/([^\n#])(#{1,4}\s+)/g, '$1\n\n$2');
  text = text.replace(/([.!?:)"”])(-\s+(?=[A-Z0-9\u0980-\u09FF]))/g, '$1\n\n$2');
  text = text.replace(
    /([a-z0-9)"”])\.(?!\d)(?<!\b(?:Mr|Mrs|Ms|Dr|St|Mt|Prof|Sr|Jr|vs|etc|Fig|No|Vol))(\*?(?:[A-Z][a-z]{1,}|A|I)\s+[a-zA-Z0-9])/g,
    '$1.\n\n$2'
  );

  text = text
    .split('\n')
    .map((line) => splitGluedHeadingLineSsr(line.trim()))
    .join('\n');

  return text;
}

function renderSsrTable(rows: string[][]): string {
  if (!rows || rows.length === 0) return '';
  const [header, ...body] = rows;
  const thead = `<thead><tr>${header.map((c) => `<th style="text-align:left;padding:8px 12px;border-bottom:2px solid #cbd5e1;background:#f8fafc;">${escapeHtml(c)}</th>`).join('')}</tr></thead>`;
  const tbody =
    body.length > 0
      ? `<tbody>${body
          .map(
            (r) =>
              `<tr>${r
                .map((c) => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${renderSafeInlineHtml(c)}</td>`)
                .join('')}</tr>`
          )
          .join('')}</tbody>`
      : '';
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;">${thead}${tbody}</table>`;
}

function isSsrTableLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.indexOf('|', 1) !== -1;
}

function isSsrTableSep(line: string): boolean {
  return /^\|(?:\s*:?-{2,}:?\s*\|)+\s*$/.test(line.trim());
}

function parseSsrTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.replace(/\*\*/g, '').trim());
}

function formatPlainTextHtml(raw: string, articleTitle?: string): string {
  const normTitle = (articleTitle || '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ').trim();
  const expanded = expandCollapsedMarkdownSsr(cleanStrayLeadingHash(raw));
  if (!expanded) return '';

  const chunks = /\n\s*\n/.test(expanded) ? expanded.split(/\n\s*\n+/) : expanded.split(/\n+/);
  const outHtml: string[] = [];

  for (let idx = 0; idx < chunks.length && outHtml.length < 80; idx++) {
    const lines = chunks[idx]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    if (lines.length >= 2 && lines.every(isSsrTableLine)) {
      const rows = lines.filter((l) => !isSsrTableSep(l)).map(parseSsrTableRow).filter((r) => r.length > 0);
      if (rows.length > 0) outHtml.push(renderSsrTable(rows));
      continue;
    }

    if (lines.every((l) => /^([-*•]\s+|\d+[.)]\s+)/.test(l))) {
      const ordered = /^\d+[.)]\s+/.test(lines[0]);
      const tag = ordered ? 'ol' : 'ul';
      const itemsHtml = lines
        .map((l) => `<li>${renderSafeInlineHtml(l.replace(/^([-*•]\s+|\d+[.)]\s+)/, '').trim())}</li>`)
        .join('');
      outHtml.push(`<${tag}>${itemsHtml}</${tag}>`);
      continue;
    }

    const joined = lines.join(' ').trim();
    const hd = joined.match(/^(#{1,4})\s+(.+)$/);
    if (hd) {
      const headingText = hd[2].replace(/\*\*/g, '').trim();
      const normH = headingText.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ').trim();
      if (outHtml.length === 0 && normTitle && (normH === normTitle || normTitle.startsWith(normH) || normH.startsWith(normTitle))) {
        continue;
      }
      const lvl = Math.min(4, Math.max(2, hd[1].length));
      outHtml.push(`<h${lvl}>${escapeHtml(headingText)}</h${lvl}>`);
      continue;
    }

    if (joined.startsWith('> ')) {
      outHtml.push(`<blockquote>${renderSafeInlineHtml(joined.slice(2).trim())}</blockquote>`);
      continue;
    }

    outHtml.push(`<p>${renderSafeInlineHtml(joined)}</p>`);
  }

  return outHtml.join('\n');
}

function readBlocksText(fields: Record<string, any> | undefined, articleTitle?: string): string {
  const arr = fields?.blocks?.arrayValue?.values;
  if (!Array.isArray(arr) || arr.length === 0) return '';
  const normTitle = (articleTitle || '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ').trim();
  const parts: string[] = [];
  for (const item of arr) {
    const mapFields = item?.mapValue?.fields;
    if (!mapFields) continue;
    const type = readStr(mapFields, 'type');

    if (type === 'table') {
      const rowValues = mapFields?.content?.arrayValue?.values;
      if (Array.isArray(rowValues)) {
        const rows: string[][] = rowValues
          .map((rv: any) => {
            const cells = rv?.arrayValue?.values;
            return Array.isArray(cells) ? cells.map((c: any) => String(c?.stringValue || '')) : [];
          })
          .filter((r: string[]) => r.length > 0);
        if (rows.length > 0) parts.push(renderSsrTable(rows));
      }
      continue;
    }

    const content = cleanStrayLeadingHash(readStr(mapFields, 'content'));
    if (!content) continue;
    if (type === 'heading') {
      const cleanHeading = content.replace(/\*\*/g, '').trim();
      const normH = cleanHeading.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ').trim();
      if (parts.length === 0 && normTitle && (normH === normTitle || normTitle.startsWith(normH) || normH.startsWith(normTitle))) continue;
      const levelNum = Number(mapFields?.level?.integerValue || 2);
      const tag = levelNum === 4 ? 'h4' : levelNum === 3 ? 'h3' : 'h2';
      parts.push(`<${tag}>${escapeHtml(cleanHeading)}</${tag}>`);
    } else if (type === 'quote') {
      parts.push(`<blockquote>${renderSafeInlineHtml(content)}</blockquote>`);
    } else if (type === 'paragraph') {
      const formatted = formatPlainTextHtml(content, parts.length === 0 ? articleTitle : undefined);
      if (formatted) parts.push(formatted);
    } else if (type === 'callout') {
      parts.push(`<p>${renderSafeInlineHtml(content)}</p>`);
    }
  }
  return parts.join('\n');
}

const DEFAULT_SOCIAL_IMAGE =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop&q=85&fm=jpg';

const DEFAULT_SITE_CONFIG: SiteSeoConfig = {
  adsenseClientId: '',
  searchConsoleCode: '',
  googleAnalyticsId: '',
  siteName: 'Alif News 24',
  titleSeparator: '|',
  homeSeoTitle: '',
  homeSeoDescription:
    'Around-the-clock independent investigative journalism, US politics, business, tech, sports, and world news.',
  defaultOgTitle: '',
  defaultOgDescription: '',
  defaultOgImage: DEFAULT_SOCIAL_IMAGE,
  twitterHandle: '@AlifNews24',
  bingVerificationCode: '',
  yandexVerificationCode: '',
  publisherName: 'Alif News 24',
  publisherLogo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80',
  defaultArticleSchema: 'NewsArticle',
  defaultRobots: 'index, follow, max-image-preview:large',
  enableBreadcrumbs: true,
  enableOrganizationSchema: true,
  noindexSearchResults: true,
  seoRedirects: [],
};
let cachedSiteConfig: { expiresAt: number; value: SiteSeoConfig } | null = null;
const entityCache = new Map<string, { expiresAt: number; entity: SeoEntity | null }>();
type CountryPostSummary = { title: string; slug: string; excerpt: string; targetCountry: string; featuredImage: string };
const countryPostsCache = new Map<string, { expiresAt: number; items: CountryPostSummary[] }>();

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

  if (!res.ok) {
    throw new Error(`Firestore runQuery failed (${res.status})`);
  }
  const rows: any[] = await res.json();
  return rows
    .filter((r) => r && r.document && r.document.fields)
    .map((r) => r.document.fields as Record<string, any>);
}

async function fetchSiteConfig(): Promise<SiteSeoConfig> {
  const now = Date.now();
  if (cachedSiteConfig && now < cachedSiteConfig.expiresAt) {
    return cachedSiteConfig.value;
  }

  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const apiKey = firebaseConfig.apiKey;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/config/site_settings?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      return cachedSiteConfig?.value || DEFAULT_SITE_CONFIG;
    }
    const docData: any = await res.json();
    const fields = docData?.fields;
    const rankFields = fields?.rankSeo?.mapValue?.fields;
    const rawRedirects = Array.isArray(fields?.seoRedirects?.arrayValue?.values)
      ? fields.seoRedirects.arrayValue.values
          .map((rv: any) => {
            const rf = rv?.mapValue?.fields;
            if (!rf) return null;
            return {
              sourcePath: readStr(rf, 'sourcePath'),
              targetUrl: readStr(rf, 'targetUrl'),
              type: (readStr(rf, 'type') || '301') as '301' | '302' | '410',
              active: readBool(rf, 'active', true),
            };
          })
          .filter((x: RedirectEntry | null): x is RedirectEntry => Boolean(x && x.sourcePath))
      : [];

    const cfg: SiteSeoConfig = {
      adsenseClientId: readStr(fields, 'adsenseClientId').trim(),
      searchConsoleCode: readStr(fields, 'searchConsoleCode').trim(),
      googleAnalyticsId: readStr(fields, 'googleAnalyticsId').trim(),
      siteName: readStr(fields, 'siteName').trim() || 'Alif News 24',
      titleSeparator: readStr(rankFields, 'titleSeparator').trim() || '|',
      homeSeoTitle: readStr(rankFields, 'homeSeoTitle').trim(),
      homeSeoDescription: readStr(rankFields, 'homeSeoDescription').trim() || DEFAULT_SITE_CONFIG.homeSeoDescription,
      defaultOgTitle: readStr(rankFields, 'defaultOgTitle').trim(),
      defaultOgDescription: readStr(rankFields, 'defaultOgDescription').trim(),
      defaultOgImage: readStr(rankFields, 'defaultOgImage').trim() || DEFAULT_SOCIAL_IMAGE,
      twitterHandle: readStr(rankFields, 'twitterHandle').trim() || '@AlifNews24',
      bingVerificationCode: readStr(rankFields, 'bingVerificationCode').trim(),
      yandexVerificationCode: readStr(rankFields, 'yandexVerificationCode').trim(),
      publisherName: readStr(rankFields, 'publisherName').trim() || readStr(fields, 'siteName').trim() || 'Alif News 24',
      publisherLogo: readStr(rankFields, 'publisherLogo').trim() || DEFAULT_SITE_CONFIG.publisherLogo,
      defaultArticleSchema: readStr(rankFields, 'defaultArticleSchema').trim() || 'NewsArticle',
      defaultRobots: readStr(rankFields, 'defaultRobots').trim() || 'index, follow, max-image-preview:large',
      enableBreadcrumbs: readBool(rankFields, 'enableBreadcrumbs', true),
      enableOrganizationSchema: readBool(rankFields, 'enableOrganizationSchema', true),
      noindexSearchResults: readBool(rankFields, 'noindexSearchResults', true),
      seoRedirects: rawRedirects,
    };
    cachedSiteConfig = { expiresAt: now + 5 * 60 * 1000, value: cfg };
    return cfg;
  } catch {
    return cachedSiteConfig?.value || DEFAULT_SITE_CONFIG;
  }
}

export async function resolveSsrRedirect(
  requestPath: string
): Promise<{ status: 301 | 302 | 410; location?: string } | null> {
  const cfg = await fetchSiteConfig();
  const cleanPath = (requestPath || '/').split('?')[0].replace(/\/+$/, '') || '/';
  for (const rule of cfg.seoRedirects) {
    if (!rule.active || !rule.sourcePath) continue;
    const src = rule.sourcePath.trim().replace(/\/+$/, '') || '/';
    const matched = src.endsWith('*')
      ? cleanPath.startsWith(src.slice(0, -1))
      : cleanPath.toLowerCase() === src.toLowerCase();
    if (matched) {
      if (rule.type === '410') {
        return { status: 410 };
      }
      return {
        status: rule.type === '302' ? 302 : 301,
        location: rule.targetUrl || '/',
      };
    }
  }
  return null;
}

async function fetchEntityBySlug(kind: 'article' | 'page', slug: string): Promise<SeoEntity | null> {
  const cacheKey = `${kind}:${slug}`;
  const now = Date.now();
  const cached = entityCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.entity;
  }

  const collectionId = kind === 'article' ? 'posts' : 'pages';
  let docs: Array<Record<string, any>>;
  try {
    docs = await queryFirestore({
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
    });
  } catch {
    return cached?.entity || null;
  }

  if (!docs || docs.length === 0) return null;
  const f = docs[0];
  const title = readStr(f, 'title');
  if (!title) return null;

  const seoFields = f?.seo?.mapValue?.fields;
  const rawContent = readStr(f, 'content');
  const blocksHtml = readBlocksText(f, title);
  const contentHtml = blocksHtml || (rawContent ? formatPlainTextHtml(rawContent, title) : '');
  const description =
    readStr(seoFields, 'description') ||
    readStr(f, 'seoDescription') ||
    readStr(f, 'excerpt') ||
    readStr(f, 'subtitle') ||
    title;

  const tags = Array.isArray(f?.tags?.arrayValue?.values)
    ? f.tags.arrayValue.values.map((t: any) => String(t?.stringValue || '').trim()).filter(Boolean)
    : [];

  const faqItems = Array.isArray(seoFields?.faqItems?.arrayValue?.values)
    ? seoFields.faqItems.arrayValue.values
        .map((fv: any) => {
          const ff = fv?.mapValue?.fields;
          if (!ff) return null;
          const q = readStr(ff, 'question').trim();
          const a = readStr(ff, 'answer').trim();
          return q && a ? { question: q, answer: a } : null;
        })
        .filter((x: any): x is { question: string; answer: string } => Boolean(x))
    : [];

  const howToSteps = Array.isArray(seoFields?.howToSteps?.arrayValue?.values)
    ? seoFields.howToSteps.arrayValue.values
        .map((sv: any) => {
          const sf = sv?.mapValue?.fields;
          if (!sf) return null;
          const t = readStr(sf, 'title').trim();
          const d = readStr(sf, 'description').trim();
          return t ? { title: t, description: d || t } : null;
        })
        .filter((x: any): x is { title: string; description: string } => Boolean(x))
    : [];

  const entity: SeoEntity = {
    kind,
    title,
    seoTitle: readStr(seoFields, 'title') || readStr(f, 'seoTitle'),
    subtitle: readStr(f, 'subtitle'),
    description: description.slice(0, 300),
    slug: readStr(f, 'slug') || slug,
    category: readStr(f, 'category'),
    tags,
    image: readStr(f, 'featuredImage'),
    imageAlt: readStr(seoFields, 'featuredImageAlt') || title,
    ogTitle: readStr(seoFields, 'ogTitle'),
    ogDescription: readStr(seoFields, 'ogDescription'),
    ogImage: readStr(seoFields, 'ogImage'),
    twitterCardType: readStr(seoFields, 'twitterCardType') || 'summary_large_image',
    twitterTitle: readStr(seoFields, 'twitterTitle'),
    twitterDescription: readStr(seoFields, 'twitterDescription'),
    canonicalUrl: readStr(seoFields, 'canonicalUrl'),
    metaRobots: readStr(seoFields, 'metaRobots'),
    schemaType: readStr(seoFields, 'schemaType'),
    breadcrumbTitle: readStr(seoFields, 'breadcrumbTitle'),
    faqItems,
    howToSteps,
    redirectUrl: readStr(seoFields, 'redirectUrl'),
    redirectType: (readStr(seoFields, 'redirectType') || '301') as '301' | '302',
    authorName: readStr(f, 'authorName') || 'Alif News 24 Editorial Desk',
    publishedAt: readStr(f, 'publishedAt') || readStr(f, 'createdAt'),
    updatedAt: readStr(f, 'updatedAt'),
    contentHtml,
    targetCountry: readStr(f, 'targetCountry').toLowerCase().trim(),
  };

  if (entityCache.size > 150) {
    const oldestKey = entityCache.keys().next().value;
    if (oldestKey) entityCache.delete(oldestKey);
  }
  entityCache.set(cacheKey, { expiresAt: now + 5 * 60 * 1000, entity });
  return entity;
}

export async function getEntityRedirectIfAny(
  type: 'article' | 'page',
  slug: string
): Promise<{ status: 301 | 302; location: string } | null> {
  const entity = await fetchEntityBySlug(type, slug);
  if (entity?.redirectUrl?.trim()) {
    return {
      status: entity.redirectType === '302' ? 302 : 301,
      location: entity.redirectUrl.trim(),
    };
  }
  return null;
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

function resolveAbsoluteSocialImage(rawImg: string, cleanBase: string, fallbackImg?: string): string {
  const trimmed = String(rawImg || '').trim();
  const abs = trimmed.startsWith('/') ? `${cleanBase}${trimmed}` : trimmed;
  if (abs && !abs.startsWith('data:')) {
    return abs;
  }
  return fallbackImg || DEFAULT_SOCIAL_IMAGE;
}

function injectSocialMetaTags(
  inputHtml: string,
  params: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage: string;
    ogImageAlt?: string;
    ogType: 'website' | 'article';
    robots: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterHandle?: string;
  }
): string {
  let out = inputHtml;
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  out = out.replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, '');
  out = out.replace(/<meta\s+property=["']og:(?:url|title|description|type|image|image:width|image:height|image:alt)["'][^>]*>\s*/gi, '');
  out = out.replace(/<meta\s+name=["']twitter:(?:card|site|title|description|image)["'][^>]*>\s*/gi, '');

  const ogTitle = params.ogTitle || params.title;
  const ogDesc = params.ogDescription || params.description;
  const twTitle = params.twitterTitle || ogTitle;
  const twDesc = params.twitterDescription || ogDesc;

  const tags = [
    `<link rel="canonical" href="${escapeHtml(params.canonicalUrl)}" />`,
    `<meta name="robots" content="${escapeHtml(params.robots)}" />`,
    `<meta property="og:url" content="${escapeHtml(params.canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(ogDesc)}" />`,
    `<meta property="og:type" content="${params.ogType}" />`,
    `<meta property="og:image" content="${escapeHtml(params.ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(params.ogImageAlt || ogTitle)}" />`,
    `<meta name="twitter:card" content="${escapeHtml(params.twitterCard || 'summary_large_image')}" />`,
    ...(params.twitterHandle ? [`<meta name="twitter:site" content="${escapeHtml(params.twitterHandle)}" />`] : []),
    `<meta name="twitter:title" content="${escapeHtml(twTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(twDesc)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(params.ogImage)}" />`,
  ].join('\n    ');

  return out.replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

async function fetchCountryPosts(country: string): Promise<CountryPostSummary[]> {
  const now = Date.now();
  const cached = countryPostsCache.get(country);
  if (cached && now < cached.expiresAt) {
    return cached.items;
  }

  let docs: Array<Record<string, any>>;
  try {
    docs = await queryFirestore({
      from: [{ collectionId: 'posts' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: 'published' },
        },
      },
      limit: 30,
    });
  } catch {
    return cached?.items || [];
  }

  const items = docs
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
    .slice(0, 20)
    .map(({ title, slug, excerpt, targetCountry, featuredImage }) => ({
      title,
      slug,
      excerpt,
      targetCountry,
      featuredImage,
    }));

  countryPostsCache.set(country, { expiresAt: now + 10 * 60 * 1000, items });
  return items;
}

export async function injectSeoIntoHtml(
  templateHtml: string,
  options: {
    type: 'article' | 'page' | 'country' | 'home';
    slug?: string;
    country?: string;
    baseUrl: string;
    isSearchQuery?: boolean;
  }
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

  // Inject Google, Bing, Yandex verification tags
  const pubMatch = siteCfg.adsenseClientId.match(/(?:ca-)?(pub-\d{10,})/i);
  const adsenseId = pubMatch ? `ca-${pubMatch[1].toLowerCase()}` : '';
  const isRealAdSense = Boolean(adsenseId && adsenseId !== 'ca-pub-9386736849071234');

  if (siteCfg.searchConsoleCode) {
    html = html.replace(
      /<meta\s+name="google-site-verification"[^>]*>/i,
      `<meta name="google-site-verification" content="${escapeHtml(siteCfg.searchConsoleCode)}" id="google-site-verification" />`
    );
  }
  if (siteCfg.bingVerificationCode) {
    html = html.replace(
      /<\/head>/i,
      `    <meta name="msvalidate.01" content="${escapeHtml(siteCfg.bingVerificationCode)}" />\n  </head>`
    );
  }
  if (siteCfg.yandexVerificationCode) {
    html = html.replace(
      /<\/head>/i,
      `    <meta name="yandex-verification" content="${escapeHtml(siteCfg.yandexVerificationCode)}" />\n  </head>`
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
        `<script data-alif-ga-init="true">window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('js',new Date());if(!window.location.pathname.startsWith('/admin')){gtag('config','${escapeHtml(gaId)}');}</script>`
      );
    } else {
      const gaTag = `<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}" data-alif-ga="true"></script>\n    <script data-alif-ga-init="true">window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('js',new Date());if(!window.location.pathname.startsWith('/admin')){gtag('config','${escapeHtml(gaId)}');}</script>`;
      html = html.replace(/<\/head>/i, `    ${gaTag}\n  </head>`);
    }
  }

  const defaultRobots =
    options.isSearchQuery && siteCfg.noindexSearchResults
      ? 'noindex, follow'
      : siteCfg.defaultRobots || 'index, follow, max-image-preview:large';

  if (options.type === 'home') {
    const homeTitle = siteCfg.homeSeoTitle || `${siteCfg.siteName} - America's 24/7 Live News Portal`;
    const homeDesc = siteCfg.homeSeoDescription;
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(homeTitle)}</title>`);
    html = html.replace(
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${escapeHtml(homeDesc)}" />`
    );
    html = injectSocialMetaTags(html, {
      title: homeTitle,
      description: homeDesc,
      canonicalUrl: `${cleanBase}/`,
      ogTitle: siteCfg.defaultOgTitle || homeTitle,
      ogDescription: siteCfg.defaultOgDescription || homeDesc,
      ogImage: siteCfg.defaultOgImage,
      ogType: 'website',
      robots: defaultRobots,
      twitterHandle: siteCfg.twitterHandle,
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
    const fullTitle = `${meta.title} ${siteCfg.titleSeparator} ${siteCfg.siteName}`;
    const leadPostImage = countryPosts.find((p) => p.featuredImage && !p.featuredImage.startsWith('data:'))?.featuredImage || '';
    const countryOgImage = resolveAbsoluteSocialImage(leadPostImage, cleanBase, siteCfg.defaultOgImage);

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
      robots: defaultRobots,
      twitterHandle: siteCfg.twitterHandle,
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

  const defaultCanonical =
    entity.kind === 'article'
      ? effectiveCountry
        ? `${cleanBase}/${effectiveCountry}/${encodeURIComponent(entity.slug)}`
        : `${cleanBase}/news/${encodeURIComponent(entity.slug)}`
      : `${cleanBase}/page/${encodeURIComponent(entity.slug)}`;

  const canonicalUrl = entity.canonicalUrl?.trim() || defaultCanonical;
  const pageTitleCore = entity.seoTitle?.trim() || entity.title;
  const fullTitle = `${pageTitleCore} ${siteCfg.titleSeparator} ${siteCfg.siteName}`;
  const ogImage = resolveAbsoluteSocialImage(entity.ogImage || entity.image || '', cleanBase, siteCfg.defaultOgImage);
  const robots = entity.metaRobots?.trim() || defaultRobots;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(entity.description)}" />`
  );

  html = injectSocialMetaTags(html, {
    title: pageTitleCore,
    description: entity.description,
    canonicalUrl,
    ogTitle: entity.ogTitle || pageTitleCore,
    ogDescription: entity.ogDescription || entity.description,
    ogImage,
    ogImageAlt: entity.imageAlt || entity.title,
    ogType: entity.kind === 'article' ? 'article' : 'website',
    robots,
    twitterCard: entity.twitterCardType || 'summary_large_image',
    twitterTitle: entity.twitterTitle || entity.ogTitle || pageTitleCore,
    twitterDescription: entity.twitterDescription || entity.ogDescription || entity.description,
    twitterHandle: siteCfg.twitterHandle,
  });

  // Build Rank SEO @graph JSON-LD Schema.org payload
  let jsonLd: Record<string, any>;
  if (entity.kind === 'article') {
    const graph: Array<Record<string, any>> = [];
    if (siteCfg.enableOrganizationSchema) {
      graph.push({
        '@type': 'NewsMediaOrganization',
        '@id': `${cleanBase}/#organization`,
        name: siteCfg.publisherName || siteCfg.siteName,
        url: cleanBase,
        logo: {
          '@type': 'ImageObject',
          url: siteCfg.publisherLogo,
        },
      });
    }

    const schemaType = entity.schemaType || siteCfg.defaultArticleSchema || 'NewsArticle';
    if (schemaType === 'HowTo' && entity.howToSteps && entity.howToSteps.length > 0) {
      graph.push({
        '@type': 'HowTo',
        name: pageTitleCore,
        description: entity.description,
        image: [ogImage],
        step: entity.howToSteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.description,
        })),
      });
    } else {
      graph.push({
        '@type': schemaType === 'FAQPage' || schemaType === 'HowTo' ? 'NewsArticle' : schemaType,
        headline: pageTitleCore,
        description: entity.description,
        image: [ogImage],
        datePublished: entity.publishedAt || undefined,
        dateModified: entity.updatedAt || entity.publishedAt || undefined,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        articleSection: entity.category || 'News',
        keywords: (entity.tags || []).join(', ') || undefined,
        author: [
          {
            '@type': 'Person',
            name: entity.authorName || siteCfg.siteName,
          },
        ],
        publisher: {
          '@id': `${cleanBase}/#organization`,
        },
      });
    }

    if (siteCfg.enableBreadcrumbs) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${cleanBase}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: effectiveCountry ? effectiveCountry.toUpperCase() : 'News',
            item: effectiveCountry ? `${cleanBase}/${effectiveCountry}` : `${cleanBase}/`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: entity.breadcrumbTitle || entity.category || entity.title,
            item: canonicalUrl,
          },
        ],
      });
    }

    if (entity.faqItems && entity.faqItems.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: entity.faqItems.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      });
    }

    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': graph,
    };
  } else {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitleCore,
      description: entity.description,
      url: canonicalUrl,
    };
  }

  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">\n    ${JSON.stringify(jsonLd)}\n    </script>`
  );

  const faqHtml =
    entity.faqItems && entity.faqItems.length > 0
      ? `<section style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;"><h2 style="font-size:20px;margin-bottom:12px;">Frequently Asked Questions</h2>${entity.faqItems
          .map(
            (f) =>
              `<details style="margin-bottom:10px;"><summary style="font-weight:700;">${escapeHtml(
                f.question
              )}</summary><p style="margin-top:6px;color:#334155;">${escapeHtml(f.answer)}</p></details>`
          )
          .join('')}</section>`
      : '';

  const preRenderedBody = `
    <div id="root">
      <main style="max-width:760px;margin:40px auto;padding:0 20px;font-family:Georgia,serif;color:#0f172a;line-height:1.7;">
        <article>
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#dc2626;font-weight:700;">${escapeHtml(siteCfg.siteName)}</p>
          <h1 style="font-size:32px;line-height:1.25;margin:10px 0 14px;">${escapeHtml(entity.title)}</h1>
          ${entity.subtitle ? `<p style="font-size:18px;color:#475569;margin-bottom:20px;">${escapeHtml(entity.subtitle)}</p>` : ''}
          ${entity.image ? `<img src="${escapeHtml(entity.image)}" alt="${escapeHtml(entity.imageAlt || entity.title)}" style="max-width:100%;height:auto;border-radius:12px;margin-bottom:24px;" />` : ''}
          <div>${entity.contentHtml || `<p>${escapeHtml(entity.description)}</p>`}</div>
          ${faqHtml}
        </article>
      </main>
    </div>`;

  html = html.replace(/<div\s+id="root"\s*><\/div>/i, preRenderedBody);

  return html;
}
