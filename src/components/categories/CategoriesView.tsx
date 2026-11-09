import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Tag as TagIcon,
  Palette,
  Search,
  CheckCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { Category, Tag } from '../../types';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(db.getCategories());
  const [tags, setTags] = useState<Tag[]>(db.getTags());
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'tags'>('categories');

  // Category form state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catColor, setCatColor] = useState('#0284C7');
  const [catParent, setCatParent] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Tag form state
  const [newTagName, setNewTagName] = useState('');

  const refreshData = () => {
    setCategories([...db.getCategories()]);
    setTags([...db.getTags()]);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    db.saveCategory({
      id: editingCatId || undefined,
      name: catName,
      slug: catSlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      color: catColor,
      parentId: catParent || null,
      description: catDesc,
    });

    setEditingCatId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    refreshData();
  };

  const handleEditCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatColor(cat.color);
    setCatParent(cat.parentId || '');
    setCatDesc(cat.description || '');
  };

  const handleDeleteCat = (id: string, name: string) => {
    if (confirm(`Delete category "${name}"? Articles in this category will become Uncategorized.`)) {
      db.deleteCategory(id);
      refreshData();
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    db.saveTag(newTagName.trim());
    setNewTagName('');
    refreshData();
  };

  const handleDeleteTag = (id: string) => {
    db.deleteTag(id);
    refreshData();
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories & Tags</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize taxonomy, parent-child hierarchies, brand colors, and navigation anchors.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'categories' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveSubTab('tags')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'tags' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Tags ({tags.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'categories' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add / Edit Category Form (4 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
              {editingCatId ? 'Edit Category' : 'Add New Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Geopolitics"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. geopolitics"
                  className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Category</label>
                  <select
                    value={catParent}
                    onChange={(e) => setCatParent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">None (Top Level)</option>
                    {categories
                      .filter((c) => c.id !== editingCatId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <span className="font-mono text-slate-600">{catColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Editorial scope of this category..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all shadow-xs"
                >
                  {editingCatId ? 'Update Category' : 'Create Category'}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(null);
                      setCatName('');
                      setCatSlug('');
                      setCatDesc('');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories Table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Current Categories</h3>
              <span className="text-xs text-slate-500 font-semibold">
                {categories.length} Taxonomies
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Slug</th>
                    <th className="py-3 px-5">Color</th>
                    <th className="py-3 px-5">Articles</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-bold text-slate-900 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.name}</span>
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-slate-500">{cat.slug}</td>
                      <td className="py-3 px-5 font-mono text-xs text-slate-600">{cat.color}</td>
                      <td className="py-3 px-5 text-slate-800 font-semibold">{cat.count}</td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditCat(cat)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCat(cat.id, cat.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
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
        </div>
      ) : (
        /* Tags View */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <form onSubmit={handleAddTag} className="flex gap-3 max-w-md">
            <input
              type="text"
              required
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter new tag name..."
              className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Add Tag
            </button>
          </form>

          <div>
            <h3 className="font-extrabold text-sm text-slate-900 mb-3">All Active Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <span>#{tag.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({tag.count})</span>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-slate-400 hover:text-red-500 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
