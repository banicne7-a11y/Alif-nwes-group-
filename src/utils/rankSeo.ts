import { EditorBlock, Post, RankSeoSettings } from '../types';
import { getPostPublicPath } from './countryEditions';

export interface RankSeoCheckItem {
  id: string;
  category: 'basic' | 'additional' | 'titleReadability' | 'contentReadability';
  label: string;
  passed: boolean;
  partial?: boolean;
  points: number;
  maxPoints: number;
  tip: string;
}

export interface RankSeoAuditResult {
  score: number;
  grade: 'optimal' | 'good' | 'needs_work';
  passedCount: number;
  totalChecks: number;
  categories: {
    basic: { score: number; max: number; passed: number; total: number };
    additional: { score: number; max: number; passed: number; total: number };
    titleReadability: { score: number; max: number; passed: number; total: number };
    contentReadability: { score: number; max: number; passed: number; total: number };
  };
  checks: RankSeoCheckItem[];
  stats: {
    wordCount: number;
    headingCount: number;
    paragraphCount: number;
    avgParagraphWords: number;
    internalLinksCount: number;
    externalLinksCount: number;
    keywordDensity: number;
    slugLength: number;
    readingTimeMinutes: number;
  };
}

export interface InternalLinkSuggestion {
  postId: string;
  title: string;
  url: string;
  category: string;
  matchedTerms: string[];
  relevanceScore: number;
}

export const DEFAULT_RANK_SEO_SETTINGS: RankSeoSettings = {
  titleSeparator: '|',
  homeSeoTitle: "Alif News 24 - America's 24/7 Live News Portal",
  homeSeoDescription:
    'Alif News 24 delivers independent breaking news, US politics, Wall Street markets, technology, science, sports, and global investigative coverage 24/7.',
  defaultOgTitle: "Alif News 24 - America's 24/7 Live Breaking News & Analysis",
  defaultOgDescription:
    'Around-the-clock independent investigative journalism, US politics, business, tech, sports, and global dispatches.',
  defaultOgImage:
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop&q=85&fm=jpg',
  twitterHandle: '@AlifNews24',
  bingVerificationCode: '',
  yandexVerificationCode: '',
  publisherName: 'Alif News 24',
  publisherLogo:
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80',
  defaultArticleSchema: 'NewsArticle',
  defaultRobots: 'index, follow, max-image-preview:large',
  enableBreadcrumbs: true,
  enableOrganizationSchema: true,
  enableImageSitemap: true,
  enableFaqSchema: true,
  noindexSearchResults: true,
  noindexEmptyArchives: true,
  autoInternalLinking: true,
  indexNowKey: 'alifnews24-indexnow-9f8d7c6b5a4e3d2c',
  modules: {
    seoAnalysis: true,
    schemaGenerator: true,
    sitemaps: true,
    redirections: true,
    instantIndexing: true,
    linkSuggestions: true,
    imageSeo: true,
    breadcrumbs: true,
    robotsEditor: true,
  },
};

const POWER_AND_SENTIMENT_WORDS = [
  'breaking', 'exclusive', 'shocking', 'verified', 'crisis', 'surge', 'update',
  'essential', 'top', 'latest', 'major', 'warning', 'secret', 'proven', 'guide',
  'analysis', 'report', 'best', 'how', 'why', 'record', 'massive', 'critical',
  'explosive', 'official', 'urgent', 'revealed', 'insider', 'complete', 'ultimate',
  'explained', 'live', 'real', 'impact', 'win', 'victory', 'historic', 'forecast',
];

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'among', 'another', 'around', 'because',
  'before', 'being', 'between', 'could', 'during', 'every', 'first', 'found',
  'from', 'have', 'here', 'into', 'just', 'like', 'more', 'most', 'much', 'must',
  'never', 'news', 'only', 'other', 'over', 'really', 'report', 'said', 'says',
  'should', 'since', 'some', 'such', 'than', 'that', 'their', 'them', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'today', 'under', 'until',
  'update', 'very', 'want', 'well', 'were', 'what', 'when', 'where', 'which',
  'while', 'will', 'with', 'would', 'your',
]);

