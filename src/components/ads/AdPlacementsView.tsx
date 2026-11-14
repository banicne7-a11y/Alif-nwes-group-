import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Code2,
  Tv,
  CheckCircle,
  Info,
  LayoutGrid,
  List,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { AdPlacement } from '../../types';

const WEBSITE_POSITION_PRESETS: Array<{
  key: string;
  name: string;
  label: string;
  size: string;
  deviceTarget: 'all' | 'desktop' | 'mobile';
}> = [
  { key: 'global_header_top', name: 'Global - Header Top', label: 'সকল পেজের একদম ওপরে (Header Top)', size: 'Responsive', deviceTarget: 'all' },
  { key: 'home_mobile_top', name: 'Home - Mobile Top', label: 'হোমপেজ - মোবাইলের ওপরে (Home Mobile Top)', size: '320x100', deviceTarget: 'mobile' },
  { key: 'home_sidebar_top', name: 'Home - Sidebar Top', label: 'হোমপেজ - ডান পাশের সাইডবার ওপরে (Sidebar Top)', size: '300x250', deviceTarget: 'desktop' },
  { key: 'home_sidebar_bottom', name: 'Home - Sidebar Bottom', label: 'হোমপেজ - সাইডবার নিচে (Sidebar Bottom)', size: '300x600', deviceTarget: 'desktop' },
  { key: 'article_header', name: 'Article - Header (All)', label: 'নিউজ পেজ - শিরোনামের ওপরে (Article Top)', size: 'Responsive', deviceTarget: 'all' },
  { key: 'article_mobile_top', name: 'Article - Mobile Top', label: 'নিউজ পেজ - মোবাইলের ওপরে (Article Mobile Top)', size: '320x100', deviceTarget: 'mobile' },
  { key: 'article_after_cover', name: 'Article - After Cover Image', label: 'নিউজ পেজ - বড় ছবির ঠিক নিচে (After Cover)', size: 'Responsive', deviceTarget: 'all' },
  { key: 'article_in_content', name: 'Article - Inside Story (Mid-Text)', label: 'নিউজ পেজ - লেখার মাঝখানে (২য় প্যারার পর)', size: 'Responsive', deviceTarget: 'all' },
  { key: 'article_bottom', name: 'Article - End of Story', label: 'নিউজ পেজ - লেখা শেষ হওয়ার পর (Article Bottom)', size: 'Responsive', deviceTarget: 'all' },
  { key: 'global_sticky_bottom', name: 'Global - Mobile Sticky Bottom', label: 'মোবাইলের নিচে ফিক্সড স্টিকি ব্যানার (Mobile Sticky)', size: '320x50', deviceTarget: 'mobile' },
];

