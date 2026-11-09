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
} from 'lucide-react';
import { db } from '../../services/db';
import { Post, Comment, Page } from '../../types';

interface PublicWebsiteViewProps {
  onBackToAdmin: () => void;
  initialPost?: Post | null;
  initialPage?: Page | null;
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({
  onBackToAdmin,
  initialPost,
  initialPage,
}) => {
  const [posts] = useState<Post[]>(db.getPosts().filter((p) => p.status === 'published'));
  const [categories] = useState(db.getCategories());
  const [pages] = useState<Page[]>(db.getPages());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<Post | null>(initialPost || null);
  const [activePage, setActivePage] = useState<Page | null>(initialPage || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [drawerMenuOpen, setDrawerMenuOpen] = useState(false);

  // New comment form state on article page
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  // Contact page form simulator
  const [contactSent, setContactSent] = useState(false);

  // Newsletter subscription simulator
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Share message simulator
  const [shareCopied, setShareCopied] = useState(false);

  const settings = db.getSettings();

  const footerPages = pages.filter((p) => p.showInFooter && p.status === 'published');

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    }
    return true;
  });

  const featuredPost = posts.find((p) => p.isBreaking) || posts[0];
  const secondaryLeads = posts.filter((p) => p.id !== featuredPost?.id).slice(0, 2);
  const mostReadPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
  const businessPosts = posts.filter((p) => p.category.toLowerCase().includes('business') || p.category.toLowerCase().includes('finance')).slice(0, 3);
  const techPosts = posts.filter((p) => p.category.toLowerCase().includes('tech') || p.category.toLowerCase().includes('science')).slice(0, 3);
  const opinionPost = posts.find((p) => p.isEditorPick) || posts[1] || posts[0];

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !commentName || !commentText) return;

    db.addComment(
      activeArticle.id,
      activeArticle.title,
      commentName,
      commentEmail || 'reader@example.com',
      commentText
    );

    setCommentSubmitted(true);
    setCommentName('');
    setCommentEmail('');
    setCommentText('');
    setTimeout(() => setCommentSubmitted(false), 4000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    db.addSubscriber(newsletterEmail, 'Website Reader');
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSubscribed(false), 5000);
  };

  const handleShare = () => {
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
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setActiveArticle(null);
    setActivePage(null);
  };

  const handleSelectPage = (page: Page) => {
    setActivePage(page);
    setActiveArticle(null);
  };

  return (
    <div
      className={`min-h-screen font-['Plus_Jakarta_Sans',sans-serif] ${
        darkMode ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#FAFAFB] text-slate-900'
      }`}
    >
      {/* 1. TOP GLOBAL NEWSPAPER BAR */}
      <div className="bg-[#0B132B] text-slate-300 border-b border-slate-800 text-xs px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              রবিবার, ৮ নভেম্বর ২০২৬ · Sunday, Nov 8, 2026
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">
              সংস্করণ: <strong className="text-white">গ্লোবাল ও বাংলাদেশ এডিশন</strong>
            </span>
            <span className="hidden lg:inline text-slate-500">|</span>
            <span className="hidden lg:inline text-slate-400">
              ঢাকা: ২৬°C রোদঝলমল আবহাওয়া
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              লাইভ সংবাদ পোর্টাল
            </span>
            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-md font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>এডমিন প্যানেলে ফিরুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BREAKING NEWS TICKER */}
      {settings.breakingNewsTickerActive && (
        <div className="bg-red-600 text-white px-4 sm:px-8 py-1.5 flex items-center gap-3 text-xs overflow-hidden shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-black/40 font-extrabold uppercase rounded-sm text-[10px] tracking-wider shrink-0 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-white animate-bounce" />
              ব্রেকিং নিউজ
            </span>
            <div className="truncate font-semibold tracking-wide text-xs">
              {settings.breakingNewsText}
            </div>
          </div>
        </div>
      )}

      {/* 3. 3-TOOTH DRAWER (ONLY PAGES - কোন ক্যাটাগরি নেই) */}
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
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-6 bg-red-600 rounded-sm"></span>
                  <span className="w-2.5 h-6 bg-slate-900 dark:bg-white rounded-sm"></span>
                </div>
                <div>
                  <span className="font-serif font-black text-xl tracking-tight text-slate-900 dark:text-white">
                    MAAN <span className="text-red-600 font-sans font-bold">NEWS</span>
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    ওয়েবসাইট পেজ মেনু
                  </span>
                </div>
              </div>

              <button
                onClick={() => setDrawerMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="বন্ধ করুন"
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
                  হোম পেজ (সকল খবর)
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
                  placeholder="পেজ খুঁজুন (Search pages)..."
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Published Pages List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    ওয়েবসাইট পেজসমূহ (Pages)
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {pages.filter((p) => p.status === 'published').length} টি পেজ
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
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
              <button
                onClick={() => {
                  setDrawerMenuOpen(false);
                  onBackToAdmin();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>এডমিন ড্যাশবোর্ডে ফিরুন (Admin Panel)</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>থিম পরিবর্তন</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{darkMode ? 'ডার্ক মোড' : 'লাইট মোড'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN EDITORIAL MASTHEAD (যেমন আসল বিবিসি, নিউইয়র্ক টাইমস বা প্রথম আলোতে থাকে) */}
      <header className={`border-b ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
          {/* Left: 3-Tooth Hamburger Button (৩দাঁত পেজ মেনু) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawerMenuOpen(true)}
              title="পেজ মেনু খুলুন (৩দাঁত মেনু)"
              aria-label="৩দাঁত পেজ মেনু খুলুন"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex flex-col gap-1 items-center justify-center">
                <span className="w-5 h-0.5 bg-slate-800 dark:bg-slate-200 group-hover:bg-red-600 rounded-full transition-colors" />
                <span className="w-5 h-0.5 bg-slate-800 dark:bg-slate-200 group-hover:bg-red-600 rounded-full transition-colors" />
                <span className="w-5 h-0.5 bg-slate-800 dark:bg-slate-200 group-hover:bg-red-600 rounded-full transition-colors" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-red-600 transition-colors hidden sm:inline">
                পেজ মেনু
              </span>
            </button>

            <span className="hidden md:inline-block text-xs font-medium text-slate-400">
              স্বাধীন ও নির্ভীক সাংবাদিকতা
            </span>
          </div>

          {/* Center: Prestigious Newspaper Logo */}
          <div
            onClick={handleSelectHome}
            className="flex flex-col items-center cursor-pointer select-none text-center"
          >
            <h1 className="font-serif font-black text-3xl sm:text-4xl tracking-tight text-slate-950 dark:text-white leading-none">
              MAAN <span className="text-red-600 font-sans font-extrabold">NEWS</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
              The Daily Enterprise · সত্য ও তথ্যের অনুসন্ধান
            </p>
          </div>

          {/* Right: Search & Dark Mode */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden md:block w-56 lg:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="সংবাদ খুঁজুন..."
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              title="থিম পরিবর্তন"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 5. CATEGORY NAVIGATION BAR (ONLY CATEGORIES - কোন পেজ নেই) */}
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
                সব খবর (All)
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
          <span>স্পন্সরড ব্যানার • [Global - Header Top • 728x90 Billboard Ad Space]</span>
        </div>

        {/* VIEW 1: STATIC PAGE READER (When clicked from 3-tooth drawer or footer) */}
        {activePage ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            <button
              onClick={handleSelectHome}
              className="flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> হোম পেজের সকল সংবাদে ফিরুন
            </button>

            <div className={`p-8 md:p-12 rounded-2xl border shadow-xs space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-sky-600">
                  {activePage.template} Page
                </span>
                <span>·</span>
                <span>সর্বশেষ আপডেট: {activePage.updatedAt}</span>
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
                    নিউজ ডেস্কে বার্তা পাঠান (Editorial Contact Form)
                  </h3>

                  {contactSent ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span>ধন্যবাদ! আপনার বার্তাটি আমাদের সম্পাদকীয় ডেস্কে সফলভাবে পৌঁছেছে।</span>
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
                          placeholder="আপনার পূর্ণ নাম *"
                          className="p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                        />
                        <input
                          type="email"
                          required
                          placeholder="আপনার ইমেইল *"
                          className="p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                        />
                      </div>
                      <textarea
                        rows={4}
                        required
                        placeholder="আপনার তথ্য বা নিউজ টিপস লিখুন..."
                        className="w-full p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                      >
                        বার্তা জমা দিন
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeArticle ? (
          /* VIEW 2: ARTICLE READER VIEW */
          <div className="space-y-6 max-w-4xl mx-auto">
            <button
              onClick={() => setActiveArticle(null)}
              className="flex items-center gap-2 text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> সংবাদ সূচিতে ফিরুন
            </button>

            <article className={`p-6 md:p-10 rounded-2xl border shadow-xs space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="text-red-600 font-bold uppercase">{activeArticle.category}</span>
                <span>·</span>
                <span>{activeArticle.publishedAt}</span>
                <span>·</span>
                <span>{activeArticle.views} বার পঠিত</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-black leading-tight text-slate-950 dark:text-white">
                {activeArticle.title}
              </h1>

              {activeArticle.subtitle && (
                <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {activeArticle.subtitle}
                </p>
              )}

              {/* Author byline */}
              <div className="flex flex-wrap items-center justify-between py-3 border-y border-slate-200 dark:border-slate-800 text-xs gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={activeArticle.author.avatar}
                    alt={activeArticle.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{activeArticle.author.name}</p>
                    <p className="text-slate-500">{activeArticle.author.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareCopied ? 'লিঙ্ক কপি হয়েছে!' : 'শেয়ার করুন'}</span>
                  </button>
                </div>
              </div>

              {/* Featured Image */}
              {activeArticle.featuredImage && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img
                    src={activeArticle.featuredImage}
                    alt={activeArticle.title}
                    className="w-full max-h-[500px] object-cover"
                  />
                </div>
              )}

              {/* Gutenberg Blocks */}
              <div className="space-y-4 pt-2">
                {activeArticle.blocks.map((block) => (
                  <div key={block.id}>
                    {block.type === 'paragraph' && (
                      <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200">
                        {block.content}
                      </p>
                    )}
                    {block.type === 'heading' && (
                      <h2 className="text-xl md:text-2xl font-serif font-bold mt-6 mb-2 text-slate-950 dark:text-white">
                        {block.content}
                      </h2>
                    )}
                    {block.type === 'quote' && (
                      <blockquote className="border-l-4 border-red-600 pl-4 py-2 italic font-serif text-lg bg-slate-50 dark:bg-slate-800 rounded-r-lg my-4 text-slate-800 dark:text-slate-200">
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

              {/* Tags */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
                {(activeArticle.tags || []).map((t) => (
                  <span
                    key={t}
                    className="text-slate-500 hover:text-red-600 font-semibold cursor-pointer"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </article>

            {/* Reader Comments Section */}
            <div className={`p-6 md:p-8 rounded-2xl border shadow-xs space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                পাঠক মন্তব্য ও আলোচনা
              </h3>

              {commentSubmitted ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>ধন্যবাদ! আপনার মন্তব্যটি গৃহীত হয়েছে এবং পর্যালোচনার জন্য জমা হয়েছে।</span>
                </div>
              ) : (
                <form onSubmit={handlePostComment} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="আপনার নাম *"
                      className="p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                    />
                    <input
                      type="email"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      placeholder="আপনার ইমেইল (ঐচ্ছিক)"
                      className="p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="এই প্রতিবেদনের ওপর আপনার অভিমত জানান..."
                    className="w-full p-3 border rounded-xl focus:outline-hidden dark:bg-slate-800 dark:border-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                  >
                    মন্তব্য প্রকাশ করুন
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* VIEW 3: NEWSPAPER ENTERPRISE HOMEPAGE DESIGN (আসল শীর্ষস্থানীয় নিউজ পোর্টালের মতো) */
          <div className="space-y-10">
            {/* 3.1 HERO EDITORIAL LEAD SECTION: 3 Columns (Lead 7 cols + Trending & Opinion 5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-slate-200 dark:border-slate-800">
              {/* Left Column (7 cols): Main Lead Story + 2 Secondary Leads */}
              <div className="lg:col-span-7 space-y-6">
                {featuredPost && (
                  <div
                    onClick={() => setActiveArticle(featuredPost)}
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
                        {featuredPost.isBreaking ? 'ব্রেকিং নিউজ' : featuredPost.category}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="text-red-600 font-bold uppercase">{featuredPost.category}</span>
                        <span>·</span>
                        <span>প্রতিবেদক: {featuredPost.author.name}</span>
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
                      onClick={() => setActiveArticle(post)}
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
                          {post.category}
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
                {/* Most Read (শীর্ষ ৫ সর্বাধিক পঠিত) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-red-600">
                    <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      সর্বাধিক পঠিত সংবাদ
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">শীর্ষ ৫</span>
                  </div>

                  <div className="space-y-4">
                    {mostReadPosts.map((post, idx) => (
                      <div
                        key={post.id}
                        onClick={() => setActiveArticle(post)}
                        className="group flex items-start gap-4 cursor-pointer pb-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                      >
                        <span className="font-serif font-black text-2xl text-slate-300 dark:text-slate-700 group-hover:text-red-600 transition-colors w-7 shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {post.category} · {post.publishedAt}
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
                  <span className="font-bold block text-slate-500">বিজ্ঞাপন স্থান</span>
                  <span className="text-[10px]">Author Profile - Sidebar Top (300x250)</span>
                </div>

                {/* Editorial Quote / Opinion Spotlight */}
                {opinionPost && (
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-900/60 border border-amber-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                      সম্পাদকীয় দৃষ্টিকোণ
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
                        <p className="text-[10px] text-slate-500">সম্পাদকীয় বোর্ড</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3.2 THEMATIC SECTION 1: BUSINESS & ECONOMY (বাণিজ্য ও অর্থনীতি) */}
            {businessPosts.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-sky-600">
                  <h3 className="font-serif font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    বাণিজ্য ও বৈশ্বিক অর্থনীতি (Business & Finance)
                  </h3>
                  <button
                    onClick={() => handleSelectCategory('Business')}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>আরও দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {businessPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setActiveArticle(post)}
                      className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all"
                    >
                      <div className="aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <span className="text-[10px] font-bold text-sky-600 uppercase">
                          অর্থনীতি ও বাজার
                        </span>
                        <h4 className="font-serif font-bold text-sm group-hover:text-sky-600 transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
                        <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>{post.publishedAt}</span>
                          <span>{post.views} রিডস</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3.3 THEMATIC SECTION 2: TECHNOLOGY & INNOVATION (প্রযুক্তি ও উদ্ভাবন) */}
            {techPosts.length > 0 && (
              <div className="space-y-4 pt-6">
                <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-600">
                  <h3 className="font-serif font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    প্রযুক্তি, বিজ্ঞান ও ভবিষ্যৎ (Tech & Science)
                  </h3>
                  <button
                    onClick={() => handleSelectCategory('Technology')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>আরও দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {techPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setActiveArticle(post)}
                      className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all"
                    >
                      <div className="aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">
                          উদ্ভাবন ও গবেষণা
                        </span>
                        <h4 className="font-serif font-bold text-sm group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
                        <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>{post.publishedAt}</span>
                          <span>{post.views} রিডস</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3.4 ALL STORIES GRID */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-black text-xl text-slate-900 dark:text-white">
                  সকল গুরুত্বপূর্ণ প্রতিবেদন
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {filteredPosts.length} টি সংবাদ প্রদর্শিত হচ্ছে
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setActiveArticle(post)}
                    className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 hover:shadow-md transition-all"
                  >
                    <div className="aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="text-red-600 uppercase">{post.category}</span>
                        <span>{post.publishedAt}</span>
                      </div>
                      <h4 className="font-serif font-bold text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                      <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <span>প্রতিবেদক: {post.author.name}</span>
                        <span>{post.views} রিডস</span>
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
                  <span>দৈনিক সকালের নিউজলেটার ব্রিফিং</span>
                </div>
                <h3 className="font-serif font-black text-2xl tracking-tight">
                  দিনের সেরা সংবাদ বিশ্লেষণ আপনার ইনবক্সে
                </h3>
                <p className="text-xs text-slate-400 max-w-lg">
                  প্রতিদিন সকালে বিশ্ব রাজনীতি, বাণিজ্য এবং অর্থনীতির নির্বাচিত প্রতিবেদন সরাসরি আপনার ইমেইলে পৌঁছে দেবে মান নিউজ।
                </p>
              </div>

              {newsletterSubscribed ? (
                <div className="px-6 py-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>ধন্যবাদ! আপনি সফলভাবে সাবস্ক্রাইব করেছেন।</span>
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
                    placeholder="আপনার ইমেইল ঠিকানা দিন..."
                    className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-red-600 w-full sm:w-64"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    সাবস্ক্রাইব
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 7. PRESTIGIOUS NEWSPAPER FOOTER */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Editorial Policy */}
          <div className="space-y-3">
            <h2 className="font-serif font-black text-2xl text-slate-950 dark:text-white">
              MAAN <span className="text-red-600 font-sans font-extrabold">NEWS</span>
            </h2>
            <p className="text-xs leading-relaxed text-slate-500">
              মান নিউজ একটি আন্তর্জাতিক সংবাদমাধ্যম। সত্য, বস্তুনিষ্ঠতা এবং অনুসন্ধানী সাংবাদিকতার মূল আদর্শে আমরা বিশ্বজুড়ে লাখো পাঠকের বিশ্বস্ত উৎস।
            </p>
            <p className="text-[11px] text-slate-400">
              সম্পাদক ও প্রকাশক: <strong>Maan Media Group Ltd.</strong>
            </p>
          </div>

          {/* Column 2: News Categories */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              সংবাদ বিভাগসমূহ
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {categories.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCategory(c.name)}
                  className="text-left hover:text-red-600 transition-colors cursor-pointer"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Static Pages (All published pages) */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              ওয়েবসাইট পেজসমূহ (Pages)
            </h4>
            <div className="space-y-1.5 text-xs">
              {footerPages.map((page) => (
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

          {/* Column 4: Admin Quick Switch & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              ব্যবস্থাপনা ও পোর্টাল
            </h4>
            <p className="text-xs text-slate-500">
              সম্পূর্ণ এন্টারপ্রাইজ এডমিন প্যানেল, এডিটরিয়াল ওয়ার্কফ্লো এবং এআই অ্যাসিস্ট্যান্ট এক্সেস করতে এডমিনে প্রবেশ করুন।
            </p>
            <button
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-500 dark:text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>এডমিন প্যানেলে ফিরুন</span>
            </button>
          </div>
        </div>

        {/* Bottom Copyright bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 py-4 bg-slate-50 dark:bg-slate-950 text-slate-400 text-center text-xs">
          <p>© 2026 Maan News Media Enterprise. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  );
};
