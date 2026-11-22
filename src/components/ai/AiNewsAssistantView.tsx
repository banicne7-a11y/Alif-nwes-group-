import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Globe,
  ExternalLink,
  PenTool,
  Flame,
  Send,
  X,
} from 'lucide-react';
import { api, LiveTrendItem, AnalyzedTrendTopic } from '../../services/api';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { Post, TargetCountry } from '../../types';
import { COUNTRY_EDITIONS, CountryRouteSlug } from '../../utils/countryEditions';
import { parseTextToEditorBlocks } from '../../utils/articleFormatter';

interface AiNewsAssistantViewProps {
  onNavigateToEditor: (post: Post) => void;
}

const TREND_COUNTRY_OPTIONS: Array<{
  code: CountryRouteSlug;
  geo: 'US' | 'GB' | 'CA' | 'AU';
  flag: string;
  label: string;
  sublabel: string;
}> = [
  { code: 'usa', geo: 'US', flag: '🇺🇸', label: 'USA Trends', sublabel: 'High CPC' },
  { code: 'uk', geo: 'GB', flag: '🇬🇧', label: 'UK Trends', sublabel: 'United Kingdom' },
  { code: 'canada', geo: 'CA', flag: '🇨🇦', label: 'Canada Trends', sublabel: 'North America' },
  { code: 'australia', geo: 'AU', flag: '🇦🇺', label: 'Australia Trends', sublabel: 'Oceania' },
];

