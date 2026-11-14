import React, { useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Search,
  Eye,
  MessageSquare,
  Share2,
  Calendar,
  Clock,
  Send,
  Sun,
  Moon,
  Tv,
  CheckCircle,
  FileCode,
  Mail,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Bookmark,
  Globe,
  Radio,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { db } from '../../services/db';
import { Post, Comment, Page } from '../../types';
import { navigateTo, parseCurrentRoute } from '../../services/router';
import { updatePageSeo } from '../../services/seo';
import {
  formatArticleForReader,
  estimateReadingTimeMinutes,
  FormattedSection,
} from '../../utils/articleFormatter';

interface PublicWebsiteViewProps {
  onBackToAdmin: () => void;
  onOpenAdminLogin: () => void;
  isAdminAuthenticated: boolean;
  onLogoutAdmin: () => void;
  initialPost?: Post | null;
  initialPage?: Page | null;
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({
  onBackToAdmin,
  onOpenAdminLogin,
  isAdminAuthenticated,
  onLogoutAdmin,
  initialPost,
  initialPage,
}) => {
  const [posts, setPosts] = useState<Post[]>(() => db.getPosts().filter((p) => p.status === 'published'));
  const [categories, setCategories] = useState(() => db.getCategories());
  const [pages, setPages] = useState<Page[]>(() => db.getPages());
  const [settings, setSettings] = useState(() => db.getSettings());
  const [footerConfig, setFooterConfig] = useState(() => db.getFooterConfig());
  const [commentsList, setCommentsList] = useState<Comment[]>(() => db.getComments().filter((c) => c.status === 'approved'));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<Post | null>(initialPost || null);
  const [activePage, setActivePage] = useState<Page | null>(initialPage || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [drawerMenuOpen, setDrawerMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [readerTextSize, setReaderTextSize] = useState<'normal' | 'large'>('normal');
  const [scrollProgress, setScrollProgress] = useState(0);

  // New comment form state on article page
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState<'approved' | 'pending' | null>(null);

  // Contact page form simulator
  const [contactSent, setContactSent] = useState(false);

  // Newsletter subscription simulator
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Share message simulator
  const [shareCopied, setShareCopied] = useState(false);

  const handleOpenArticle = (post: Post) => {
    setActiveArticle(post);
    setActivePage(null);
    navigateTo('/news/' + post.slug);
    updatePageSeo({
      title: post.title,
      description: post.excerpt,
      ogImage: post.featuredImage,
      ogType: 'article',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real live clock for top newspaper masthead bar
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Reading progress indicator while reading an article
  React.useEffect(() => {
    if (!activeArticle) {
      setScrollProgress(0);
      return;
    }
    const onScroll = () => {
      const docEl = document.documentElement;
      const total = docEl.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeArticle]);

  // Strict 1-person = 1-view counter for both card clicks and direct shared URLs
  React.useEffect(() => {
    if (activeArticle && activeArticle.status === 'published') {
      db.incrementPostViews(activeArticle.id);
      const updated = db.getPosts().find((p) => p.id === activeArticle.id);
      if (updated && updated.views !== activeArticle.views) {
        setActiveArticle(updated);
      }
    }
  }, [activeArticle?.id, activeArticle?.status]);

  // Real-time Firestore DB listener so edits from Admin reflect live on all phones
  React.useEffect(() => {
    const refreshFromDb = () => {
      const latestPosts = db.getPosts().filter((p) => p.status === 'published');
      setPosts(latestPosts);
      setCategories([...db.getCategories()]);
      setPages([...db.getPages()]);
      setSettings({ ...db.getSettings() });
      setFooterConfig({ ...db.getFooterConfig() });
      setCommentsList(db.getComments().filter((c) => c.status === 'approved'));

      setActiveArticle((prev) => {
        if (!prev) return prev;
        return latestPosts.find((p) => p.id === prev.id || p.slug === prev.slug) || prev;
      });
    };

    const unsub = db.subscribe(refreshFromDb);
    return unsub;
  }, []);

  const footerPages = pages.filter((p) => p.showInFooter && p.status === 'published');

  const getPostCategoryList = (post: Post): string[] => {
    const raw =
      Array.isArray(post.categories) && post.categories.length > 0
        ? post.categories
        : post.category
        ? [post.category]
        : ['General'];
    return Array.from(new Set(raw.filter(Boolean)));
  };

  const postHasCategory = (post: Post, targetCat: string): boolean => {
    const norm = targetCat.toLowerCase().trim();
    return getPostCategoryList(post).some((c) => {
      const cNorm = c.toLowerCase().trim();
      const cSlug = cNorm.replace(/[^a-z0-9]+/g, '-');
      return cNorm === norm || cSlug === norm;
    });
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory !== 'all' && !postHasCategory(p, selectedCategory)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        getPostCategoryList(p).some((c) => c.toLowerCase().includes(q)) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const featuredPost = posts.find((p) => p.isBreaking) || posts[0];
  const secondaryLeads = posts.filter((p) => p.id !== featuredPost?.id).slice(0, 2);
  const mostReadPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
  const businessPosts = posts
    .filter((p) =>
      getPostCategoryList(p).some((c) => c.toLowerCase().includes('business') || c.toLowerCase().includes('finance'))
    )
    .slice(0, 4);
  const techPosts = posts
    .filter((p) =>
      getPostCategoryList(p).some((c) => c.toLowerCase().includes('tech') || c.toLowerCase().includes('science'))
    )
    .slice(0, 4);
  const opinionPost = posts.find((p) => p.isEditorPick) || posts[1] || posts[0];

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !commentName.trim() || !commentText.trim()) return;

    const created = db.addComment(
      activeArticle.id,
      activeArticle.title,
      commentName.trim(),
      commentEmail.trim() || 'reader@example.com',
      commentText.trim()
    );

    setCommentsList(db.getComments().filter((c) => c.status === 'approved'));
    setCommentSubmitted(created.status === 'approved' ? 'approved' : 'pending');
    setCommentName('');
    setCommentEmail('');
    setCommentText('');
    setTimeout(() => setCommentSubmitted(null), 4000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    db.addSubscriber(newsletterEmail, 'US Edition Reader');
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSubscribed(false), 5000);
  };

  const handleShare = async () => {
    if (activeArticle && typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: activeArticle.title,
          text: activeArticle.subtitle || activeArticle.excerpt,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard copy if user dismisses native sheet
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  const handleSelectHome = () => {
    setSelectedCategory('all');
    setActiveArticle(null);
    setActivePage(null);
    navigateTo('/');
    updatePageSeo({ title: "America's 24/7 Live News Portal" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catName: string) => {
    setActiveArticle(null);
    setActivePage(null);
    if (catName.toLowerCase() === 'all') {
      setSelectedCategory('all');
      navigateTo('/');
      updatePageSeo({ title: "America's 24/7 Live News Portal" });
    } else {
      setSelectedCategory(catName);
      const catObj = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
      const slug = catObj ? catObj.slug : catName.toLowerCase();
      navigateTo('/category/' + slug);
      updatePageSeo({ title: `${catName} News` });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPage = (page: Page) => {
    setActivePage(page);
    setActiveArticle(null);
    navigateTo('/page/' + page.slug);
    updatePageSeo({
      title: page.seoTitle || page.title,
      description: page.seoDescription || page.title,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFooterLinkClick = (url: string) => {
    const cleanUrl = (url || '/').trim();
    if (cleanUrl === '#login' || cleanUrl === '/admin') {
      onOpenAdminLogin();
      return;
    }
    if (cleanUrl === '/' || cleanUrl === '') {
      handleSelectHome();
      return;
    }
    if (cleanUrl.startsWith('/category/')) {
      const slug = cleanUrl.replace(/^\/category\//, '').split('/')[0];
      const matched = categories.find(
        (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === slug.toLowerCase()
      );
      handleSelectCategory(matched ? matched.name : slug);
      return;
    }
    if (cleanUrl.startsWith('/page/')) {
      const slug = cleanUrl.replace(/^\/page\//, '').split('/')[0];
      const matched = pages.find((p) => p.slug === slug || p.id === slug);
      if (matched) {
        handleSelectPage(matched);
        return;
      }
    }
    if (cleanUrl.startsWith('/news/') || cleanUrl.startsWith('/article/')) {
      const slug = cleanUrl.replace(/^\/(news|article)\//, '').split('/')[0];
      const matched = posts.find((p) => p.slug === slug || p.id === slug);
      if (matched) {
        handleOpenArticle(matched);
        return;
      }
    }
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    handleSelectHome();
  };

  // Synchronize route on popstate and initial load
  React.useEffect(() => {
    if (initialPost) {
      setActiveArticle(initialPost);
      setActivePage(null);
      updatePageSeo({
        title: initialPost.title,
        description: initialPost.excerpt,
        ogImage: initialPost.featuredImage,
        ogType: 'article',
      });
    } else if (initialPage) {
      setActivePage(initialPage);
      setActiveArticle(null);
      updatePageSeo({
        title: initialPage.seoTitle || initialPage.title,
        description: initialPage.seoDescription || initialPage.title,
      });
    } else {
      const route = parseCurrentRoute();
      if (route.type === 'article') {
        const found = db.getPosts().find((p) => p.slug === route.slug || p.id === route.slug);
        if (found) {
          setActiveArticle(found);
          setActivePage(null);
          updatePageSeo({
            title: found.title,
            description: found.excerpt,
            ogImage: found.featuredImage,
            ogType: 'article',
          });
        }
      } else if (route.type === 'page') {
        const found = db.getPages().find((p) => p.slug === route.slug || p.id === route.slug);
        if (found) {
          setActivePage(found);
          setActiveArticle(null);
          updatePageSeo({
            title: found.seoTitle || found.title,
            description: found.seoDescription || found.title,
          });
        }
      } else if (route.type === 'category') {
        setSelectedCategory(route.slug);
        setActiveArticle(null);
        setActivePage(null);
        updatePageSeo({ title: `${route.slug.toUpperCase()} News` });
      } else {
        updatePageSeo({ title: "America's 24/7 Live News Portal" });
      }
    }

    const handlePopState = () => {
      const route = parseCurrentRoute();
      const latestPosts = db.getPosts().filter((p) => p.status === 'published');
      const latestPages = db.getPages();
      if (route.type === 'article') {
        const found = latestPosts.find((p) => p.slug === route.slug || p.id === route.slug);
        if (found) {
          setActiveArticle(found);
          setActivePage(null);
          updatePageSeo({
            title: found.title,
            description: found.excerpt,
            ogImage: found.featuredImage,
            ogType: 'article',
          });
        }
      } else if (route.type === 'page') {
        const found = latestPages.find((p) => p.slug === route.slug || p.id === route.slug);
        if (found) {
          setActivePage(found);
          setActiveArticle(null);
          updatePageSeo({
            title: found.seoTitle || found.title,
            description: found.seoDescription || found.title,
          });
        }
      } else if (route.type === 'category') {
        setSelectedCategory(route.slug);
        setActiveArticle(null);
        setActivePage(null);
        updatePageSeo({ title: `${route.slug.toUpperCase()} News` });
      } else if (route.type === 'home') {
        setActiveArticle(null);
        setActivePage(null);
        setSelectedCategory('all');
        updatePageSeo({ title: "America's 24/7 Live News Portal" });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialPost, initialPage]);

  const liveDateLabel = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const liveClockLabel = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const activeSections: FormattedSection[] = activeArticle
    ? formatArticleForReader(activeArticle.blocks, activeArticle.content)
    : [];
  const activeReadMinutes = activeArticle
    ? estimateReadingTimeMinutes(activeSections, activeArticle.title)
    : 1;
  const activeArticleComments = activeArticle
    ? commentsList.filter((c) => c.postId === activeArticle.id)
    : [];
  const relatedArticles = activeArticle
    ? (() => {
        const activeCats = getPostCategoryList(activeArticle).map((c) => c.toLowerCase());
        return posts
          .filter((p) => p.id !== activeArticle.id)
          .sort((a, b) => {
            const aShared = getPostCategoryList(a).filter((c) => activeCats.includes(c.toLowerCase())).length;
            const bShared = getPostCategoryList(b).filter((c) => activeCats.includes(c.toLowerCase())).length;
            return bShared - aShared;
          })
          .slice(0, 3);
      })()
    : [];

  return (
    <div
      className={`min-h-screen font-['Plus_Jakarta_Sans',sans-serif] ${
        darkMode ? 'dark bg-[#0B0F19] text-slate-100' : 'bg-[#FAFAFB] text-slate-900'
      }`}
    >
      {/* Reading progress hairline while reading an article */}
      {activeArticle && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none">
          <div
            className="h-full bg-red-600 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* 1. TOP GLOBAL NEWSPAPER BAR (REAL LIVE DATE & CLOCK) */}
      <div className="bg-[#0B132B] text-slate-300 border-b border-slate-800 text-xs px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{liveDateLabel}</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-mono tabular-nums text-sky-300 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400 shrink-0" />
              {liveClockLabel}
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">
              Edition: <strong className="text-white">United States · International Desk</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-slate-300 font-semibold text-[11px]">
              24/7 News Desk
            </span>

            {isAdminAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onBackToAdmin}
                  className="flex items-center gap-1.5 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  title="Open Editorial Workspace"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Workspace</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-md font-medium text-[11px] transition-colors cursor-pointer"
                title="US Edition"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>US Edition</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BREAKING NEWS TICKER */}
      {settings.breakingNewsTickerActive && (
        <div className="bg-red-600 text-white px-4 sm:px-8 py-1.5 flex items-center gap-3 text-xs overflow-hidden shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-black/40 font-extrabold uppercase rounded-sm text-[10px] tracking-wider shrink-0 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-white animate-bounce" />
              BREAKING NEWS
            </span>
            <div className="truncate font-semibold tracking-wide text-xs">
              {settings.breakingNewsText}
            </div>
          </div>
        </div>
      )}

      {/* 3. 3-TOOTH DRAWER (ONLY PAGES - NO CATEGORIES) */}
      {drawerMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setDrawerMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-88 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div
                onClick={() => {
                  handleSelectHome();
                  setDrawerMenuOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-lg text-white font-serif font-black text-lg shadow-xs">
                    A
                    <span className="absolute -bottom-1 -right-1 px-1 bg-slate-950 text-[8px] font-sans font-black text-sky-400 rounded-xs border border-slate-700 leading-none">
                      24
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-serif font-black text-lg text-slate-900 dark:text-white leading-none">
                      <span>ALIF</span>
                      <span className="text-red-600 font-sans font-extrabold">NEWS</span>
                      <span className="text-xs px-1.5 py-0.2 bg-red-600 text-white font-sans rounded-sm font-black">24</span>
                    </div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">
                      Published Pages Directory
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDrawerMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: ONLY PAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              <button
                onClick={() => {
                  handleSelectHome();
                  setDrawerMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  !activeArticle && !activePage
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Frontpage (All News)
                </span>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              {/* Page Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Published Pages List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Published Pages
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {pages.filter((p) => p.status === 'published').length} Pages
                  </span>
                </div>

                <div className="space-y-2">
                  {pages
                    .filter(
                      (p) =>
                        p.status === 'published' &&
                        (!pageSearchQuery.trim() ||
                          p.title.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
                          p.slug.toLowerCase().includes(pageSearchQuery.toLowerCase()))
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleSelectPage(p);
                          setDrawerMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                          activePage?.id === p.id
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-sky-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              activePage?.id === p.id
                                ? 'bg-white/20 text-white'
                                : 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                            }`}
                          >
                            <FileCode className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="truncate font-bold text-xs">{p.title}</p>
                            <span
                              className={`text-[10px] uppercase font-mono ${
                                activePage?.id === p.id ? 'text-sky-100' : 'text-slate-400'
                              }`}
                            >
                              /{p.slug} • {p.template}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-60 shrink-0 ml-2" />
                      </button>
                    ))}

                  {pages.filter(
                    (p) =>
                      p.status === 'published' &&
                      (!pageSearchQuery.trim() ||
                        p.title.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
                        p.slug.toLowerCase().includes(pageSearchQuery.toLowerCase()))
                  ).length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No matching pages found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
              {isAdminAuthenticated ? (
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setDrawerMenuOpen(false);
                      onBackToAdmin();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Open Editorial Workspace</span>
                  </button>
                  <button
                    onClick={() => {
                      setDrawerMenuOpen(false);
                      onLogoutAdmin();
                    }}
                    className="w-full py-2 text-center text-xs text-red-500 hover:text-red-600 font-semibold cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setDrawerMenuOpen(false);
                    onOpenAdminLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Newsroom Edition · Desk</span>
                </button>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Theme Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN EDITORIAL MASTHEAD */}
      <header className={`border-b ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
          {/* Left: 3-Tooth Hamburger Button (3-Tooth Pages Menu) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawerMenuOpen(true)}
              title="Open Pages Menu"
              aria-label="Open Pages Menu"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex flex-col gap-1 items-center justify-center">
                <span className="w-5 h-0.5 bg-slate-800 dark:bg-slate-200 group-hover:bg-red-600 rounded-full transition-colors" />
                <span className="w-5 h-0.5 bg-slate-800 dark:bg-slate-200 group-hover:bg-red-600 rounded-full transition-colors" />
                <span className="w-5 h-0.5 bg-slate-800 dark:bg-slate-200 group-hover:bg-red-600 rounded-full transition-colors" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-red-600 transition-colors hidden sm:inline">
                Pages Menu
              </span>
            </button>

            <span className="hidden md:inline-block text-xs font-medium text-slate-400">
              Independent American Journalism
            </span>
          </div>

          {/* Center: Prestigious Alif News 24 Brand Logo */}
          <div
            onClick={handleSelectHome}
            className="flex items-center gap-3 cursor-pointer select-none text-left"
          >
            {/* Custom Emblem */}
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-xl shadow-md text-white font-serif font-black text-2xl sm:text-3xl tracking-tighter ring-2 ring-red-500/20 shrink-0">
              A
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-slate-950 text-[9px] font-sans font-black text-emerald-400 rounded-sm border border-slate-700 leading-none shadow-xs">
                24
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-serif font-black text-2xl sm:text-3.5xl tracking-tight text-slate-950 dark:text-white">
                  ALIF
                </span>
                <span className="font-sans font-black text-2xl sm:text-3.5xl text-red-600 tracking-tight">
                  NEWS
                </span>
                <span className="px-1.5 py-0.5 bg-red-600 text-white rounded-md text-sm sm:text-base font-black tracking-tight font-sans shadow-2xs">
                  24
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-wider mt-1 flex items-center gap-1.5">
                <span>Alif News 24</span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span>Truth, Integrity & 24/7 Investigative Journalism</span>
              </p>
            </div>
          </div>

          {/* Right: Search & Dark Mode */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden md:block w-56 lg:w-68">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search politics, markets, tech..."
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 5. CATEGORY NAVIGATION BAR (ONLY CATEGORIES - NO PAGES) */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-2 py-2.5 text-xs font-bold whitespace-nowrap">
              <button
                onClick={handleSelectHome}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  selectedCategory === 'all' && !activeArticle && !activePage
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-red-600'
                }`}
              >
                All Stories
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCategory(c.name)}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    selectedCategory === c.name && !activeArticle && !activePage
                      ? 'bg-red-600 text-white font-extrabold shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-red-600'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 6. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* Ad Space: Global Header Top Slot */}
        <div className="mb-6 p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Tv className="w-4 h-4 text-slate-400" />
          <span>Sponsored Banner • [Global - Header Top Slot • 728x90 Billboard Placement]</span>
        </div>

        {/* VIEW 1: STATIC PAGE READER (When clicked from 3-tooth drawer or footer) */}
        {activePage ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            <button
              onClick={handleSelectHome}
              className="flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Frontpage News
            </button>

            <div className={`p-8 md:p-12 rounded-2xl border shadow-xs space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-sky-600">
                  {activePage.template} Page
                </span>
                <span>·</span>
                <span>Last updated: {activePage.updatedAt}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
                {activePage.title}
              </h1>

              <div className="prose max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap pt-2">
                {activePage.content}
              </div>

              {activePage.template === 'contact' && (
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-8 space-y-4">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    Contact the Editorial Desk (Washington, D.C. Bureau)
                  </h3>

                  {contactSent ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span>Thank you! Your dispatch has been securely submitted to the news desk.</span>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setContactSent(true);
                        setTimeout(() => setContactSent(false), 5000);
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name *"
                          className="p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Your Email Address *"
                          className="p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <textarea
                        rows={4}
                        required
                        placeholder="Provide details regarding your news tip, inquiry, or editorial correction..."
                        className="w-full p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                      >
                        Submit Dispatch
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeArticle ? (
          /* VIEW 2: EDITORIAL ARTICLE READER VIEW */
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Top Reader Navigation & Accessibility Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleSelectHome}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Frontpage</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400">Text size:</span>
                <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setReaderTextSize('normal')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      readerTextSize === 'normal'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderTextSize('large')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      readerTextSize === 'large'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            <article
              className={`px-5 py-7 sm:px-10 sm:py-10 md:px-14 md:py-12 rounded-2xl border shadow-xs ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
              }`}
            >
              {/* Article Editorial Header Column */}
              <header className="max-w-[68ch] mx-auto space-y-5">
                {/* Clean unboxed metadata kicker */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {getPostCategoryList(activeArticle).map((catName, idx, arr) => (
                    <React.Fragment key={catName}>
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(catName)}
                        className="text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        {catName}
                      </button>
                      {idx < arr.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">/</span>
                      )}
                    </React.Fragment>
                  ))}
                  <span aria-hidden="true">·</span>
                  <span>{activeArticle.publishedAt || activeArticle.updatedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeReadMinutes} min read</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {(activeArticle.views || 0).toLocaleString()}{' '}
                    {(activeArticle.views || 0) === 1 ? 'view' : 'views'}
                  </span>
                </div>

                {/* High-contrast Editorial Display Headline */}
                <h1 className="font-['Playfair_Display',Georgia,serif] text-[26px] sm:text-4xl md:text-[42px] font-extrabold leading-[1.16] tracking-tight text-slate-950 dark:text-white text-balance">
                  {activeArticle.title}
                </h1>

                {/* Lead Deck / Subtitle */}
                {activeArticle.subtitle && (
                  <p className="text-base sm:text-[19px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {activeArticle.subtitle}
                  </p>
                )}

                {/* Clean Author Byline & Share Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {activeArticle.author?.avatar ? (
                      <img
                        src={activeArticle.author.avatar}
                        alt={activeArticle.author.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                        {(activeArticle.author?.name || 'A').charAt(0)}
                      </div>
                    )}
                    <div className="text-xs leading-snug">
                      <p className="font-bold text-slate-900 dark:text-white">
                        By {activeArticle.author?.name || 'Alif News 24 Desk'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {activeArticle.author?.role || 'Correspondent'} · Alif News 24
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareCopied ? 'Link Copied' : 'Share Story'}</span>
                  </button>
                </div>
              </header>

              {/* Featured Image with Figure Caption */}
              {activeArticle.featuredImage && (
                <figure className="max-w-3xl mx-auto my-7 sm:my-9">
                  <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800">
                    <img
                      src={activeArticle.featuredImage}
                      alt={activeArticle.title}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[480px] object-cover"
                    />
                  </div>
                  <figcaption className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                    {(activeArticle as any).imageCaption || activeArticle.subtitle || activeArticle.title}
                  </figcaption>
                </figure>
              )}

              {/* Optimal Reading Measure Prose Body */}
              <div
                className={`max-w-[68ch] mx-auto font-['Source_Serif_4',Georgia,serif] text-slate-800 dark:text-slate-200 ${
                  readerTextSize === 'large'
                    ? 'text-[18.5px] sm:text-[19.5px] leading-[1.85]'
                    : 'text-[16.5px] sm:text-[17.5px] leading-[1.82]'
                } space-y-5`}
              >
                {(() => {
                  let renderedFirstParagraph = false;
                  return activeSections.map((sec) => {
                    if (sec.type === 'paragraph') {
                      const isLead = !renderedFirstParagraph && sec.text.length > 60;
                      if (isLead) renderedFirstParagraph = true;
                      return (
                        <p
                          key={sec.id}
                          className={
                            isLead
                              ? "first-letter:font-['Playfair_Display',Georgia,serif] first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85] first-letter:text-slate-950 dark:first-letter:text-white"
                              : ''
                          }
                        >
                          {sec.text}
                        </p>
                      );
                    }

                    if (sec.type === 'heading') {
                      const TagName = sec.level === 4 ? 'h4' : sec.level === 3 ? 'h3' : 'h2';
                      return (
                        <TagName
                          key={sec.id}
                          className="font-['Playfair_Display',Georgia,serif] font-bold text-xl sm:text-2xl text-slate-950 dark:text-white pt-5 mt-7 mb-1 border-t border-slate-100 dark:border-slate-800/80 leading-snug text-balance"
                        >
                          {sec.text}
                        </TagName>
                      );
                    }

                    if (sec.type === 'list') {
                      const ListEl = sec.ordered ? 'ol' : 'ul';
                      return (
                        <ListEl
                          key={sec.id}
                          className={`my-4 pl-6 space-y-2 ${
                            sec.ordered ? 'list-decimal' : 'list-disc'
                          } marker:text-red-600`}
                        >
                          {sec.items.map((item, idx) => (
                            <li key={idx} className="pl-1">
                              {item}
                            </li>
                          ))}
                        </ListEl>
                      );
                    }

                    if (sec.type === 'quote') {
                      return (
                        <blockquote
                          key={sec.id}
                          className="my-7 py-5 px-2 sm:px-6 border-y border-slate-200 dark:border-slate-700 text-center"
                        >
                          <p className="font-['Playfair_Display',Georgia,serif] italic text-xl sm:text-2xl leading-relaxed text-slate-900 dark:text-slate-100">
                            “{sec.text}”
                          </p>
                          {sec.caption && (
                            <cite className="block font-['Plus_Jakarta_Sans',sans-serif] text-xs not-italic font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-3">
                              — {sec.caption}
                            </cite>
                          )}
                        </blockquote>
                      );
                    }

                    if (sec.type === 'callout') {
                      return (
                        <div
                          key={sec.id}
                          className="my-5 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-['Plus_Jakarta_Sans',sans-serif] text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                        >
                          {sec.text}
                        </div>
                      );
                    }

                    if (sec.type === 'image') {
                      return (
                        <figure key={sec.id} className="my-7">
                          <img
                            src={sec.url}
                            alt={sec.caption || activeArticle.title}
                            referrerPolicy="no-referrer"
                            className="w-full rounded-xl object-cover max-h-[420px] border border-slate-200 dark:border-slate-800"
                          />
                          {sec.caption && (
                            <figcaption className="mt-2 text-xs font-['Plus_Jakarta_Sans',sans-serif] text-slate-500 dark:text-slate-400 italic">
                              {sec.caption}
                            </figcaption>
                          )}
                        </figure>
                      );
                    }

                    if (sec.type === 'table') {
                      return (
                        <div key={sec.id} className="my-6 overflow-x-auto font-['Plus_Jakarta_Sans',sans-serif]">
                          <table className="w-full text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <tbody>
                              {sec.rows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className={
                                    rIdx === 0
                                      ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                                      : 'border-t border-slate-200 dark:border-slate-800'
                                  }
                                >
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-3 py-2.5">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    return null;
                  });
                })()}
              </div>

              {/* Clean Topic Index / Tags */}
              {Array.isArray(activeArticle.tags) && activeArticle.tags.length > 0 && (
                <div className="max-w-[68ch] mx-auto mt-10 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="uppercase tracking-wider font-bold text-[11px] text-slate-400">
                    Topics:
                  </span>
                  {activeArticle.tags.map((t, idx) => (
                    <React.Fragment key={t}>
                      <span
                        onClick={() => {
                          setSearchQuery(t);
                          handleSelectHome();
                        }}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer font-semibold"
                      >
                        {t}
                      </span>
                      {idx < activeArticle.tags.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-700">/</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </article>

            {/* Related Dispatches */}
            {relatedArticles.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="font-['Playfair_Display',Georgia,serif] font-extrabold text-xl text-slate-900 dark:text-white">
                    More Dispatches
                  </h3>
                  <button
                    type="button"
                    onClick={handleSelectHome}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    All Stories
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => handleOpenArticle(rel)}
                      className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="aspect-16/10 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={rel.featuredImage}
                          alt={rel.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                            {getPostCategoryList(rel).join(' · ')}
                          </span>
                          <h4 className="font-['Playfair_Display',Georgia,serif] font-bold text-sm leading-snug text-slate-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-2 mt-1">
                            {rel.title}
                          </h4>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 tabular-nums">
                          <span>{rel.publishedAt}</span>
                          <span>
                            {(rel.views || 0).toLocaleString()} {(rel.views || 0) === 1 ? 'view' : 'views'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reader Comments Section */}
            <div className={`p-6 md:p-8 rounded-2xl border shadow-xs space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-['Playfair_Display',Georgia,serif] font-bold text-xl text-slate-900 dark:text-white">
                  Reader Discussion ({activeArticleComments.length})
                </h3>
                <MessageSquare className="w-4 h-4 text-slate-400" />
              </div>

              {activeArticleComments.length > 0 && (
                <div className="space-y-4">
                  {activeArticleComments.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{c.authorName}</span>
                        <span className="text-slate-400 text-[11px]">{c.createdAt}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {c.content}
                      </p>
                      {(c.replies || []).map((rep) => (
                        <div
                          key={rep.id}
                          className="mt-2 ml-4 pl-3 border-l-2 border-red-600 text-xs text-slate-600 dark:text-slate-300 space-y-0.5"
                        >
                          <div className="font-bold text-red-700 dark:text-red-400">{rep.author}</div>
                          <p>{rep.content}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {commentSubmitted ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {commentSubmitted === 'approved'
                      ? 'Thank you! Your comment has been posted.'
                      : 'Thank you! Your comment has been submitted for moderation.'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handlePostComment} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Your Full Name *"
                      className="p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                    <input
                      type="email"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      placeholder="Your Email (Optional)"
                      className="p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your perspective on this report..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Post Comment
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* VIEW 3: NEWSPAPER ENTERPRISE HOMEPAGE DESIGN (100% US / ENGLISH CONTENT) */
          <div className="space-y-10">
            {/* 3.1 HERO EDITORIAL LEAD SECTION: 3 Columns (Lead 7 cols + Trending & Opinion 5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-slate-200 dark:border-slate-800">
              {/* Left Column (7 cols): Main Lead Story + 2 Secondary Leads */}
              <div className="lg:col-span-7 space-y-6">
                {featuredPost && (
                  <div
                    onClick={() => handleOpenArticle(featuredPost)}
                    className="group cursor-pointer space-y-3"
                  >
                    <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                      <img
                        src={featuredPost.featuredImage}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white text-[11px] font-extrabold uppercase rounded-sm shadow-md flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-white" />
                        {featuredPost.isBreaking ? 'BREAKING' : featuredPost.category}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="text-red-600 font-bold uppercase">
                          {getPostCategoryList(featuredPost).join(' · ')}
                        </span>
                        <span>·</span>
                        <span>By {featuredPost.author.name}</span>
                        <span>·</span>
                        <span>{featuredPost.publishedAt}</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-serif font-black leading-tight text-slate-950 dark:text-white group-hover:text-red-600 transition-colors">
                        {featuredPost.title}
                      </h2>

                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2 Secondary Spotlight Stories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  {secondaryLeads.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleOpenArticle(post)}
                      className="group cursor-pointer space-y-2"
                    >
                      <div className="aspect-16/10 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-red-600 uppercase">
                          {getPostCategoryList(post).join(' · ')}
                        </span>
                        <h3 className="font-serif font-bold text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column (5 cols): Ranked Top 5 Most Read + Editor's Pick + Ad */}
              <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-8">
                {/* Most Read (Trending Stories) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-red-600">
                    <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      Trending Stories
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Top 5</span>
                  </div>

                  <div className="space-y-4">
                    {mostReadPosts.map((post, idx) => (
                      <div
                        key={post.id}
                        onClick={() => handleOpenArticle(post)}
                        className="group flex items-start gap-4 cursor-pointer pb-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                      >
                        <span className="font-serif font-black text-2xl text-slate-300 dark:text-slate-700 group-hover:text-red-600 transition-colors w-7 shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {getPostCategoryList(post).join(' · ')} · {post.publishedAt}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar Ad Placement */}
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
                  <span className="font-bold block text-slate-500 uppercase tracking-wider text-[11px]">Sponsored Space</span>
                  <span className="text-[10px]">Author Profile - Sidebar Top (300x250)</span>
                </div>

                {/* Editorial Quote / Opinion Spotlight */}
                {opinionPost && (
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-900/60 border border-amber-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                      Editorial Perspective & Analysis
                    </span>
                    <p className="font-serif italic text-xs leading-relaxed text-slate-800 dark:text-slate-300">
                      "{opinionPost.subtitle || opinionPost.excerpt}"
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <img
                        src={opinionPost.author.avatar}
                        alt={opinionPost.author.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{opinionPost.author.name}</p>
                        <p className="text-[10px] text-slate-500">Alif News 24 Editorial Board</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3.2 THEMATIC SECTION 1: BUSINESS & ECONOMY (2 POSTS PER LINE) */}
            {businessPosts.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-sky-600">
                  <h3 className="font-serif font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    Wall Street & US Economy (Business & Markets)
                  </h3>
                  <button
                    onClick={() => handleSelectCategory('Business')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View More</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {businessPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleOpenArticle(post)}
                      className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row"
                    >
                      <div className="sm:w-2/5 aspect-16/10 sm:aspect-auto overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-sky-600 uppercase">
                            Markets & Policy
                          </span>
                          <h4 className="font-serif font-bold text-sm sm:text-base group-hover:text-sky-600 transition-colors line-clamp-2 mt-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">{post.excerpt}</p>
                        </div>
                        <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 tabular-nums">
                          <span>{post.publishedAt}</span>
                          <span>{(post.views || 0).toLocaleString()} {(post.views || 0) === 1 ? 'view' : 'views'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3.3 THEMATIC SECTION 2: TECHNOLOGY & INNOVATION (2 POSTS PER LINE) */}
            {techPosts.length > 0 && (
              <div className="space-y-4 pt-6">
                <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-600">
                  <h3 className="font-serif font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    Silicon Valley, Tech & Science
                  </h3>
                  <button
                    onClick={() => handleSelectCategory('Technology')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View More</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {techPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleOpenArticle(post)}
                      className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row"
                    >
                      <div className="sm:w-2/5 aspect-16/10 sm:aspect-auto overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">
                            Innovation & Science
                          </span>
                          <h4 className="font-serif font-bold text-sm sm:text-base group-hover:text-emerald-600 transition-colors line-clamp-2 mt-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">{post.excerpt}</p>
                        </div>
                        <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 tabular-nums">
                          <span>{post.publishedAt}</span>
                          <span>{(post.views || 0).toLocaleString()} {(post.views || 0) === 1 ? 'view' : 'views'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3.4 ALL STORIES GRID (2 POSTS PER LINE) */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-black text-xl text-slate-900 dark:text-white">
                  Top National & Global Dispatches
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {filteredPosts.length} articles displayed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleOpenArticle(post)}
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 hover:shadow-md transition-all flex flex-col sm:flex-row"
                  >
                    <div className="sm:w-2/5 aspect-16/10 sm:aspect-auto overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 gap-2">
                          <span className="text-red-600 uppercase truncate">
                            {getPostCategoryList(post).join(' · ')}
                          </span>
                          <span className="shrink-0">{post.publishedAt}</span>
                        </div>
                        <h4 className="font-serif font-bold text-sm sm:text-base leading-snug group-hover:text-red-600 transition-colors line-clamp-2 mt-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1.5">{post.excerpt}</p>
                      </div>
                      <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 tabular-nums">
                        <span>By {post.author.name}</span>
                        <span>{(post.views || 0).toLocaleString()} {(post.views || 0) === 1 ? 'view' : 'views'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3.5 NEWSLETTER SUBSCRIPTION BANNER */}
            <div className="rounded-2xl p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start text-red-500 font-extrabold text-xs uppercase tracking-wider">
                  <Mail className="w-4 h-4" />
                  <span>Daily Morning Wire Briefing</span>
                </div>
                <h3 className="font-serif font-black text-2xl tracking-tight">
                  The Nation's Most Essential News in Your Inbox
                </h3>
                <p className="text-xs text-slate-400 max-w-lg">
                  Start your day with investigative reporting, market data, and political analysis from Washington and beyond delivered straight to your email every morning.
                </p>
              </div>

              {newsletterSubscribed ? (
                <div className="px-6 py-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Thank you! You have successfully subscribed to the Daily Wire.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex items-center gap-2 w-full md:w-auto"
                >
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-red-600 w-full sm:w-64"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 7. DYNAMIC ADMIN-MANAGED NEWSPAPER FOOTER */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Editorial Policy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl text-white font-serif font-black text-xl shadow-xs">
                A
              </div>
              <div className="font-serif font-black text-2xl text-slate-950 dark:text-white flex items-center gap-1.5">
                <span>ALIF</span>
                <span className="text-red-600 font-sans font-extrabold">NEWS</span>
                <span className="text-sm px-1.5 py-0.5 bg-red-600 text-white font-sans rounded-md font-black">24</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              {footerConfig.aboutText}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              {footerConfig.publisherText}
            </p>
          </div>

          {/* Dynamic Footer Columns controlled from Admin -> Appearance -> Footer Menu */}
          {(footerConfig.columns || []).map((col) => (
            <div key={col.id} className="space-y-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                {col.title}
              </h4>
              <div className="space-y-1.5 text-xs">
                {col.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleFooterLinkClick(item.url)}
                    className="block text-left hover:text-red-600 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
                {col.id === 'col-2' &&
                  footerPages
                    .filter((fp) => !col.items.some((it) => it.url.includes(fp.slug)))
                    .map((page) => (
                      <button
                        key={page.id}
                        onClick={() => handleSelectPage(page)}
                        className="block text-left hover:text-red-600 transition-colors cursor-pointer"
                      >
                        {page.title}
                      </button>
                    ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Copyright bar (Discreet Edition trigger) */}
        <div className="border-t border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-8 bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>{footerConfig.copyrightText}</p>
            <div className="flex items-center gap-3">
              {isAdminAuthenticated ? (
                <>
                  <button
                    onClick={onBackToAdmin}
                    className="text-sky-600 hover:text-sky-500 font-semibold cursor-pointer"
                  >
                    Editorial Workspace
                  </button>
                  <button
                    onClick={onLogoutAdmin}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer text-[11px]"
                >
                  US Bureau · Edition v24.1
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
