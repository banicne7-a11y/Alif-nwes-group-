import React, { useState } from 'react';
import {
  FileText,
  Volume2,
  Tv,
  Layers,
  Eye,
  MessageSquare,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/db';
import { Post, Comment } from '../../types';

interface DashboardViewProps {
  onNavigate: (view: string, subParam?: any) => void;
  onOpenArticle: (post: Post) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenArticle,
}) => {
  const [timeFilter, setTimeFilter] = useState<'Yearly' | 'Monthly' | 'Weekly'>('Yearly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(6); // Default hover on July

  const posts = db.getPosts();
  const comments = db.getComments().slice(0, 5);
  const categories = db.getCategories();
  const ads = db.getAds();

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const breakingCount = posts.filter((p) => p.isBreaking).length;

  // Monthly statistics data for the dual-tone bar chart (Jan to Dec)
  const monthlyData = [
    { month: 'Jan', free: 21, sub: 9 },
    { month: 'Feb', free: 42, sub: 25 },
    { month: 'Mar', free: 25, sub: 12 },
    { month: 'Apr', free: 15, sub: 8 },
    { month: 'May', free: 32, sub: 14 },
    { month: 'Jun', free: 48, sub: 28 },
    { month: 'Jul', free: 15, sub: 7 }, // highlighted in screenshot
    { month: 'Aug', free: 38, sub: 18 },
    { month: 'Sep', free: 26, sub: 11 },
    { month: 'Nov', free: 44, sub: 20 },
    { month: 'Oct', free: 33, sub: 15 },
    { month: 'Dec', free: 18, sub: 9 },
  ];

  // Most viewed news items
  const mostViewed = [...posts].sort((a, b) => b.views - a.views).slice(0, 4);

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ------------------------------------------------------------- */}
      {/* ROW 1: Big Reader Card + 4 Metric Cards (Matching Screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Big News Readers Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                30,000
              </h2>
              <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5">
                News Readers
              </p>

              <div className="flex items-center gap-4 mt-5">
                <div>
                  <p className="text-lg md:text-xl font-bold text-sky-600">10,000</p>
                  <p className="text-[11px] font-semibold text-slate-500">Subscribe Users</p>
                </div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-amber-500">20,000</p>
                  <p className="text-[11px] font-semibold text-slate-500">Free Users</p>
                </div>
              </div>
            </div>

            {/* Illustration Graphic with "Breaking News" badge (Recreating Screenshot 1) */}
            <div className="relative w-36 h-28 hidden sm:flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-sky-100 rounded-xl border border-sky-100/60 flex flex-col items-center justify-center p-2">
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-sky-500 text-white rounded-full mb-1 shadow-xs">
                  Breaking News
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="w-10 h-1.5 bg-slate-300 rounded-sm"></div>
                    <div className="w-8 h-1.5 bg-slate-200 rounded-sm"></div>
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-slate-400 font-medium">Live Feed 24/7</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Top Metric Cards (7 cols: 4 mini cards grid) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 1. Featured Section */}
          <div
            onClick={() => onNavigate('breaking-news')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">8+</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Featured Section</p>
          </div>

          {/* 2. Language */}
          <div
            onClick={() => onNavigate('settings')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center hover:border-rose-300 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform mb-3">
              <Volume2 className="w-6 h-6" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">40+</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Language</p>
          </div>

          {/* 3. Ad Spaces */}
          <div
            onClick={() => onNavigate('ads')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform mb-3">
              <Tv className="w-6 h-6" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">{ads.length > 0 ? ads.length : 4}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Ad Spaces</p>
          </div>

          {/* 4. Category */}
          <div
            onClick={() => onNavigate('categories')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center hover:border-purple-300 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-xl font-extrabold text-slate-900">{categories.length}+</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Category</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 2: Stack of 4 Mini Stat Cards + User Statistic Bar Chart */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left stack of 4 mini stat cards (4 cols) */}
        <div className="lg:col-span-4 space-y-3.5 flex flex-col justify-between">
          {/* 1. Published News */}
          <div
            onClick={() => onNavigate('posts', { filter: 'published' })}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-amber-300 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {publishedCount > 0 ? publishedCount : 300}
              </p>
              <p className="text-xs font-semibold text-slate-500">Published News</p>
            </div>
          </div>

          {/* 2. Draft News */}
          <div
            onClick={() => onNavigate('posts', { filter: 'draft' })}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-teal-300 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {draftCount > 0 ? draftCount : 30}
              </p>
              <p className="text-xs font-semibold text-slate-500">Draft News</p>
            </div>
          </div>

          {/* 3. Breaking News */}
          <div
            onClick={() => onNavigate('breaking-news')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-rose-300 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">
                {breakingCount > 0 ? breakingCount : 15}
              </p>
              <p className="text-xs font-semibold text-slate-500">Breaking News</p>
            </div>
          </div>

          {/* 4. Total Blogs */}
          <div
            onClick={() => onNavigate('posts')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-purple-300 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">40</p>
              <p className="text-xs font-semibold text-slate-500">Total Blogs</p>
            </div>
          </div>
        </div>

        {/* Right side: User Statistic Bar Chart (8 cols) matching Screenshot 1 */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          {/* Chart Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">User Statistic</h3>
              <div className="flex items-center gap-4 mt-1.5 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  Free Users: <strong className="text-slate-800">20,000</strong>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Subscribed: <strong className="text-slate-800">10,000</strong>
                </span>
              </div>
            </div>

            {/* Yearly / Monthly dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                aria-label="Filter User Statistics"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden"
              >
                <option value="Yearly">Yearly</option>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Custom Dual Bar Chart Visualizer matching Screenshot 1 */}
          <div className="relative pt-6 pb-2">
            {/* Y Axis Guide lines */}
            <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400">
              <div className="border-b border-dashed border-slate-100 pb-0.5">$100k</div>
              <div className="border-b border-dashed border-slate-100 pb-0.5">$50k</div>
              <div className="border-b border-dashed border-slate-100 pb-0.5">$25k</div>
              <div className="border-b border-dashed border-slate-100 pb-0.5">$10k</div>
              <div className="border-b border-slate-200 pb-0.5">0</div>
            </div>

            {/* Bars container */}
            <div className="relative z-10 grid grid-cols-12 gap-1 sm:gap-2 h-56 items-end pt-4 pl-8">
              {monthlyData.map((d, index) => {
                const isHovered = hoveredBarIndex === index;
                return (
                  <div
                    key={d.month}
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    className="relative flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Tooltip on active / hovered bar (Matching July 2024 screenshot tooltip) */}
                    {isHovered && (
                      <div className="absolute -top-14 z-30 bg-white border border-slate-200 rounded-lg shadow-xl px-2.5 py-1.5 text-[10px] whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                        <p className="font-bold text-slate-800 text-[11px]">{d.month} 2026</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-cyan-600 font-semibold">• Free: {d.free / 10}k</span>
                          <span className="text-amber-600 font-semibold">• Subscribe: {d.sub * 100}</span>
                        </div>
                        <div className="w-2 h-2 bg-white border-r border-b border-slate-200 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                      </div>
                    )}

                    {/* Bar columns */}
                    <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center">
                      {/* Cyan Bar (Free Users) */}
                      <div
                        style={{ height: `${(d.free / 50) * 100}%` }}
                        className="w-1.5 sm:w-2.5 bg-cyan-400 rounded-t-sm group-hover:bg-cyan-500 transition-all duration-300"
                      />
                      {/* Orange Bar (Subscribed) */}
                      <div
                        style={{ height: `${(d.sub / 50) * 100}%` }}
                        className="w-1.5 sm:w-2.5 bg-amber-500 rounded-t-sm group-hover:bg-amber-600 transition-all duration-300"
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[10px] mt-2 font-medium transition-colors ${
                        isHovered ? 'text-cyan-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ROW 3: Most Viewed News, Latest Comments, Category Wise News  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Most Viewed News (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900">Most Viewed News</h3>
            <button
              onClick={() => onNavigate('posts')}
              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            {mostViewed.map((post) => (
              <div
                key={post.id}
                onClick={() => onOpenArticle(post)}
                className="pt-3 first:pt-0 flex gap-3 group cursor-pointer"
              >
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-16 h-14 rounded-lg object-cover shrink-0 group-hover:opacity-90 transition-opacity"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-sky-600">
                    | {post.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-sky-600 transition-colors leading-snug">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(post.views / 1000).toFixed(1)}k
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.commentsCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Latest Comments (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900">Latest Comments</h3>
            <button
              onClick={() => onNavigate('comments')}
              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            {comments.map((comment) => (
              <div key={comment.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.authorName}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{comment.authorName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{comment.content}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                  {comment.createdAt}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Category Wise News (4 cols) matching Screenshot 1 Donut Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900">Category Wise News</h3>
            <button
              onClick={() => onNavigate('categories')}
              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
            >
              Categories
            </button>
          </div>

          {/* Donut Chart & Category Legend */}
          <div className="flex items-center gap-4 py-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* 9 Category Segments matching Screenshot 1 */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#0284C7" strokeWidth="14" strokeDasharray="25 214" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#6366F1" strokeWidth="14" strokeDasharray="30 209" strokeDashoffset="-26" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray="24 215" strokeDashoffset="-57" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="14" strokeDasharray="28 211" strokeDashoffset="-82" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="22 217" strokeDashoffset="-111" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="14" strokeDasharray="20 219" strokeDashoffset="-134" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="14" strokeDasharray="26 213" strokeDashoffset="-155" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F97316" strokeWidth="14" strokeDasharray="34 205" strokeDashoffset="-182" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="20 219" strokeDashoffset="-217" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-extrabold text-slate-800">345</span>
                <span className="text-[9px] text-slate-400 font-semibold">Articles</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="grid grid-cols-1 gap-1 text-[11px] font-medium text-slate-600 overflow-y-auto max-h-40 pr-1">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Footer matching Screenshot 1 */}
      {/* ------------------------------------------------------------- */}
      <footer className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>COPYRIGHT © 2024 Acnoo, All rights Reserved</p>
        <p>
          Made by <span className="text-red-500">❤️</span> Acnoo
        </p>
      </footer>
    </div>
  );
};
