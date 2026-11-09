import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Globe2,
  Smartphone,
  Laptop,
  Tablet,
  DollarSign,
  Eye,
  Share2,
  Users,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { db } from '../../services/db';

export const AnalyticsView: React.FC = () => {
  const [liveVisitors, setLiveVisitors] = useState(342);
  const posts = db.getPosts();

  // Simulate real-time pulsing visitor fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveVisitors((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4;
        return Math.max(310, Math.min(380, prev + delta));
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const countries = [
    { name: 'United States', code: 'US', share: '42%', visitors: '12,600' },
    { name: 'United Kingdom', code: 'UK', share: '16%', visitors: '4,800' },
    { name: 'Bangladesh', code: 'BD', share: '14%', visitors: '4,200' },
    { name: 'India', code: 'IN', share: '11%', visitors: '3,300' },
    { name: 'Germany', code: 'DE', share: '7%', visitors: '2,100' },
    { name: 'Other Regions', code: 'GL', share: '10%', visitors: '3,000' },
  ];

  const trafficSources = [
    { source: 'Google Organic Search', percent: 54, color: '#0284C7' },
    { source: 'Direct Navigation', percent: 22, color: '#10B981' },
    { source: 'Social Media (X, Facebook, LinkedIn)', percent: 15, color: '#8B5CF6' },
    { source: 'Referrals & News Aggregators', percent: 9, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time reader telemetry, geo-distribution, device breakdown, and revenue attribution.
          </p>
        </div>

        {/* Real-time active badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold shadow-2xs self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{liveVisitors} Active Readers Right Now</span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Monthly Pageviews</span>
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">1,842,500</p>
          <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last month
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Unique Visitors</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">620,000</p>
          <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12.1% growth
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Avg. Engagement Time</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">3m 48s</p>
          <p className="text-[11px] text-slate-400 mt-1">High journalistic retention</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Estimated Net Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">$14,820.00</p>
          <p className="text-[11px] text-slate-400 mt-1">AdSense + Sponsorships</p>
        </div>
      </div>

      {/* Grid: Country breakdown + Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Country Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-sky-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Traffic by Country</h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Global Distribution</span>
          </div>

          <div className="space-y-3">
            {countries.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{c.name}</span>
                  <span className="text-slate-500 font-mono">
                    {c.visitors} ({c.share})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: c.share }}
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices & Traffic Sources (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Device Split */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Device Statistics
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Smartphone className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-slate-900">64%</p>
                <p className="text-[11px] text-slate-500 font-semibold">Mobile Phone</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Laptop className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-slate-900">29%</p>
                <p className="text-[11px] text-slate-500 font-semibold">Desktop PC</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Tablet className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-slate-900">7%</p>
                <p className="text-[11px] text-slate-500 font-semibold">Tablet</p>
              </div>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Traffic Acquisition Channels
            </h3>

            <div className="space-y-2.5">
              {trafficSources.map((source) => (
                <div key={source.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="font-medium text-slate-700">{source.source}</span>
                  </div>
                  <span className="font-bold text-slate-900">{source.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
