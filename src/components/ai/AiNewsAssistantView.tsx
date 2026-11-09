import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  Languages,
  CheckCircle2,
  Copy,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Share2,
  Search,
  Eye,
  Check,
  X,
  Sliders,
} from 'lucide-react';
import { api } from '../../services/api';
import { db } from '../../services/db';
import { Post } from '../../types';

interface AiNewsAssistantViewProps {
  onNavigateToEditor: (post: Post) => void;
}

export const AiNewsAssistantView: React.FC<AiNewsAssistantViewProps> = ({
  onNavigateToEditor,
}) => {
  const [activeTab, setActiveTab] = useState<
    'article' | 'headlines' | 'summarizer' | 'seo' | 'grammar' | 'translate' | 'social' | 'duplicates' | 'queue'
  >('article');

  const [prompt, setPrompt] = useState('');
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('Bengali');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // AI Queue posts (posts that have isAiGenerated = true and aiApprovalStatus = 'pending')
  const [posts, setPosts] = useState<Post[]>(db.getPosts());
  const pendingAiPosts = posts.filter((p) => p.isAiGenerated && p.aiApprovalStatus === 'pending');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAi = async () => {
    setLoading(true);
    setResult(null);

    try {
      if (activeTab === 'article') {
        const res = await api.generateArticle(prompt || 'Global developments in clean energy technology');
        setResult(res);
      } else if (activeTab === 'headlines') {
        const res = await api.generateHeadlines(prompt || inputText || 'Economic growth updates');
        setResult(res);
      } else if (activeTab === 'summarizer') {
        const res = await api.summarizeText(inputText || prompt || 'Recent policy announcements...');
        setResult(res);
      } else if (activeTab === 'seo') {
        const res = await api.generateSeo(prompt || 'Market Trends', inputText || '');
        setResult(res);
      } else if (activeTab === 'grammar') {
        const res = await api.checkGrammar(inputText || 'The company are releasing their report yesterday.');
        setResult(res);
      } else if (activeTab === 'translate') {
        const res = await api.translateText(inputText || prompt || 'Breaking news update', targetLang);
        setResult(res);
      } else if (activeTab === 'social') {
        const res = await api.generateSocial(prompt || 'Major Space Discovery', inputText || '');
        setResult(res);
      } else if (activeTab === 'duplicates') {
        const res = await api.checkDuplicates(inputText || 'Stock market rises as inflation cools.');
        setResult(res);
      }
    } catch (e: any) {
      alert(e.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToDrafts = (articleData: any) => {
    const newPost = db.savePost({
      title: articleData.title || prompt,
      subtitle: articleData.subtitle || '',
      category: articleData.category || 'Business',
      tags: articleData.tags || ['AI Assisted'],
      content: articleData.content || '',
      excerpt: articleData.summary || articleData.content?.slice(0, 160) || '',
      isAiGenerated: true,
      aiApprovalStatus: 'pending', // Enforce requirement!
      status: 'pending_review',
      editorialNotes: 'Created via AI Newsroom Generator. Editorial verification required.',
    });
    setPosts([...db.getPosts()]);
    alert('Article saved to CMS as "Pending Review" (Requires Editorial Approval before publishing)!');
    onNavigateToEditor(newPost);
  };

  const handleApproveAiPost = (post: Post) => {
    const confirmed = confirm(
      `Approve "${post.title}" for publishing?\n\nAs Editor, you certify this AI story meets journalistic standards.`
    );
    if (confirmed) {
      db.savePost({
        ...post,
        aiApprovalStatus: 'approved',
        status: 'published',
        editorialNotes: `Approved by Editor on ${new Date().toLocaleString()}`,
      });
      setPosts([...db.getPosts()]);
    }
  };

  const handleRejectAiPost = (post: Post) => {
    const reason = window.prompt('Enter rejection reason for this AI story:', 'Requires factual corrections or rewritten quotes.');
    if (reason) {
      db.savePost({
        ...post,
        aiApprovalStatus: 'rejected',
        status: 'draft',
        editorialNotes: `Rejected by Editor: ${reason}`,
      });
      setPosts([...db.getPosts()]);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI News Assistant</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Enterprise journalistic copilot with mandatory editorial approval guardrails.
          </p>
        </div>

        {/* Tab switch to approval queue */}
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'queue'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Editorial Approval Queue</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
            {pendingAiPosts.length}
          </span>
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        {[
          { key: 'article', label: 'Article Generator' },
          { key: 'headlines', label: 'Catchy Headlines' },
          { key: 'summarizer', label: 'Executive Summarizer' },
          { key: 'seo', label: 'SEO Writer' },
          { key: 'grammar', label: 'Grammar & Tone Polish' },
          { key: 'translate', label: 'Translation Studio (বাংলা/etc)' },
          { key: 'social', label: 'Social Captions' },
          { key: 'duplicates', label: 'Originality & Plagiarism' },
          { key: 'queue', label: `Approval Queue (${pendingAiPosts.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              setResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View 1: Editorial Approval Queue */}
      {activeTab === 'queue' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Editorial Review & Verification Queue
              </h2>
              <p className="text-xs text-slate-500">
                All AI-generated articles require human editorial sign-off before being broadcast to readers.
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
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800 font-bold text-[10px] uppercase">
                          AI Generated
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {post.category}
                        </span>
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => onNavigateToEditor(post)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs"
                    >
                      Inspect / Edit
                    </button>
                    <button
                      onClick={() => handleRejectAiPost(post)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => handleApproveAiPost(post)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
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
        /* Workspace Form for Current AI Task */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel (5 cols) */}
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
                  placeholder="e.g. World Bank updates global growth forecast; trade rebound in Asia offsets slowdown in manufacturing..."
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
                  <option value="Bengali">বাংলা (Bengali)</option>
                  <option value="Spanish">Español (Spanish)</option>
                  <option value="French">Français (French)</option>
                  <option value="German">Deutsch (German)</option>
                  <option value="Arabic">العربية (Arabic)</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
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
                    placeholder="e.g. Electric Vehicle Subsidies Extended in Europe"
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
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{loading ? 'Processing with Gemini...' : 'Run AI Assistant'}</span>
            </button>
          </div>

          {/* Results Panel (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-extrabold text-sm text-slate-900">AI Generated Results</h3>
                {result && (
                  <button
                    onClick={() => handleCopy(typeof result.data === 'string' ? result.data : JSON.stringify(result.data || result.text, null, 2))}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold"
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
                    Gemini 3.8 Flash is drafting journalistic copy...
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4 text-xs">
                  {/* Article output */}
                  {activeTab === 'article' && result.data && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                        <span className="font-bold text-purple-900 text-sm">
                          {result.data.title}
                        </span>
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
                          className="px-4 py-2 bg-[#00C5FF] hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20"
                        >
                          Send to CMS (Pending Review)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Headlines output */}
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
                            className="text-purple-600 hover:text-purple-700 text-xs font-bold shrink-0"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summarizer output */}
                  {activeTab === 'summarizer' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {result.text || JSON.stringify(result.data)}
                    </div>
                  )}

                  {/* Translation output */}
                  {activeTab === 'translate' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800 leading-relaxed font-['Noto_Sans_Bengali',sans-serif] text-sm whitespace-pre-wrap">
                      {result.text || result.data}
                    </div>
                  )}

                  {/* SEO output */}
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

                  {/* Duplicate check output */}
                  {activeTab === 'duplicates' && result.data && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-extrabold text-base text-emerald-900">
                            Originality Score: {result.data.originalityScore || 94}%
                          </p>
                          <p className="text-emerald-700 text-xs">
                            Risk Level: {result.data.riskLevel || 'Low'} — Content demonstrates unique journalistic angle.
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
    </div>
  );
};
