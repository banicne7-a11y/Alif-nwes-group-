import React, { useState } from 'react';
import {
  Search,
  FileCode,
  FileText,
  ExternalLink,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  Sliders,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';

export const SeoManagerView: React.FC = () => {
  const settings = db.getSettings();
  const posts = db.getPosts();

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'sitemaps' | 'robots' | 'schema' | 'redirects'>('general');
  const [robotsTxt, setRobotsTxt] = useState(settings.robotsTxt);
  const [googleVerification, setGoogleVerification] = useState(settings.searchConsoleCode);
  const [copied, setCopied] = useState(false);

  // Generate real dynamic XML Sitemap
  const xmlSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${settings.siteUrl}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
${posts
  .filter((p) => p.status === 'published')
  .map(
    (p) => `  <url>
    <loc>${settings.siteUrl}/news/${p.slug}</loc>
    <lastmod>${p.updatedAt.slice(0, 10)}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Generate Google News Sitemap
  const googleNewsSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${posts
  .filter((p) => p.status === 'published')
  .slice(0, 10)
  .map(
    (p) => `  <url>
    <loc>${settings.siteUrl}/news/${p.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${settings.siteName}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${p.publishedAt}</news:publication_date>
      <news:title>${p.title.replace(/&/g, '&amp;')}</news:title>
    </news:news>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Schema.org NewsArticle sample
  const sampleArticle = posts[0];
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: sampleArticle?.title || 'Breaking Headline',
    image: [sampleArticle?.featuredImage],
    datePublished: sampleArticle?.publishedAt,
    dateModified: sampleArticle?.updatedAt,
    author: [
      {
        '@type': 'Person',
        name: sampleArticle?.author.name,
        url: `${settings.siteUrl}/author/${sampleArticle?.author.id}`,
      },
    ],
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: settings.siteName,
      url: settings.siteUrl,
    },
    description: sampleArticle?.seo.description,
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRobots = () => {
    db.updateSettings({
      robotsTxt,
      searchConsoleCode: googleVerification,
    });
    toast.success('SEO configuration and robots.txt updated successfully!');
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SEO Manager & Sitemaps</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Search engine ranking, XML Google News indexing, canonical tags, and structured Schema data.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        {[
          { key: 'general', label: 'Meta & Search Console' },
          { key: 'sitemaps', label: 'XML & Google News Sitemaps' },
          { key: 'robots', label: 'Robots.txt Editor' },
          { key: 'schema', label: 'Schema.org JSON-LD' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'general' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 max-w-2xl">
          <h2 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
            Search Console & OpenGraph
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google Search Console Verification Meta Tag
              </label>
              <input
                type="text"
                value={googleVerification}
                onChange={(e) => setGoogleVerification(e.target.value)}
                placeholder="google-site-verification=..."
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default OpenGraph Share Title
              </label>
              <input
                type="text"
                defaultValue="Alif News 24 - America's 24/7 Live Breaking News & Analysis"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <button
              onClick={handleSaveRobots}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all"
            >
              Save SEO Settings
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'sitemaps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standard XML Sitemap */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Standard XML Sitemap</h3>
                <span className="text-[11px] font-mono text-sky-600">/sitemap.xml</span>
              </div>
              <button
                onClick={() => handleCopy(xmlSitemapContent)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72">
              {xmlSitemapContent}
            </pre>
          </div>

          {/* Google News Sitemap */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Google News Sitemap</h3>
                <span className="text-[11px] font-mono text-sky-600">/google-news-sitemap.xml</span>
              </div>
              <button
                onClick={() => handleCopy(googleNewsSitemapContent)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-cyan-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72">
              {googleNewsSitemapContent}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'robots' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900">Robots.txt Configuration</h3>
            <span className="text-xs text-slate-400 font-mono">/robots.txt</span>
          </div>
          <textarea
            rows={8}
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            className="w-full p-4 font-mono text-xs bg-slate-950 text-slate-200 rounded-xl focus:outline-hidden"
          />
          <button
            onClick={handleSaveRobots}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
          >
            Save Robots.txt
          </button>
        </div>
      )}

      {activeSubTab === 'schema' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900">Schema.org NewsArticle JSON-LD Preview</h3>
            <button
              onClick={() => handleCopy(JSON.stringify(newsArticleJsonLd, null, 2))}
              className="text-xs text-sky-600 font-bold"
            >
              Copy JSON-LD
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-purple-300 font-mono text-xs rounded-xl overflow-x-auto max-h-80">
            {JSON.stringify(newsArticleJsonLd, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
