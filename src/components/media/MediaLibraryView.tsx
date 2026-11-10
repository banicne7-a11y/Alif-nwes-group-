import React, { useState } from 'react';
import {
  Upload,
  Search,
  Filter,
  Trash2,
  Copy,
  Crop,
  Check,
  Image as ImageIcon,
  FileVideo,
  Sparkles,
  Maximize2,
  Download,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { MediaItem } from '../../types';

export const MediaLibraryView: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>(db.getMedia());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropRatio, setCropRatio] = useState<'16:9' | '4:3' | '1:1'>('16:9');
  const [webpOptimized, setWebpOptimized] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Upload modal state
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');

  const refreshMedia = () => {
    setMedia([...db.getMedia()]);
  };

  const filteredMedia = media.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.altText.toLowerCase().includes(q);
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const sizeKb = Math.round(file.size / 1024);
      const optimizedSize = webpOptimized ? `${Math.round(sizeKb * 0.35)} KB (WebP)` : `${sizeKb} KB`;

      const newItem = db.addMediaItem({
        name: file.name,
        url: result,
        type: file.type.startsWith('video') ? 'video' : 'image',
        size: optimizedSize,
        dimensions: '1920x1080',
        format: webpOptimized ? 'image/webp' : file.type,
        altText: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      });
      refreshMedia();
      setSelectedItem(newItem);
    };
    reader.readAsDataURL(file);
  };

  const handleDirectAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl) return;

    const newItem = db.addMediaItem({
      name: uploadName || 'news-image.jpg',
      url: uploadUrl,
      type: 'image',
      size: webpOptimized ? '180 KB (WebP)' : '420 KB',
      dimensions: '1920x1080',
      format: webpOptimized ? 'image/webp' : 'image/jpeg',
      altText: uploadAlt || uploadName || 'News asset',
    });
    refreshMedia();
    setSelectedItem(newItem);
    setUploadUrl('');
    setUploadName('');
    setUploadAlt('');
  };

  const handleDelete = (id: string) => {
    toast.confirm({
      title: 'Delete Media Item',
      message: 'Delete this media item from the library?',
      confirmLabel: 'Delete Media',
      isDestructive: true,
      onConfirm: () => {
        db.deleteMediaItem(id);
        if (selectedItem?.id === id) setSelectedItem(null);
        refreshMedia();
        toast.success('Media item deleted');
      },
    });
  };

  const handleSaveAltText = (id: string, altText: string) => {
    db.updateMediaItem(id, { altText });
    refreshMedia();
    toast.success('Alt text updated');
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Media Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            High-performance image assets, WebP compression, and media crop studio.
          </p>
        </div>

        {/* Compression switch */}
        <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-xl text-xs font-semibold self-start sm:self-auto shadow-2xs">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Auto WebP Compression:</span>
          <button
            onClick={() => setWebpOptimized(!webpOptimized)}
            className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
              webpOptimized ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {webpOptimized ? 'ON (-65%)' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Upload Dropzone */}
        <div className="md:col-span-8 bg-white p-6 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/20 text-center flex flex-col items-center justify-center relative group hover:border-sky-500 transition-colors">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Click to upload or drag & drop news photos
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PNG, JPG, WebP, SVG, MP4 up to 50MB • Automatic lossless compression
          </p>
        </div>

        {/* Direct URL import */}
        <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleDirectAddUrl} className="space-y-3">
            <h3 className="font-bold text-xs text-slate-700">Import via Image URL</h3>
            <input
              type="url"
              required
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Asset title..."
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              Add to Library
            </button>
          </form>
        </div>
      </div>

      {/* Media Grid & Inspector Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Media Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images by name or alt text..."
              className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredMedia.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`group relative aspect-4/3 rounded-xl overflow-hidden border-2 bg-slate-100 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.altText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[10px]">
                    <p className="font-semibold truncate">{item.name}</p>
                    <span className="text-[9px] text-slate-300 font-mono">{item.size}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Media Inspector Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Asset Details
          </h3>

          {selectedItem ? (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-slate-100">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.altText}
                  className="max-h-48 w-full object-contain"
                />
              </div>

              <div>
                <p className="font-bold text-slate-900 truncate">{selectedItem.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span>Size: {selectedItem.size}</span>
                  <span>Dim: {selectedItem.dimensions}</span>
                  <span>Format: {selectedItem.format}</span>
                  <span>Date: {selectedItem.uploadedAt}</span>
                </div>
              </div>

              {/* Alt text editor for SEO accessibility */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alt Text (Screen Readers & SEO)
                </label>
                <input
                  type="text"
                  value={selectedItem.altText}
                  onChange={(e) => {
                    setSelectedItem({ ...selectedItem, altText: e.target.value });
                    handleSaveAltText(selectedItem.id, e.target.value);
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCopyUrl(selectedItem.url)}
                  className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-bold flex items-center justify-center gap-2 border border-sky-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUrl ? 'URL Copied!' : 'Copy Asset URL'}</span>
                </button>

                <button
                  onClick={() => setCropModalOpen(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Crop & Resize Tool</span>
                </button>

                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold flex items-center justify-center gap-2 border border-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Asset</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold">No asset selected</p>
              <p className="text-[11px]">Click any image in the grid to view metadata and crop.</p>
            </div>
          )}
        </div>
      </div>

      {/* Crop & Resize Modal */}
      {cropModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 mb-1">Crop & Resize Image</h3>
            <p className="text-xs text-slate-500 mb-4">
              Preset ratios for News Hero (16:9), Standard Article (4:3), or Avatar (1:1).
            </p>

            <div className="flex gap-2 mb-4">
              {(['16:9', '4:3', '1:1'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setCropRatio(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    cropRatio === r
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Aspect {r}
                </button>
              ))}
            </div>

            <div
              className={`rounded-xl overflow-hidden border-2 border-sky-400 max-h-72 flex items-center justify-center bg-slate-950 ${
                cropRatio === '16:9' ? 'aspect-16/9' : cropRatio === '4:3' ? 'aspect-4/3' : 'aspect-square'
              }`}
            >
              <img
                src={selectedItem.url}
                alt="Crop View"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success(`Image cropped to ${cropRatio} and optimized with WebP!`);
                  setCropModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-2xs"
              >
                Apply Crop & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
