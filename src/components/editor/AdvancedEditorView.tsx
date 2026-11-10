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
  AlertCircle,
  HelpCircle,
  Flame,
  Globe,
  Sliders,
  Calendar,
  Languages,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { toast } from '../../services/toast';
import { Post, EditorBlock, PostStatus } from '../../types';

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
  const [category, setCategory] = useState(postToEdit?.category || 'Business');
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

  // SEO state
  const [seoFocusKeyword, setSeoFocusKeyword] = useState(postToEdit?.seo?.focusKeyword || '');
  const [seoTitle, setSeoTitle] = useState(postToEdit?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(postToEdit?.seo?.description || '');

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

  // Dynamic SEO score calculation (0 - 100)
  const calculateSeoScore = () => {
    let score = 50;
    if (title.length >= 35 && title.length <= 70) score += 15;
    if (seoDescription.length >= 80 && seoDescription.length <= 160) score += 15;
    if (seoFocusKeyword && title.toLowerCase().includes(seoFocusKeyword.toLowerCase())) score += 10;
    if (blocks.some((b) => b.type === 'heading')) score += 5;
    if (featuredImage) score += 5;
    return Math.min(100, score);
  };
  const seoScore = calculateSeoScore();

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

  // Add tag
  const handleAddTag = () => {
    if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
      setSelectedTags([...selectedTags, newTagInput.trim()]);
      db.saveTag(newTagInput.trim());
      setNewTagInput('');
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
        if (d.category) setCategory(d.category);
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
        category,
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
          score: seoScore,
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
                    rows={4}
                    value={block.content}
                    onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                    className="w-full text-sm text-slate-700 leading-relaxed border-none focus:outline-hidden resize-y placeholder:text-slate-300"
                    placeholder="Type article paragraph..."
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

          {/* Category & Tags */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Category & Tags
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag and press Enter..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <button
                  onClick={handleAddTag}
                  type="button"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                      className="text-slate-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Featured Image
            </h3>

            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="Featured Image URL..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />

            {featuredImage && (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={featuredImage}
                  alt="Featured Preview"
                  className="w-full h-36 object-cover"
                />
              </div>
            )}
          </div>

          {/* Real-time SEO Inspector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">SEO Score</h3>
              <div
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  seoScore >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : seoScore >= 60
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {seoScore} / 100
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Focus Keyword
              </label>
              <input
                type="text"
                value={seoFocusKeyword}
                onChange={(e) => setSeoFocusKeyword(e.target.value)}
                placeholder="e.g. US inflation"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta Description (Search Snippet)
              </label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Concise 150-character summary for Google & news search results..."
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400">{seoDescription.length} / 160 chars</span>
            </div>
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
                <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-full">
                  {category}
                </span>

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

                <div className="space-y-4 pt-2">
                  {blocks.map((block) => (
                    <div key={block.id}>
                      {block.type === 'paragraph' && (
                        <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                          {block.content}
                        </p>
                      )}
                      {block.type === 'heading' && (
                        <h2 className="text-xl font-bold text-slate-900 mt-4">
                          {block.content}
                        </h2>
                      )}
                      {block.type === 'quote' && (
                        <blockquote className="border-l-4 border-sky-500 pl-4 py-2 italic font-serif text-slate-800 bg-slate-50 rounded-r-lg">
                          "{block.content}"
                          {block.caption && (
                            <cite className="block text-xs font-sans not-italic text-slate-500 mt-1">
                              — {block.caption}
                            </cite>
                          )}
                        </blockquote>
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
