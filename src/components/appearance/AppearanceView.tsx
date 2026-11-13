import React, { useState } from 'react';
import {
  Palette,
  Layout,
  Menu,
  Sun,
  Moon,
  Check,
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  RotateCcw,
  Save,
  Link as LinkIcon,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { FooterConfig } from '../../types';

export const AppearanceView: React.FC = () => {
  const [settings, setSettings] = useState(db.getSettings());
  const [activeTab, setActiveTab] = useState<'theme' | 'builder' | 'menu' | 'footer'>('theme');

  // Theme settings
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [darkMode, setDarkMode] = useState(settings.darkMode);

  // Footer Menu & Brand config state
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() =>
    JSON.parse(JSON.stringify(db.getFooterConfig()))
  );
  const [newColTitle, setNewColTitle] = useState('');
  const [newItemLabels, setNewItemLabels] = useState<Record<string, string>>({});
  const [newItemUrls, setNewItemUrls] = useState<Record<string, string>>({});

  // Homepage section layout reordering
  const [sections, setSections] = useState([
    { id: 'sec-1', name: 'Breaking News Marquee Ticker', enabled: true },
    { id: 'sec-2', name: 'Hero News Grid (Main Story + 3 Trending Cards)', enabled: true },
    { id: 'sec-3', name: 'Top Leaderboard Advertisement Banner (728x90)', enabled: true },
    { id: 'sec-4', name: 'Category Block: Business & Finance Wire', enabled: true },
    { id: 'sec-5', name: 'Technology & AI In-Depth Section', enabled: true },
    { id: 'sec-6', name: 'Multimedia Video & Photo Gallery Showcase', enabled: true },
    { id: 'sec-7', name: 'Opinion Columns & Editor’s Picks', enabled: true },
  ]);

  // Navigation menu items
  const [menuItems, setMenuItems] = useState([
    { id: 'm-1', label: 'Home', url: '/' },
    { id: 'm-2', label: 'Business', url: '/category/business' },
    { id: 'm-3', label: 'Politics', url: '/category/politics' },
    { id: 'm-4', label: 'Technology', url: '/category/technology' },
    { id: 'm-5', label: 'Health', url: '/category/health' },
    { id: 'm-6', label: 'Sports', url: '/category/sports' },
    { id: 'm-7', label: 'Opinion', url: '/category/opinion' },
  ]);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuUrl, setNewMenuUrl] = useState('');

  const colorPresets = ['#00C5FF', '#0284C7', '#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  const handleSaveTheme = () => {
    db.updateSettings({
      primaryColor,
      darkMode,
    });
    toast.success('Appearance settings saved successfully!');
  };

  const handleMoveSection = (idx: number, dir: 'up' | 'down') => {
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === sections.length - 1)) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    const copy = [...sections];
    const temp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = temp;
    setSections(copy);
  };

  const handleToggleSection = (id: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuLabel || !newMenuUrl) return;
    setMenuItems([...menuItems, { id: `m-${Date.now()}`, label: newMenuLabel, url: newMenuUrl }]);
    setNewMenuLabel('');
    setNewMenuUrl('');
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appearance & Theme</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Homepage layout builder, navigation menu order, brand colors, and typography.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'theme' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Theme & Colors
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'builder' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Homepage Builder
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'menu' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Navigation Menu
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'footer' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Footer Menus
          </button>
        </div>
      </div>

      {activeTab === 'theme' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-w-xl">
          <h2 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
            Brand Identity & Accent Colors
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-2">Primary Accent Color</label>
              <div className="flex items-center gap-2">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrimaryColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform ${
                      primaryColor === c ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : ''
                    }`}
                  >
                    {primaryColor === c && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custom Hex Code</label>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-36 px-3 py-1.5 font-mono border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <button
              onClick={handleSaveTheme}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
            >
              Save Appearance
            </button>
          </div>
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 max-w-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Homepage Layout Flow</h2>
              <p className="text-xs text-slate-500">Reorder frontpage sections by priority.</p>
            </div>
          </div>

          <div className="space-y-2">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className={`font-semibold ${sec.enabled ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    {sec.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleSection(sec.id)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      sec.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {sec.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleMoveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 hover:bg-slate-200 rounded-md disabled:opacity-30"
                  >
                    <MoveUp className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleMoveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1 hover:bg-slate-200 rounded-md disabled:opacity-30"
                  >
                    <MoveDown className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => toast.success('Homepage section order saved successfully!')}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            Apply Layout
          </button>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 max-w-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Header Navigation Menu</h2>
              <p className="text-xs text-slate-500">Configure top navigation anchors.</p>
            </div>
          </div>

          <form onSubmit={handleAddMenuItem} className="flex gap-2 text-xs">
            <input
              type="text"
              required
              value={newMenuLabel}
              onChange={(e) => setNewMenuLabel(e.target.value)}
              placeholder="Menu Label (e.g. Science)"
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              required
              value={newMenuUrl}
              onChange={(e) => setNewMenuUrl(e.target.value)}
              placeholder="Link URL (/category/...)"
              className="flex-1 px-3 py-1.5 font-mono border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg"
            >
              Add Link
            </button>
          </form>

          {/* Static Pages Quick Toggle in Menu */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900 mb-1">
              Static Pages in Navigation Menu
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Toggle any page to appear directly on the Homepage top menu or keep it hidden.
            </p>

            <div className="space-y-2">
              {db.getPages().map((page) => (
                <div
                  key={page.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{page.title}</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-2">/{page.slug}</span>
                  </div>
                  <button
                    onClick={() => {
                      db.togglePageMenuVisibility(page.id);
                      setMenuItems([...menuItems]);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      page.showInMenu
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {page.showInMenu ? '✓ In Menu (Visible)' : '✕ Hidden from Menu'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'footer' && (
        <div className="space-y-6">
          {/* Save & Reset Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Footer Menu & Columns Manager
              </h2>
              <p className="text-xs text-slate-500">
                Edit every footer column, link label, link URL, brand description, and copyright line. Syncs live to all devices via Firebase.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const reset = db.resetFooterConfig();
                  setFooterConfig(JSON.parse(JSON.stringify(reset)));
                  toast.info('Footer restored to default editorial template.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  db.updateFooterConfig(footerConfig);
                  toast.success('Footer menus saved and published live across all devices!');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00C5FF] hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-extrabold cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Footer Changes</span>
              </button>
            </div>
          </div>

          {/* Brand Bio, Publisher & Copyright */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Brand Column & Copyright Text
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Footer About Text</label>
                <textarea
                  rows={3}
                  value={footerConfig.aboutText}
                  onChange={(e) => setFooterConfig({ ...footerConfig, aboutText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publisher Line</label>
                  <input
                    type="text"
                    value={footerConfig.publisherText}
                    onChange={(e) => setFooterConfig({ ...footerConfig, publisherText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bottom Copyright Line</label>
                  <input
                    type="text"
                    value={footerConfig.copyrightText}
                    onChange={(e) => setFooterConfig({ ...footerConfig, copyrightText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add New Footer Column */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
            <input
              type="text"
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              placeholder="New footer column title (e.g. Regional Desks)..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl"
            />
            <button
              type="button"
              onClick={() => {
                if (!newColTitle.trim()) return;
                const newCol = {
                  id: `col-${Date.now()}`,
                  title: newColTitle.trim(),
                  items: [],
                };
                const updated = { ...footerConfig, columns: [...footerConfig.columns, newCol] };
                setFooterConfig(updated);
                db.updateFooterConfig(updated);
                setNewColTitle('');
                toast.success(`Added footer column "${newCol.title}"`);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Footer Column</span>
            </button>
          </div>

          {/* Columns Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {footerConfig.columns.map((col, colIdx) => (
              <div
                key={col.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <input
                    type="text"
                    value={col.title}
                    onChange={(e) => {
                      const updatedCols = footerConfig.columns.map((c) =>
                        c.id === col.id ? { ...c, title: e.target.value } : c
                      );
                      setFooterConfig({ ...footerConfig, columns: updatedCols });
                    }}
                    className="font-extrabold text-sm text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updatedCols = footerConfig.columns.filter((c) => c.id !== col.id);
                      const updated = { ...footerConfig, columns: updatedCols };
                      setFooterConfig(updated);
                      db.updateFooterConfig(updated);
                      toast.info(`Removed column "${col.title}"`);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Delete Column"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Links inside this column */}
                <div className="space-y-2.5 flex-1">
                  {col.items.map((item, itemIdx) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const updatedCols = footerConfig.columns.map((c) => {
                              if (c.id !== col.id) return c;
                              return {
                                ...c,
                                items: c.items.map((it) =>
                                  it.id === item.id ? { ...it, label: e.target.value } : it
                                ),
                              };
                            });
                            setFooterConfig({ ...footerConfig, columns: updatedCols });
                          }}
                          placeholder="Link label"
                          className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-800"
                        />
                        <button
                          type="button"
                          disabled={itemIdx === 0}
                          onClick={() => {
                            const items = [...col.items];
                            const tmp = items[itemIdx];
                            items[itemIdx] = items[itemIdx - 1];
                            items[itemIdx - 1] = tmp;
                            const updatedCols = footerConfig.columns.map((c) =>
                              c.id === col.id ? { ...c, items } : c
                            );
                            setFooterConfig({ ...footerConfig, columns: updatedCols });
                          }}
                          className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <MoveUp className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          disabled={itemIdx === col.items.length - 1}
                          onClick={() => {
                            const items = [...col.items];
                            const tmp = items[itemIdx];
                            items[itemIdx] = items[itemIdx + 1];
                            items[itemIdx + 1] = tmp;
                            const updatedCols = footerConfig.columns.map((c) =>
                              c.id === col.id ? { ...c, items } : c
                            );
                            setFooterConfig({ ...footerConfig, columns: updatedCols });
                          }}
                          className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <MoveDown className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedCols = footerConfig.columns.map((c) =>
                              c.id === col.id
                                ? { ...c, items: c.items.filter((it) => it.id !== item.id) }
                                : c
                            );
                            setFooterConfig({ ...footerConfig, columns: updatedCols });
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                          title="Remove Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => {
                            const updatedCols = footerConfig.columns.map((c) => {
                              if (c.id !== col.id) return c;
                              return {
                                ...c,
                                items: c.items.map((it) =>
                                  it.id === item.id ? { ...it, url: e.target.value } : it
                                ),
                              };
                            });
                            setFooterConfig({ ...footerConfig, columns: updatedCols });
                          }}
                          placeholder="/category/business or /page/about-us"
                          className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-[11px] text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Link to this Column */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <input
                    type="text"
                    value={newItemLabels[col.id] || ''}
                    onChange={(e) =>
                      setNewItemLabels({ ...newItemLabels, [col.id]: e.target.value })
                    }
                    placeholder="New link label (e.g. World News)"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newItemUrls[col.id] || ''}
                      onChange={(e) =>
                        setNewItemUrls({ ...newItemUrls, [col.id]: e.target.value })
                      }
                      placeholder="/category/... or https://..."
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const label = (newItemLabels[col.id] || '').trim();
                        const url = (newItemUrls[col.id] || '').trim() || '/';
                        if (!label) return;
                        const newItem = {
                          id: `item-${Date.now()}-${colIdx}`,
                          label,
                          url,
                        };
                        const updatedCols = footerConfig.columns.map((c) =>
                          c.id === col.id ? { ...c, items: [...c.items, newItem] } : c
                        );
                        const updated = { ...footerConfig, columns: updatedCols };
                        setFooterConfig(updated);
                        db.updateFooterConfig(updated);
                        setNewItemLabels({ ...newItemLabels, [col.id]: '' });
                        setNewItemUrls({ ...newItemUrls, [col.id]: '' });
                        toast.success(`Added "${label}" to ${col.title}`);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
