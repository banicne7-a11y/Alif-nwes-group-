import React, { useState } from 'react';
import {
  Flame,
  Radio,
  Sliders,
  TrendingUp,
  Bell,
  Eye,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { db } from '../../services/db';
import { Post } from '../../types';

export const BreakingTrendingView: React.FC = () => {
  const [settings, setSettings] = useState(db.getSettings());
  const [posts, setPosts] = useState<Post[]>(db.getPosts());
  const [tickerText, setTickerText] = useState(settings.breakingNewsText);
  const [tickerActive, setTickerActive] = useState(settings.breakingNewsTickerActive);
  const [urgentAlertText, setUrgentAlertText] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  const refreshState = () => {
    setPosts([...db.getPosts()]);
    setSettings({ ...db.getSettings() });
  };

  const handleToggleTicker = () => {
    const nextState = !tickerActive;
    setTickerActive(nextState);
    db.updateSettings({
      breakingNewsTickerActive: nextState,
    });
    refreshState();
  };

  const handleSaveTickerText = () => {
    db.updateSettings({
      breakingNewsText: tickerText,
      breakingNewsTickerActive: tickerActive,
    });
    refreshState();
    alert('Breaking news marquee banner updated!');
  };

  const handleTogglePostBreaking = (post: Post) => {
    db.savePost({
      ...post,
      isBreaking: !post.isBreaking,
    });
    refreshState();
  };

  const handleTogglePostSlider = (post: Post) => {
    db.savePost({
      ...post,
      isHomepageSlider: !post.isHomepageSlider,
    });
    refreshState();
  };

  const handleSendUrgentPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urgentAlertText.trim()) return;
    setAlertSent(true);
    db.logAction('Push Notification Sent', `Urgent news alert broadcast to 30,000 readers: "${urgentAlertText}"`, 'warning');
    setTimeout(() => {
      setAlertSent(false);
      setUrgentAlertText('');
      alert('Urgent Notification successfully delivered to 30,000 active app and web subscribers!');
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Breaking & Trending</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage real-time news ticker, homepage slider priorities, and urgent push alerts.
          </p>
        </div>
      </div>

      {/* Breaking News Ticker Manager */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="font-extrabold text-base text-slate-900">
              Live Homepage Breaking News Ticker
            </h2>
          </div>

          <button
            onClick={handleToggleTicker}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              tickerActive ? 'bg-red-500 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {tickerActive ? 'Ticker Active' : 'Ticker Paused'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ticker Marquee Headlines (Separated by |)
          </label>
          <textarea
            rows={2}
            value={tickerText}
            onChange={(e) => setTickerText(e.target.value)}
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Live Preview of Ticker */}
        <div className="p-3 bg-slate-950 text-white rounded-xl flex items-center gap-3 overflow-hidden text-xs">
          <span className="px-2.5 py-1 bg-red-600 font-extrabold rounded-md text-[10px] tracking-wider uppercase shrink-0">
            BREAKING
          </span>
          <div className="truncate font-medium text-slate-200">{tickerText}</div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveTickerText}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
          >
            Update Live Ticker
          </button>
        </div>
      </div>

      {/* Grid: Push Notification Dispatcher + Homepage Slider Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgent Push Notification Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Urgent Push Notification
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Broadcast emergency alerts immediately to browser push subscribers and mobile app devices.
          </p>

          <form onSubmit={handleSendUrgentPush} className="space-y-3">
            <textarea
              rows={3}
              required
              value={urgentAlertText}
              onChange={(e) => setUrgentAlertText(e.target.value)}
              placeholder="e.g. FLASH: Emergency summit concludes with sweeping trade agreement..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={alertSent}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
            >
              {alertSent ? 'Broadcasting Alert...' : 'Broadcast Urgent Push'}
            </button>
          </form>
        </div>

        {/* Homepage Slider & Featured News Manager (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Homepage Hero Slider Stories
          </h3>

          <div className="space-y-3">
            {posts.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-12 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{post.title}</p>
                    <span className="text-[10px] text-slate-500">{post.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTogglePostBreaking(post)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      post.isBreaking
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Breaking
                  </button>
                  <button
                    onClick={() => handleTogglePostSlider(post)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      post.isHomepageSlider
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    Slider
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
