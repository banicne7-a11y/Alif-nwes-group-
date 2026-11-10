import React, { useState } from 'react';
import {
  FileCode,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  ExternalLink,
  Menu,
  Globe,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { Page } from '../../types';

interface PagesViewProps {
  onOpenPublicPage?: (page: Page) => void;
}

export const PagesView: React.FC<PagesViewProps> = ({ onOpenPublicPage }) => {
  const [pages, setPages] = useState<Page[]>(db.getPages());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [previewPage, setPreviewPage] = useState<Page | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState<Page['template']>('default');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Page['status']>('published');
  const [showInMenu, setShowInMenu] = useState(true);
  const [showInFooter, setShowInFooter] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const refreshPages = () => {
    setPages([...db.getPages()]);
  };

  const handleOpenCreate = () => {
    setEditingPage(null);
    setTitle('');
    setSlug('');
    setTemplate('default');
    setContent('Write static page content here with rich editorial paragraphs and guidelines...');
    setStatus('published');
    setShowInMenu(true);
    setShowInFooter(true);
    setSeoTitle('');
    setSeoDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (page: Page) => {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setTemplate(page.template);
    setContent(page.content);
    setStatus(page.status);
    setShowInMenu(page.showInMenu !== undefined ? page.showInMenu : true);
    setShowInFooter(page.showInFooter !== undefined ? page.showInFooter : true);
    setSeoTitle(page.seoTitle || '');
    setSeoDescription(page.seoDescription || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a page title.');
      return;
    }

    const saved = db.savePage({
      id: editingPage ? editingPage.id : undefined,
      title: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      template,
      content,
      status,
      showInMenu,
      showInFooter,
      seoTitle: seoTitle.trim() || title,
      seoDescription: seoDescription.trim(),
    });

    setModalOpen(false);
    refreshPages();
    toast.success(`Page "${saved.title}" saved successfully`);
  };

  const handleToggleMenuVisibility = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = db.togglePageMenuVisibility(id);
    refreshPages();
    if (updated) {
      toast.info(updated.showInMenu ? `"${updated.title}" added to Homepage Menu` : `"${updated.title}" removed from Homepage Menu`);
    }
  };

  const handleDelete = (id: string, pageTitle: string) => {
    toast.confirm({
      title: 'Delete Page',
      message: `Are you sure you want to delete page "${pageTitle}"?`,
      confirmLabel: 'Delete Page',
      isDestructive: true,
      onConfirm: () => {
        db.deletePage(id);
        refreshPages();
        toast.success(`Page "${pageTitle}" deleted`);
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pages Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {pages.length} Pages
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Create custom static pages, toggle visibility in homepage navigation menu, or hide from public.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00C5FF] hover:bg-cyan-500 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-md shadow-cyan-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Page</span>
        </button>
      </div>

      {/* Info Notice Box for User Guidance */}
      <div className="p-4 bg-gradient-to-r from-sky-50 via-cyan-50 to-white rounded-2xl border border-sky-200/80 shadow-2xs flex items-start gap-3 text-xs">
        <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Menu className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">
            Homepage Navigation Menu Control
          </p>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            Create any custom Page and click the <strong>"In Menu"</strong> toggle to make it instantly visible or hidden in the reader homepage navigation drawer. Pages marked as <strong>"Visible in Menu"</strong> can be read directly by visitors.
          </p>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900">All Created Pages</h2>
          <span className="text-xs text-slate-400 font-semibold">
            {pages.filter((p) => p.showInMenu).length} of {pages.length} visible in top menu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-6">Page Title</th>
                <th className="py-3 px-6">URL Slug</th>
                <th className="py-3 px-6">Template</th>
                <th className="py-3 px-6">Homepage Menu Status</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Last Updated</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>{p.title}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-500">
                    /{p.slug}
                  </td>
                  <td className="py-3.5 px-6 capitalize">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                      {p.template}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    {/* One-click toggle button to show or hide page in Homepage Menu */}
                    <button
                      onClick={(e) => handleToggleMenuVisibility(p.id, e)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                        p.showInMenu
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={p.showInMenu ? 'Click to Hide from Menu' : 'Click to Show in Homepage Menu'}
                    >
                      {p.showInMenu ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-white" />
                          <span>Visible in Menu</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Hidden from Menu</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        p.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">
                    {p.updatedAt}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewPage(p)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Preview Page"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Page"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Page Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingPage ? 'Edit Page' : 'Add New Page'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure page title, content, SEO, and homepage navigation menu visibility.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Press Room & Media Kit"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. press-room"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Homepage Menu Visibility Toggle */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Menu className="w-4 h-4 text-sky-600" />
                      <span>Show in Homepage Navigation Menu</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When enabled, visitors can access this page directly from the 3-bar header drawer.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowInMenu(!showInMenu)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      showInMenu ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {showInMenu ? '✓ In Menu' : '✕ Hidden'}
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-sky-200/60 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={showInFooter}
                      onChange={(e) => setShowInFooter(e.target.checked)}
                      className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Show link in Footer</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Page Template</label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="default">Default Page Layout</option>
                    <option value="about">About Us Template</option>
                    <option value="contact">Contact Newsroom Template</option>
                    <option value="privacy">Privacy & Terms Template</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publish Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Page Content
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write complete editorial page text..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>

              {/* SEO inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SEO Meta Title</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Page Title for Google SERP"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta Description</label>
                  <input
                    type="text"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Summary snippet for search results"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  {editingPage ? 'Save Changes' : 'Publish Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Preview Modal */}
      {previewPage && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                  Static Page Preview
                </span>
                <h3 className="font-extrabold text-xl text-slate-900">{previewPage.title}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Slug: /{previewPage.slug} • Menu: {previewPage.showInMenu ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <button
                onClick={() => setPreviewPage(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {previewPage.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
