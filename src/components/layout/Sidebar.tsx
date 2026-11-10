import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  PenSquare,
  Sparkles,
  Flame,
  Image as ImageIcon,
  Tv,
  FileCode,
  Tag as TagIcon,
  Users,
  MessageSquare,
  Search,
  BarChart3,
  Mail,
  Rss,
  Palette,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle,
  FileEdit,
  Database,
  Radio,
  Calendar,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, subParam?: any) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  pendingAiCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onCloseMobile,
  pendingAiCount = 1,
}) => {
  // Collapsible accordion states
  const [newsOpen, setNewsOpen] = useState(
    currentView === 'posts' || currentView === 'editor' || currentView === 'calendar'
  );
  const [categoryOpen, setCategoryOpen] = useState(currentView === 'categories' || currentView === 'tags');
  const [aiOpen, setAiOpen] = useState(currentView === 'ai-assistant');
  const [systemOpen, setSystemOpen] = useState(
    currentView === 'users' || currentView === 'security' || currentView === 'settings'
  );

  const handleNav = (view: string, subParam?: any) => {
    onNavigate(view, subParam);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0B132B] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80 shadow-2xl lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header matching Screenshot 1 */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/90 bg-[#0B132B]">
          <div
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            {/* Logo glyph: Red emblem with 24 badge for Alif News 24 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 text-white font-serif font-black text-lg flex items-center justify-center shadow-xs">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                  ALIF <span className="text-red-500 font-bold">NEWS</span> <span className="text-sky-400 text-xs font-black">24</span>
                </span>
                <span className="text-[9px] text-slate-400 font-medium">US Edition · 24/7 Desk</span>
              </div>
            </div>
          </div>

          <span className="hidden lg:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-red-950/80 text-red-400 border border-red-800/50">
            LIVE 24/7
          </span>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Main Dashboard item matching screenshot (Cyan active background) */}
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              currentView === 'dashboard'
                ? 'bg-[#00C5FF] text-white shadow-lg shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </div>
            {currentView === 'dashboard' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          </button>

          {/* Category Accordion */}
          <div>
            <button
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderTree className="w-4 h-4 text-slate-400" />
                <span>Category</span>
              </div>
              {categoryOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            {categoryOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <button
                  onClick={() => handleNav('categories')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'categories' ? 'text-sky-400 font-semibold bg-sky-950/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Categories
                </button>
                <button
                  onClick={() => handleNav('tags')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'tags' ? 'text-sky-400 font-semibold bg-sky-950/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  News Tags
                </button>
              </div>
            )}
          </div>

          {/* News Manages Accordion */}
          <div>
            <button
              onClick={() => setNewsOpen(!newsOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'posts' || currentView === 'editor'
                  ? 'text-white bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>News Manages</span>
              </div>
              {newsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            {newsOpen && (
              <div className="pl-9 pr-2 py-1 space-y-1">
                <button
                  onClick={() => handleNav('posts')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'posts' ? 'text-sky-400 font-semibold bg-sky-950/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => handleNav('editor', { isNew: true })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    currentView === 'editor' ? 'text-sky-400 font-semibold bg-sky-950/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>+ Add New Post</span>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-950 px-1.5 py-0.2 rounded-sm">Block</span>
                </button>
                <button
                  onClick={() => handleNav('posts', { filter: 'pending_review' })}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white flex items-center justify-between"
                >
                  <span>Pending Review</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">1</span>
                </button>
                <button
                  onClick={() => handleNav('calendar')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    currentView === 'calendar' ? 'text-sky-400 font-semibold bg-sky-950/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Content Calendar
                </button>
              </div>
            )}
          </div>

          {/* AI News Assistant (Crucial Enterprise Module) */}
          <div>
            <button
              onClick={() => handleNav('ai-assistant')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'ai-assistant'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-4 h-4 ${currentView === 'ai-assistant' ? 'text-yellow-300' : 'text-purple-400'}`} />
                <span>AI News Assistant</span>
              </div>
              <span className="text-[10px] bg-purple-400/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-400/30">
                Gemini 3.8
              </span>
            </button>
          </div>

          {/* Breaking & Trending News */}
          <button
            onClick={() => handleNav('breaking-news')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'breaking-news'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Flame className="w-4 h-4 text-red-400" />
              <span>Breaking & Trending</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </button>

          {/* Media / Gallery */}
          <button
            onClick={() => handleNav('media')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'media'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Media / Gallery</span>
          </button>

          {/* Ad Spaces / Placements (Matching Screenshot 2) */}
          <button
            onClick={() => handleNav('ads')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'ads'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tv className="w-4 h-4 text-amber-400" />
              <span>Ad Spaces</span>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">13 Slots</span>
          </button>

          {/* Static Pages */}
          <button
            onClick={() => handleNav('pages')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'pages'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>Pages Management</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => handleNav('comments')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'comments'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Comments</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              5 New
            </span>
          </button>

          {/* SEO Report & Sitemaps */}
          <button
            onClick={() => handleNav('seo')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'seo'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4 text-sky-400" />
            <span>SEO Manager & Sitemaps</span>
          </button>

          {/* Analytics & Reports */}
          <button
            onClick={() => handleNav('analytics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'analytics'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Analytics & Reports</span>
          </button>

          {/* Newsletter */}
          <button
            onClick={() => handleNav('newsletter')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'newsletter'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-4 h-4 text-rose-400" />
            <span>Newsletter</span>
          </button>

          {/* RSS Crawler & Importer */}
          <button
            onClick={() => handleNav('rss')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'rss'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Rss className="w-4 h-4 text-orange-400" />
            <span>RSS Importer</span>
          </button>

          {/* Appearance & Homepage Builder */}
          <button
            onClick={() => handleNav('appearance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'appearance'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Appearance & Menus</span>
          </button>

          {/* Staff & Users */}
          <button
            onClick={() => handleNav('users')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'users'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Staff & Permissions</span>
          </button>

          {/* Security & Automated Backups */}
          <button
            onClick={() => handleNav('security')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'security'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Security & Backup</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Daily Backups Active" />
          </button>

          {/* Website Settings */}
          <button
            onClick={() => handleNav('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Website Settings</span>
          </button>
        </div>

        {/* Sidebar Footer matching Screenshot 2 */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090F21] text-[11px] text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span>Alif News 24 CMS</span>
            <span className="text-red-400 font-bold">LIVE v2.4</span>
          </div>
          <p className="text-[10px] text-slate-500">© 2026 Enterprise Edition</p>
        </div>
      </aside>
    </>
  );
};
