import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Code2,
  Tv,
  CheckCircle,
  Eye,
  MousePointerClick,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { db } from '../../services/db';
import { AdPlacement } from '../../types';

export const AdPlacementsView: React.FC = () => {
  const [ads, setAds] = useState<AdPlacement[]>(db.getAds());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdPlacement | null>(null);

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
      alert('Please enter placement name and location key.');
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
  };

  const handleDelete = (id: string, adName: string) => {
    if (confirm(`Are you sure you want to delete ad placement "${adName}"?`)) {
      db.deleteAd(id);
      refreshAds();
    }
  };

  const handleToggleStatus = (id: string) => {
    db.toggleAdStatus(id);
    refreshAds();
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

      {/* Stats summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Total Active Slots</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {ads.filter((a) => a.status === 'Active').length} of {ads.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Total Monthly Impressions</p>
          <p className="text-xl font-extrabold text-sky-600 mt-1">1.84M</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">AdSense Estimated Revenue</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">$4,850.00</p>
        </div>
      </div>

      {/* Main Table Card matching Screenshot 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900">Active Placements</h2>
          <span className="text-xs text-slate-400 font-medium">All slot positions defined in theme</span>
        </div>

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
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
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
                        className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Placement"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id, ad.name)}
                        className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    placeholder="e.g. Article - Top Leaderboard"
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
                    placeholder="e.g. article_top_banner"
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
                    Ad / Script Code
                  </label>
                  <textarea
                    rows={4}
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="<!-- Paste Google AdSense or sponsor script here -->"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
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