export const AiNewsAssistantView: React.FC<AiNewsAssistantViewProps> = ({
  onNavigateToEditor,
}) => {
  const [activeTab, setActiveTab] = useState<
    'trends' | 'article' | 'headlines' | 'summarizer' | 'seo' | 'grammar' | 'translate' | 'social' | 'duplicates' | 'queue'
  >('trends');

  // Google Trends + AI Analyzer state
  const [selectedTrendCountry, setSelectedTrendCountry] = useState<CountryRouteSlug>('usa');
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [liveTrends, setLiveTrends] = useState<LiveTrendItem[]>([]);
  const [trendsFetchedAt, setTrendsFetchedAt] = useState<string>('');
  const [analyzingTrends, setAnalyzingTrends] = useState(false);
  const [analyzedMap, setAnalyzedMap] = useState<Record<string, AnalyzedTrendTopic>>({});
  const [wordCountTarget, setWordCountTarget] = useState<'medium' | 'long'>('medium');
  const [writingTopicId, setWritingTopicId] = useState<string | null>(null);
  const [quickPublishDraft, setQuickPublishDraft] = useState<Post | null>(null);
  const [quickDraftTitle, setQuickDraftTitle] = useState('');
  const [quickDraftImage, setQuickDraftImage] = useState('');
  const [quickDraftCategory, setQuickDraftCategory] = useState('Business');
  const [quickDraftBreaking, setQuickDraftBreaking] = useState(true);

  // Classic AI workspace state
  const [prompt, setPrompt] = useState('');
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('Bengali');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [posts, setPosts] = useState<Post[]>(db.getPosts());
  const pendingAiPosts = posts.filter((p) => p.isAiGenerated && p.aiApprovalStatus === 'pending');

  const loadTrends = async (countrySlug: CountryRouteSlug) => {
    const cfg = TREND_COUNTRY_OPTIONS.find((c) => c.code === countrySlug) || TREND_COUNTRY_OPTIONS[0];
    setTrendsLoading(true);
    setTrendsError(null);
    setAnalyzedMap({});
    try {
      const res = await api.fetchGoogleTrends(cfg.geo);
      if (!res.success || !Array.isArray(res.items)) {
        throw new Error(res.error || 'Could not load Google Trends RSS');
      }
      setLiveTrends(res.items);
      setTrendsFetchedAt(res.fetchedAt || new Date().toISOString());
    } catch (err: any) {
      setTrendsError(err?.message || 'Google Trends লোড করতে সমস্যা হয়েছে।');
      setLiveTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trends' && liveTrends.length === 0 && !trendsLoading) {
      loadTrends(selectedTrendCountry);
    }
  }, [activeTab]);

  const handleAnalyzeAllTrends = async () => {
    if (liveTrends.length === 0) {
      toast.warning('আগে কোনো দেশের Google Trends লোড করুন।');
      return;
    }
    setAnalyzingTrends(true);
    try {
      const countryLabel = COUNTRY_EDITIONS[selectedTrendCountry].fullName;
      const res = await api.analyzeTrends(countryLabel, liveTrends);
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.error || 'AI analysis failed. Check GEMINI_API_KEY configuration.');
      }
      const map: Record<string, AnalyzedTrendTopic> = {};
      for (const item of res.data) {
        if (item?.topic) {
          map[item.topic.toLowerCase().trim()] = item;
        }
      }
      setAnalyzedMap(map);
      toast.success(`⚡ ${res.data.length}টি ট্রেন্ডিং টপিক AI দিয়ে বিশ্লেষণ করা হয়েছে!`);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('GEMINI_API_KEY')) {
        toast.error(
          'সার্ভারে GEMINI_API_KEY সেট করা নেই—AI অ্যানালাইসিস চালাতে Vercel Environment Variables-এ GEMINI_API_KEY যোগ করুন।'
        );
      } else {
        toast.error(msg || 'AI দিয়ে ট্রেন্ড অ্যানালাইসিস করা যায়নি।');
      }
    } finally {
      setAnalyzingTrends(false);
    }
  };

  const handleWriteArticleFromTrend = async (trend: LiveTrendItem, mode: 'quick' | 'editor' = 'quick') => {
    const analysis = analyzedMap[trend.title.toLowerCase().trim()];
    setWritingTopicId(trend.id);

    const newsContext = (trend.newsItems || [])
      .map(
        (n, idx) =>
          `${idx + 1}. ${n.title}${n.source ? ` (${n.source})` : ''}${n.snippet ? ` — ${n.snippet}` : ''}`
      )
      .join('\n');

    try {
      const res = await api.generateTrendArticle({
        topic: trend.title,
        country: selectedTrendCountry,
        suggestedAngle:
          analysis?.recommendedAngle ||
          `Clear newsroom explainer on "${trend.title}" and why it is trending right now`,
        newsContext,
        wordCountTarget,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'AI could not generate the trend article.');
      }

      const d = res.data;
      const cleanBody = String(d.content || d.summary || '');
      const blocks = parseTextToEditorBlocks(cleanBody);
      const cleanExcerpt = String(d.summary || d.metaDescription || cleanBody)
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
      const validThumb =
        trend.picture && trend.picture.startsWith('http')
          ? trend.picture
          : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80';

      const newPost = db.savePost({
        title: d.title || analysis?.suggestedTitle || trend.title,
        subtitle: d.subtitle || cleanExcerpt || '',
        slug: d.slug || undefined,
        category: d.category || analysis?.category || 'Business',
        tags: Array.isArray(d.tags) && d.tags.length > 0 ? d.tags : [trend.title, selectedTrendCountry.toUpperCase()],
        content: cleanBody,
        blocks: blocks.length > 0 ? blocks : undefined,
        excerpt: cleanExcerpt,
        featuredImage: validThumb,
        targetCountry: selectedTrendCountry as TargetCountry,
        isAiGenerated: true,
        isTrending: true,
        aiApprovalStatus: 'pending',
        status: 'pending_review',
        editorialNotes: `Google Trends (${selectedTrendCountry.toUpperCase()}) topic "${trend.title}" drafted via Gemini 4 Hydrogen.`,
        seo: {
          title: d.seoTitle || d.title || trend.title,
          description: d.metaDescription || cleanExcerpt || '',
          focusKeyword: d.seoKeyword || analysis?.targetKeyword || trend.title,
          secondaryKeywords: Array.isArray(d.tags) ? d.tags : [],
          score: 88,
        },
      });

      setPosts([...db.getPosts()]);
      if (mode === 'quick') {
        setQuickPublishDraft(newPost);
        setQuickDraftTitle(newPost.title);
        setQuickDraftImage(newPost.featuredImage || validThumb);
        setQuickDraftCategory(newPost.category || 'Business');
        setQuickDraftBreaking(true);
        toast.success(`✅ খসড়া রেডি! রিভিউ করে ১ ক্লিকেই Publish করুন।`);
      } else {
        toast.success(
          `✅ "${newPost.title}" খসড়া তৈরি হয়েছে (${COUNTRY_EDITIONS[selectedTrendCountry].flag} /${selectedTrendCountry}/)!`
        );
        onNavigateToEditor(newPost);
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (mode === 'editor' && msg.includes('GEMINI_API_KEY')) {
        const validThumb =
          trend.picture && trend.picture.startsWith('http')
            ? trend.picture
            : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80';
        const bulletSummary = (trend.newsItems || [])
          .map((n) => `• ${n.title}${n.source ? ` (${n.source})` : ''}`)
          .join('\n');
        const starterBody = [
          `## Why Is "${trend.title}" Trending Today?`,
          bulletSummary || `Latest updates and background context on ${trend.title}.`,
          `## Key Details & What to Know`,
          `Write or paste your full verified report here...`,
        ].join('\n\n');
        const blocks = parseTextToEditorBlocks(starterBody);
        const draftPost = db.savePost({
          title: analysis?.suggestedTitle || trend.title,
          subtitle: trend.newsItems?.[0]?.title || '',
          category: analysis?.category || 'Business',
          tags: [trend.title, selectedTrendCountry.toUpperCase()],
          content: starterBody,
          blocks: blocks.length > 0 ? blocks : undefined,
          excerpt: trend.newsItems?.[0]?.title || `${trend.title} latest updates.`,
          featuredImage: validThumb,
          targetCountry: selectedTrendCountry as TargetCountry,
          isTrending: true,
          status: 'draft',
          seo: {
            title: analysis?.suggestedTitle || trend.title,
            description: trend.newsItems?.[0]?.title || `Read the latest updates about ${trend.title} on Alif News 24.`,
            focusKeyword: analysis?.targetKeyword || trend.title,
            secondaryKeywords: [trend.title],
            score: 65,
          },
        });
        setPosts([...db.getPosts()]);
        toast.info('AI Key না থাকায় টপিকটি সরাসরি Editor-এ ওপেন করা হয়েছে—এখন লিখে Publish করতে পারবেন।');
        onNavigateToEditor(draftPost);
      } else if (msg.includes('GEMINI_API_KEY')) {
        toast.error(
          "AI দিয়ে লিখতে Vercel-এ GEMINI_API_KEY যোগ করুন, অথবা বাম পাশের 'Editor' বাটনে চাপ দিয়ে সরাসরি পোস্ট লিখুন।"
        );
      } else {
        toast.error(msg || 'আর্টিকেল তৈরি করতে সমস্যা হয়েছে।');
      }
    } finally {
      setWritingTopicId(null);
    }
  };

  const handleConfirmQuickPublish = () => {
    if (!quickPublishDraft) return;
    db.savePost({
      ...quickPublishDraft,
      title: quickDraftTitle.trim() || quickPublishDraft.title,
      featuredImage: quickDraftImage.trim() || quickPublishDraft.featuredImage,
      category: quickDraftCategory || quickPublishDraft.category,
      categories: [quickDraftCategory || quickPublishDraft.category],
      isBreaking: quickDraftBreaking,
      isTrending: true,
      aiApprovalStatus: 'approved',
      status: 'published',
      editorialNotes: `Quick-verified & published from Google Trends AI (${new Date().toLocaleString()})`,
    });
    setPosts([...db.getPosts()]);
    toast.success(`🚀 পোস্ট লাইভ হয়ে গেছে! (${COUNTRY_EDITIONS[quickPublishDraft.targetCountry || selectedTrendCountry].flag})`);
    setQuickPublishDraft(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAi = async () => {
    setLoading(true);
    setResult(null);

    try {
      let res: any = null;
      if (activeTab === 'article') {
        res = await api.generateArticle(prompt || 'Global developments in clean energy technology');
      } else if (activeTab === 'headlines') {
        res = await api.generateHeadlines(prompt || inputText || 'Economic growth updates');
      } else if (activeTab === 'summarizer') {
        res = await api.summarizeText(inputText || prompt || 'Recent policy announcements...');
      } else if (activeTab === 'seo') {
        res = await api.generateSeo(prompt || 'Market Trends', inputText || '');
      } else if (activeTab === 'grammar') {
        res = await api.checkGrammar(inputText || 'The company are releasing their report yesterday.');
      } else if (activeTab === 'translate') {
        res = await api.translateText(inputText || prompt || 'Breaking news update', targetLang);
      } else if (activeTab === 'social') {
        res = await api.generateSocial(prompt || 'Major Space Discovery', inputText || '');
      } else if (activeTab === 'duplicates') {
        res = await api.checkDuplicates(inputText || 'Stock market rises as inflation cools.');
      }

      if (res && !res.success) {
        toast.error(res.error || 'AI request failed');
      } else {
        setResult(res);
      }
    } catch (e: any) {
      toast.error(e.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToDrafts = (articleData: any) => {
    const cleanBody = articleData.content || '';
    const blocks = parseTextToEditorBlocks(cleanBody);
    const newPost = db.savePost({
      title: articleData.title || prompt,
      subtitle: articleData.subtitle || '',
      category: articleData.category || 'Business',
      tags: articleData.tags || ['AI Assisted'],
      content: cleanBody,
      blocks: blocks.length > 0 ? blocks : undefined,
      excerpt: articleData.summary || cleanBody.slice(0, 160),
      targetCountry: 'usa',
      isAiGenerated: true,
      aiApprovalStatus: 'pending',
      status: 'pending_review',
      editorialNotes: 'Created via AI Newsroom Generator. Editorial verification required.',
    });
    setPosts([...db.getPosts()]);
    toast.success('Article saved to CMS as "Pending Review"!');
    onNavigateToEditor(newPost);
  };

  const handleApproveAiPost = (post: Post) => {
    toast.confirm({
      title: 'Editorial Approval Certification',
      message: `Approve "${post.title}" for publishing? As Editor, you certify this AI story meets journalistic standards.`,
      confirmLabel: 'Certify & Publish',
      onConfirm: () => {
        db.savePost({
          ...post,
          aiApprovalStatus: 'approved',
          status: 'published',
          editorialNotes: `Approved by Editor on ${new Date().toLocaleString()}`,
        });
        setPosts([...db.getPosts()]);
        toast.success(`"${post.title}" certified and published to the live portal!`);
      },
    });
  };

  const handleRejectAiPost = (post: Post) => {
    db.savePost({
      ...post,
      aiApprovalStatus: 'rejected',
      status: 'draft',
      editorialNotes: 'Returned to draft by Editor for manual factual adjustments.',
    });
    setPosts([...db.getPosts()]);
    toast.info(`"${post.title}" returned to drafts.`);
  };

  // Sort trends by AI opportunity score if analyzed
  const sortedTrends = [...liveTrends].sort((a, b) => {
    const scoreA = analyzedMap[a.title.toLowerCase().trim()]?.opportunityScore ?? -1;
    const scoreB = analyzedMap[b.title.toLowerCase().trim()]?.opportunityScore ?? -1;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AI News & Google Trends Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Gemini 4 Hydrogen
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Google Trends বিশ্লেষণ করে কম-কম্পিটিশনের টপিক বাছাই ও ইংরেজি আর্টিকেল তৈরি করুন (ভিডিও ছাড়াই)।
          </p>
        </div>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Approval Queue</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
            {pendingAiPosts.length}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        {[
          { key: 'trends', label: '🔥 Google Trends AI' },
          { key: 'article', label: 'Article Generator' },
          { key: 'headlines', label: 'Catchy Headlines' },
          { key: 'summarizer', label: 'Summarizer' },
          { key: 'seo', label: 'SEO Writer' },
          { key: 'grammar', label: 'Grammar Polish' },
          { key: 'translate', label: 'Translation Studio' },
          { key: 'social', label: 'Social Captions' },
          { key: 'duplicates', label: 'Originality Check' },
          { key: 'queue', label: `Approval Queue (${pendingAiPosts.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              setResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 0: GOOGLE TRENDS ANALYZER & 1-CLICK AI WRITER */}
      {activeTab === 'trends' ? (
        <div className="space-y-5">
          {/* Country Picker & Action Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  <span>দেশ অনুযায়ী লাইভ Google Trends ও AI অ্যানালাইজার</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ১. দেশ বেছে নিন → ২. "Analyze with AI" চাপুন → ৩. সহজ (Low Competition) টপিকে "Write Article" ক্লিক করে Editor-এ নিয়ে Publish করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={wordCountTarget}
                  onChange={(e) => setWordCountTarget(e.target.value as 'medium' | 'long')}
                  aria-label="Article length selector"
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                >
                  <option value="medium">Fast News (~700 words)</option>
                  <option value="long">In-Depth Guide (~1100 words)</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadTrends(selectedTrendCountry)}
                  disabled={trendsLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${trendsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Trends</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnalyzeAllTrends}
                  disabled={analyzingTrends || liveTrends.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-yellow-300 ${analyzingTrends ? 'animate-pulse' : ''}`} />
                  <span>{analyzingTrends ? 'AI বিশ্লেষণ করছে...' : 'Analyze Competition with AI'}</span>
                </button>
              </div>
            </div>

            {/* Country Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TREND_COUNTRY_OPTIONS.map((c) => {
                const active = selectedTrendCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedTrendCountry(c.code);
                      loadTrends(c.code);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{c.flag}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          active ? 'bg-sky-500 text-slate-950' : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                      >
                        /{c.code}
                      </span>
                    </div>
                    <p className="font-bold text-xs mt-1.5">{c.label}</p>
                    <p className={`text-[10px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                      {c.sublabel}
                    </p>
                  </button>
                );
              })}
            </div>

            {trendsFetchedAt && (
              <p className="text-[11px] text-slate-400">
                Showing {liveTrends.length} live topics for {COUNTRY_EDITIONS[selectedTrendCountry].flag}{' '}
                <strong>{COUNTRY_EDITIONS[selectedTrendCountry].fullName}</strong> · Updated{' '}
                {new Date(trendsFetchedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Trends Error State */}
          {trendsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center justify-between gap-3">
              <span>⚠️ {trendsError}</span>
              <button
                type="button"
                onClick={() => loadTrends(selectedTrendCountry)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Trends Loading Skeleton */}
          {trendsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 w-2/3 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedTrends.map((trend) => {
                const analysis = analyzedMap[trend.title.toLowerCase().trim()];
                const isWriting = writingTopicId === trend.id;
                const diffColor =
                  analysis?.difficulty === 'Low'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : analysis?.difficulty === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200';

                return (
                  <div
                    key={trend.id}
                    className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between gap-4 transition-all ${
                      analysis?.difficulty === 'Low'
                        ? 'border-emerald-300 ring-1 ring-emerald-200'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {trend.picture && (
                            <img
                              src={trend.picture}
                              alt={trend.title}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                {trend.approxTraffic}
                              </span>
                              {analysis && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${diffColor}`}>
                                  {analysis.difficulty === 'Low'
                                    ? `Easy · Score ${analysis.opportunityScore}/100`
                                    : `${analysis.difficulty} · ${analysis.opportunityScore}/100`}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1">
                              {trend.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendation Box if analyzed */}
                      {analysis && (
                        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1 text-xs">
                          <p className="font-bold text-purple-900">
                            💡 Suggested Headline: {analysis.suggestedTitle}
                          </p>
                          <p className="text-slate-700 text-[11px]">
                            <strong>Angle:</strong> {analysis.recommendedAngle}
                          </p>
                          <p className="text-slate-600 text-[11px]">{analysis.reason}</p>
                        </div>
                      )}

                      {/* Verified Current Headlines from Google Trends RSS */}
                      {trend.newsItems.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Latest Context Headlines
                          </p>
                          {trend.newsItems.slice(0, 2).map((n, i) => (
                            <div key={i} className="text-xs text-slate-600 flex items-start justify-between gap-2">
                              <span className="line-clamp-2">
                                • {n.title}{' '}
                                {n.source && <strong className="text-slate-400 font-semibold">({n.source})</strong>}
                              </span>
                              {n.url && (
                                <a
                                  href={n.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-600 hover:text-sky-700 shrink-0 mt-0.5"
                                  title="Open source headline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action footer */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        /{selectedTrendCountry}/
                      </span>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleWriteArticleFromTrend(trend, 'editor')}
                          disabled={isWriting || writingTopicId !== null}
                          className="min-h-[40px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Editor</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWriteArticleFromTrend(trend, 'quick')}
                          disabled={isWriting || writingTopicId !== null}
                          className="min-h-[40px] px-4 py-2 bg-[#00C5FF] hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {isWriting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Writing...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>⚡ Write & Publish</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'queue' ? (
        /* Editorial Approval Queue */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Editorial Review & Verification Queue
              </h2>
              <p className="text-xs text-slate-500">
                All AI-generated articles require human editorial sign-off before being published live.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              {pendingAiPosts.length} Pending Approval
            </span>
          </div>

          {pendingAiPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">All AI Content Cleared</p>
              <p className="text-xs">No pending AI stories awaiting editorial sign-off.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAiPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 border border-amber-200/80 bg-amber-50/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex gap-4 items-start">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-16 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800 font-bold text-[10px] uppercase">
                          AI Generated
                        </span>
                        <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {COUNTRY_EDITIONS[post.targetCountry || 'usa'].flag}{' '}
                          {COUNTRY_EDITIONS[post.targetCountry || 'usa'].label}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{post.category}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{post.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {post.excerpt || post.subtitle}
                      </p>
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        Notes: {post.editorialNotes || 'Awaiting initial fact-check.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => onNavigateToEditor(post)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
                    >
                      Inspect / Edit
                    </button>
                    <button
                      onClick={() => handleRejectAiPost(post)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => handleApproveAiPost(post)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Classic Workspace Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 capitalize">
              {activeTab} Assistant Input
            </h3>

            {activeTab === 'article' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Article Topic or News Flash *
                </label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. World Bank updates global growth forecast..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {activeTab === 'headlines' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  News Topic or Draft Title *
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Tech earnings report and AI chips surge"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {(activeTab === 'summarizer' || activeTab === 'grammar' || activeTab === 'translate' || activeTab === 'duplicates') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  News Text / Copy to Process *
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste article body or paragraph here..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {activeTab === 'translate' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Arabic">Arabic (العربية)</option>
                </select>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Story Title</label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Electric Vehicle Subsidies Extended"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Story Summary / Excerpt</label>
                  <textarea
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Key facts from the article..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Story Headline</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Landmark AI Accord Signed at Global Summit"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
            )}

            <button
              onClick={handleRunAi}
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{loading ? 'Processing with Gemini 4...' : 'Run AI Assistant'}</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-extrabold text-sm text-slate-900">AI Generated Results</h3>
                {result && (
                  <button
                    onClick={() =>
                      handleCopy(
                        typeof result.data === 'string'
                          ? result.data
                          : JSON.stringify(result.data || result.text, null, 2)
                      )
                    }
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                )}
              </div>

              {!result && !loading && (
                <div className="py-16 text-center text-slate-400">
                  <Sparkles className="w-10 h-10 mx-auto text-purple-300 mb-2" />
                  <p className="font-semibold text-slate-600">Assistant Ready</p>
                  <p className="text-xs">Fill in your prompt on the left and run the assistant.</p>
                </div>
              )}

              {loading && (
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-semibold text-purple-600 animate-pulse">
                    Gemini 4 Hydrogen is drafting journalistic copy...
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4 text-xs">
                  {activeTab === 'article' && result.data && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                        <span className="font-bold text-purple-900 text-sm">{result.data.title}</span>
                        <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded-sm font-bold text-[10px]">
                          {result.data.category}
                        </span>
                      </div>
                      <p className="font-medium text-slate-600 italic">{result.data.subtitle}</p>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 leading-relaxed text-slate-700">
                        <p>{result.data.summary}</p>
                        <div className="pt-2 border-t border-slate-200 text-slate-800 whitespace-pre-wrap">
                          {result.data.content}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Requires Editorial Approval
                        </span>
                        <button
                          onClick={() => handleSendToDrafts(result.data)}
                          className="px-4 py-2 bg-[#00C5FF] hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                          Send to CMS (Pending Review)
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'headlines' && (
                    <div className="space-y-2">
                      <p className="font-bold text-slate-700 mb-2">5 High-CTR Journalistic Headlines:</p>
                      {(Array.isArray(result.data) ? result.data : [result.text]).map((h: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                        >
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {idx + 1}. {h}
                          </span>
                          <button
                            onClick={() => handleCopy(h)}
                            className="text-purple-600 hover:text-purple-700 text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'summarizer' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {result.text || JSON.stringify(result.data)}
                    </div>
                  )}

                  {activeTab === 'translate' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800 leading-relaxed font-['Noto_Sans_Bengali',sans-serif] text-sm whitespace-pre-wrap">
                      {result.text || result.data}
                    </div>
                  )}

                  {activeTab === 'seo' && result.data && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400">Focus Keyword</span>
                        <p className="font-bold text-sky-600 text-sm">{result.data.focusKeyword}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400">Google SERP Title Preview</span>
                        <p className="font-bold text-blue-700 text-sm hover:underline">{result.data.seoTitle}</p>
                        <p className="text-slate-600 text-xs">{result.data.metaDescription}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'grammar' && result.data && (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                        {result.data.correctedText}
                      </div>
                      {result.data.readabilityScore && (
                        <p className="text-emerald-700 font-bold">
                          Readability: {result.data.readabilityScore}
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'social' && result.data && (
                    <div className="space-y-3">
                      {Object.entries(result.data).map(([k, v]) => (
                        <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="uppercase text-[10px] font-bold text-slate-400">{k}</span>
                          <p className="text-slate-800 mt-1">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'duplicates' && result.data && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-extrabold text-base text-emerald-900">
                            Originality Score: {result.data.originalityScore || 94}%
                          </p>
                          <p className="text-emerald-700 text-xs">
                            Risk Level: {result.data.riskLevel || 'Low'} — {result.data.feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Quick Review & 1-Tap Publish Sheet */}
      {quickPublishDraft && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-black uppercase">
                  {COUNTRY_EDITIONS[quickPublishDraft.targetCountry || selectedTrendCountry].flag}{' '}
                  {COUNTRY_EDITIONS[quickPublishDraft.targetCountry || selectedTrendCountry].label}
                </span>
                <span className="text-sm font-extrabold text-slate-900">Quick Review &amp; Publish</span>
              </div>
              <button
                type="button"
                onClick={() => setQuickPublishDraft(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 mb-1">শিরোনাম (Headline)</label>
                <input
                  type="text"
                  value={quickDraftTitle}
                  onChange={(e) => setQuickDraftTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">ক্যাটাগরি</label>
                  <select
                    value={quickDraftCategory}
                    onChange={(e) => setQuickDraftCategory(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {db.getCategories().map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quickDraftBreaking}
                      onChange={(e) => setQuickDraftBreaking(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded-sm"
                    />
                    <span className="text-xs font-bold text-slate-800">Breaking News</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 mb-1">ছবির লিংক (Image URL)</label>
                <input
                  type="url"
                  value={quickDraftImage}
                  onChange={(e) => setQuickDraftImage(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl"
                />
                {quickDraftImage && (
                  <img
                    src={quickDraftImage}
                    alt="Draft visual"
                    className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-[11px] font-extrabold text-slate-500 uppercase">Article Preview</p>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-6 whitespace-pre-line">
                  {quickPublishDraft.content}
                </p>
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const target = quickPublishDraft;
                  setQuickPublishDraft(null);
                  onNavigateToEditor(target);
                }}
                className="min-h-[46px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold cursor-pointer"
              >
                Open Editor
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickPublish}
                className="flex-1 min-h-[46px] px-5 py-2 bg-[#00C5FF] hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Publish Live Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
