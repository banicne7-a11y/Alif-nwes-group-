import React, { useState, useRef, useEffect } from 'react';
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
  Bold,
  List,
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
  Upload,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { toast } from '../../services/toast';
import { Post, EditorBlock, PostStatus, TargetCountry, MediaItem } from '../../types';
import { TARGET_COUNTRY_LIST, isCountryEditionSlug } from '../../utils/countryEditions';
import { formatArticleForReader, parseTextToEditorBlocks } from '../../utils/articleFormatter';
import { compressAndUploadGalleryImage } from '../../utils/imageUpload';
import { renderInlineFormatting } from '../../utils/inlineFormat';
import {
  analyzePostRankSeo,
  suggestInternalLinks,
  smartExcerpt,
  buildArticleGraphSchema,
} from '../../utils/rankSeo';

interface AdvancedEditorViewProps {
  postToEdit?: Post | null;
  defaultExpressMode?: boolean;
  onBack: () => void;
  onSaved: (post: Post) => void;
}

export const AdvancedEditorView: React.FC<AdvancedEditorViewProps> = ({
  postToEdit,
  defaultExpressMode = false,
  onBack,
  onSaved,
}) => {
  const [categories, setCategories] = useState(() => db.getCategories());
  const allTags = db.getTags();
  const currentUser = db.getCurrentUser();
  const allUsers = db.getUsers();

  useEffect(() => {
    return db.subscribe(() => {
      setCategories(db.getCategories());
    });
  }, []);

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
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const category = selectedCategories[0] || 'Business';
  const [selectedTags, setSelectedTags] = useState<string[]>(postToEdit?.tags || ['News']);
  const [newTagInput, setNewTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState(
    postToEdit?.featuredImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80'
  );
  const [status, setStatus] = useState<PostStatus>(postToEdit?.status || 'draft');
  const [targetCountry, setTargetCountry] = useState<TargetCountry>(postToEdit?.targetCountry || 'usa');
  const [authorId, setAuthorId] = useState<string>(postToEdit?.author?.id || currentUser.id);
  const [authorName, setAuthorName] = useState<string>(postToEdit?.author?.name || currentUser.name);
  const [authorRole, setAuthorRole] = useState<string>(postToEdit?.author?.role || currentUser.role || 'Correspondent');
  const [authorAvatar, setAuthorAvatar] = useState<string>(postToEdit?.author?.avatar || currentUser.avatar);
  const [scheduledAt, setScheduledAt] = useState(postToEdit?.scheduledAt || '');
  const [isBreaking, setIsBreaking] = useState(!!postToEdit?.isBreaking);
  const [isTrending, setIsTrending] = useState(!!postToEdit?.isTrending);
  const [isEditorPick, setIsEditorPick] = useState(!!postToEdit?.isEditorPick);
  const [isHomepageSlider, setIsHomepageSlider] = useState(!!postToEdit?.isHomepageSlider);
  const [isAiGenerated, setIsAiGenerated] = useState(!!postToEdit?.isAiGenerated);
  const [editorialNotes, setEditorialNotes] = useState(postToEdit?.editorialNotes || '');

  // Advanced Rank SEO & Meta Tags state
  const [seoFocusKeyword, setSeoFocusKeyword] = useState(postToEdit?.seo?.focusKeyword || '');
  const [seoTitle, setSeoTitle] = useState(postToEdit?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(postToEdit?.seo?.description || '');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(postToEdit?.seo?.secondaryKeywords || []);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState(postToEdit?.seo?.canonicalUrl || '');
  const [metaRobots, setMetaRobots] = useState(postToEdit?.seo?.metaRobots || 'index, follow');
  const [schemaType, setSchemaType] = useState(postToEdit?.seo?.schemaType || 'NewsArticle');
  const [ogTitle, setOgTitle] = useState(postToEdit?.seo?.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(postToEdit?.seo?.ogDescription || '');
  const [ogImage, setOgImage] = useState(postToEdit?.seo?.ogImage || '');
  const [twitterCardType, setTwitterCardType] = useState<'summary_large_image' | 'summary'>(
    postToEdit?.seo?.twitterCardType || 'summary_large_image'
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(postToEdit?.seo?.featuredImageAlt || '');
  const [breadcrumbTitle, setBreadcrumbTitle] = useState(postToEdit?.seo?.breadcrumbTitle || '');
  const [isPillarContent, setIsPillarContent] = useState(Boolean(postToEdit?.seo?.isPillarContent));
  const [faqItems, setFaqItems] = useState<Array<{ id: string; question: string; answer: string }>>(
    postToEdit?.seo?.faqItems || []
  );
  const [howToSteps, setHowToSteps] = useState<Array<{ id: string; title: string; description: string }>>(
    postToEdit?.seo?.howToSteps || []
  );
  const [redirectUrl, setRedirectUrl] = useState(postToEdit?.seo?.redirectUrl || '');
  const [redirectType, setRedirectType] = useState<'301' | '302'>(postToEdit?.seo?.redirectType || '301');

  const [seoActiveTab, setSeoActiveTab] = useState<'meta' | 'checklist' | 'social' | 'schema' | 'advanced'>('meta');
  const [serpPreviewDevice, setSerpPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [expressSeoOpen, setExpressSeoOpen] = useState(true);
  const [expressChecklistOpen, setExpressChecklistOpen] = useState(false);

  // Gallery Image Upload & Library Picker state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewFallback, setImagePreviewFallback] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => db.getMedia());

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

  // Classic Full Studio is default everywhere so Add New Post opens the familiar full editor;
  // Quick Phone mode opens when explicitly requested or toggled from the top bar.
  const [expressMode, setExpressMode] = useState<boolean>(!!defaultExpressMode);

  React.useEffect(() => {
    setExpressMode(!!defaultExpressMode);
  }, [defaultExpressMode, postToEdit?.id]);
  const blocksToPlainText = (blkList: EditorBlock[]): string =>
    blkList
      .map((b) => {
        if (b.type === 'heading') return `## ${b.content || ''}`;
        if (b.type === 'quote') return `> ${b.content || ''}`;
        if (b.type === 'paragraph' || b.type === 'callout') return String(b.content || '');
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

  const [expressBodyText, setExpressBodyText] = useState<string>(() => {
    if (postToEdit?.blocks && postToEdit.blocks.length > 0) {
      const txt = blocksToPlainText(postToEdit.blocks);
      if (txt && !txt.startsWith('Write the introductory lead paragraph here')) return txt;
    }
    return postToEdit?.content || '';
  });

  const handleToggleExpressMode = (nextExpress: boolean) => {
    if (nextExpress) {
      const txt = blocksToPlainText(blocks);
      if (txt && !txt.startsWith('Write the introductory lead paragraph here')) {
        setExpressBodyText(txt);
      }
    } else if (expressBodyText.trim()) {
      const parsed = parseTextToEditorBlocks(expressBodyText);
      if (parsed.length > 0) setBlocks(parsed);
    }
    setExpressMode(nextExpress);
  };

  const expressTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const paragraphTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const applyFormatToTextarea = (
    textarea: HTMLTextAreaElement | null,
    currentValue: string,
    onChangeValue: (nextVal: string) => void,
    format: 'bold' | 'h2' | 'h3' | 'list' | 'quote'
  ) => {
    const val = currentValue || '';
    const start = textarea ? textarea.selectionStart ?? val.length : val.length;
    const end = textarea ? textarea.selectionEnd ?? val.length : val.length;
    const selected = val.slice(start, end);

    let nextVal = val;
    let nextSelStart = start;
    let nextSelEnd = end;

    if (format === 'bold') {
      const marker = '**';
      const placeholder = 'bold text';
      if (selected) {
        if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length > 4) {
          const inner = selected.slice(2, -2);
          nextVal = val.slice(0, start) + inner + val.slice(end);
          nextSelStart = start;
          nextSelEnd = start + inner.length;
        } else {
          const wrapped = `${marker}${selected}${marker}`;
          nextVal = val.slice(0, start) + wrapped + val.slice(end);
          nextSelStart = start;
          nextSelEnd = start + wrapped.length;
        }
      } else {
        const needsSpace = start > 0 && !/[\s\n]$/.test(val.slice(0, start));
        const pad = needsSpace ? ' ' : '';
        const insertText = `${pad}${marker}${placeholder}${marker}`;
        nextVal = val.slice(0, start) + insertText + val.slice(end);
        nextSelStart = start + pad.length + marker.length;
        nextSelEnd = nextSelStart + placeholder.length;
      }
    } else {
      const prefix = format === 'h2' ? '## ' : format === 'h3' ? '### ' : format === 'list' ? '• ' : '> ';
      const placeholder =
        format === 'h2'
          ? 'Section Headline Here'
          : format === 'h3'
          ? 'Subheading Here'
          : format === 'list'
          ? 'List item here'
          : 'Important quote here';

      if (selected) {
        const formattedLines = selected
          .split('\n')
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            const cleaned = trimmed.replace(/^(#{1,4}\s+|•\s+|-\s+|>\s+)/, '');
            return trimmed.startsWith(prefix) ? cleaned : `${prefix}${cleaned}`;
          })
          .join('\n');
        nextVal = val.slice(0, start) + formattedLines + val.slice(end);
        nextSelStart = start;
        nextSelEnd = start + formattedLines.length;
      } else {
        const lineStart = val.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
        const lineEndIdx = val.indexOf('\n', start);
        const lineEnd = lineEndIdx === -1 ? val.length : lineEndIdx;
        const currentLine = val.slice(lineStart, lineEnd);

        if (currentLine.trim()) {
          const cleaned = currentLine.trim().replace(/^(#{1,4}\s+|•\s+|-\s+|>\s+)/, '');
          const replacement = currentLine.trim().startsWith(prefix) ? cleaned : `${prefix}${cleaned}`;
          nextVal = val.slice(0, lineStart) + replacement + val.slice(lineEnd);
          nextSelStart = lineStart;
          nextSelEnd = lineStart + replacement.length;
        } else {
          const needsBreak = start > 0 && val[start - 1] !== '\n';
          const insertPrefix = `${needsBreak ? '\n' : ''}${prefix}`;
          nextVal = val.slice(0, start) + insertPrefix + placeholder + val.slice(end);
          nextSelStart = start + insertPrefix.length;
          nextSelEnd = nextSelStart + placeholder.length;
        }
      }
    }

    onChangeValue(nextVal);
    if (textarea) {
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(nextSelStart, nextSelEnd);
      });
    }
  };

  const handleExpressBodyChange = (val: string) => {
    setExpressBodyText(val);
    if (val.trim()) {
      const parsed = parseTextToEditorBlocks(val);
      if (parsed.length > 0) setBlocks(parsed);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText();
        if (!clip.trim()) {
          toast.warning('ক্লিপবোর্ডে কোনো লেখা পাওয়া যায়নি।');
          return;
        }
        const nextVal = expressBodyText.trim() ? `${expressBodyText.trim()}\n\n${clip.trim()}` : clip.trim();
        handleExpressBodyChange(nextVal);
        toast.success('ক্লিপবোর্ড থেকে লেখা পেস্ট করা হয়েছে!');
      } else {
        toast.info('বক্সে চাপ দিয়ে ধরে "Paste" করুন।');
      }
    } catch {
      toast.info('ব্রাউজার পারমিশন দেয়নি—বক্সে ট্যাপ করে ধরে "Paste" করুন।');
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const result = await compressAndUploadGalleryImage(file, { preferWebp: true });
      setMediaItems([...db.getMedia()]);
      setImagePreviewFallback(result.previewDataUrl);
      setFeaturedImage(result.url);
      if (result.synced) {
        toast.success(`✅ গ্যালারি থেকে ছবি আপলোড হয়েছে! (${result.sizeLabel})`);
      } else {
        toast.warning('⚠️ Google Admin লগইন না থাকায় ছবিটি শুধু ডিভাইসে আছে—পাবলিক সাইটে দেখাতে উপরে Admin লগইন করুন।');
      }
    } catch (err: any) {
      toast.error(err?.message || 'গ্যালারি থেকে ছবি আপলোড করা যায়নি।');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBlockGalleryImageUpload = async (
    blockId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingBlockId(blockId);
    try {
      const result = await compressAndUploadGalleryImage(file, { preferWebp: true });
      setMediaItems([...db.getMedia()]);
      handleUpdateBlock(blockId, { content: result.url });
      toast.success(`✅ ব্লকে ছবি যুক্ত হয়েছে (${result.sizeLabel})`);
    } catch (err: any) {
      toast.error(err?.message || 'ছবি আপলোড করা যায়নি।');
    } finally {
      setUploadingBlockId(null);
    }
  };

  const handlePickExistingMedia = (item: MediaItem) => {
    if (item.url.startsWith('data:image/')) {
      setImagePreviewFallback(item.url);
      setFeaturedImage(`/api/media?id=${encodeURIComponent(item.id)}`);
    } else {
      setImagePreviewFallback('');
      setFeaturedImage(item.url);
    }
    setShowMediaPicker(false);
    toast.success(`ছবি সিলেক্ট করা হয়েছে: ${item.name}`);
  };

  const quickImagePresets = [
    { label: 'Newsroom', url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Business', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Tech / AI', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80' },
    { label: 'World / City', url: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200&auto=format&fit=crop&q=80' },
  ];

  // Real-time Rank SEO 100-Point 4-Category Audit & Internal Link Suggester
  const activeBodyForAudit = expressMode && expressBodyText.trim()
    ? expressBodyText
    : blocks.map((b) => (typeof b.content === 'string' ? b.content : '')).join('\n\n');

  const rankAudit = analyzePostRankSeo({
    title,
    subtitle,
    slug,
    content: activeBodyForAudit,
    blocks: expressMode ? undefined : blocks,
    featuredImage,
    featuredImageAlt: featuredImageAlt || title,
    tags: selectedTags,
    seoTitle,
    seoDescription,
    focusKeyword: seoFocusKeyword,
    secondaryKeywords,
  });

  const wordCount = rankAudit.stats.wordCount;
  const readingTime = rankAudit.stats.readingTimeMinutes;
  const seoScore = rankAudit.score;

  const internalLinkSuggestions = suggestInternalLinks(
    postToEdit?.id,
    title,
    activeBodyForAudit,
    seoFocusKeyword,
    db.getPosts(),
    5
  );

  const handleInsertInternalLink = (sugTitle: string, sugUrl: string) => {
    const mdLink = `Related: [${sugTitle}](${sugUrl})`;
    if (expressMode) {
      const nextText = expressBodyText.trim() ? `${expressBodyText.trim()}\n\n${mdLink}` : mdLink;
      handleExpressBodyChange(nextText);
    } else {
      setBlocks((prev) => [
        ...prev,
        {
          id: `b-link-${Date.now()}`,
          type: 'callout',
          content: mdLink,
        },
      ]);
    }
    toast.success(`Internal link inserted: ${sugTitle.slice(0, 36)}...`);
  };

  const toggleRobotsToken = (token: string, conflictToken?: string) => {
    const tokens = new Set(
      metaRobots
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
    if (tokens.has(token)) {
      tokens.delete(token);
      if (conflictToken) tokens.add(conflictToken);
    } else {
      tokens.add(token);
      if (conflictToken) tokens.delete(conflictToken);
    }
    if (!tokens.has('index') && !tokens.has('noindex')) tokens.add('index');
    if (!tokens.has('follow') && !tokens.has('nofollow')) tokens.add('follow');
    setMetaRobots(Array.from(tokens).join(', '));
  };

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

  const handleQuickAddCategory = (mode: 'replace' | 'append') => {
    const clean = newCategoryInput.trim();
    if (!clean) return;
    const savedCat = db.saveCategory({ name: clean });
    setCategories(db.getCategories());
    if (mode === 'replace') {
      setSelectedCategories([savedCat.name]);
    } else {
      setSelectedCategories((prev) => {
        const exists = prev.some((c) => c.toLowerCase().trim() === savedCat.name.toLowerCase().trim());
        return exists ? prev : [...prev, savedCat.name];
      });
    }
    setNewCategoryInput('');
    toast.success(`ক্যাটাগরি "${savedCat.name}" যোগ ও সিলেক্ট হয়েছে!`);
  };

  const handleAddTag = () => {
    const parsed = newTagInput
      .split(/[,\n]+/)
      .map((t) => t.replace(/^#+/, '').trim())
      .filter(Boolean);
    if (parsed.length === 0) return;

    const existingLower = new Set(selectedTags.map((t) => t.toLowerCase()));
    const toAdd: string[] = [];
    for (const tag of parsed) {
      if (!existingLower.has(tag.toLowerCase())) {
        existingLower.add(tag.toLowerCase());
        toAdd.push(tag);
        db.saveTag(tag);
      }
    }

    if (toAdd.length > 0) {
      setSelectedTags([...selectedTags, ...toAdd]);
      toast.success(toAdd.length > 1 ? `${toAdd.length}টি ট্যাগ একসাথে যুক্ত হয়েছে!` : `Tag "${toAdd[0]}" added!`);
    }
    setNewTagInput('');
  };

  const handleAutoGenerateSlug = () => {
    const source = (title || seoFocusKeyword || '').trim();
    if (!source) {
      toast.warning('আগে শিরোনাম (Headline) লিখুন, তারপর Slug জেনারেট করুন।');
      return;
    }
    const generated = source
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)
      .replace(/(^-|-$)/g, '');
    const finalSlug = generated || `news-${Date.now()}`;
    setSlug(finalSlug);
    const prefix = isCountryEditionSlug(targetCountry) ? `/${targetCountry}` : '/news';
    toast.success(`URL Slug জেনারেট হয়েছে: ${prefix}/${finalSlug}`);
  };

  const handleAutoGenerateTags = async () => {
    const sampleText = blocks.map((b) => (typeof b.content === 'string' ? b.content : '')).join(' ');
    if (!title.trim() && !sampleText.trim()) {
      toast.warning('ট্যাগ জেনারেট করতে আগে শিরোনাম বা কনটেন্ট লিখুন।');
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const res = await api.generateSeo(title || 'Breaking News', sampleText);
      const aiTags: string[] = Array.isArray(res?.data?.secondaryKeywords)
        ? res.data.secondaryKeywords
        : [];
      const stopWords = new Set([
        'about', 'after', 'around', 'because', 'before', 'between', 'could', 'first', 'found',
        'their', 'there', 'these', 'those', 'through', 'under', 'where', 'which', 'while',
        'would', 'inside', 'update', 'latest', 'breaking', 'report', 'news', 'today', 'story',
      ]);
      const extractedWords = `${title} ${sampleText.slice(0, 400)}`
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w.toLowerCase()));
      const uniqueExtracted = Array.from(new Set(extractedWords)).slice(0, 5);
      const candidates = Array.from(new Set([...aiTags, ...uniqueExtracted, category])).slice(0, 6);

      const existingLower = new Set(selectedTags.map((t) => t.toLowerCase()));
      const newlyAdded = candidates.filter((t) => t.trim() && !existingLower.has(t.toLowerCase()));
      newlyAdded.forEach((t) => db.saveTag(t));
      if (newlyAdded.length > 0) {
        setSelectedTags([...selectedTags, ...newlyAdded]);
        toast.success(`⚡ ${newlyAdded.length}টি স্মার্ট ট্যাগ জেনারেট হয়েছে!`);
      } else {
        toast.info('প্রাসঙ্গিক ট্যাগগুলো ইতিমধ্যেই যুক্ত আছে।');
      }
    } catch {
      toast.error('ট্যাগ জেনারেট করতে সমস্যা হয়েছে।');
    } finally {
      setIsGeneratingSeo(false);
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
    const parsed = newSecondaryKeyword
      .split(/[,\n]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;

    const existingLower = new Set(secondaryKeywords.map((k) => k.toLowerCase()));
    const toAdd = parsed.filter((k) => {
      if (existingLower.has(k.toLowerCase())) return false;
      existingLower.add(k.toLowerCase());
      return true;
    });
    if (toAdd.length > 0) {
      setSecondaryKeywords([...secondaryKeywords, ...toAdd]);
    }
    setNewSecondaryKeyword('');
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
      const pendingTags = newTagInput
        .split(/[,\n]+/)
        .map((t) => t.replace(/^#+/, '').trim())
        .filter(Boolean);
      const mergedTags = Array.from(new Set([...selectedTags, ...pendingTags]));
      pendingTags.forEach((t) => db.saveTag(t));

      const parsedExpressBlocks =
        expressMode && expressBodyText.trim() ? parseTextToEditorBlocks(expressBodyText) : blocks;
      const finalBlocks = parsedExpressBlocks.length > 0 ? parsedExpressBlocks : blocks;
      const rawLead = String(finalBlocks.find((b) => b.type === 'paragraph')?.content || finalBlocks[0]?.content || title);
      const cleanExcerpt = smartExcerpt(subtitle || rawLead, 158) || smartExcerpt(title, 158);
      const cleanSlug =
        slug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const saved = db.savePost({
        id: postToEdit?.id,
        title,
        subtitle,
        slug: cleanSlug,
        blocks: finalBlocks,
        content: finalBlocks.map((b) => (typeof b.content === 'string' ? b.content : '')).join('\n\n'),
        excerpt: cleanExcerpt || title,
        category: selectedCategories[0] || 'Business',
        categories: selectedCategories,
        tags: mergedTags,
        featuredImage,
        status: finalStatus,
        targetCountry,
        author: {
          id: authorId || currentUser.id,
          name: authorName.trim() || 'Alif News 24 Desk',
          avatar: authorAvatar || currentUser.avatar,
          role: (authorRole.trim() || currentUser.role || 'Correspondent') as any,
        },
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
          description: seoDescription || cleanExcerpt || title,
          focusKeyword: seoFocusKeyword || category,
          secondaryKeywords,
          canonicalUrl: canonicalUrl.trim() || undefined,
          score: seoScore,
          metaRobots,
          schemaType,
          ogTitle: ogTitle.trim() || undefined,
          ogDescription: ogDescription.trim() || undefined,
          ogImage: ogImage.trim() || undefined,
          twitterCardType,
          featuredImageAlt: featuredImageAlt.trim() || undefined,
          breadcrumbTitle: breadcrumbTitle.trim() || undefined,
          isPillarContent,
          faqItems: faqItems.filter((f) => f.question.trim() || f.answer.trim()),
          howToSteps: howToSteps.filter((s) => s.title.trim() || s.description.trim()),
          redirectUrl: redirectUrl.trim() || undefined,
          redirectType: redirectUrl.trim() ? redirectType : undefined,
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
      {/* Hidden shared gallery input for both Quick Phone & Full Studio */}
      <input
        id="gallery-image-upload-input"
        type="file"
        accept="image/*"
        onChange={handleGalleryImageUpload}
        className="sr-only"
      />
      {/* Top action bar */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md py-3 px-4 -mx-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Back to Posts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block leading-none">
              {postToEdit ? 'Editing Article' : 'New Article'}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'published' ? 'bg-emerald-500' : status === 'pending_review' ? 'bg-purple-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold capitalize text-slate-700">
                {status === 'pending_review' ? 'Pending Review' : status}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher + Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleToggleExpressMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                expressMode ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Quick Phone</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleExpressMode(false)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                !expressMode ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Studio</span>
            </button>
          </div>

          {/* Preview button */}
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {!expressMode && (
            <>
              <button
                onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Copilot</span>
              </button>
              <button
                onClick={() => handleSave('draft')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSave('published')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00C5FF] hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* MOBILE EXPRESS QUICK POST MODE */}
      {expressMode ? (
        <div className="max-w-2xl mx-auto space-y-4 pb-24">
          {/* AI 1-Tap Helper Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs font-extrabold">AI দিয়ে ১০ সেকেন্ডে পোস্ট লিখুন</span>
              </div>
              <span className="text-[10px] text-sky-300 font-semibold">Quick Mobile Mode</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="টপিক লিখুন (যেমন: Apple new AI update 2026)..."
                className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="button"
                onClick={async () => {
                  const topicText = aiPrompt.trim() || title.trim();
                  if (!topicText) {
                    toast.warning('আগে উপরের বক্সে একটি টপিক বা শিরোনাম লিখুন।');
                    return;
                  }
                  setAiLoading(true);
                  try {
                    const res = await api.generateTrendArticle({
                      topic: topicText,
                      country: targetCountry === 'global' ? 'usa' : targetCountry,
                      wordCountTarget: 'medium',
                    });
                    if (res.success && res.data) {
                      const d = res.data;
                      if (d.title) setTitle(d.title);
                      if (d.subtitle) setSubtitle(d.subtitle);
                      if (d.slug) setSlug(d.slug);
                      if (d.category) setSelectedCategories([d.category]);
                      if (Array.isArray(d.tags) && d.tags.length > 0) setSelectedTags(d.tags);
                      if (d.seoTitle) setSeoTitle(d.seoTitle);
                      if (d.metaDescription) setSeoDescription(d.metaDescription);
                      if (d.seoKeyword) setSeoFocusKeyword(d.seoKeyword);
                      const body = String(d.content || d.summary || '');
                      handleExpressBodyChange(body);
                      setIsAiGenerated(true);
                      toast.success('⚡ পুরো খবর + SEO তৈরি হয়ে গেছে! নিচে দেখে Publish চাপুন।');
                    } else {
                      toast.error(res.error || 'AI লিখতে পারেনি, আবার চেষ্টা করুন।');
                    }
                  } catch (e: any) {
                    toast.error(e?.message || 'AI error');
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
                className="min-h-[44px] px-4 py-2 bg-[#00C5FF] hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl transition-colors disabled:opacity-60 shrink-0 cursor-pointer"
              >
                {aiLoading ? 'AI লিখছে...' : '⚡ AI দিয়ে লিখুন'}
              </button>
            </div>
          </div>

          {/* 1. Country Edition */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <label className="block text-xs font-extrabold text-slate-700">
              ১. কোন দেশের সাইটে দেখাবে? (Country Edition)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TARGET_COUNTRY_LIST.map((c) => {
                const active = targetCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setTargetCountry(c.code)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Headline & Article Body */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ২. খবরের শিরোনাম (Headline) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="এখানে খবরের শিরোনাম লিখুন বা পেস্ট করুন..."
                className="w-full min-h-[46px] px-3.5 py-2.5 text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  ৩. মূল খবর (লিখুন বা পেস্ট করুন)
                </label>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-extrabold cursor-pointer"
                >
                  📋 Paste Text
                </button>
              </div>
              {/* Quick Phone Bold & Heading Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 mb-2 bg-slate-100 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() =>
                    applyFormatToTextarea(expressTextareaRef.current, expressBodyText, handleExpressBodyChange, 'bold')
                  }
                  className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-slate-900 hover:text-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 flex items-center gap-1 cursor-pointer"
                  title="লেখা মোটা করুন (Bold)"
                >
                  <Bold className="w-3.5 h-3.5" /> মোটা (B)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyFormatToTextarea(expressTextareaRef.current, expressBodyText, handleExpressBodyChange, 'h2')
                  }
                  className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-sky-700 hover:text-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-800 cursor-pointer"
                  title="বড় সাব-হেডলাইন (H2)"
                >
                  H2 হেডলাইন
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyFormatToTextarea(expressTextareaRef.current, expressBodyText, handleExpressBodyChange, 'h3')
                  }
                  className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-sky-700 hover:text-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                  title="ছোট হেডলাইন (H3)"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyFormatToTextarea(expressTextareaRef.current, expressBodyText, handleExpressBodyChange, 'list')
                  }
                  className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-slate-800 hover:text-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="পয়েন্ট লিস্ট"
                >
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyFormatToTextarea(expressTextareaRef.current, expressBodyText, handleExpressBodyChange, 'quote')
                  }
                  className="min-h-[34px] px-2.5 py-1 bg-white hover:bg-slate-800 hover:text-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="উদ্ধৃতি (Quote)"
                >
                  <Quote className="w-3.5 h-3.5" /> Quote
                </button>
              </div>
              <textarea
                ref={expressTextareaRef}
                rows={9}
                value={expressBodyText}
                onChange={(e) => handleExpressBodyChange(e.target.value)}
                placeholder="পুরো আর্টিকেল এখানে লিখুন বা Paste করুন (যেকোনো লেখা সিলেক্ট করে B চাপলে মোটা ও H2 চাপলে হেডলাইন হবে)..."
                className="w-full p-3.5 text-sm leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-y"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>{wordCount} words · {readingTime} min read</span>
                <button
                  type="button"
                  onClick={handleAutoGenerateFullSeo}
                  disabled={isGeneratingSeo}
                  className="text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  {isGeneratingSeo ? 'Generating SEO...' : '⚡ Auto-Fill SEO & Tags'}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Category & Featured Image */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ৪. ক্যাটাগরি (Category)
              </label>
              <select
                value={selectedCategories[0] || categories[0]?.name || 'Business'}
                onChange={(e) => setSelectedCategories([e.target.value])}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                {selectedCategories[0] &&
                  !categories.some((c) => c.name.toLowerCase().trim() === selectedCategories[0].toLowerCase().trim()) && (
                    <option value={selectedCategories[0]}>{selectedCategories[0]}</option>
                  )}
              </select>
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAddCategory('replace');
                    }
                  }}
                  placeholder="+ নতুন ক্যাটাগরি লিখুন (যেমন: World)..."
                  className="flex-1 min-h-[40px] px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddCategory('replace')}
                  disabled={!newCategoryInput.trim()}
                  className="min-h-[40px] px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>যোগ করুন</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  ৫. ছবি (গ্যালারি আপলোড বা লিংক)
                </label>
                {featuredImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeaturedImage('');
                      setImagePreviewFallback('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> মুছুন
                  </button>
                )}
              </div>

              {/* Primary Phone Gallery Upload & Media Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                <label
                  htmlFor="gallery-image-upload-input"
                  className={`min-h-[46px] px-3.5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isUploadingImage
                      ? 'bg-slate-200 text-slate-500 pointer-events-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isUploadingImage ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isUploadingImage ? 'আপলোড হচ্ছে...' : '📷 গ্যালারি থেকে ছবি আপলোড'}</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMediaItems([...db.getMedia()]);
                    setShowMediaPicker(!showMediaPicker);
                  }}
                  className="min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>{showMediaPicker ? 'লাইব্রেরি বন্ধ করুন' : '🗂️ সেভ করা ছবি বাছুন'}</span>
                </button>
              </div>

              {showMediaPicker && (
                <div className="mb-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Media Library ({mediaItems.length})</span>
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                    {mediaItems
                      .filter((m) => m.type === 'image')
                      .slice(0, 18)
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handlePickExistingMedia(m)}
                          className="group relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 hover:border-sky-500 cursor-pointer bg-white"
                        >
                          <img src={m.url} alt={m.altText || m.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <input
                type="text"
                value={featuredImage}
                onChange={(e) => {
                  setImagePreviewFallback('');
                  setFeaturedImage(e.target.value);
                }}
                placeholder="অথবা ছবির লিংক পেস্ট করুন (https://...)"
                className="w-full min-h-[44px] px-3 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickImagePresets.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => {
                      setImagePreviewFallback('');
                      setFeaturedImage(img.url);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      featuredImage === img.url
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🖼️ {img.label}
                  </button>
                ))}
              </div>
              {featuredImage && (
                <img
                  src={featuredImage}
                  onError={(e) => {
                    if (imagePreviewFallback && e.currentTarget.src !== imagePreviewFallback) {
                      e.currentTarget.src = imagePreviewFallback;
                    }
                  }}
                  alt="Cover preview"
                  className="mt-2.5 w-full h-40 object-cover rounded-xl border border-slate-200"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
              <label className="flex items-center gap-2 min-h-[40px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-300 text-red-600"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500" /> Breaking News
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                By <strong>{authorName.trim() || 'Alif News 24 Desk'}</strong>
              </span>
            </div>
          </div>

          {/* 4. MOBILE SEO & TAGS OPTIMIZATION PANEL */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setExpressSeoOpen(!expressSeoOpen)}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <Search className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">
                    ৬. SEO ও ট্যাগ সেটিংস (Google Search)
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Focus Keyword, Meta Description, URL Slug ও Tags
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black tabular-nums ${
                    seoScore >= 81
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : seoScore >= 60
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  Rank SEO {seoScore}/100
                </span>
                <button
                  type="button"
                  onClick={() => setExpressSeoOpen(!expressSeoOpen)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600 cursor-pointer"
                  aria-label="Toggle SEO panel"
                >
                  {expressSeoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expressSeoOpen && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* 4-Category Mini Score Pills */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  {[
                    { label: 'Basic', val: rankAudit.categories.basic },
                    { label: 'Additional', val: rankAudit.categories.additional },
                    { label: 'Title', val: rankAudit.categories.titleReadability },
                    { label: 'Readability', val: rankAudit.categories.contentReadability },
                  ].map((g) => (
                    <div key={g.label} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-400 font-semibold">{g.label}</p>
                      <p className="font-extrabold text-slate-800 tabular-nums">
                        {g.val.score}/{g.val.max}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 1-Click Auto SEO & Tags */}
                <button
                  type="button"
                  onClick={handleAutoGenerateFullSeo}
                  disabled={isGeneratingSeo}
                  className="w-full min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingSeo ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-sky-400" />
                  )}
                  <span>
                    {isGeneratingSeo ? 'SEO তৈরি হচ্ছে...' : '⚡ ১ ক্লিকে অটো SEO, Slug ও Tags তৈরি করুন'}
                  </span>
                </button>

                {/* Focus Keyword */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="font-bold text-slate-700">Focus Keyword (মূল সার্চ কিওয়ার্ড) *</label>
                    {seoFocusKeyword && (
                      <span
                        className={
                          title.toLowerCase().includes(seoFocusKeyword.toLowerCase())
                            ? 'text-emerald-600 font-bold'
                            : 'text-amber-600 font-semibold'
                        }
                      >
                        {title.toLowerCase().includes(seoFocusKeyword.toLowerCase())
                          ? '✓ শিরোনামে আছে'
                          : '⚠️ শিরোনামে নেই'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={seoFocusKeyword}
                    onChange={(e) => setSeoFocusKeyword(e.target.value)}
                    placeholder="যেমন: Federal Reserve rate cut 2026"
                    className="w-full min-h-[42px] px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* SEO Title */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="font-bold text-slate-700">SEO Title (গুগলে যে শিরোনাম দেখাবে)</label>
                    <span
                      className={`font-mono text-[10px] ${
                        (seoTitle || title).length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {(seoTitle || title).length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || 'ফাঁকা রাখলে মূল শিরোনাম ব্যবহার হবে...'}
                    className="w-full min-h-[42px] px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="font-bold text-slate-700">Meta Description (গুগল সার্চ বিবরণ) *</label>
                    <span
                      className={`font-mono text-[10px] ${
                        seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {seoDescription.length} / 160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="১২০–১৬০ অক্ষরের মধ্যে সংক্ষিপ্ত সারসংক্ষেপ লিখুন..."
                    className="w-full px-3 py-2 text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
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

                {/* URL Slug */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="font-bold text-slate-700">URL Slug (আর্টিকেল লিংক)</label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSlug}
                      className="text-sky-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Generate
                    </button>
                  </div>
                  <div className="flex items-center px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                    <span className="text-slate-400 shrink-0 font-mono">
                      {isCountryEditionSlug(targetCountry) ? `/${targetCountry}/` : '/news/'}
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder={
                        title
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '') || 'article-slug'
                      }
                      className="w-full bg-transparent border-none focus:outline-hidden font-mono text-slate-800 pl-1"
                    />
                  </div>
                </div>

                {/* Featured Image Alt & Pillar Content */}
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Image Alt Text (Google Discover SEO)
                    </label>
                    <input
                      type="text"
                      value={featuredImageAlt}
                      onChange={(e) => setFeaturedImageAlt(e.target.value)}
                      placeholder={seoFocusKeyword ? `${seoFocusKeyword} — ${title}` : 'Describe image with keyword...'}
                      className="w-full min-h-[40px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs cursor-pointer">
                    <span className="font-bold text-slate-800">Mark as Pillar / Cornerstone Article</span>
                    <input
                      type="checkbox"
                      checked={isPillarContent}
                      onChange={(e) => setIsPillarContent(e.target.checked)}
                      className="w-4 h-4 accent-slate-900"
                    />
                  </label>
                </div>

                {/* Subheadline */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Subheadline / Summary (উপ-শিরোনাম)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="ছোট ১ লাইনের উপ-শিরোনাম (ঐচ্ছিক)..."
                    className="w-full min-h-[40px] px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* News Tags */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="font-bold text-slate-700">News Tags ({selectedTags.length})</label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateTags}
                      disabled={isGeneratingSeo}
                      className="text-sky-600 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" /> AI Tags
                    </button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="tag1, tag2 লিখে Add চাপুন..."
                      className="flex-1 min-h-[40px] px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-lg"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                            className="text-sky-400 hover:text-rose-500 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {popularSuggestedTags.slice(0, 6).map((pt) => {
                      const isAdded = selectedTags.includes(pt);
                      return (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => handleQuickAddTag(pt)}
                          disabled={isAdded}
                          className={`text-[10px] px-2 py-1 rounded-md font-semibold border cursor-pointer ${
                            isAdded
                              ? 'bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-slate-50 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isAdded ? `✓ ${pt}` : `+ ${pt}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Mobile Rank Checklist & Internal Link Suggester */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpressChecklistOpen(!expressChecklistOpen)}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <span>
                      Rank Checklist ({rankAudit.passedCount}/{rankAudit.totalChecks}) & Internal Links
                    </span>
                    {expressChecklistOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expressChecklistOpen && (
                    <div className="p-3 space-y-3 bg-white text-[11px]">
                      <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {rankAudit.checks.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-2">
                            <span className={item.passed ? 'text-slate-700 font-semibold' : 'text-slate-500'}>
                              {item.label}
                            </span>
                            {item.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                      {internalLinkSuggestions.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <p className="font-bold text-slate-800">Internal Link Suggestions (Tap to insert):</p>
                          {internalLinkSuggestions.slice(0, 3).map((sug) => (
                            <div key={sug.postId} className="flex items-center justify-between gap-2">
                              <span className="truncate text-slate-600">{sug.title}</span>
                              <button
                                type="button"
                                onClick={() => handleInsertInternalLink(sug.title, sug.url)}
                                className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold shrink-0 cursor-pointer"
                              >
                                + Link
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Live Mobile Google SERP Preview */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Google Search Preview
                  </p>
                  <p className="text-[11px] font-mono text-emerald-700 truncate">
                    www.official1.online{isCountryEditionSlug(targetCountry) ? `/${targetCountry}/` : '/news/'}
                    {slug || 'article-slug'}
                  </p>
                  <p className="text-xs font-bold text-[#1a0dab] line-clamp-1">
                    {seoTitle || title || 'খবরের শিরোনাম এখানে দেখাবে'} | Alif News 24
                  </p>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {seoDescription || subtitle || 'Meta description গুগল সার্চে এখানে দেখাবে...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Mobile Thumb Action Bar */}
          <div className="sticky bottom-3 z-30 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="min-h-[48px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Draft</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="min-h-[48px] px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSave('published')}
              className="flex-1 min-h-[48px] px-5 py-2.5 bg-[#00C5FF] hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Publish Live Now</span>
            </button>
          </div>
        </div>
      ) : (
        <>

      {/* AI Copilot Drawer (Embedded) */}
      {aiDrawerOpen && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 p-5 rounded-2xl border border-purple-200 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Gemini 4 Hydrogen Newsroom Copilot
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
              type="button"
              onClick={handleAiGenerateArticle}
              disabled={aiLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {aiLoading ? 'Generating...' : 'Generate Full Story'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-purple-200/70">
            <span className="text-[11px] font-bold text-purple-900 mr-1">AI দিয়ে যা জেনারেট করবেন:</span>
            <button
              type="button"
              onClick={handleAiHeadlines}
              disabled={aiLoading}
              className="px-3 py-1.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              5 Headlines
            </button>
            <button
              type="button"
              onClick={handleAutoGenerateTags}
              disabled={isGeneratingSeo}
              className="px-3 py-1.5 bg-white hover:bg-purple-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              ⚡ Generate Tags
            </button>
            <button
              type="button"
              onClick={handleAutoGenerateFullSeo}
              disabled={isGeneratingSeo}
              className="px-3 py-1.5 bg-white hover:bg-purple-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Full SEO & Meta
            </button>
            <button
              type="button"
              onClick={handleAutoGenerateSlug}
              className="px-3 py-1.5 bg-white hover:bg-purple-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              URL Slug / ID
            </button>
            <button
              type="button"
              onClick={() => handleAiTranslate('Spanish')}
              disabled={aiLoading}
              className="px-3 py-1.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{readingTime} min read</span>
                <span>•</span>
                <span className="font-mono text-slate-500">
                  url: {isCountryEditionSlug(targetCountry) ? `/${targetCountry}/` : '/news/'}
                  {slug || (title ? title.toLowerCase().slice(0, 30).replace(/[^a-z0-9]/g, '-') : 'untitled')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateSlug}
                className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
              >
                ⚡ Generate Slug / ID
              </button>
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
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          applyFormatToTextarea(
                            paragraphTextareaRefs.current[block.id] || null,
                            String(block.content || ''),
                            (nextVal) => handleUpdateBlock(block.id, { content: nextVal }),
                            'bold'
                          )
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-md text-[11px] font-black text-slate-900 flex items-center gap-1 cursor-pointer"
                        title="সিলেক্ট করা লেখা মোটা করুন (**Bold**)"
                      >
                        <Bold className="w-3 h-3" /> মোটা (B)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormatToTextarea(
                            paragraphTextareaRefs.current[block.id] || null,
                            String(block.content || ''),
                            (nextVal) => handleUpdateBlock(block.id, { content: nextVal }),
                            'h2'
                          )
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-sky-700 hover:text-white border border-slate-200 rounded-md text-[11px] font-extrabold text-slate-800 cursor-pointer"
                        title="বড় মোটা সাব-হেডলাইন (## H2)"
                      >
                        H2 হেডলাইন
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormatToTextarea(
                            paragraphTextareaRefs.current[block.id] || null,
                            String(block.content || ''),
                            (nextVal) => handleUpdateBlock(block.id, { content: nextVal }),
                            'h3'
                          )
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-sky-700 hover:text-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 cursor-pointer"
                        title="ছোট হেডলাইন (### H3)"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormatToTextarea(
                            paragraphTextareaRefs.current[block.id] || null,
                            String(block.content || ''),
                            (nextVal) => handleUpdateBlock(block.id, { content: nextVal }),
                            'list'
                          )
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-800 hover:text-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                        title="পয়েন্ট লিস্ট"
                      >
                        <List className="w-3 h-3" /> List
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormatToTextarea(
                            paragraphTextareaRefs.current[block.id] || null,
                            String(block.content || ''),
                            (nextVal) => handleUpdateBlock(block.id, { content: nextVal }),
                            'quote'
                          )
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-800 hover:text-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                        title="উদ্ধৃতি (Quote)"
                      >
                        <Quote className="w-3 h-3" /> Quote
                      </button>
                    </div>
                    <textarea
                      ref={(el) => {
                        paragraphTextareaRefs.current[block.id] = el;
                      }}
                      rows={5}
                      value={block.content}
                      onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                      onPaste={(e) => handleParagraphPaste(e, index)}
                      className="w-full text-sm text-slate-700 leading-relaxed border-none focus:outline-hidden resize-y placeholder:text-slate-300"
                      placeholder="লেখা লিখুন বা Paste করুন—যেকোনো লেখা সিলেক্ট করে উপরে 'মোটা (B)' বা 'H2 হেডলাইন' চাপতে পারেন..."
                    />
                  </div>
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
                      placeholder="Bold Headline / Subheading text..."
                      className="w-full text-xl font-extrabold text-slate-950 border-none focus:outline-hidden"
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
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor={`block-img-${block.id}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        {uploadingBlockId === block.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingBlockId === block.id ? 'Uploading...' : 'গ্যালারি আপলোড'}</span>
                      </label>
                      <input
                        id={`block-img-${block.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBlockGalleryImageUpload(block.id, e)}
                        className="sr-only"
                      />
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                        placeholder="Image URL..."
                        className="flex-1 min-w-[180px] px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
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
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Heading className="w-3.5 h-3.5 text-sky-600" /> Heading (H2/H3)
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Country Edition (কোন দেশের পেজে দেখাবে)
              </label>
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value as TargetCountry)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                {TARGET_COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label} — {c.fullName} ({c.code === 'global' ? '/news/...' : `/${c.code}/...`})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">
                https://www.official1.online{isCountryEditionSlug(targetCountry) ? `/${targetCountry}/` : '/news/'}
                {slug || 'post-slug'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Author Name (পোস্টের উপরে &ldquo;By ...&rdquo; হিসেবে যা দেখাবে)
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Alif News 24 Desk"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-semibold"
              />
              <div className="flex flex-wrap gap-1.5">
                {['Alif News 24 Desk', 'Staff Correspondent', 'Alif Sheen', 'International Desk'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAuthorName(preset);
                      setAuthorRole(preset.includes('Desk') ? 'Editorial Desk' : 'Senior Correspondent');
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition-colors cursor-pointer ${
                      authorName === preset
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Designation</label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="Correspondent"
                    className="w-full px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Quick Team Pick</label>
                  <select
                    value={authorId}
                    onChange={(e) => {
                      const picked = allUsers.find((u) => u.id === e.target.value);
                      if (picked) {
                        setAuthorId(picked.id);
                        setAuthorName(picked.name);
                        setAuthorRole(picked.role);
                        setAuthorAvatar(picked.avatar);
                      }
                    }}
                    className="w-full px-2 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Preview: <span className="font-bold text-slate-800">By {authorName.trim() || 'Alif News 24 Desk'}</span> · {authorRole.trim() || 'Correspondent'}
              </p>
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

              <div className="mt-2.5 flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAddCategory('append');
                    }
                  }}
                  placeholder="+ নতুন ক্যাটাগরি যোগ করুন..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAddCategory('append')}
                  disabled={!newCategoryInput.trim()}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Article Tags (কমা `,` দিয়ে একসাথে একাধিক)
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateTags}
                  disabled={isGeneratingSeo}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isGeneratingSeo ? 'Generating...' : 'AI Generate'}</span>
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="tag1, tag2, tag3 লিখে Enter বা Add চাপুন..."
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Featured Cover Visual</span>
              </h3>
              {featuredImage && (
                <button
                  type="button"
                  onClick={() => {
                    setFeaturedImage('');
                    setImagePreviewFallback('');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label
                htmlFor="gallery-image-upload-input"
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isUploadingImage
                    ? 'bg-slate-200 text-slate-500 pointer-events-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isUploadingImage ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingImage ? 'Uploading...' : 'গ্যালারি আপলোড'}</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setMediaItems([...db.getMedia()]);
                  setShowMediaPicker(!showMediaPicker);
                }}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>Media Library</span>
              </button>
            </div>

            {showMediaPicker && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Saved Images ({mediaItems.filter((m) => m.type === 'image').length})</span>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                  {mediaItems
                    .filter((m) => m.type === 'image')
                    .slice(0, 18)
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handlePickExistingMedia(m)}
                        className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 hover:border-sky-500 cursor-pointer bg-white"
                      >
                        <img src={m.url} alt={m.altText || m.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                </div>
              </div>
            )}

            <input
              type="text"
              value={featuredImage}
              onChange={(e) => {
                setImagePreviewFallback('');
                setFeaturedImage(e.target.value);
              }}
              placeholder="Featured Image URL..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />

            {featuredImage && (
              <div className="rounded-xl overflow-hidden border border-slate-200 relative group">
                <img
                  src={featuredImage}
                  onError={(e) => {
                    if (imagePreviewFallback && e.currentTarget.src !== imagePreviewFallback) {
                      e.currentTarget.src = imagePreviewFallback;
                    }
                  }}
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
                Gemini 4
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

          {/* Comprehensive Rank SEO Pro Inspector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            {/* Header with 100-Point Score */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-sky-600" />
                  <span>Rank SEO Analyzer</span>
                </h3>
                <p className="text-[11px] text-slate-500">গুগল র‍্যাংকিং ও রিচ রেজাল্টস</p>
              </div>

              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black tabular-nums ${
                    seoScore >= 81
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : seoScore >= 60
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  <span>{seoScore}</span>
                  <span className="text-[10px] opacity-75">/ 100</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 tabular-nums">
                  {rankAudit.passedCount}/{rankAudit.totalChecks} Passed
                </p>
              </div>
            </div>

            {/* 5-Tab Rank SEO Navigation */}
            <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600">
              {[
                { key: 'meta', label: 'Meta' },
                { key: 'checklist', label: 'Checklist' },
                { key: 'social', label: 'Social' },
                { key: 'schema', label: 'Schema' },
                { key: 'advanced', label: 'Links/Robots' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSeoActiveTab(t.key as any)}
                  className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer truncate ${
                    seoActiveTab === t.key ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: META, CORNERSTONE, SLUG & LIVE SERP */}
            {seoActiveTab === 'meta' && (
              <div className="space-y-3.5 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-700">Focus Keyword *</label>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      Density: {rankAudit.stats.keywordDensity}%
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoFocusKeyword}
                    onChange={(e) => setSeoFocusKeyword(e.target.value)}
                    placeholder="e.g. US Inflation Federal Reserve"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                {/* Secondary Keywords */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Secondary Keywords
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSecondaryKeyword}
                      onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSecondaryKeyword())}
                      placeholder="Add keyword..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
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
                            className="text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pillar Content Toggle */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Pillar / Cornerstone Content</span>
                    <span className="text-[10px] text-slate-400">Prioritize 1.0 weight in XML Sitemaps</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPillarContent}
                    onChange={(e) => setIsPillarContent(e.target.checked)}
                    className="w-4 h-4 accent-slate-900"
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-700">SEO Title</label>
                    <span className={`text-[10px] font-mono tabular-nums ${(seoTitle || title).length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {(seoTitle || title).length} / 60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || 'Title for Google search results...'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-slate-700">Meta Description *</label>
                    <span className={`text-[10px] font-mono tabular-nums ${seoDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {seoDescription.length} / 160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Concise 120-160 character summary..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg leading-relaxed"
                  />
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">URL Permalink Slug</label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSlug}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Generate
                    </button>
                  </div>
                  <div className="flex items-center px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs">
                    <span className="text-slate-400 shrink-0 font-mono">
                      {isCountryEditionSlug(targetCountry) ? `/${targetCountry}/` : '/news/'}
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder={title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'article-slug'}
                      className="w-full bg-transparent border-none focus:outline-hidden font-mono text-slate-800 pl-1"
                    />
                  </div>
                </div>

                {/* Live SERP Preview Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Google SERP Preview</span>
                    <div className="flex gap-1 bg-white p-0.5 rounded-md border border-slate-200 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSerpPreviewDevice('mobile')}
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                          serpPreviewDevice === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-500'
                        }`}
                      >
                        Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => setSerpPreviewDevice('desktop')}
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                          serpPreviewDevice === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-500'
                        }`}
                      >
                        Desktop
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-mono truncate">
                    https://www.official1.online &gt; {isCountryEditionSlug(targetCountry) ? targetCountry : 'news'} &gt; {slug || 'article-slug'}
                  </p>
                  <p className="text-xs font-bold text-[#1a0dab] line-clamp-1">
                    {seoTitle || title || 'Headline Preview'} | Alif News 24
                  </p>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {seoDescription || subtitle || 'Meta description snippet appears here...'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: 4-GROUP RANK MATH SEO CHECKLIST */}
            {seoActiveTab === 'checklist' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">Words / Read Time</span>
                    <strong className="text-slate-900 tabular-nums">
                      {wordCount}w · {readingTime} min
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">Links (Int / Ext)</span>
                    <strong className="text-slate-900 tabular-nums">
                      {rankAudit.stats.internalLinksCount} int · {rankAudit.stats.externalLinksCount} ext
                    </strong>
                  </div>
                </div>

                {[
                  { id: 'basic', title: 'Basic SEO', meta: rankAudit.categories.basic },
                  { id: 'additional', title: 'Additional SEO', meta: rankAudit.categories.additional },
                  { id: 'titleReadability', title: 'Title Readability', meta: rankAudit.categories.titleReadability },
                  { id: 'contentReadability', title: 'Content Readability', meta: rankAudit.categories.contentReadability },
                ].map((group) => (
                  <div key={group.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-extrabold text-slate-800">{group.title}</span>
                      <span className="font-mono font-bold text-[10px] text-slate-500 tabular-nums">
                        {group.meta.score}/{group.meta.max} pts ({group.meta.passed}/{group.meta.total})
                      </span>
                    </div>
                    {rankAudit.checks
                      .filter((c) => c.category === group.id)
                      .map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-2 text-[11px]">
                          <div>
                            <span className={`font-semibold ${item.passed ? 'text-slate-800' : 'text-slate-600'}`}>
                              {item.label}
                            </span>
                            <p className="text-[10px] text-slate-400">{item.tip}</p>
                          </div>
                          {item.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${item.partial ? 'text-sky-500' : 'text-amber-500'}`} />
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: SOCIAL CARDS (FACEBOOK & X) */}
            {seoActiveTab === 'social' && (
              <div className="space-y-3 pt-1 text-xs">
                {/* Visual Social Card Preview */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  {(ogImage || featuredImage) && (
                    <img
                      src={ogImage || featuredImage}
                      alt={featuredImageAlt || title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-3 bg-white border-t border-slate-200">
                    <p className="text-[10px] uppercase text-slate-400 font-mono">official1.online</p>
                    <p className="text-xs font-extrabold text-slate-900 line-clamp-1 mt-0.5">
                      {ogTitle || seoTitle || title || 'Social Share Headline'}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {ogDescription || seoDescription || subtitle || 'Social share preview summary...'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Social / OpenGraph Title</label>
                  <input
                    type="text"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder={seoTitle || title || 'Override headline for Facebook/X'}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Social / OpenGraph Description</label>
                  <textarea
                    rows={2}
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder={seoDescription || 'Override description for social shares...'}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custom OG Image URL (Optional)</label>
                  <input
                    type="url"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="Leave blank to use Featured Image"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">X / Twitter Card Format</label>
                  <select
                    value={twitterCardType}
                    onChange={(e) => setTwitterCardType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="summary_large_image">Summary Card with Large Image</option>
                    <option value="summary">Compact Summary Card</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 4: SCHEMA.ORG, FAQ & HOWTO BUILDER */}
            {seoActiveTab === 'schema' && (
              <div className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Schema.org Structured Data Type
                  </label>
                  <select
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="NewsArticle">NewsArticle (Default Breaking News)</option>
                    <option value="AnalysisNewsArticle">AnalysisNewsArticle (Deep Analysis)</option>
                    <option value="OpinionNewsArticle">OpinionNewsArticle (Op-Ed)</option>
                    <option value="Report">Report (Special Investigation)</option>
                    <option value="LiveBlogPosting">LiveBlogPosting (Developing Live Story)</option>
                    <option value="HowTo">HowTo (Step-by-Step Guide)</option>
                    <option value="FAQPage">NewsArticle + Prominent FAQ Schema</option>
                  </select>
                </div>

                {/* Interactive FAQ Schema Builder */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">FAQ Rich Snippet Builder ({faqItems.length})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFaqItems([
                          ...faqItems,
                          { id: `faq-${Date.now()}`, question: '', answer: '' },
                        ])
                      }
                      className="px-2 py-1 bg-slate-900 text-white rounded-md text-[10px] font-bold cursor-pointer"
                    >
                      + Add FAQ
                    </button>
                  </div>
                  {faqItems.map((faq, idx) => (
                    <div key={faq.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">Question #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setFaqItems(faqItems.filter((f) => f.id !== faq.id))}
                          className="text-rose-500 text-[10px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) =>
                          setFaqItems(
                            faqItems.map((f) => (f.id === faq.id ? { ...f, question: e.target.value } : f))
                          )
                        }
                        placeholder="Question for Google FAQ rich result..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) =>
                          setFaqItems(
                            faqItems.map((f) => (f.id === faq.id ? { ...f, answer: e.target.value } : f))
                          )
                        }
                        placeholder="Concise verified answer..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                      />
                    </div>
                  ))}
                </div>

                {/* HowTo Builder when HowTo schema selected */}
                {schemaType === 'HowTo' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">HowTo Steps ({howToSteps.length})</span>
                      <button
                        type="button"
                        onClick={() =>
                          setHowToSteps([
                            ...howToSteps,
                            { id: `step-${Date.now()}`, title: '', description: '' },
                          ])
                        }
                        className="px-2 py-1 bg-slate-900 text-white rounded-md text-[10px] font-bold cursor-pointer"
                      >
                        + Add Step
                      </button>
                    </div>
                    {howToSteps.map((step, idx) => (
                      <div key={step.id} className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">Step {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setHowToSteps(howToSteps.filter((s) => s.id !== step.id))}
                            className="text-rose-500 text-[10px] font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) =>
                            setHowToSteps(
                              howToSteps.map((s) => (s.id === step.id ? { ...s, title: e.target.value } : s))
                            )
                          }
                          placeholder="Step headline..."
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                        />
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) =>
                            setHowToSteps(
                              howToSteps.map((s) => (s.id === step.id ? { ...s, description: e.target.value } : s))
                            )
                          }
                          placeholder="Step instructions..."
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const dummyGraph = buildArticleGraphSchema({
                      post: {
                        ...(postToEdit || ({} as Post)),
                        id: postToEdit?.id || 'preview',
                        title,
                        subtitle,
                        slug,
                        category,
                        tags: selectedTags,
                        featuredImage,
                        seo: {
                          title: seoTitle || title,
                          description: seoDescription,
                          focusKeyword: seoFocusKeyword,
                          score: seoScore,
                          schemaType,
                          faqItems,
                          howToSteps,
                        },
                      } as Post,
                      canonicalUrl:
                        canonicalUrl ||
                        `https://www.official1.online${
                          isCountryEditionSlug(targetCountry) ? `/${targetCountry}` : '/news'
                        }/${slug || 'preview'}`,
                      baseUrl: 'https://www.official1.online',
                      siteName: 'Alif News 24',
                    });
                    navigator.clipboard.writeText(JSON.stringify(dummyGraph, null, 2));
                    toast.success('Article @graph JSON-LD copied!');
                  }}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Copy Article @graph JSON-LD
                </button>
              </div>
            )}

            {/* TAB 5: ROBOTS, ALT SEO, REDIRECT & INTERNAL LINK SUGGESTER */}
            {seoActiveTab === 'advanced' && (
              <div className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Featured Image Alt Text (SEO)
                  </label>
                  <input
                    type="text"
                    value={featuredImageAlt}
                    onChange={(e) => setFeaturedImageAlt(e.target.value)}
                    placeholder={seoFocusKeyword ? `${seoFocusKeyword} — ${title}` : 'Describe image for Google Image Search'}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Search Robots Directives
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { token: 'noindex', conflict: 'index', label: 'Noindex (Hide from Search)' },
                      { token: 'nofollow', conflict: 'follow', label: 'Nofollow Links' },
                      { token: 'noarchive', label: 'No Archive Cache' },
                      { token: 'noimageindex', label: 'No Image Index' },
                    ].map((flag) => {
                      const active = metaRobots.toLowerCase().includes(flag.token);
                      return (
                        <label
                          key={flag.token}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleRobotsToken(flag.token, flag.conflict)}
                            className="accent-slate-900"
                          />
                          <span className="font-semibold text-slate-700">{flag.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Active: {metaRobots}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Breadcrumb Short Title</label>
                    <input
                      type="text"
                      value={breadcrumbTitle}
                      onChange={(e) => setBreadcrumbTitle(e.target.value)}
                      placeholder={category || 'Optional shorter breadcrumb label'}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Canonical URL Override</label>
                    <input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://www.official1.online/... (optional)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Post Redirect URL (Optional 301/302)
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={redirectType}
                        onChange={(e) => setRedirectType(e.target.value as any)}
                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-bold"
                      >
                        <option value="301">301</option>
                        <option value="302">302</option>
                      </select>
                      <input
                        type="text"
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="/usa/newer-article (leave blank normally)"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Internal Link Suggester */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">
                    Internal Link Suggester ({internalLinkSuggestions.length})
                  </span>
                  {internalLinkSuggestions.map((sug) => (
                    <div key={sug.postId} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-[11px]">{sug.title}</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">{sug.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertInternalLink(sug.title, sug.url)}
                        className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        + Insert
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

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
                          {renderInlineFormatting(sec.text)}
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
                            <li key={idx}>{renderInlineFormatting(item)}</li>
                          ))}
                        </ul>
                      )}
                      {sec.type === 'quote' && (
                        <blockquote className="border-y border-slate-200 py-4 my-4 text-center italic font-['Playfair_Display',Georgia,serif] text-lg text-slate-900">
                          “{renderInlineFormatting(sec.text)}”
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