/**
 * Cleanly truncates text at a word boundary without cutting words in half.
 */
export function smartExcerpt(raw: string, maxLen = 160): string {
  const clean = String(raw || '')
    .replace(/^#+\s*/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > Math.floor(maxLen * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.replace(/[,;:\-]+$/, '')}...`;
}

export function normalizeSlug(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/(^-|-$)/g, '');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractBodyText(blocks?: EditorBlock[], content?: string): string {
  const fromBlocks = Array.isArray(blocks)
    ? blocks
        .map((b) => {
          if (!b) return '';
          if (typeof b.content === 'string') return b.content;
          if (Array.isArray(b.content)) {
            return b.content.map((row) => (Array.isArray(row) ? row.join(' ') : String(row))).join(' ');
          }
          return '';
        })
        .filter(Boolean)
        .join('\n\n')
    : '';
  return fromBlocks.trim() || String(content || '').trim();
}

function extractLinks(raw: string): { internal: string[]; external: string[] } {
  const internal: string[] = [];
  const external: string[] = [];

  const mdRegex = /\[[^\]]+\]\(([^)\s]+)\)/g;
  const htmlRegex = /href=["']([^"']+)["']/gi;
  const bareUrlRegex = /(?<![("'=])https?:\/\/[^\s<>"')]+/gi;

  const classify = (href: string) => {
    const clean = href.trim();
    if (!clean) return;
    if (
      clean.startsWith('/') ||
      clean.includes('official1.online') ||
      clean.includes('alifnews24.com')
    ) {
      internal.push(clean);
    } else if (clean.startsWith('http://') || clean.startsWith('https://')) {
      external.push(clean);
    }
  };

  let m: RegExpExecArray | null;
  while ((m = mdRegex.exec(raw)) !== null) classify(m[1]);
  while ((m = htmlRegex.exec(raw)) !== null) classify(m[1]);
  while ((m = bareUrlRegex.exec(raw)) !== null) classify(m[0]);

  return {
    internal: Array.from(new Set(internal)),
    external: Array.from(new Set(external)),
  };
}

export function analyzePostRankSeo(input: {
  title?: string;
  subtitle?: string;
  slug?: string;
  content?: string;
  blocks?: EditorBlock[];
  featuredImage?: string;
  featuredImageAlt?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
}): RankSeoAuditResult {
  const title = String(input.title || '').trim();
  const seoTitle = String(input.seoTitle || title).trim();
  const seoDesc = String(input.seoDescription || '').trim();
  const slug = String(input.slug || normalizeSlug(title)).trim();
  const focusKeyword = String(input.focusKeyword || '').trim();
  const cleanKey = focusKeyword.toLowerCase();
  const slugKey = cleanKey.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const bodyRaw = extractBodyText(input.blocks, input.content);
  const fullPlain = `${title} ${input.subtitle || ''} ${bodyRaw}`
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[#*`>_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = fullPlain ? fullPlain.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const bodyLower = bodyRaw.toLowerCase();
  const firstTenPercentEnd = Math.max(220, Math.floor(bodyLower.length * 0.15));
  const introText = `${(input.subtitle || '').toLowerCase()} ${bodyLower.slice(0, firstTenPercentEnd)}`;

  // Extract headings from blocks and markdown lines
  const blockHeadings = (input.blocks || [])
    .filter((b) => b.type === 'heading' && typeof b.content === 'string')
    .map((b) => String(b.content).trim());
  const markdownHeadings = Array.from(bodyRaw.matchAll(/^#{2,4}\s+(.+)$/gm)).map((m) => m[1].trim());
  const allHeadings = Array.from(new Set([...blockHeadings, ...markdownHeadings]));
  const headingCount = allHeadings.length;

  // Paragraph length analysis
  const paragraphs = bodyRaw
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p && !/^#{1,4}\s+/.test(p));
  const paragraphCount = paragraphs.length;
  const paragraphWordCounts = paragraphs.map((p) => p.split(/\s+/).filter(Boolean).length);
  const avgParagraphWords =
    paragraphCount > 0
      ? Math.round(paragraphWordCounts.reduce((acc, n) => acc + n, 0) / paragraphCount)
      : 0;
  const shortParagraphsOk = paragraphCount > 0 && avgParagraphWords <= 120;

  // Links detection
  const links = extractLinks(bodyRaw);
  const internalLinksCount = links.internal.length;
  const externalLinksCount = links.external.length;

  // Keyword density
  let keywordOccurrences = 0;
  if (cleanKey) {
    const kwRegex = new RegExp(escapeRegex(cleanKey), 'gi');
    const matches = fullPlain.match(kwRegex);
    keywordOccurrences = matches ? matches.length : 0;
  }
  const kwWordCount = cleanKey ? cleanKey.split(/\s+/).filter(Boolean).length : 1;
  const keywordDensity =
    wordCount > 0 && keywordOccurrences > 0
      ? Number((((keywordOccurrences * kwWordCount) / wordCount) * 100).toFixed(2))
      : 0;

  // Image / Media detection
  const hasVisualMedia = Boolean(
    (input.featuredImage && input.featuredImage.trim()) ||
      (input.blocks || []).some((b) => b.type === 'image' || b.type === 'video' || b.type === 'table')
  );
  const imageAltText = String(input.featuredImageAlt || '').toLowerCase();
  const captionText = (input.blocks || [])
    .map((b) => String(b.caption || '').toLowerCase())
    .join(' ');
  const keywordInAlt = Boolean(cleanKey && (imageAltText.includes(cleanKey) || captionText.includes(cleanKey)));

  // Title readability checks
  const seoTitleLower = seoTitle.toLowerCase();
  const titleKwPos = cleanKey ? seoTitleLower.indexOf(cleanKey) : -1;
  const keywordNearStart =
    titleKwPos !== -1 && titleKwPos <= Math.max(25, Math.floor(seoTitleLower.length * 0.5));
  const hasPowerWord = POWER_AND_SENTIMENT_WORDS.some((w) =>
    new RegExp(`\\b${escapeRegex(w)}\\b`, 'i').test(seoTitle)
  );
  const hasNumberInTitle = /\d+/.test(seoTitle);

  const keywordInTitle = Boolean(cleanKey && seoTitleLower.includes(cleanKey));
  const keywordInDesc = Boolean(cleanKey && seoDesc.toLowerCase().includes(cleanKey));
  const keywordInSlug = Boolean(
    cleanKey &&
      (slug.toLowerCase().includes(slugKey) ||
        slugKey
          .split('-')
          .filter((p) => p.length > 2)
          .every((part) => slug.toLowerCase().includes(part)))
  );
  const keywordInIntro = Boolean(cleanKey && introText.includes(cleanKey));
  const keywordInBody = Boolean(cleanKey && bodyLower.includes(cleanKey));
  const keywordInHeading = Boolean(
    cleanKey && allHeadings.some((h) => h.toLowerCase().includes(cleanKey))
  );

  const checks: RankSeoCheckItem[] = [
    // 1. BASIC SEO (45 points)
    {
      id: 'kw-title',
      category: 'basic',
      label: 'Focus Keyword in SEO Title',
      passed: keywordInTitle,
      points: keywordInTitle ? 10 : 0,
      maxPoints: 10,
      tip: cleanKey
        ? keywordInTitle
          ? `Great! "${focusKeyword}" appears in your SEO title.`
          : `Add "${focusKeyword}" to the SEO title for stronger relevance.`
        : 'Set a Focus Keyword first.',
    },
    {
      id: 'kw-meta-desc',
      category: 'basic',
      label: 'Focus Keyword in Meta Description & Optimal Length',
      passed: keywordInDesc && seoDesc.length >= 100 && seoDesc.length <= 165,
      partial: !keywordInDesc && seoDesc.length >= 100 && seoDesc.length <= 165,
      points:
        keywordInDesc && seoDesc.length >= 100 && seoDesc.length <= 165
          ? 8
          : seoDesc.length >= 90
          ? 4
          : 0,
      maxPoints: 8,
      tip: `Length: ${seoDesc.length}/160 chars. Aim for 120–160 chars containing your focus keyword.`,
    },
    {
      id: 'kw-slug',
      category: 'basic',
      label: 'Focus Keyword in URL Permalink',
      passed: keywordInSlug,
      points: keywordInSlug ? 7 : 0,
      maxPoints: 7,
      tip: `Slug "${slug || 'none'}" should include "${slugKey || 'your-keyword'}".`,
    },
    {
      id: 'kw-intro',
      category: 'basic',
      label: 'Focus Keyword in First 15% of Content',
      passed: keywordInIntro,
      points: keywordInIntro ? 8 : 0,
      maxPoints: 8,
      tip: 'Use your focus keyword in the opening lead paragraph or subtitle.',
    },
    {
      id: 'kw-body',
      category: 'basic',
      label: 'Focus Keyword Used Naturally in Body',
      passed: keywordInBody,
      points: keywordInBody ? 6 : 0,
      maxPoints: 6,
      tip: `Found ${keywordOccurrences} total mention(s) of the focus keyword.`,
    },
    {
      id: 'word-count',
      category: 'basic',
      label: 'Content Length (600+ Words Recommended)',
      passed: wordCount >= 600,
      partial: wordCount >= 300 && wordCount < 600,
      points: wordCount >= 600 ? 6 : wordCount >= 300 ? 3 : 0,
      maxPoints: 6,
      tip: `Current count: ${wordCount} words (${readingTimeMinutes} min read). In-depth 600+ word reports rank higher.`,
    },

    // 2. ADDITIONAL SEO (30 points)
    {
      id: 'kw-subheading',
      category: 'additional',
      label: 'Focus Keyword in H2 / H3 Subheadings',
      passed: keywordInHeading,
      points: keywordInHeading ? 5 : 0,
      maxPoints: 5,
      tip: 'Add at least one H2 or H3 subheading containing your focus keyword.',
    },
    {
      id: 'kw-alt',
      category: 'additional',
      label: 'Image Alt Text Configured with Focus Keyword',
      passed: keywordInAlt,
      partial: Boolean(input.featuredImageAlt?.trim()) && !keywordInAlt,
      points: keywordInAlt ? 4 : input.featuredImageAlt?.trim() ? 2 : 0,
      maxPoints: 4,
      tip: 'Set Featured Image Alt Text with your focus keyword for Google Discover & Image SEO.',
    },
    {
      id: 'kw-density',
      category: 'additional',
      label: 'Healthy Keyword Density (0.5% – 2.5%)',
      passed: keywordDensity >= 0.4 && keywordDensity <= 2.6,
      points: keywordDensity >= 0.4 && keywordDensity <= 2.6 ? 5 : keywordDensity > 0 ? 2 : 0,
      maxPoints: 5,
      tip: `Current keyword density is ${keywordDensity}% (aim for 0.5% to 2.5% to avoid stuffing).`,
    },
    {
      id: 'short-url',
      category: 'additional',
      label: 'Short, Clean URL Slug (<= 75 chars)',
      passed: slug.length > 0 && slug.length <= 75,
      points: slug.length > 0 && slug.length <= 75 ? 4 : 0,
      maxPoints: 4,
      tip: `Current URL slug length: ${slug.length} chars.`,
    },
    {
      id: 'internal-links',
      category: 'additional',
      label: 'Internal Links to Your Own Articles',
      passed: internalLinksCount >= 1,
      points: internalLinksCount >= 1 ? 4 : 0,
      maxPoints: 4,
      tip: `${internalLinksCount} internal link(s) detected. Use the Internal Link Suggester to connect related news.`,
    },
    {
      id: 'external-links',
      category: 'additional',
      label: 'Outbound Reference / Citation Links',
      passed: externalLinksCount >= 1,
      points: externalLinksCount >= 1 ? 4 : 0,
      maxPoints: 4,
      tip: `${externalLinksCount} external source link(s) found. Citing authoritative sources boosts E-E-A-T trust.`,
    },
    {
      id: 'tags-secondary',
      category: 'additional',
      label: 'Related Keywords & News Tags (3+ Tags)',
      passed: (input.tags || []).length >= 3 || (input.secondaryKeywords || []).length >= 2,
      points: (input.tags || []).length >= 3 || (input.secondaryKeywords || []).length >= 2 ? 4 : 0,
      maxPoints: 4,
      tip: `${(input.tags || []).length} news tag(s) and ${(input.secondaryKeywords || []).length} secondary keyword(s) set.`,
    },

    // 3. TITLE READABILITY (15 points)
    {
      id: 'title-kw-start',
      category: 'titleReadability',
      label: 'Focus Keyword Near Beginning of Title',
      passed: keywordNearStart,
      points: keywordNearStart ? 5 : 0,
      maxPoints: 5,
      tip: 'Front-load your focus keyword within the first half of the headline.',
    },
    {
      id: 'title-power',
      category: 'titleReadability',
      label: 'High-CTR Power or News Word in Headline',
      passed: hasPowerWord,
      points: hasPowerWord ? 5 : 0,
      maxPoints: 5,
      tip: 'Words like Update, Report, Analysis, Latest, Breaking, Why, or Guide lift click-through rate.',
    },
    {
      id: 'title-number',
      category: 'titleReadability',
      label: 'Title Contains a Year or Specific Number',
      passed: hasNumberInTitle,
      points: hasNumberInTitle ? 5 : 0,
      maxPoints: 5,
      tip: 'Including 2026 or exact figures increases Google CTR.',
    },

    // 4. CONTENT READABILITY (10 points)
    {
      id: 'content-headings',
      category: 'contentReadability',
      label: 'Structured Section Subheadings (2+ Headings)',
      passed: headingCount >= 2,
      partial: headingCount === 1,
      points: headingCount >= 2 ? 4 : headingCount === 1 ? 2 : 0,
      maxPoints: 4,
      tip: `${headingCount} subheading(s) found. Break long stories into clear H2/H3 sections.`,
    },
    {
      id: 'content-paragraphs',
      category: 'contentReadability',
      label: 'Short, Scannable Paragraphs (Avg <= 120 words)',
      passed: shortParagraphsOk,
      points: shortParagraphsOk ? 3 : 0,
      maxPoints: 3,
      tip: `Average paragraph length: ${avgParagraphWords} words across ${paragraphCount} paragraph(s).`,
    },
    {
      id: 'content-media',
      category: 'contentReadability',
      label: 'Featured Image or Data Visual Included',
      passed: hasVisualMedia,
      points: hasVisualMedia ? 3 : 0,
      maxPoints: 3,
      tip: 'Images and tables keep readers engaged and qualify for Google Discover large thumbnails.',
    },
  ];

  const sumCategory = (cat: RankSeoCheckItem['category']) => {
    const items = checks.filter((c) => c.category === cat);
    return {
      score: items.reduce((s, c) => s + c.points, 0),
      max: items.reduce((s, c) => s + c.maxPoints, 0),
      passed: items.filter((c) => c.passed).length,
      total: items.length,
    };
  };

  const basic = sumCategory('basic');
  const additional = sumCategory('additional');
  const titleReadability = sumCategory('titleReadability');
  const contentReadability = sumCategory('contentReadability');

  const rawTotal = basic.score + additional.score + titleReadability.score + contentReadability.score;
  const maxTotal = basic.max + additional.max + titleReadability.max + contentReadability.max;
  const normalizedScore = maxTotal > 0 ? Math.min(100, Math.round((rawTotal / maxTotal) * 100)) : 0;

  return {
    score: normalizedScore,
    grade: normalizedScore >= 81 ? 'optimal' : normalizedScore >= 60 ? 'good' : 'needs_work',
    passedCount: checks.filter((c) => c.passed).length,
    totalChecks: checks.length,
    categories: {
      basic,
      additional,
      titleReadability,
      contentReadability,
    },
    checks,
    stats: {
      wordCount,
      headingCount,
      paragraphCount,
      avgParagraphWords,
      internalLinksCount,
      externalLinksCount,
      keywordDensity,
      slugLength: slug.length,
      readingTimeMinutes,
    },
  };
}

export function auditPostObject(post: Post, allPosts?: Post[]): RankSeoAuditResult {
  void allPosts;
  return analyzePostRankSeo({
    title: post.title,
    subtitle: post.subtitle,
    slug: post.slug,
    content: post.content,
    blocks: post.blocks,
    featuredImage: post.featuredImage,
    featuredImageAlt: post.seo?.featuredImageAlt || post.title,
    tags: post.tags,
    seoTitle: post.seo?.title || post.title,
    seoDescription: post.seo?.description || post.excerpt,
    focusKeyword: post.seo?.focusKeyword,
    secondaryKeywords: post.seo?.secondaryKeywords,
  });
}

export function suggestInternalLinks(
  currentPostId: string | undefined,
  title: string,
  content: string,
  focusKeyword: string,
  allPosts: Post[],
  limit = 6
): InternalLinkSuggestion[] {
  const seedText = `${title} ${focusKeyword} ${content.slice(0, 600)}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');
  const seedTerms = new Set(
    seedText
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
  );

  const candidates = allPosts
    .filter((p) => p.status === 'published' && p.id !== currentPostId && p.slug)
    .map((p) => {
      const targetText = `${p.title} ${p.seo?.focusKeyword || ''} ${(p.tags || []).join(' ')} ${p.category}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ');
      const targetWords = Array.from(
        new Set(targetText.split(/\s+/).filter((w) => w.length >= 4 && !STOP_WORDS.has(w)))
      );
      const matchedTerms = targetWords.filter((w) => seedTerms.has(w));
      const kwBonus =
        focusKeyword &&
        p.title.toLowerCase().includes(focusKeyword.toLowerCase())
          ? 3
          : 0;
      const relevanceScore = matchedTerms.length + kwBonus;
      return {
        postId: p.id,
        title: p.title,
        url: getPostPublicPath(p),
        category: p.category || 'News',
        matchedTerms: matchedTerms.slice(0, 4),
        relevanceScore,
      };
    })
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  if (candidates.length >= limit) {
    return candidates.slice(0, limit);
  }

  // Fill remaining slots with recent published stories if topic overlap is small
  const chosenIds = new Set(candidates.map((c) => c.postId));
  const fallback = allPosts
    .filter((p) => p.status === 'published' && p.id !== currentPostId && !chosenIds.has(p.id) && p.slug)
    .slice(0, limit - candidates.length)
    .map((p) => ({
      postId: p.id,
      title: p.title,
      url: getPostPublicPath(p),
      category: p.category || 'News',
      matchedTerms: p.category ? [p.category] : [],
      relevanceScore: 0,
    }));

  return [...candidates, ...fallback];
}

export function autoOptimizePostSeo(post: Post): Post['seo'] {
  const words = post.title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()));
  const derivedKw =
    post.seo?.focusKeyword?.trim() ||
    words.slice(0, 3).join(' ') ||
    post.category ||
    'Breaking News';

  const cleanTitle = (post.seo?.title?.trim() || post.title).slice(0, 65).trim();
  const leadParagraph =
    post.blocks?.find((b) => b.type === 'paragraph' && typeof b.content === 'string')?.content ||
    post.content ||
    post.subtitle ||
    post.title;
  const derivedDesc =
    post.seo?.description && post.seo.description.length >= 100
      ? smartExcerpt(post.seo.description, 158)
      : smartExcerpt(`${post.subtitle ? post.subtitle + ' ' : ''}${leadParagraph}`, 158) ||
        smartExcerpt(post.title, 158);

  const secondaryKeywords =
    post.seo?.secondaryKeywords && post.seo.secondaryKeywords.length > 0
      ? post.seo.secondaryKeywords
      : Array.from(new Set([...words.slice(0, 4), ...(post.tags || []).slice(0, 3)])).slice(0, 5);

  const featuredImageAlt = post.seo?.featuredImageAlt?.trim() || `${derivedKw} — ${post.title}`.slice(0, 125);

  const audit = analyzePostRankSeo({
    title: post.title,
    subtitle: post.subtitle,
    slug: post.slug,
    content: post.content,
    blocks: post.blocks,
    featuredImage: post.featuredImage,
    featuredImageAlt,
    tags: post.tags,
    seoTitle: cleanTitle,
    seoDescription: derivedDesc,
    focusKeyword: derivedKw,
    secondaryKeywords,
  });

  return {
    ...post.seo,
    title: cleanTitle,
    description: derivedDesc,
    focusKeyword: derivedKw,
    secondaryKeywords,
    featuredImageAlt,
    schemaType: post.seo?.schemaType || 'NewsArticle',
    metaRobots: post.seo?.metaRobots || 'index, follow',
    ogTitle: post.seo?.ogTitle || cleanTitle,
    ogDescription: post.seo?.ogDescription || derivedDesc,
    score: audit.score,
  };
}

export function buildArticleGraphSchema(params: {
  post: Post;
  canonicalUrl: string;
  baseUrl: string;
  siteName: string;
  publisherLogo?: string;
  enableBreadcrumbs?: boolean;
  enableOrganizationSchema?: boolean;
}) {
  const {
    post,
    canonicalUrl,
    baseUrl,
    siteName,
    publisherLogo,
    enableBreadcrumbs = true,
    enableOrganizationSchema = true,
  } = params;
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const ogImg = post.seo?.ogImage || post.featuredImage || `${cleanBase}/favicon.svg`;
  const schemaType = post.seo?.schemaType || 'NewsArticle';
  const headline = post.seo?.title || post.title;
  const description = post.seo?.description || smartExcerpt(post.excerpt || post.subtitle || post.title, 160);

  const graph: Array<Record<string, any>> = [];

  if (enableOrganizationSchema) {
    graph.push({
      '@type': 'NewsMediaOrganization',
      '@id': `${cleanBase}/#organization`,
      name: siteName,
      url: cleanBase,
      ...(publisherLogo
        ? {
            logo: {
              '@type': 'ImageObject',
              url: publisherLogo,
            },
          }
        : {}),
    });
  }

  const mainArticleNode: Record<string, any> =
    schemaType === 'HowTo' && post.seo?.howToSteps && post.seo.howToSteps.length > 0
      ? {
          '@type': 'HowTo',
          name: headline,
          description,
          image: [ogImg],
          step: post.seo.howToSteps
            .filter((s) => s.title.trim())
            .map((s, idx) => ({
              '@type': 'HowToStep',
              position: idx + 1,
              name: s.title.trim(),
              text: s.description.trim() || s.title.trim(),
            })),
        }
      : {
          '@type': schemaType === 'FAQPage' || schemaType === 'HowTo' ? 'NewsArticle' : schemaType,
          headline,
          description,
          image: [ogImg],
          datePublished: post.publishedAt || undefined,
          dateModified: post.updatedAt || post.publishedAt || undefined,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
          },
          articleSection: post.category || 'News',
          keywords: [post.seo?.focusKeyword, ...(post.tags || [])].filter(Boolean).join(', '),
          author: [
            {
              '@type': 'Person',
              name: post.author?.name || `${siteName} Editorial Desk`,
            },
          ],
          publisher: {
            '@id': `${cleanBase}/#organization`,
          },
        };

  graph.push(mainArticleNode);

  if (enableBreadcrumbs) {
    const editionLabel = post.targetCountry && post.targetCountry !== 'global' ? post.targetCountry.toUpperCase() : 'News';
    const editionPath =
      post.targetCountry && post.targetCountry !== 'global' ? `${cleanBase}/${post.targetCountry}` : `${cleanBase}/`;
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
          name: editionLabel,
          item: editionPath,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.seo?.breadcrumbTitle || post.category || 'Article',
          item: canonicalUrl,
        },
      ],
    });
  }

  if (post.seo?.faqItems && post.seo.faqItems.some((f) => f.question.trim() && f.answer.trim())) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.seo.faqItems
        .filter((f) => f.question.trim() && f.answer.trim())
        .map((f) => ({
          '@type': 'Question',
          name: f.question.trim(),
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer.trim(),
          },
        })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