export const AdPlacementsView: React.FC = () => {
  const [ads, setAds] = useState<AdPlacement[]>(db.getAds());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdPlacement | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form state
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState<'Code' | 'Image' | 'AdSense'>('Code');
  const [size, setSize] = useState('300x250');
  const [deviceTarget, setDeviceTarget] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [customCode, setCustomCode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');

  const refreshAds = () => {
    setAds([...db.getAds()]);
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setAds([...db.getAds()]);
    });
    return unsub;
  }, []);

  const handleOpenCreate = () => {
    setEditingAd(null);
    setName('');
    setKey('');
    setType('Code');
    setSize('300x250');
    setDeviceTarget('all');
    setCustomCode('');
    setImageUrl('');
    setTargetUrl('');
    setModalOpen(true);
  };

  const handleOpenEdit = (ad: AdPlacement) => {
    setEditingAd(ad);
    setName(ad.name);
    setKey(ad.key);
    setType(ad.type);
    setSize(ad.size);
    setDeviceTarget(ad.deviceTarget);
    setCustomCode(ad.customCode || '');
    setImageUrl(ad.imageUrl || '');
    setTargetUrl(ad.targetUrl || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !key) {
      toast.error('Please enter placement name and location key.');
      return;
    }

    db.saveAd({
      id: editingAd ? editingAd.id : undefined,
      name,
      key,
      type,
      size,
      deviceTarget,
      customCode,
      imageUrl,
      targetUrl,
      status: editingAd ? editingAd.status : 'Active',
    });

    refreshAds();
    setModalOpen(false);
    toast.success(`Ad placement "${name}" saved successfully`);
  };

  const handleDelete = (id: string, adName: string) => {
    toast.confirm({
      title: 'Delete Ad Placement',
      message: `Are you sure you want to delete ad placement "${adName}"?`,
      confirmLabel: 'Delete Placement',
      isDestructive: true,
      onConfirm: () => {
        db.deleteAd(id);
        refreshAds();
        toast.success(`Ad placement "${adName}" deleted`);
      },
    });
  };

  const handleToggleStatus = (id: string) => {
    db.toggleAdStatus(id);
    refreshAds();
    const updated = db.getAds().find((a) => a.id === id);
    if (updated) {
      toast.info(`Placement status updated to "${updated.status}"`);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Page Header matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ad Placements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage advertisement slots and codes.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-semibold transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Placement</span>
        </button>
      </div>

      {/* How AdSense Works Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-900">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">AdSense অ্যাড কাস্টমাইজ করার নিয়ম:</p>
          <p className="text-sky-800 leading-relaxed">
            ১) পুরো সাইটে Auto Ads চালাতে <strong>Settings → Google Integrations &amp; AdSense</strong>-এ আপনার <code className="bg-white px-1 rounded font-mono">ca-pub-...</code> আইডি সেভ করুন।
            ২) নির্দিষ্ট জায়গায় (যেমন: <em>হেডার, কভার ছবির নিচে, লেখার মাঝখানে, সাইডবারে বা মোবাইলের নিচে</em>) অ্যাড বসাতে নিচের যেকোনো স্লটের <strong>Edit (✏️)</strong> বা <strong>New Placement</strong>-এ গিয়ে আপনার AdSense কোড (বা শুধু <strong>Ad Slot ID</strong>) বসিয়ে <strong>Active</strong> করুন।
          </p>
        </div>
      </div>

      {/* Stats summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Active Ad Slots</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {ads.filter((a) => a.status === 'Active').length} of {ads.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Configured Ad Units</p>
          <p className="text-xl font-extrabold text-sky-600 mt-1">
            {
              ads.filter(
                (a) =>
                  a.status === 'Active' &&
                  ((a.type === 'Image' && Boolean(a.imageUrl?.trim())) ||
                    Boolean((a.customCode || '').replace(/<!--[\s\S]*?-->/g, '').trim()))
              ).length
            }{' '}
            Live
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">AdSense Publisher</p>
          <p className="text-sm font-extrabold font-mono text-emerald-600 mt-1.5 truncate">
            {db.getSettings().adsenseClientId || 'Not set'}
          </p>
        </div>
      </div>

      {/* Main Container with 2-Column Grid or Table View */}
      <div className="space-y-4">
        {/* View Switcher Header */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">Active Placements ({ads.length})</h2>
            <p className="text-xs text-slate-400">Layout: 2 Ad Slots per Row</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>2-Column Grid (2 per line)</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: 2-COLUMN GRID VIEW (2 ad slots per row) */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad, idx) => (
              <div
                key={ad.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                        Slot #{idx + 1}
                      </span>
                      <span className="text-xs font-mono text-slate-400 truncate">{ad.key}</span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-1 truncate">
                      {ad.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(ad.id)}
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      ad.status === 'Active'
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ad.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    <span>{ad.status}</span>
                  </button>
                </div>

                {/* Simulated Ad Preview Box */}
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center text-center space-y-1.5 min-h-[110px]">
                  <Tv className="w-5 h-5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">{ad.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Size: {ad.size} • Target: {ad.deviceTarget} • Type: {ad.type}
                  </p>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                    <span title="Impressions">
                      👀 {(ad.impressions || 0).toLocaleString()} views
                    </span>
                    <span title="Clicks">
                      🖱️ {(ad.clicks || 0).toLocaleString()} clicks
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(ad)}
                      className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Placement"
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id, ad.name)}
                      className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Placement"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* VIEW 2: TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200/70">
                  <tr>
                    <th className="py-3 px-6">Placement Name</th>
                    <th className="py-3 px-6">Key (Location)</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Size</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {ad.name}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-500">
                        {ad.key}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <Code2 className="w-3.5 h-3.5 text-slate-400" />
                          {ad.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-600">
                        {ad.size}
                      </td>
                      <td className="py-3.5 px-6">
                        <button
                          onClick={() => handleToggleStatus(ad.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            ad.status === 'Active'
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Click to toggle status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${ad.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {ad.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            onClick={() => handleOpenEdit(ad)}
                            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Placement"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id, ad.name)}
                            className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Placement"
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Creating or Editing Placement */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingAd ? 'Edit Ad Placement' : 'Create New Ad Placement'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Configure slot location, ad dimensions, and integration code.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quick Website Location Preset (অ্যাডের জায়গা বাছাই করুন)
                </label>
                <select
                  value={WEBSITE_POSITION_PRESETS.some((p) => p.key === key) ? key : ''}
                  onChange={(e) => {
                    const preset = WEBSITE_POSITION_PRESETS.find((p) => p.key === e.target.value);
                    if (preset) {
                      setKey(preset.key);
                      if (!name.trim() || WEBSITE_POSITION_PRESETS.some((p) => p.name === name)) {
                        setName(preset.name);
                      }
                      setSize(preset.size);
                      setDeviceTarget(preset.deviceTarget);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Custom / Select a Website Position --</option>
                  {WEBSITE_POSITION_PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Placement Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Article - Inside Story"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key (Location Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. article_in_content"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Code">HTML / JavaScript Code</option>
                    <option value="AdSense">Google AdSense</option>
                    <option value="Image">Banner Image + Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Responsive">Responsive</option>
                    <option value="300x250">300x250 (Medium Rectangle)</option>
                    <option value="300x600">300x600 (Half Page)</option>
                    <option value="728x90">728x90 (Leaderboard)</option>
                    <option value="320x100">320x100 (Mobile Large Banner)</option>
                    <option value="320x50">320x50 (Mobile Banner)</option>
                    <option value="970x250">970x250 (Billboard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Device Target</label>
                  <select
                    value={deviceTarget}
                    onChange={(e) => setDeviceTarget(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="all">All Devices</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                </div>
              </div>

              {type === 'Code' || type === 'AdSense' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AdSense Code / Ad Slot ID
                  </label>
                  <textarea
                    rows={4}
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="পুরো <ins class='adsbygoogle' ...> কোড পেস্ট করুন অথবা শুধু 10 ডিজিটের Ad Slot ID (যেমন 1234567890) লিখুন"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    শুধু Slot ID দিলে Settings-এ সেভ করা Publisher ID দিয়ে অটোমেটিক Responsive AdSense ইউনিট তৈরি হবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Banner Image URL
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/banner.png"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination Target URL
                    </label>
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://sponsor.com/landing"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs"
                >
                  {editingAd ? 'Save Changes' : 'Create Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
