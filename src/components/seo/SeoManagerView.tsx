import React, { useMemo, useState } from 'react';
import {
  Search,
  FileCode,
  CheckCircle2,
  Copy,
  Download,
  Sparkles,
  Globe,
  Link2,
  ArrowRightLeft,
  ShieldCheck,
  Sliders,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  Zap,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { Post, RankSeoSettings, SeoRedirectRule } from '../../types';
import {
  cleanGoogleVerificationCode,
  applyGoogleVerificationTag,
} from '../../services/seo';
import { getPostPublicPath } from '../../utils/countryEditions';
import {
  DEFAULT_RANK_SEO_SETTINGS,
  auditPostObject,
  autoOptimizePostSeo,
  buildArticleGraphSchema,
  suggestInternalLinks,
} from '../../utils/rankSeo';

interface SeoManagerViewProps {
  onEditPost?: (post: Post) => void;
}

type SeoTab =
  | 'overview'
  | 'audit'
  | 'titles'
  | 'schema'
  | 'sitemaps'
  | 'redirects'
  | 'robots';

export const SeoManagerView: React.FC<SeoManagerViewProps> = ({ onEditPost }) => {
  const [settingsSnapshot, setSettingsSnapshot] = useState(() => db.getSettings());
  const [posts, setPosts] = useState<Post[]>(() => db.getPosts());

  React.useEffect(() => {
    return db.subscribe(() => {
      setSettingsSnapshot({ ...db.getSettings() });
      setPosts([...db.getPosts()]);
    });
  }, []);

  const initialRankSeo: RankSeoSettings = {
    ...DEFAULT_RANK_SEO_SETTINGS,
    ...(settingsSnapshot.rankSeo || {}),
    modules: {
      ...DEFAULT_RANK_SEO_SETTINGS.modules,
      ...(settingsSnapshot.rankSeo?.modules || {}),
    },
  };

  const [activeSubTab, setActiveSubTab] = useState<SeoTab>('overview');
  const [rankSeo, setRankSeo] = useState<RankSeoSettings>(initialRankSeo);
  const [googleVerification, setGoogleVerification] = useState(
    settingsSnapshot.searchConsoleCode || ''
  );
  const [robotsTxt, setRobotsTxt] = useState(settingsSnapshot.robotsTxt || '');
  const [redirects, setRedirects] = useState<SeoRedirectRule[]>(
    Array.isArray(settingsSnapshot.seoRedirects) ? settingsSnapshot.seoRedirects : []
  );

  // Audit filter states
  const [auditFilter, setAuditFilter] = useState<'all' | 'needs_work' | 'good' | 'optimal'>('all');
  const [auditQuery, setAuditQuery] = useState('');

  // Schema inspector target article
  const publishedPosts = useMemo(
    () => posts.filter((p) => p.status === 'published'),
    [posts]
  );
  const [schemaPostId, setSchemaPostId] = useState<string>(() => publishedPosts[0]?.id || posts[0]?.id || '');

  // Redirect form state
  const [newSourcePath, setNewSourcePath] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('/');
  const [newRedirectType, setNewRedirectType] = useState<'301' | '302' | '410'>('301');
  const [newRedirectNote, setNewRedirectNote] = useState('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [verificationTested, setVerificationTested] = useState<boolean | null>(null);

  const nonTrashPosts = useMemo(
    () => posts.filter((p) => p.status !== 'trash'),
    [posts]
  );

  // Real-time audit results computed directly from live posts
  const auditedPosts = useMemo(
    () =>
      nonTrashPosts.map((post) => ({
        post,
        audit: auditPostObject(post, publishedPosts),
      })),
    [nonTrashPosts, publishedPosts]
  );

  const summaryStats = useMemo(() => {
    const count = auditedPosts.length;
    const avgScore =
      count > 0
        ? Math.round(auditedPosts.reduce((acc, x) => acc + x.audit.score, 0) / count)
        : 0;
    const optimalCount = auditedPosts.filter((x) => x.audit.score >= 81).length;
    const needsWorkCount = auditedPosts.filter((x) => x.audit.score < 60).length;
    const indexableCount = publishedPosts.filter(
      (p) => !(p.seo?.metaRobots || '').toLowerCase().includes('noindex') && !p.seo?.redirectUrl
    ).length;
    const faqSchemaCount = publishedPosts.filter(
      (p) => Array.isArray(p.seo?.faqItems) && p.seo.faqItems.some((f) => f.question?.trim())
    ).length;
    return {
      avgScore,
      optimalCount,
      needsWorkCount,
      indexableCount,
      faqSchemaCount,
      activeRedirectsCount: redirects.filter((r) => r.active).length,
    };
  }, [auditedPosts, publishedPosts, redirects]);

  // Internal Link Opportunity Scanner: posts with 0 internal links
  const linkOpportunities = useMemo(() => {
    return publishedPosts
      .map((post) => {
        const audit = auditPostObject(post, publishedPosts);
        if (audit.stats.internalLinksCount > 0) return null;
        const bodyText = (post.blocks || [])
          .map((b) => (typeof b.content === 'string' ? b.content : ''))
          .join(' ') || post.content || '';
        const suggestions = suggestInternalLinks(
          post.id,
          post.title,
          bodyText,
          post.seo?.focusKeyword || '',
          publishedPosts,
          3
        );
        return { post, suggestions };
      })
      .filter((x): x is { post: Post; suggestions: ReturnType<typeof suggestInternalLinks> } => Boolean(x))
      .slice(0, 15);
  }, [publishedPosts]);

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const persistRankSettings = (
    nextRankSeo: RankSeoSettings = rankSeo,
    extra: Partial<typeof settingsSnapshot> = {}
  ) => {
    const cleanGsc = cleanGoogleVerificationCode(googleVerification);
    setGoogleVerification(cleanGsc);
    const updated = db.updateSettings({
      rankSeo: nextRankSeo,
      searchConsoleCode: cleanGsc,
      robotsTxt,
      seoRedirects: redirects,
      ...extra,
    });
    setSettingsSnapshot({ ...updated });
    applyGoogleVerificationTag(cleanGsc);
  };

  const handleSaveGlobalSeo = async () => {
    const cleanGsc = cleanGoogleVerificationCode(googleVerification);
    persistRankSettings(rankSeo);
    try {
      await fetch('/api/seo/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanGsc }),
      });
    } catch {
      // client tag already synced via Firestore + DOM head
    }
    setVerificationTested(Boolean(cleanGsc));
    toast.success('Rank SEO settings saved and synced live!');
  };

  const handleToggleModule = (key: keyof RankSeoSettings['modules']) => {
    const nextRank: RankSeoSettings = {
      ...rankSeo,
      modules: {
        ...rankSeo.modules,
        [key]: !rankSeo.modules[key],
      },
    };
    setRankSeo(nextRank);
    persistRankSettings(nextRank);
    toast.success('SEO module state saved.');
  };

  const handleAutoFixSinglePost = (post: Post) => {
    const nextSeo = autoOptimizePostSeo(post);
    db.savePost({
      ...post,
      seo: nextSeo,
    });
    setPosts([...db.getPosts()]);
    toast.success(`Auto-optimized "${post.title.slice(0, 40)}..." (Score: ${nextSeo.score}/100)`);
  };

  const handleBatchAutoOptimize = () => {
    const targets = auditedPosts
      .filter((x) => x.audit.score < 80 || !x.post.seo?.focusKeyword || !x.post.seo?.description)
      .map((x) => x.post);
    if (targets.length === 0) {
      toast.info('All articles already have optimized SEO metadata!');
      return;
    }
    targets.forEach((post) => {
      const nextSeo = autoOptimizePostSeo(post);
      db.savePost({
        ...post,
        seo: nextSeo,
      });
    });
    setPosts([...db.getPosts()]);
    toast.success(`Batch optimized ${targets.length} articles in one pass!`);
  };

  const handleAddRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    const rawSource = newSourcePath.trim();
    if (!rawSource) {
      toast.warning('Enter a source path like /tag/old-slug or /old-article');
      return;
    }
    const normalizedSource = rawSource.startsWith('/') ? rawSource : `/${rawSource}`;
    const newRule: SeoRedirectRule = {
      id: `redir-${Date.now()}`,
      sourcePath: normalizedSource,
      targetUrl: newRedirectType === '410' ? '' : newTargetUrl.trim() || '/',
      type: newRedirectType,
      active: true,
      note: newRedirectNote.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextList = [newRule, ...redirects];
    setRedirects(nextList);
    persistRankSettings(rankSeo, { seoRedirects: nextList });
    setNewSourcePath('');
    setNewTargetUrl('/');
    setNewRedirectNote('');
    toast.success(`Redirect rule (${newRedirectType}) added & synced!`);
  };

  const handleAddLegacyPreset = () => {
    const presets: SeoRedirectRule[] = [
      {
        id: `redir-tag-${Date.now()}`,
        sourcePath: '/tag/*',
        targetUrl: '/',
        type: '301',
        active: true,
        note: 'Clean up old WordPress /tag/* URLs',
        createdAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: `redir-product-${Date.now() + 1}`,
        sourcePath: '/product/*',
        targetUrl: '',
        type: '410',
        active: true,
        note: 'Remove old store /product/* URLs (410 Gone)',
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ];
    const existingSources = new Set(redirects.map((r) => r.sourcePath));
    const toAdd = presets.filter((p) => !existingSources.has(p.sourcePath));
    if (toAdd.length === 0) {
      toast.info('Legacy /tag/* & /product/* cleanup rules are already active.');
      return;
    }
    const nextList = [...toAdd, ...redirects];
    setRedirects(nextList);
    persistRankSettings(rankSeo, { seoRedirects: nextList });
    toast.success('Added 301/410 cleanup rules for old /tag/* and /product/* URLs!');
  };

  const handleToggleRedirect = (id: string) => {
    const nextList = redirects.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    setRedirects(nextList);
    persistRankSettings(rankSeo, { seoRedirects: nextList });
  };

  const handleDeleteRedirect = (id: string) => {
    const nextList = redirects.filter((r) => r.id !== id);
    setRedirects(nextList);
    persistRankSettings(rankSeo, { seoRedirects: nextList });
    toast.info('Redirect rule removed.');
  };

  const handleTestVerification = () => {
    const cleanCode = cleanGoogleVerificationCode(googleVerification);
    applyGoogleVerificationTag(cleanCode);
    const metaTag = document.querySelector<HTMLMetaElement>('meta[name="google-site-verification"]');
    if (metaTag && metaTag.content && metaTag.content === cleanCode) {
      setVerificationTested(true);
      toast.success('Verified! Google tag is active in <head>.');
    } else {
      setVerificationTested(false);
      toast.error('Verification tag missing. Enter code and save first.');
    }
  };

  const filteredAuditList = useMemo(() => {
    return auditedPosts.filter(({ post, audit }) => {
      if (auditFilter !== 'all' && audit.grade !== auditFilter) return false;
      if (auditQuery.trim()) {
        const q = auditQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(q) ||
          (post.seo?.focusKeyword || '').toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditedPosts, auditFilter, auditQuery]);

  const cleanSiteUrl = (settingsSnapshot.siteUrl || 'https://www.official1.online').replace(/\/+$/, '');
  const indexablePosts = publishedPosts.filter(
    (p) => !(p.seo?.metaRobots || '').toLowerCase().includes('noindex') && !p.seo?.redirectUrl
  );

  // Accurate Sitemap XML Preview matching live server generator
  const xmlSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${
    rankSeo.enableImageSitemap ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''
  }>
  <url>
    <loc>${cleanSiteUrl}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
${indexablePosts
  .slice(0, 25)
  .map((p) => {
    const imgBlock =
      rankSeo.enableImageSitemap && p.featuredImage && !p.featuredImage.startsWith('data:')
        ? `\n    <image:image>\n      <image:loc>${p.featuredImage}</image:loc>\n      <image:title>${(
            p.seo?.featuredImageAlt || p.title
          ).replace(/&/g, '&amp;')}</image:title>\n    </image:image>`
        : '';
    return `  <url>
    <loc>${cleanSiteUrl}${getPostPublicPath(p)}</loc>
    <lastmod>${(p.updatedAt || p.publishedAt || new Date().toISOString()).slice(0, 10)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${p.seo?.isPillarContent ? '1.0' : '0.9'}</priority>${imgBlock}
  </url>`;
  })
  .join('\n')}
</urlset>`;

  const googleNewsSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${indexablePosts
  .slice(0, 15)
  .map(
    (p) => `  <url>
    <loc>${cleanSiteUrl}${getPostPublicPath(p)}</loc>
    <news:news>
      <news:publication>
        <news:name>${rankSeo.publisherName || settingsSnapshot.siteName}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${p.publishedAt}</news:publication_date>
      <news:title>${p.title.replace(/&/g, '&amp;')}</news:title>
    </news:news>
  </url>`
  )
  .join('\n')}
</urlset>`;

  const selectedSchemaPost =
    posts.find((p) => p.id === schemaPostId) || publishedPosts[0] || posts[0];
  const liveSchemaGraphJson = selectedSchemaPost
    ? buildArticleGraphSchema({
        post: selectedSchemaPost,
        canonicalUrl:
          selectedSchemaPost.seo?.canonicalUrl ||
          `${cleanSiteUrl}${getPostPublicPath(selectedSchemaPost)}`,
        baseUrl: cleanSiteUrl,
        siteName: rankSeo.publisherName || settingsSnapshot.siteName,
        publisherLogo: rankSeo.publisherLogo || settingsSnapshot.logoUrl,
        enableBreadcrumbs: rankSeo.enableBreadcrumbs,
        enableOrganizationSchema: rankSeo.enableOrganizationSchema,
      })
    : {
        '@context': 'https://schema.org',
        '@type': 'NewsMediaOrganization',
        name: rankSeo.publisherName || settingsSnapshot.siteName,
        url: cleanSiteUrl,
      };

  const modulesList: Array<{
    key: keyof RankSeoSettings['modules'];
    title: string;
    desc: string;
  }> = [
    {
      key: 'seoAnalysis',
      title: '100-Point On-Page SEO Analyzer',
      desc: '4-category Rank Math scoring inside Quick Phone & Full Studio editors.',
    },
    {
      key: 'schemaGenerator',
      title: 'Schema.org @graph & FAQ Builder',
      desc: 'Auto-generates NewsArticle, HowTo, FAQPage, Organization & BreadcrumbList JSON-LD.',
    },
    {
      key: 'sitemaps',
      title: 'XML, Google News & Image Sitemaps',
      desc: 'Automatically excludes noindex/redirected articles & attaches news images.',
    },
    {
      key: 'redirections',
      title: '301 / 302 / 410 Redirection Manager',
      desc: 'Fixes Search Console 404s, legacy /tag/* & /product/* URLs with true HTTP headers.',
    },
    {
      key: 'linkSuggestions',
      title: 'Internal Link Opportunity Scanner',
      desc: 'Detects orphan stories and suggests contextually relevant internal links.',
    },
    {
      key: 'imageSeo',
      title: 'Image Alt SEO & Google Discover Card',
      desc: 'Applies SEO alt attributes & large 1200x630 max-image-preview tags.',
    },
    {
      key: 'breadcrumbs',
      title: 'Semantic Reader Breadcrumbs',
      desc: 'Displays Home > Edition > Category trail synced with BreadcrumbList schema.',
    },
    {
      key: 'instantIndexing',
      title: 'IndexNow & Rapid Crawl Keys',
      desc: 'Manage Bing/Yandex IndexNow verification keys & sitemap URLs.',
    },
    {
      key: 'robotsEditor',
      title: 'Dynamic Robots.txt Controller',
      desc: 'Live Firestore-backed /robots.txt configuration for Googlebot & AdSense.',
    },
  ];

  return (
    <div className="space-y-6 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rank SEO Pro Suite
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete Rank Math-style SEO toolkit: 100-pt content scoring, Schema @graph, Redirects, Sitemaps & Internal Link Builder.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleBatchAutoOptimize}
            className="min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Auto-Fix Missing Metadata</span>
          </button>
          <button
            type="button"
            onClick={handleSaveGlobalSeo}
            className="min-h-[42px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Save All SEO Settings</span>
          </button>
        </div>
      </div>

      {/* Responsive Tab Strip */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 text-xs font-bold">
        {[
          { key: 'overview', label: 'Overview & Modules', icon: Sliders },
          { key: 'audit', label: `Post Audit (${nonTrashPosts.length})`, icon: Sparkles },
          { key: 'titles', label: 'Titles, Meta & Social', icon: Globe },
          { key: 'schema', label: 'Schema & FAQ Engine', icon: FileCode },
          { key: 'sitemaps', label: 'Sitemaps & IndexNow', icon: Search },
          { key: 'redirects', label: `Redirects (${redirects.length})`, icon: ArrowRightLeft },
          { key: 'robots', label: 'Robots.txt & Link Finder', icon: Link2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as SeoTab)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & MODULES */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Real KPI Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              {
                label: 'Average SEO Score',
                val: `${summaryStats.avgScore}/100`,
                tone:
                  summaryStats.avgScore >= 80
                    ? 'text-emerald-700'
                    : summaryStats.avgScore >= 60
                    ? 'text-amber-700'
                    : 'text-rose-700',
              },
              {
                label: 'Optimal (81–100)',
                val: String(summaryStats.optimalCount),
                tone: 'text-emerald-700',
              },
              {
                label: 'Needs Work (<60)',
                val: String(summaryStats.needsWorkCount),
                tone: 'text-rose-700',
              },
              {
                label: 'Indexable URLs',
                val: String(summaryStats.indexableCount),
                tone: 'text-sky-700',
              },
              {
                label: 'Active Redirects',
                val: String(summaryStats.activeRedirectsCount),
                tone: 'text-slate-900',
              },
              {
                label: 'FAQ Rich Snippets',
                val: String(summaryStats.faqSchemaCount),
                tone: 'text-indigo-700',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs"
              >
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className={`text-2xl font-black mt-1 tabular-nums ${kpi.tone}`}>
                  {kpi.val}
                </p>
              </div>
            ))}
          </div>

          {/* Rank SEO Modules Grid */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Rank SEO Feature Modules
                </h2>
                <p className="text-xs text-slate-500">
                  Enable or disable individual SEO automation engines site-wide.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modulesList.map((mod) => {
                const enabled = rankSeo.modules[mod.key];
                return (
                  <div
                    key={mod.key}
                    className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                      enabled
                        ? 'bg-slate-50/70 border-slate-200'
                        : 'bg-slate-50/30 border-slate-100 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-extrabold text-slate-900">{mod.title}</h3>
                        <button
                          type="button"
                          onClick={() => handleToggleModule(mod.key)}
                          className={`min-w-[44px] h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                            enabled ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          aria-label={`Toggle ${mod.title}`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                              enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        enabled ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POST AUDIT & QUICK FIX */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              {[
                { key: 'all', label: `All (${auditedPosts.length})` },
                {
                  key: 'needs_work',
                  label: `Needs Work (${auditedPosts.filter((x) => x.audit.grade === 'needs_work').length})`,
                },
                {
                  key: 'good',
                  label: `Good (${auditedPosts.filter((x) => x.audit.grade === 'good').length})`,
                },
                {
                  key: 'optimal',
                  label: `Optimal (${auditedPosts.filter((x) => x.audit.grade === 'optimal').length})`,
                },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setAuditFilter(f.key as any)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg cursor-pointer ${
                    auditFilter === f.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                placeholder="Search title, focus keyword, category..."
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Rank Score</th>
                  <th className="py-3 px-4">Focus Keyword</th>
                  <th className="py-3 px-4">Words & Links</th>
                  <th className="py-3 px-4">Schema / Robots</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditList.map(({ post, audit }) => (
                  <tr key={post.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 max-w-[300px]">
                      <p className="font-bold text-slate-900 line-clamp-1">{post.title}</p>
                      <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {getPostPublicPath(post)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black tabular-nums text-xs ${
                            audit.score >= 81
                              ? 'text-emerald-700'
                              : audit.score >= 60
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {audit.score}/100
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              audit.score >= 81
                                ? 'bg-emerald-500'
                                : audit.score >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${audit.score}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {audit.passedCount}/{audit.totalChecks} checks
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      {post.seo?.focusKeyword ? (
                        <span className="font-semibold text-slate-800">
                          {post.seo.focusKeyword}
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Missing</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-slate-600">
                      <div>{audit.stats.wordCount} words</div>
                      <div className="text-[10px] text-slate-400">
                        {audit.stats.internalLinksCount} int · {audit.stats.externalLinksCount} ext
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">
                        {post.seo?.schemaType || 'NewsArticle'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {post.seo?.metaRobots || 'index, follow'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAutoFixSinglePost(post)}
                          className="min-h-[34px] px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Auto-Fix
                        </button>
                        {onEditPost && (
                          <button
                            type="button"
                            onClick={() => onEditPost(post)}
                            className="min-h-[34px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TITLES, META & WEBMASTER VERIFICATION */}
      {activeSubTab === 'titles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Global Titles, Separator & OpenGraph */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 text-xs">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Global Titles, Meta & Social Defaults
            </h2>

            <div>
              <label className="block font-bold text-slate-800 mb-2">Title Separator Character</label>
              <div className="flex flex-wrap gap-2">
                {(['|', '-', '•', '—', '»'] as const).map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    onClick={() => setRankSeo({ ...rankSeo, titleSeparator: sep })}
                    className={`min-w-[44px] min-h-[42px] px-3 rounded-xl border font-extrabold text-sm cursor-pointer ${
                      rankSeo.titleSeparator === sep
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sep}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Homepage SEO Title</label>
              <input
                type="text"
                value={rankSeo.homeSeoTitle}
                onChange={(e) => setRankSeo({ ...rankSeo, homeSeoTitle: e.target.value })}
                className="w-full min-h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Homepage Meta Description ({rankSeo.homeSeoDescription.length}/160)
              </label>
              <textarea
                rows={3}
                value={rankSeo.homeSeoDescription}
                onChange={(e) => setRankSeo({ ...rankSeo, homeSeoDescription: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Live Homepage Google Snippet Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Homepage Google Preview
              </p>
              <p className="text-[11px] font-mono text-emerald-700">{cleanSiteUrl}/</p>
              <p className="text-sm font-bold text-[#1a0dab] line-clamp-1">
                {rankSeo.homeSeoTitle || settingsSnapshot.siteName}
              </p>
              <p className="text-xs text-slate-600 line-clamp-2">{rankSeo.homeSeoDescription}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Default OpenGraph Title</label>
              <input
                type="text"
                value={rankSeo.defaultOgTitle}
                onChange={(e) => setRankSeo({ ...rankSeo, defaultOgTitle: e.target.value })}
                className="w-full min-h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Default OpenGraph Image URL (1200x630)</label>
              <input
                type="url"
                value={rankSeo.defaultOgImage}
                onChange={(e) => setRankSeo({ ...rankSeo, defaultOgImage: e.target.value })}
                className="w-full min-h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">X / Twitter Handle</label>
              <input
                type="text"
                value={rankSeo.twitterHandle}
                onChange={(e) => setRankSeo({ ...rankSeo, twitterHandle: e.target.value })}
                placeholder="@AlifNews24"
                className="w-full min-h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveGlobalSeo}
              className="min-h-[44px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl cursor-pointer"
            >
              Save Titles & Social Settings
            </button>
          </div>

          {/* Right: Google / Bing / Yandex Webmaster Verification */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Webmaster Tools Verification
                </h2>
                <p className="text-xs text-slate-500">
                  Google Search Console, Bing Webmaster & Yandex meta tags
                </p>
              </div>
              {cleanGoogleVerificationCode(googleVerification) && (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> GSC Active
                </span>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Google Search Console Verification Code / Meta Tag *
              </label>
              <input
                type="text"
                value={googleVerification}
                onChange={(e) => {
                  setGoogleVerification(e.target.value);
                  setVerificationTested(null);
                }}
                placeholder='e.g. <meta name="google-site-verification" content="..." />'
                className="w-full min-h-[42px] px-3.5 py-2 font-mono border border-slate-200 rounded-xl bg-slate-50"
              />
            </div>

            <div className="p-3.5 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] break-all">
              &lt;meta name="google-site-verification" content="{cleanGoogleVerificationCode(googleVerification) || 'your-token'}" /&gt;
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Bing Webmaster Tools Verification (msvalidate.01)
              </label>
              <input
                type="text"
                value={rankSeo.bingVerificationCode}
                onChange={(e) => setRankSeo({ ...rankSeo, bingVerificationCode: e.target.value })}
                placeholder="Paste Bing verification token..."
                className="w-full min-h-[42px] px-3.5 py-2 font-mono border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Yandex Webmaster Verification
              </label>
              <input
                type="text"
                value={rankSeo.yandexVerificationCode}
                onChange={(e) => setRankSeo({ ...rankSeo, yandexVerificationCode: e.target.value })}
                placeholder="Paste Yandex verification token..."
                className="w-full min-h-[42px] px-3.5 py-2 font-mono border border-slate-200 rounded-xl"
              />
            </div>

            {verificationTested !== null && (
              <div
                className={`p-3 rounded-xl border ${
                  verificationTested
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {verificationTested
                  ? 'Verified in DOM <head>! Google Search Console can validate this domain.'
                  : 'Save changes first so the verification tag writes into <head>.'}
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleSaveGlobalSeo}
                className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
              >
                Save & Apply to &lt;head&gt;
              </button>
              <button
                type="button"
                onClick={handleTestVerification}
                className="min-h-[44px] px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl border border-sky-200 cursor-pointer"
              >
                Verify Tag in DOM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEMA TEMPLATES & INSPECTOR */}
      {activeSubTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Global Schema.org & Indexing Automation
            </h2>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Publisher / Newsroom Name</label>
              <input
                type="text"
                value={rankSeo.publisherName}
                onChange={(e) => setRankSeo({ ...rankSeo, publisherName: e.target.value })}
                className="w-full min-h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Publisher Logo URL</label>
              <input
                type="url"
                value={rankSeo.publisherLogo}
                onChange={(e) => setRankSeo({ ...rankSeo, publisherLogo: e.target.value })}
                className="w-full min-h-[42px] px-3.5 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Default Article Schema</label>
                <select
                  value={rankSeo.defaultArticleSchema}
                  onChange={(e) =>
                    setRankSeo({ ...rankSeo, defaultArticleSchema: e.target.value as any })
                  }
                  className="w-full min-h-[42px] px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="NewsArticle">NewsArticle (Recommended)</option>
                  <option value="AnalysisNewsArticle">AnalysisNewsArticle</option>
                  <option value="Article">Article</option>
                  <option value="BlogPosting">BlogPosting</option>
                  <option value="Report">Report</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">Default Meta Robots</label>
                <select
                  value={rankSeo.defaultRobots}
                  onChange={(e) => setRankSeo({ ...rankSeo, defaultRobots: e.target.value })}
                  className="w-full min-h-[42px] px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="index, follow, max-image-preview:large">
                    index, follow, max-image-preview:large
                  </option>
                  <option value="index, follow">index, follow</option>
                  <option value="noindex, follow">noindex, follow</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                { key: 'enableOrganizationSchema', label: 'Include NewsMediaOrganization Schema' },
                { key: 'enableBreadcrumbs', label: 'Include BreadcrumbList JSON-LD & Reader Trail' },
                { key: 'enableImageSitemap', label: 'Attach <image:image> Tags in Sitemaps' },
                { key: 'enableFaqSchema', label: 'Auto-output FAQPage & HowTo Rich Schema' },
                { key: 'noindexSearchResults', label: 'Auto Noindex Search Query URLs (?s= / ?search=)' },
                { key: 'autoInternalLinking', label: 'Enable Real-Time Internal Link Suggester' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  <span className="font-semibold text-slate-800">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean((rankSeo as any)[opt.key])}
                    onChange={(e) =>
                      setRankSeo({ ...rankSeo, [opt.key]: e.target.checked })
                    }
                    className="w-4 h-4 accent-slate-900"
                  />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveGlobalSeo}
              className="min-h-[44px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl cursor-pointer"
            >
              Save Schema Configuration
            </button>
          </div>

          {/* Live Article @graph JSON-LD Inspector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Live Article @graph JSON-LD Inspector
                </h3>
                <p className="text-[11px] text-slate-500">
                  Inspect exact structured data output sent to Google Rich Results
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('JSON-LD', JSON.stringify(liveSchemaGraphJson, null, 2))}
                className="px-3 py-1.5 bg-sky-50 text-sky-700 font-bold rounded-lg border border-sky-200 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKey === 'JSON-LD' ? 'Copied' : 'Copy JSON-LD'}</span>
              </button>
            </div>

            <select
              value={schemaPostId}
              onChange={(e) => setSchemaPostId(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800"
            >
              {nonTrashPosts.slice(0, 40).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.seo?.schemaType || 'NewsArticle'})
                </option>
              ))}
            </select>

            <pre className="p-4 bg-slate-950 text-purple-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[420px]">
              {JSON.stringify(liveSchemaGraphJson, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: SITEMAPS & INDEXNOW */}
      {activeSubTab === 'sitemaps' && (
        <div className="space-y-6 text-xs">
          {/* Live Sitemap Links + IndexNow Key Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Google Search Console Sitemap URLs
              </h3>
              <p className="text-slate-500">
                Submit both URLs in Search Console. Posts marked <code className="font-mono bg-slate-100 px-1 rounded">noindex</code> or redirected are automatically excluded.
              </p>
              {[
                { label: 'Main XML & Image Sitemap', url: `${cleanSiteUrl}/sitemap.xml` },
                { label: 'Google News Sitemap', url: `${cleanSiteUrl}/google-news-sitemap.xml` },
                { label: 'Robots.txt Endpoint', url: `${cleanSiteUrl}/robots.txt` },
              ].map((item) => (
                <div
                  key={item.url}
                  className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">{item.label}</p>
                    <p className="font-mono text-sky-700 truncate">{item.url}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.label, item.url)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
                    >
                      Copy
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                IndexNow Instant Indexing API Key
              </h3>
              <p className="text-slate-500">
                Used by Bing, Yandex & IndexNow crawlers to discover newly published articles immediately.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rankSeo.indexNowKey}
                  onChange={(e) => setRankSeo({ ...rankSeo, indexNowKey: e.target.value })}
                  className="flex-1 min-h-[40px] px-3 py-2 font-mono border border-slate-200 rounded-xl bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    const rand = `alifnews24-${Math.random().toString(36).slice(2, 12)}`;
                    const next = { ...rankSeo, indexNowKey: rand };
                    setRankSeo(next);
                    persistRankSettings(next);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy('IndexNow Key', rankSeo.indexNowKey)}
                  className="px-3.5 py-2 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([rankSeo.indexNowKey], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${rankSeo.indexNowKey}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3.5 py-2 bg-sky-50 text-sky-800 border border-sky-200 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Verification File
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Standard & Image XML Sitemap Preview</h3>
                  <span className="text-[11px] font-mono text-sky-600">{indexablePosts.length} indexable posts</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('XML Sitemap', xmlSitemapContent)}
                  className="text-xs font-bold text-sky-600 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy XML
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72">
                {xmlSitemapContent}
              </pre>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Google News Sitemap Preview</h3>
                  <span className="text-[11px] font-mono text-sky-600">/google-news-sitemap.xml</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('News Sitemap', googleNewsSitemapContent)}
                  className="text-xs font-bold text-sky-600 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy XML
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-cyan-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72">
                {googleNewsSitemapContent}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REDIRECTIONS (301 / 302 / 410) */}
      {activeSubTab === 'redirects' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  301 / 302 / 410 Redirections Manager
                </h2>
                <p className="text-xs text-slate-500">
                  Redirect broken URLs or clean up legacy WordPress paths (supports wildcard suffix like <code className="font-mono bg-slate-100 px-1 rounded">/tag/*</code>).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLegacyPreset}
                className="min-h-[38px] px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Add /tag/* & /product/* Cleanup Rules</span>
              </button>
            </div>

            <form onSubmit={handleAddRedirect} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block font-bold text-slate-700 mb-1">Source Path *</label>
                <input
                  type="text"
                  value={newSourcePath}
                  onChange={(e) => setNewSourcePath(e.target.value)}
                  placeholder="/old-url or /tag/*"
                  className="w-full min-h-[42px] px-3 py-2 font-mono border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">HTTP Code</label>
                <select
                  value={newRedirectType}
                  onChange={(e) => setNewRedirectType(e.target.value as any)}
                  className="w-full min-h-[42px] px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="301">301 Permanent</option>
                  <option value="302">302 Temporary</option>
                  <option value="410">410 Content Gone</option>
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block font-bold text-slate-700 mb-1">
                  Target URL {newRedirectType === '410' ? '(Not needed for 410)' : '*'}
                </label>
                <input
                  type="text"
                  value={newTargetUrl}
                  disabled={newRedirectType === '410'}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  placeholder="/usa/new-slug or /"
                  className="w-full min-h-[42px] px-3 py-2 font-mono border border-slate-200 rounded-xl bg-slate-50 disabled:opacity-50"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full min-h-[42px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Rule
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {redirects.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No redirects configured yet</p>
                <p className="text-[11px] mt-1">
                  Add a redirect rule above or click "Add /tag/* & /product/* Cleanup Rules" to resolve old pending URLs.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Source Path</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {redirects.map((rule) => (
                      <tr key={rule.id}>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {rule.sourcePath}
                          {rule.note && (
                            <p className="text-[10px] font-sans font-normal text-slate-400">
                              {rule.note}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-sky-700">
                          {rule.type}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {rule.type === '410' ? '410 Content Deleted' : rule.targetUrl || '/'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleRedirect(rule.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                              rule.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {rule.active ? 'Active' : 'Paused'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRedirect(rule.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                            aria-label="Delete rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: ROBOTS.TXT & INTERNAL LINK OPPORTUNITY SCANNER */}
      {activeSubTab === 'robots' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Dynamic Robots.txt Editor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Robots.txt Editor</h2>
                <p className="text-[11px] text-slate-500">Served dynamically at /robots.txt</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRobotsTxt(
                    `User-agent: *\nAllow: /\nAllow: /api/media\nDisallow: /admin/\nDisallow: /api/\nDisallow: /*?search=\nDisallow: /*?s=\n\nUser-agent: Googlebot-News\nAllow: /\n\nSitemap: ${cleanSiteUrl}/sitemap.xml\nSitemap: ${cleanSiteUrl}/google-news-sitemap.xml\n`
                  );
                  toast.info('Optimal Google News & Search preset applied. Click Save to publish.');
                }}
                className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg font-bold cursor-pointer"
              >
                Load Google News Optimal Preset
              </button>
            </div>
            <textarea
              rows={11}
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              className="w-full p-4 font-mono text-xs bg-slate-950 text-slate-100 rounded-xl focus:outline-hidden"
            />
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Keep <code className="font-mono font-bold">Allow: /api/media</code> so Google Discover and image search can index your uploaded photos cleanly.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveGlobalSeo}
              className="min-h-[42px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Save Robots.txt Live
            </button>
          </div>

          {/* Internal Link Opportunity Scanner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Internal Link Opportunity Scanner
              </h2>
              <p className="text-[11px] text-slate-500">
                Articles below currently have 0 internal links. Link them together to boost crawl depth & Google authority.
              </p>
            </div>

            {linkOpportunities.length === 0 ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold">
                Every published article already has internal links!
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {linkOpportunities.map(({ post, suggestions }) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{post.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {post.category} · 0 internal links detected
                        </p>
                      </div>
                      {onEditPost && (
                        <button
                          type="button"
                          onClick={() => onEditPost(post)}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          Open Editor
                        </button>
                      )}
                    </div>
                    {suggestions.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-200/70">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Suggested Related Stories to Link:
                        </p>
                        {suggestions.map((sug) => (
                          <div
                            key={sug.postId}
                            className="flex items-center justify-between gap-2 text-[11px] text-slate-700"
                          >
                            <span className="truncate">→ {sug.title}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  'Markdown Link',
                                  `[${sug.title}](${sug.url})`
                                )
                              }
                              className="text-sky-600 font-bold shrink-0 cursor-pointer"
                            >
                              Copy Link
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
