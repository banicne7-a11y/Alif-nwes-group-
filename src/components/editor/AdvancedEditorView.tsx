import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Image as ImageIcon,
  Heading,
  AlignLeft,
  Quote,
  Table as TableIcon,
  Video,
  Code2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  Globe,
  Sliders,
  Calendar,
  Languages,
  Search,
  Tag,
  Check,
  RefreshCw,
  Smartphone,
  Monitor,
  ExternalLink,
  Lightbulb,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { toast } from '../../services/toast';
import { Post, EditorBlock, PostStatus } from '../../types';
import { formatArticleForReader, parseTextToEditorBlocks } from '../../utils/articleFormatter';

interface AdvancedEditorViewProps {
  postToEdit?: Post | null;
  onBack: () => void;
  onSaved: (post: Post) => void;
}

export const AdvancedEditorView: React.FC<AdvancedEditorViewProps> = ({
  postToEdit,
  onBack,
  onSaved,
}) => {
  const categories = db.getCategories();
  const allTags = db.getTags();

  // Core post state
  const [title, setTitle] = useState(postToEdit?.title || '');
  const [subtitle, setSubtitle] = useState(postToEdit?.subtitle || '');
  const [slug, setSlug] = useState(postToEdit?.slug || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const raw =
      postToEdit?.categories && postToEdit.categories.length > 0
        ? postToEdit.categories
        : postToEdit?.category
        ? [postToEdit.category]
        : [categories[0]?.name || 'Business'];
    return Array.from(new Set(raw.filter(Boolean)));
  });
  const category = selectedCategories[0] || 'Business';
  const [selectedTags, setSelectedTags] = useState<string[]>(postToEdit?.tags || ['News']);
  const [newTagInput, setNewTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState(
    postToEdit?.featuredImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80'
  );
  const [status, setStatus] = useState<PostStatus>(postToEdit?.status || 'draft');
  const [scheduledAt, setScheduledAt] = useState(postToEdit?.scheduledAt || '');
  const [isBreaking, setIsBreaking] = useState(!!postToEdit?.isBreaking);
  const [isTrending, setIsTrending] = useState(!!postToEdit?.isTrending);
  const [isEditorPick, setIsEditorPick] = useState(!!postToEdit?.isEditorPick);
  const [isHomepageSlider, setIsHomepageSlider] = useState(!!postToEdit?.isHomepageSlider);
  const [isAiGenerated, setIsAiGenerated] = useState(!!postToEdit?.isAiGenerated);
  const [editorialNotes, setEditorialNotes] = useState(postToEdit?.editorialNotes || '');

  // Advanced SEO & Meta Tags state
  const [seoFocusKeyword, setSeoFocusKeyword] = useState(postToEdit?.seo?.focusKeyword || '');
  const [seoTitle, setSeoTitle] = useState(postToEdit?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(postToEdit?.seo?.description || '');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(postToEdit?.seo?.secondaryKeywords || []);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState(postToEdit?.seo?.canonicalUrl || '');
  const [metaRobots, setMetaRobots] = useState(postToEdit?.seo?.metaRobots || 'index, follow');
  const [schemaType, setSchemaType] = useState(postToEdit?.seo?.schemaType || 'NewsArticle');
  const [seoActiveTab, setSeoActiveTab] = useState<'meta' | 'serp' | 'checklist' | 'advanced'>('meta');
  const [serpPreviewDevice, setSerpPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  // Gutenberg Blocks state
  const [blocks, setBlocks] = useState<EditorBlock[]>(
    postToEdit?.blocks && postToEdit.blocks.length > 0
      ? postToEdit.blocks
      : [
          {
            id: 'b-init-1',
            type: 'paragraph',
            content: 'Write the introductory lead paragraph here. Explain the who, what, where, and why of this story...',
          },
        ]
  );

  // AI Assistant drawer state
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Preview modal
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Calculate word count & SEO Score
  const fullText = [title, subtitle, ...blocks.map((b) => (typeof b.content === 'string' ? b.content : ''))].join(' ');
  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Comprehensive Real-Time SEO Audit & Scoring Engine (0 - 100)
  const calculateSeoAudit = () => {
    const leadText = blocks[0]?.content ? String(blocks[0].content).toLowerCase() : '';
    const cleanKey = seoFocusKeyword.trim().toLowerCase();

    const checks = {
      titleLength: title.length >= 35 && title.length <= 70,
      keywordInTitle: !!cleanKey && title.toLowerCase().includes(cleanKey),
      keywordInSlug: !!cleanKey && (slug || title).toLowerCase().includes(cleanKey.replace(/\s+/g, '-')),
      keywordInLead: !!cleanKey && leadText.includes(cleanKey),
      metaDescOptimal: seoDescription.length >= 100 && seoDescription.length <= 160,
      hasTags: selectedTags.length >= 3,
      hasSecondaryKeywords: secondaryKeywords.length > 0,
      wordCountAdequate: wordCount >= 250,
      hasHeadings: blocks.some((b) => b.type === 'heading'),
      hasImage: !!featuredImage,
    };

    let score = 20;
    if (checks.titleLength) score += 10;
    if (checks.keywordInTitle) score += 15;
    if (checks.keywordInSlug) score += 10;
    if (checks.keywordInLead) score += 10;
    if (checks.metaDescOptimal) score += 15;
    if (checks.hasTags) score += 5;
    if (checks.hasSecondaryKeywords) score += 5;
    if (checks.wordCountAdequate) score += 5;
    if (checks.hasHeadings) score += 5;
    if (checks.hasImage) score += 5;

    return {
      score: Math.min(100, Math.max(0, score)),
      checks,
    };
  };

  const seoAudit = calculateSeoAudit();
  const seoScore = seoAudit.score;

  // Block management
  const handleAddBlock = (type: EditorBlock['type']) => {
    const newBlock: EditorBlock = {
      id: `b-${Date.now()}`,
      type,
      content:
        type === 'heading'
          ? 'New Section Heading'
          : type === 'quote'
          ? 'Add impactful quotation or pullquote here...'
          : type === 'image'
          ? 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80'
          : type === 'table'
          ? [
              ['Indicator', 'Previous', 'Current'],
              ['Headline Rate', '3.4%', '3.1%'],
              ['Market Reaction', 'Neutral', 'Positive'],
            ]
          : type === 'callout'
          ? 'Key Takeaway: Crucial regulatory or market milestone observed.'
          : 'Write paragraph text here...',
      level: 2,
      caption: type === 'quote' ? 'Spokesperson, Industry Group' : '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlock = (id: string, updates: Partial<EditorBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      toast.warning('Articles require at least one content block.');
      return;
    }
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;
    setBlocks(newBlocks);
  };

  const handleAutoFormatBlocks = () => {
    const combinedRaw = blocks
      .map((b) => {
        if (b.type === 'heading') return `## ${b.content}`;
        if (b.type === 'quote') return `> ${b.content}`;
        if (b.type === 'paragraph') return String(b.content || '');
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    const nonTextBlocks = blocks.filter((b) => b.type === 'image' || b.type === 'table');
    const formatted = parseTextToEditorBlocks(combinedRaw);
    setBlocks([...formatted, ...nonTextBlocks]);
    toast.success(`Formatted into ${formatted.length} clean editorial blocks!`);
  };

  const handleParagraphPaste = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    blockIndex: number
  ) => {
    const pasted = e.clipboardData?.getData('text/plain') || '';
    // Automatically split pasted long multi-paragraph articles into structured blocks
    if (pasted.length > 350 || /\n\s*\n/.test(pasted) || (pasted.split('\n').length >= 3)) {
      e.preventDefault();
      const target = blocks[blockIndex];
      const currentVal = String(target?.content || '').trim();
      const combined =
        currentVal && !currentVal.startsWith('Write the introductory') && !currentVal.startsWith('Write paragraph')
          ? `${currentVal}\n\n${pasted}`
          : pasted;
      const splitBlocks = parseTextToEditorBlocks(combined);
      const next = [
        ...blocks.slice(0, blockIndex),
        ...splitBlocks,
        ...blocks.slice(blockIndex + 1),
      ];
      setBlocks(next);
      toast.success(`Auto-formatted pasted article into ${splitBlocks.length} clean blocks!`);
    }
  };

  // Tag and Keyword Handlers
  const handleToggleCategory = (catName: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === catName.toLowerCase());
      if (exists) {
        if (prev.length <= 1) {
          toast.warning('কমপক্ষে ১টি ক্যাটাগরি সিলেক্ট করা থাকতে হবে।');
          return prev;
        }
        return prev.filter((c) => c.toLowerCase() !== catName.toLowerCase());
      }
      return [...prev, catName];
    });
  };

  const handleSetPrimaryCategory = (catName: string) => {
    setSelectedCategories((prev) => [
      catName,
      ...prev.filter((c) => c.toLowerCase() !== catName.toLowerCase()),
    ]);
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
      setSelectedTags([...selectedTags, newTagInput.trim()]);
      db.saveTag(newTagInput.trim());
      setNewTagInput('');
    }
  };

  const handleQuickAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      db.saveTag(tag);
      toast.info(`Tag "${tag}" added!`);
    }
  };

  const handleAddSecondaryKeyword = () => {
    if (newSecondaryKeyword.trim() && !secondaryKeywords.includes(newSecondaryKeyword.trim())) {
      setSecondaryKeywords([...secondaryKeywords, newSecondaryKeyword.trim()]);
      setNewSecondaryKeyword('');
    }
  };

  const handleRemoveSecondaryKeyword = (kw: string) => {
    setSecondaryKeywords(secondaryKeywords.filter((k) => k !== kw));
  };

  // Popular Trending News Tags for 1-Click Addition
  const popularSuggestedTags = [
    'US Politics',
    'Wall Street',
    'Inflation',
    'Federal Reserve',
    'Artificial Intelligence',
    'Elections 2026',
    'Global Economy',
    'Health Tech',
    'Clean Energy',
    'SpaceX',
    'Cybersecurity',
    'Breaking News',
  ];

  // Smart AI SEO & Meta Automation Engine
  const handleAutoGenerateFullSeo = async () => {
    if (!title.trim() && blocks.length === 0) {
      toast.warning('Please enter an article headline or write content first so the AI can analyze it.');
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const sampleText = blocks.map((b) => (typeof b.content === 'string' ? b.content : '')).join('\n\n');
      const res = await api.generateSeo(title || 'Breaking News Update', sampleText);

      if (res.success && res.data) {
        const d = res.data;
        if (d.focusKeyword) setSeoFocusKeyword(d.focusKeyword);
        if (d.seoTitle) setSeoTitle(d.seoTitle);
        if (d.metaDescription) setSeoDescription(d.metaDescription);
        if (d.slug && !slug) setSlug(d.slug);
        if (d.secondaryKeywords && Array.isArray(d.secondaryKeywords)) {
          setSecondaryKeywords(d.secondaryKeywords);
          const merged = Array.from(new Set([...selectedTags, ...d.secondaryKeywords]));
          setSelectedTags(merged);
        }
        toast.success('⚡ Smart AI: Focus keyword, SEO title, meta description, and tags generated!');
      } else {
        // Smart fallback parser
        const words = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter((w) => w.length > 3);
        const autoKey = words.slice(0, 2).join(' ') || category.toLowerCase();
        setSeoFocusKeyword(autoKey);
        setSeoTitle(`${title.slice(0, 55)} | Alif News 24`);
        setSeoDescription(`${subtitle || title}. Read verified live investigative analysis and market implications on Alif News 24.`);
        if (!slug) setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        toast.success('⚡ Generated SEO metadata from headline analysis!');
      }
    } catch (e: any) {
      toast.error('AI SEO generation error: ' + (e.message || 'Service unavailable'));
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleGenerateMetaSnippet = async () => {
    setIsGeneratingSeo(true);
    try {
      const sampleText = `${title}\n\n${blocks.map((b) => (typeof b.content === 'string' ? b.content : '')).join(' ')}`;
      const res = await api.summarizeText(sampleText);
      const textOutput = res.text || (typeof res.data === 'string' ? res.data : '');
      if (res.success && textOutput) {
        const cleanSnippet = textOutput.replace(/^[•\s\n*]+/, '').split('\n')[0].slice(0, 155);
        setSeoDescription(cleanSnippet);
        toast.success('Search snippet generated!');
      } else {
        setSeoDescription(`${title}. Comprehensive around-the-clock independent coverage on Alif News 24.`);
        toast.info('Meta description updated!');
      }
    } catch {
      setSeoDescription(`${title}. Live American breaking news and world reports on Alif News 24.`);
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  // AI Assistant Handlers
  const handleAiGenerateArticle = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiNotification(null);
    try {
      const res = await api.generateArticle(aiPrompt);
      if (res.success && res.data) {
        const d = res.data;
        if (d.title) setTitle(d.title);
        if (d.subtitle) setSubtitle(d.subtitle);
        if (d.category) {
          setSelectedCategories((prev) => Array.from(new Set([d.category, ...prev])));
        }
        if (d.tags && Array.isArray(d.tags)) setSelectedTags(d.tags);
        if (d.seoKeyword) setSeoFocusKeyword(d.seoKeyword);
        if (d.metaDescription) setSeoDescription(d.metaDescription);

        // Turn article into structured Gutenberg blocks
        const newBlocks: EditorBlock[] = [
          {
            id: `b-ai-${Date.now()}-1`,
            type: 'paragraph',
            content: d.summary || d.content?.slice(0, 200) || 'AI generated article content.',
          },
          {
            id: `b-ai-${Date.now()}-2`,
            type: 'heading',
            level: 2,
            content: 'Key Developments & Industry Impact',
          },
          {
            id: `b-ai-${Date.now()}-3`,
            type: 'paragraph',
            content: d.content || 'Detailed analysis following official updates...',
          },
          {
            id: `b-ai-${Date.now()}-4`,
            type: 'quote',
            content: 'Innovation and ethical standards will continue to guide future initiatives.',
            caption: 'Lead Analyst Report',
          },
        ];
        setBlocks(newBlocks);

        // Strict Requirement: All AI-generated news must require editorial approval!
        setIsAiGenerated(true);
        setStatus('pending_review');
        setEditorialNotes('Generated via Gemini 3.8 Flash. Editorial verification of citations and facts required prior to publishing.');
        setAiNotification('Article generated! Flagged as "Pending Review" for mandatory editorial approval.');
        toast.success('Article generated and queued for editorial approval!');
      } else {
        toast.error(res.error || 'Could not generate article');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error calling AI service');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiHeadlines = async () => {
    setAiLoading(true);
    try {
      const res = await api.generateHeadlines(title || aiPrompt || 'Global News Today');
      if (res.success && res.data && Array.isArray(res.data)) {
        if (res.data[0]) setTitle(res.data[0]);
        toast.success(`Generated 5 headlines! Title set to: "${res.data[0]}"`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Headlines generator error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiTranslate = async (targetLang: string) => {
    setAiLoading(true);
    try {
      const sampleText = `${title}\n\n${blocks[0]?.content || ''}`;
      const res = await api.translateText(sampleText, targetLang);
      if (res.success) {
        toast.info(`Translated preview (${targetLang}) generated!`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Translation error');
    } finally {
      setAiLoading(false);
    }
  };

  // Save Post
  const handleSave = (targetStatus?: PostStatus) => {
    if (!title.trim()) {
      toast.error('Please enter a post title.');
      return;
    }

    const finalStatus: PostStatus = targetStatus || status;

    const doSave = () => {
      const saved = db.savePost({
        id: postToEdit?.id,
        title,
        subtitle,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        blocks,
        content: blocks.map((b) => (typeof b.content === 'string' ? b.content : '')).join('\n\n'),
        excerpt: subtitle || (blocks[0]?.content ? String(blocks[0].content).slice(0, 160) : title),
        category: selectedCategories[0] || 'Business',
        categories: selectedCategories,
        tags: selectedTags,
        featuredImage,
        status: finalStatus,
        scheduledAt: finalStatus === 'scheduled' ? scheduledAt : undefined,
        isBreaking,
        isTrending,
        isEditorPick,
        isHomepageSlider,
        isAiGenerated,
        aiApprovalStatus: isAiGenerated ? (finalStatus === 'published' ? 'approved' : 'pending') : 'approved',
        editorialNotes,
        seo: {
          title: seoTitle || title,
          description: seoDescription || subtitle || title,
          focusKeyword: seoFocusKeyword || category,
          secondaryKeywords,
          canonicalUrl: canonicalUrl.trim() || undefined,
          score: seoScore,
          metaRobots,
          schemaType,
        },
      });
      toast.success(`Article "${title}" saved as ${finalStatus}!`);
      onSaved(saved);
    };

    // Enforce prompt requirement: If AI generated, must require editorial approval before publishing!
    if (isAiGenerated && finalStatus === 'published' && postToEdit?.aiApprovalStatus !== 'approved') {
      toast.confirm({
        title: 'Editorial Approval Guardrail',
        message: 'This article was AI-generated. Do you certify that facts, citations, and editorial guidelines have been thoroughly reviewed and approved for public broadcast?',
        confirmLabel: 'Certify & Publish',
        onConfirm: doSave,
      });
      return;
    }

    doSave();
  };

  return (
    <div className="space-y-6 pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top action bar */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md py-3 px-4 -mx-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Posts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-slate-400">
              {postToEdit ? 'Editing Article' : 'New Article'}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'published' ? 'bg-emerald-500' : status === 'pending_review' ? 'bg-purple-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold capitalize text-slate-700">
                {status === 'pending_review' ? 'Pending Editorial Review' : status}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* AI Assistant button */}
          <button
            onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Copilot</span>
          </button>

          {/* Preview button */}
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={() => handleSave('draft')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          {/* Publish or Submit */}
          <button
            onClick={() => handleSave('published')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00C5FF] hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* AI Copilot Drawer (Embedded) */}
      {aiDrawerOpen && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 p-5 rounded-2xl border border-purple-200 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Gemini 3.8 Flash Newsroom Copilot
              </h3>
            </div>
            <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
              Editorial Approval Guardrails Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Write a breaking story on Federal Reserve meeting and global currency shifts..."
              className="flex-1 px-4 py-2 text-xs bg-white border border-purple-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAiGenerateArticle}
              disabled={aiLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              {aiLoading ? 'Generating...' : 'Generate Full Story'}
            </button>
            <button
              onClick={handleAiHeadlines}
              disabled={aiLoading}
              className="px-3.5 py-2 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              5 Headlines
            </button>
            <button
              onClick={() => handleAiTranslate('Spanish')}
              disabled={aiLoading}
              className="px-3.5 py-2 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              title="Translate to Spanish"
            >
              Translate Spanish
            </button>
          </div>

          {aiNotification && (
            <div className="mt-3 p-2.5 bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-700 shrink-0" />
              <span>{aiNotification}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left Gutenberg Editor Canvas + Right Settings Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Gutenberg Block Editor Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Article Header Inputs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter headline title here..."
              className="w-full text-2xl md:text-3xl font-extrabold text-slate-900 border-none focus:outline-hidden placeholder:text-slate-300 leading-snug"
            />

            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Enter subheadline / deck summary..."
              className="w-full text-sm md:text-base font-medium text-slate-600 border-none focus:outline-hidden placeholder:text-slate-300"
            />

            {/* Word count & Read time bar */}
            <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{readingTime} min read</span>
              <span>•</span>
              <span className="font-mono text-slate-400">
                slug: /{slug || (title ? title.toLowerCase().slice(0, 30).replace(/[^a-z0-9]/g, '-') : 'untitled')}
              </span>
            </div>
          </div>

          {/* Block Canvas Area */}
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-sky-300 shadow-xs transition-all"
              >
                {/* Block header & Controls */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] text-slate-400">
                  <span className="uppercase font-bold tracking-wider text-sky-600 flex items-center gap-1">
                    {block.type === 'heading' ? <Heading className="w-3.5 h-3.5" /> : null}
                    {block.type === 'paragraph' ? <AlignLeft className="w-3.5 h-3.5" /> : null}
                    {block.type === 'quote' ? <Quote className="w-3.5 h-3.5" /> : null}
                    {block.type === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : null}
                    {block.type === 'table' ? <TableIcon className="w-3.5 h-3.5" /> : null}
                    {block.type} Block
                  </span>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveBlock(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-100 rounded-sm disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveBlock(index, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1 hover:bg-slate-100 rounded-sm disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1 hover:text-red-600 hover:bg-red-50 rounded-sm text-slate-400"
                      title="Delete Block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block Content Renderers / Editors */}
                {block.type === 'paragraph' && (
                  <textarea
                    rows={5}
                    value={block.content}
                    onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                    onPaste={(e) => handleParagraphPaste(e, index)}
                    className="w-full text-sm text-slate-700 leading-relaxed border-none focus:outline-hidden resize-y placeholder:text-slate-300"
                    placeholder="Type or paste article content here (automatically splits into clean paragraphs & headings)..."
                  />
                )}

                {block.type === 'heading' && (
                  <div className="flex items-center gap-3">
                    <select
                      value={block.level || 2}
                      onChange={(e) => handleUpdateBlock(block.id, { level: parseInt(e.target.value) as any })}
                      className="px-2 py-1 text-xs border border-slate-200 rounded-sm font-bold text-slate-700"
                    >
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                      <option value={4}>H4</option>
                    </select>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                      placeholder="Heading text..."
                      className="w-full text-lg font-bold text-slate-900 border-none focus:outline-hidden"
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <div className="border-l-4 border-sky-500 pl-4 space-y-2 py-1 bg-slate-50/50 rounded-r-lg">
                    <textarea
                      rows={2}
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                      placeholder="Quotation statement..."
                      className="w-full text-sm italic font-serif text-slate-800 bg-transparent border-none focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={block.caption || ''}
                      onChange={(e) => handleUpdateBlock(block.id, { caption: e.target.value })}
                      placeholder="Citation / Attributed source..."
                      className="w-full text-xs font-medium text-slate-500 bg-transparent border-none focus:outline-hidden"
                    />
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                        placeholder="Image URL..."
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    {block.content && (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-60 flex items-center justify-center">
                        <img
                          src={block.content}
                          alt="Block visual"
                          className="max-h-60 w-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={block.caption || ''}
                      onChange={(e) => handleUpdateBlock(block.id, { caption: e.target.value })}
                      placeholder="Photo caption and agency credit..."
                      className="w-full text-xs text-slate-500 italic border-none focus:outline-hidden"
                    />
                  </div>
                )}

                {block.type === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-slate-200">
                      <tbody>
                        {(Array.isArray(block.content) ? block.content : []).map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 font-bold' : ''}>
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx} className="p-2 border border-slate-200">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => {
                                    const newRows = [...block.content];
                                    newRows[rIdx][cIdx] = e.target.value;
                                    handleUpdateBlock(block.id, { content: newRows });
                                  }}
                                  className="w-full bg-transparent border-none focus:outline-hidden text-xs"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Block Toolbar (+ Gutenberg menu) */}
          <div className="p-4 bg-slate-100/80 rounded-2xl border border-dashed border-slate-300 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Plus className="w-4 h-4 text-sky-600" /> Add Block:
            </span>
            <button
              onClick={() => handleAddBlock('paragraph')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <AlignLeft className="w-3.5 h-3.5 text-sky-600" /> Paragraph
            </button>
            <button
              onClick={() => handleAddBlock('heading')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <Heading className="w-3.5 h-3.5 text-sky-600" /> Heading
            </button>
            <button
              onClick={() => handleAddBlock('image')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Image
            </button>
            <button
              onClick={() => handleAddBlock('quote')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <Quote className="w-3.5 h-3.5 text-purple-600" /> Quote
            </button>
            <button
              onClick={() => handleAddBlock('table')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
            >
              <TableIcon className="w-3.5 h-3.5 text-amber-600" /> Table
            </button>
            <button
              type="button"
              onClick={handleAutoFormatBlocks}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold text-sky-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Automatically break long text into clean headings & paragraphs"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Auto-Format Paragraphs
            </button>
          </div>
        </div>

        {/* Right Column: Settings & SEO Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Status & Publishing Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Publish Settings
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Editorial Review</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>

            {status === 'scheduled' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {/* Editorial Flags */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="rounded-sm border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500" /> Breaking News Ticker
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHomepageSlider}
                  onChange={(e) => setIsHomepageSlider(e.target.checked)}
                  className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Homepage Hero Slider
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEditorPick}
                  onChange={(e) => setIsEditorPick(e.target.checked)}
                  className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Editor's Pick Highlight
                </span>
              </label>
            </div>

            {isAiGenerated && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>AI Generated Content</span>
                </div>
                <p className="text-[11px] text-purple-700">
                  Editorial sign-off is mandatory before this post can appear on the public portal.
                </p>
                <textarea
                  rows={2}
                  value={editorialNotes}
                  onChange={(e) => setEditorialNotes(e.target.value)}
                  placeholder="Editorial review comments..."
                  className="w-full text-xs p-1.5 bg-white border border-purple-200 rounded-md mt-1"
                />
              </div>
            )}
          </div>

          {/* Category & Tags with 1-Click Trending Tags */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-sky-600" />
                <span>Category & News Tags</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">{selectedTags.length} active tags</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Categories * (একাধিক সিলেক্ট করুন)
                </label>
                <span className="text-[11px] font-bold text-sky-700">
                  {selectedCategories.length} selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                {categories.map((c) => {
                  const isSelected = selectedCategories.some(
                    (sc) => sc.toLowerCase() === c.name.toLowerCase()
                  );
                  const isPrimary =
                    selectedCategories[0]?.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleCategory(c.name)}
                      className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.color || '#0284C7' }}
                        />
                        <span className="truncate">{c.name}</span>
                      </span>
                      {isPrimary ? (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-sky-700 shrink-0">
                          Main
                        </span>
                      ) : isSelected ? (
                        <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {selectedCategories.length > 1 && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-semibold">Primary:</span>
                  {selectedCategories.map((catName, idx) => (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => handleSetPrimaryCategory(catName)}
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors ${
                        idx === 0
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-sky-400 hover:text-sky-700'
                      }`}
                      title={idx === 0 ? 'Primary category' : 'Click to make primary category'}
                    >
                      {catName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Article Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Type tag name and press Enter..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <button
                  onClick={handleAddTag}
                  type="button"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>

              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium rounded-lg"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                        className="text-sky-400 hover:text-red-500 text-xs font-bold cursor-pointer"
                        title="Remove tag"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-amber-600 mb-2 font-medium">⚠️ No tags added. Add at least 3 tags for higher search visibility.</p>
              )}

              {/* 1-Click Trending Tags Bar */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>ট্রেন্ডিং ট্যাগ সাজেশন (Quick Add):</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {popularSuggestedTags.map((pt) => {
                    const isAdded = selectedTags.includes(pt);
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => handleQuickAddTag(pt)}
                        disabled={isAdded}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-slate-50 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isAdded ? `✓ ${pt}` : `+ ${pt}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Featured Cover Visual</span>
            </h3>

            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Featured Image URL..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />

            {featuredImage && (
              <div className="rounded-xl overflow-hidden border border-slate-200 relative group">
                <img
                  src={featuredImage}
                  alt="Featured Preview"
                  className="w-full h-36 object-cover"
                />
                <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-sm">
                  16:9 Aspect Ratio
                </span>
              </div>
            )}
          </div>

          {/* Smart AI SEO & Editorial Power Tools ("বুদ্ধি ও অপটিমাইজেশন") */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-5 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">Smart AI SEO Assistant</h3>
                  <p className="text-[10px] text-sky-200">স্মার্ট এসইও ও ট্যাগ স্বয়ংক্রিয় বুদ্ধি</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 font-mono text-[10px] rounded-full border border-sky-400/30">
                Gemini 3.8
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              আর্টিকেলের শিরোনাম ও লেখার বিষয়বস্তু বিশ্লেষণ করে এক ক্লিকে সম্পূর্ণ এসইও ট্যাগ, কি-ওয়ার্ড এবং গুগল সার্চ ডেসক্রিপশন তৈরি করুন:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleAutoGenerateFullSeo}
                disabled={isGeneratingSeo}
                className="col-span-full py-2.5 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isGeneratingSeo ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>⚡ Auto-Generate Full SEO & Tags</span>
              </button>

              <button
                type="button"
                onClick={handleAiHeadlines}
                disabled={aiLoading}
                className="py-1.5 px-2.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-lg border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Suggest 5 Headlines</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateMetaSnippet}
                disabled={isGeneratingSeo}
                className="py-1.5 px-2.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-lg border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Generate Meta Snippet</span>
              </button>
            </div>
          </div>

          {/* Comprehensive Google SEO & Search Inspector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            {/* Header with SEO Score */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-sky-600" />
                  <span>Google SEO & Search Metadata</span>
                </h3>
                <p className="text-[11px] text-slate-500">গুগল ও সার্চ ইঞ্জিনের জন্য সম্পূর্ণ অপটিমাইজেশন</p>
              </div>

              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                    seoScore >= 80
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : seoScore >= 60
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  <span>{seoScore}</span>
                  <span className="text-[10px] opacity-75">/ 100</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {seoScore >= 80 ? '🟢 Excellent' : seoScore >= 60 ? '🟡 Moderate' : '🔴 Needs Work'}
                </p>
              </div>
            </div>

            {/* SEO Subtabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setSeoActiveTab('meta')}
                className={`flex-1 py-1 px-2 rounded-lg text-center transition-all cursor-pointer text-[11px] ${
                  seoActiveTab === 'meta' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                Metadata
              </button>
              <button
                type="button"
                onClick={() => setSeoActiveTab('serp')}
                className={`flex-1 py-1 px-2 rounded-lg text-center transition-all cursor-pointer text-[11px] ${
                  seoActiveTab === 'serp' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                SERP Preview
              </button>
              <button
                type="button"
                onClick={() => setSeoActiveTab('checklist')}
                className={`flex-1 py-1 px-2 rounded-lg text-center transition-all cursor-pointer text-[11px] ${
                  seoActiveTab === 'checklist' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                Checklist
              </button>
              <button
                type="button"
                onClick={() => setSeoActiveTab('advanced')}
                className={`flex-1 py-1 px-2 rounded-lg text-center transition-all cursor-pointer text-[11px] ${
                  seoActiveTab === 'advanced' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                Robots/Schema
              </button>
            </div>

            {/* Tab 1: Metadata & Keywords */}
            {seoActiveTab === 'meta' && (
              <div className="space-y-3.5 pt-1">
                {/* Primary Focus Keyword */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-700">Primary Focus Keyword *</label>
                    <span className="text-[10px] text-slate-400">Target Google search phrase</span>
                  </div>
                  <input
                    type="text"
                    value={seoFocusKeyword}
                    onChange={(e) => setSeoFocusKeyword(e.target.value)}
                    placeholder="e.g. US Inflation Federal Reserve"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                  {seoFocusKeyword && (
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className={title.toLowerCase().includes(seoFocusKeyword.toLowerCase()) ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                        {title.toLowerCase().includes(seoFocusKeyword.toLowerCase()) ? '✓ Included in Headline' : '⚠️ Missing from Headline'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Secondary SEO Keywords */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Secondary / Related Keywords (অন্যান্য সহায়ক কিওয়ার্ড)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSecondaryKeyword}
                      onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSecondaryKeyword())}
                      placeholder="Add keyword and press Enter..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSecondaryKeyword}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {secondaryKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {secondaryKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded-md"
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSecondaryKeyword(kw)}
                            className="text-slate-400 hover:text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* SEO Search Title */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-700">SEO Title (Search Snippet Headline)</label>
                    <span className={`text-[10px] font-mono ${
                      (seoTitle || title).length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'
                    }`}>
                      {(seoTitle || title).length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "Title for Google search results..."}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Leave blank to automatically use the main article title.
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-700">Meta Description (গুগল সার্চ সামারি) *</label>
                    <span className={`text-[10px] font-mono ${
                      seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'
                    }`}>
                      {seoDescription.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Concise 120-160 character summary that entices Google users to click and read..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 leading-relaxed"
                  />
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all ${
                        seoDescription.length >= 100 && seoDescription.length <= 160
                          ? 'bg-emerald-500'
                          : seoDescription.length > 160
                          ? 'bg-amber-500'
                          : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.min(100, (seoDescription.length / 160) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Article URL Slug */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL Slug</label>
                  <div className="flex items-center px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs">
                    <span className="text-slate-400 shrink-0 font-mono">/news/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder={title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || "article-slug"}
                      className="w-full bg-transparent border-none focus:outline-hidden font-mono text-slate-800 pl-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Live Google SERP Snippet Preview */}
            {seoActiveTab === 'serp' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Google Search Result Preview:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSerpPreviewDevice('mobile')}
                      className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                        serpPreviewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" /> Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpPreviewDevice('desktop')}
                      className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                        serpPreviewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      <Monitor className="w-3 h-3" /> Desktop
                    </button>
                  </div>
                </div>

                {/* Realistic Google Search Card */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 font-sans">
                  {/* Google Breadcrumb */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                      A
                    </div>
                    <div className="leading-tight truncate">
                      <p className="text-[11px] font-bold text-slate-900">Alif News 24</p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        https://alifnews24.com &gt; news &gt; {slug || 'article-url'}
                      </p>
                    </div>
                  </div>

                  {/* Google Search Clickable Title */}
                  <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-2 leading-snug pt-0.5">
                    {seoTitle || title || "Your Headline Will Appear Here in Google Search"} | Alif News 24
                  </h4>

                  {/* Google Snippet text */}
                  <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                    <span className="text-slate-400 font-mono text-[10px] mr-1">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} —
                    </span>
                    {seoDescription || subtitle || (blocks[0]?.content ? String(blocks[0].content).slice(0, 150) : "Meta description will be indexed and shown here for search visitors...")}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  💡 This simulation approximates how Google mobile and desktop web crawlers display this story.
                </p>
              </div>
            )}

            {/* Tab 3: Real-Time SEO Audit Checklist */}
            {seoActiveTab === 'checklist' && (
              <div className="space-y-2 pt-1 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-200 font-bold text-slate-700">
                    <span>Audit Factor</span>
                    <span>Status</span>
                  </div>

                  {[
                    {
                      label: 'Focus Keyword in Headline',
                      passed: seoAudit.checks.keywordInTitle,
                      tip: 'Include your focus keyword in the main article title',
                    },
                    {
                      label: 'Focus Keyword in First Paragraph',
                      passed: seoAudit.checks.keywordInLead,
                      tip: 'Mention your target keyword within the opening lead paragraph',
                    },
                    {
                      label: 'Focus Keyword in URL Slug',
                      passed: seoAudit.checks.keywordInSlug,
                      tip: 'Include the keyword in the clean permanent URL slug',
                    },
                    {
                      label: 'Optimal Meta Description Length (100–160 chars)',
                      passed: seoAudit.checks.metaDescOptimal,
                      tip: `Current length: ${seoDescription.length} characters`,
                    },
                    {
                      label: 'Article Word Count (Minimum 250 words)',
                      passed: seoAudit.checks.wordCountAdequate,
                      tip: `Current count: ${wordCount} words (${readingTime} min read)`,
                    },
                    {
                      label: 'At Least 3 Active News Tags',
                      passed: seoAudit.checks.hasTags,
                      tip: `${selectedTags.length} tags currently assigned`,
                    },
                    {
                      label: 'Content Subheadings (H2 / H3)',
                      passed: seoAudit.checks.hasHeadings,
                      tip: 'Subheadings improve reader scanability and SEO hierarchy',
                    },
                    {
                      label: 'Featured Cover Image Attached',
                      passed: seoAudit.checks.hasImage,
                      tip: 'Provides high-CTR OpenGraph card on social networks',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 text-[11px]">
                      <div>
                        <span className={`font-semibold ${item.passed ? 'text-slate-800' : 'text-slate-600'}`}>
                          {item.label}
                        </span>
                        <p className="text-[10px] text-slate-400">{item.tip}</p>
                      </div>
                      <span className="shrink-0 mt-0.5">
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Advanced Robots & Schema.org */}
            {seoActiveTab === 'advanced' && (
              <div className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Canonical URL Override
                  </label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://alifnews24.com/news/original-source (optional)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Leave blank to automatically use this page's clean URL as canonical.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Search Robots Indexing Directive
                  </label>
                  <select
                    value={metaRobots}
                    onChange={(e) => setMetaRobots(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="index, follow">index, follow (Default: Full Google Indexing)</option>
                    <option value="noindex, follow">noindex, follow (Don't index, but follow links)</option>
                    <option value="noindex, nofollow">noindex, nofollow (Complete Exclusion)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Schema.org Structured Data Type
                  </label>
                  <select
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="NewsArticle">NewsArticle (Default for Breaking News)</option>
                    <option value="AnalysisNewsArticle">AnalysisNewsArticle (In-depth analysis)</option>
                    <option value="OpinionNewsArticle">OpinionNewsArticle (Op-Ed & Editorial)</option>
                    <option value="Report">Report (Investigative & Special Dispatches)</option>
                    <option value="LiveBlogPosting">LiveBlogPosting (Real-time Developing News)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Live Article Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal header with device switcher */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-sm text-slate-900">Reader Article Preview</span>

              <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-xl text-xs font-semibold text-slate-700">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    previewDevice === 'desktop' ? 'bg-white shadow-xs font-bold text-slate-900' : ''
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    previewDevice === 'tablet' ? 'bg-white shadow-xs font-bold text-slate-900' : ''
                  }`}
                >
                  Tablet
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    previewDevice === 'mobile' ? 'bg-white shadow-xs font-bold text-slate-900' : ''
                  }`}
                >
                  Mobile
                </button>
              </div>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal article reader body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center bg-slate-100">
              <div
                className={`bg-white p-6 md:p-8 rounded-2xl shadow-sm space-y-6 transition-all ${
                  previewDevice === 'mobile'
                    ? 'w-[375px]'
                    : previewDevice === 'tablet'
                    ? 'w-[640px]'
                    : 'w-full max-w-3xl'
                }`}
              >
                <div className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                  {selectedCategories.join(' · ')}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                  {title || 'Headline Article Title'}
                </h1>

                {subtitle && (
                  <p className="text-base text-slate-600 font-medium">{subtitle}</p>
                )}

                {featuredImage && (
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-64 md:h-80 object-cover rounded-xl"
                  />
                )}

                <div className="space-y-4 pt-2 font-['Source_Serif_4',Georgia,serif]">
                  {formatArticleForReader(blocks).map((sec) => (
                    <div key={sec.id}>
                      {sec.type === 'paragraph' && (
                        <p className="text-[16px] text-slate-800 leading-[1.8]">
                          {sec.text}
                        </p>
                      )}
                      {sec.type === 'heading' && (
                        <h2 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-slate-950 mt-5 pt-3 border-t border-slate-100">
                          {sec.text}
                        </h2>
                      )}
                      {sec.type === 'list' && (
                        <ul className="pl-5 list-disc space-y-1.5 text-[15px] text-slate-800">
                          {sec.items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {sec.type === 'quote' && (
                        <blockquote className="border-y border-slate-200 py-4 my-4 text-center italic font-['Playfair_Display',Georgia,serif] text-lg text-slate-900">
                          “{sec.text}”
                          {sec.caption && (
                            <cite className="block text-xs font-sans not-italic text-slate-500 mt-1">
                              — {sec.caption}
                            </cite>
                          )}
                        </blockquote>
                      )}
                      {sec.type === 'image' && (
                        <img
                          src={sec.url}
                          alt={sec.caption || title}
                          className="w-full max-h-72 object-cover rounded-xl my-3"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
