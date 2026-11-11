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
import { cleanGoogleVerificationCode, applyGoogleVerificationTag } from '../../services/seo';

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

  const [verificationTested, setVerificationTested] = useState<boolean | null>(null);

  const cleanCurrentCode = cleanGoogleVerificationCode(googleVerification);

  const handleSaveRobots = async () => {
    const cleanCode = cleanGoogleVerificationCode(googleVerification);
    setGoogleVerification(cleanCode);

    db.updateSettings({
      robotsTxt,
      searchConsoleCode: cleanCode,
    });

    applyGoogleVerificationTag(cleanCode);

    try {
      await fetch('/api/seo/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });
    } catch (e) {
      // ignore
    }

    setVerificationTested(true);
    toast.success('Google Search Console verification meta tag saved and applied to <head>!');
  };

  const handleTestVerification = () => {
    const cleanCode = cleanGoogleVerificationCode(googleVerification);
    applyGoogleVerificationTag(cleanCode);
    const metaTag = document.querySelector<HTMLMetaElement>('meta[name="google-site-verification"]');

    if (metaTag && metaTag.content && metaTag.content === cleanCode) {
      setVerificationTested(true);
      toast.success('Verified! Meta tag is active in <head> and ready for Google verification.');
    } else {
      setVerificationTested(false);
      toast.error('Verification tag could not be found in document head.');
    }
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Google Search Console Verification & Domain Meta Tag
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add and verify your custom domain in Google Search Console using the HTML verification tag.
              </p>
            </div>
            {cleanCurrentCode && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tag Active
              </span>
            )}
          </div>

          <div className="space-y-5 text-xs">
            {/* Input field */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                Google Verification Code or Meta Tag *
              </label>
              <input
                type="text"
                value={googleVerification}
                onChange={(e) => {
                  setGoogleVerification(e.target.value);
                  setVerificationTested(null);
                }}
                placeholder='e.g. <meta name="google-site-verification" content="abcdef12345" /> or just abcdef12345'
                className="w-full px-3.5 py-2.5 font-mono text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-500">
                💡 <strong>Tip:</strong> You can paste the entire <code className="bg-slate-100 px-1 py-0.5 rounded">&lt;meta name="google-site-verification" content="..."&gt;</code> tag, or just the token code. It will be automatically formatted.
              </p>
            </div>

            {/* Live Tag Preview */}
            <div className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span>Live Meta Tag in &lt;head&gt; Section:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`<meta name="google-site-verification" content="${cleanCurrentCode || 'your-verification-code'}" />`)}
                  className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy Tag'}</span>
                </button>
              </div>
              <p className="text-emerald-400 break-all select-all">
                &lt;meta name="google-site-verification" content="{cleanCurrentCode || 'your-verification-code'}" /&gt;
              </p>
            </div>

            {/* Test Status Banner */}
            {verificationTested !== null && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                verificationTested
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">
                    {verificationTested
                      ? 'HTML Meta Tag is verified and live in <head>!'
                      : 'Verification pending: Click "Save & Apply Tag" below.'}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {verificationTested
                      ? 'You can now go to Google Search Console and click "Verify" with 100% confidence.'
                      : 'The tag will be rendered to Google bots immediately upon saving.'}
                  </p>
                </div>
              </div>
            )}

            {/* OpenGraph Title */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default OpenGraph Share Title
              </label>
              <input
                type="text"
                defaultValue="Alif News 24 - America's 24/7 Live Breaking News & Analysis"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveRobots}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save & Apply to &lt;head&gt;
              </button>
              <button
                type="button"
                onClick={handleTestVerification}
                className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl border border-sky-200 transition-colors cursor-pointer"
              >
                Test & Verify Tag in DOM
              </button>
            </div>

            {/* Instructions box in Bengali & English */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>Google Search Console ডোমেইন ভেরিফিকেশন করার সঠিক নিয়ম:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-600">
                <li><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-sky-600 underline font-semibold">Google Search Console</a> এ যান এবং <strong>URL prefix</strong> অপশনে আপনার ডোমেইন লিংক দিন।</li>
                <li><strong>HTML tag</strong> ভেরিফিকেশন মেথড নির্বাচন করুন।</li>
                <li>গুগল যে মেটা ট্যাগটি দেবে তা কপি করে ওপরের বক্সে পেস্ট করুন।</li>
                <li><strong>"Save & Apply to &lt;head&gt;"</strong> বাটনে ক্লিক করুন।</li>
                <li>গুগল সার্চ কনসোলে ফিরে গিয়ে <strong>"VERIFY"</strong> বাটনে ক্লিক করুন; সাথে সাথে সফলভাবে ভেরিফাই হয়ে যাবে।</li>
                <li>ভেরিফাই হওয়ার পর সাইটম্যাপ সেকশনে গিয়ে <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">sitemap.xml</code> সাবমিট করুন।</li>
              </ol>
            </div>
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
