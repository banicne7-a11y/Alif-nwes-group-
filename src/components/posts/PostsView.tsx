import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Pencil,
  Trash2,
  Eye,
  MessageSquare,
  Sparkles,
  Flame,
  Clock,
  History,
  CheckCircle,
  AlertTriangle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { Post, PostStatus } from '../../types';

interface PostsViewProps {
  onNavigate: (view: string, subParam?: any) => void;
  onEditPost: (post: Post) => void;
  onOpenPreview: (post: Post) => void;
  initialFilter?: PostStatus | 'all';
}

export const PostsView: React.FC<PostsViewProps> = ({
  onNavigate,
  onEditPost,
  onOpenPreview,
  initialFilter = 'all',
}) => {
  const [posts, setPosts] = useState<Post[]>(db.getPosts());
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [revisionsModalPost, setRevisionsModalPost] = useState<Post | null>(null);

  const categories = db.getCategories();

  const refreshPosts = () => {
    setPosts([...db.getPosts()]);
  };

  const filteredPosts = posts.filter((post) => {
    if (statusFilter !== 'all' && post.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchAuthor = post.author.name.toLowerCase().includes(q);
      const matchCategory = post.category.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchCategory) return false;
    }
    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredPosts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApplyBulk = () => {
    if (!bulkAction || selectedIds.length === 0) return;

    if (bulkAction === 'publish') {
      selectedIds.forEach((id) => {
        const p = db.getPostById(id);
        if (p) db.savePost({ ...p, status: 'published' });
      });
    } else if (bulkAction === 'draft') {
      selectedIds.forEach((id) => {
        const p = db.getPostById(id);
        if (p) db.savePost({ ...p, status: 'draft' });
      });
    } else if (bulkAction === 'trash') {
      selectedIds.forEach((id) => db.deletePost(id));
    } else if (bulkAction === 'duplicate') {
      selectedIds.forEach((id) => db.duplicatePost(id));
    }

    const count = selectedIds.length;
    setSelectedIds([]);
    setBulkAction('');
    refreshPosts();
    toast.success(`Bulk action "${bulkAction}" applied to ${count} posts`);
  };

  const handleDuplicate = (id: string) => {
    db.duplicatePost(id);
    refreshPosts();
    toast.success('Article duplicated as draft');
  };

  const handleDelete = (id: string, title: string) => {
    toast.confirm({
      title: 'Move to Trash',
      message: `Are you sure you want to move "${title}" to Trash?`,
      confirmLabel: 'Move to Trash',
      isDestructive: true,
      onConfirm: () => {
        db.deletePost(id);
        refreshPosts();
        toast.success(`"${title}" moved to Trash`);
      },
    });
  };

  const handleRestoreRevision = (post: Post, revision: any) => {
    toast.confirm({
      title: 'Restore Revision',
      message: `Restore article to revision from ${revision.timestamp}?`,
      confirmLabel: 'Restore Revision',
      onConfirm: () => {
        db.savePost({
          ...post,
          title: revision.title,
        });
        refreshPosts();
        setRevisionsModalPost(null);
        toast.success('Revision restored successfully');
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header & Add New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">News Articles</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage, publish, review and organize all editorial stories.
          </p>
        </div>

        <button
          onClick={() => onNavigate('editor', { isNew: true })}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00C5FF] hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-cyan-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Post</span>
        </button>
      </div>

      {/* Status Filter Tabs (WordPress-inspired) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        {[
          { key: 'all', label: 'All', count: posts.length },
          { key: 'published', label: 'Published', count: posts.filter((p) => p.status === 'published').length },
          { key: 'draft', label: 'Drafts', count: posts.filter((p) => p.status === 'draft').length },
          { key: 'pending_review', label: 'Pending Review', count: posts.filter((p) => p.status === 'pending_review').length },
          { key: 'scheduled', label: 'Scheduled', count: posts.filter((p) => p.status === 'scheduled').length },
          { key: 'trash', label: 'Trash', count: posts.filter((p) => p.status === 'trash').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.key ? 'bg-slate-800 text-cyan-300' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search, Category Filter, and Bulk Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            aria-label="Bulk actions selector"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="">Bulk Actions</option>
            <option value="publish">Mark as Published</option>
            <option value="draft">Move to Drafts</option>
            <option value="duplicate">Duplicate Selected</option>
            <option value="trash">Move to Trash</option>
          </select>
          <button
            onClick={handleApplyBulk}
            disabled={selectedIds.length === 0 || !bulkAction}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Apply ({selectedIds.length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === filteredPosts.length && filteredPosts.length > 0}
                    aria-label="Select all posts"
                    className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Metrics</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No news articles found</p>
                    <p className="text-xs">Try adjusting your filters or create a new post.</p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(post.id)}
                        onChange={() => handleSelectOne(post.id)}
                        aria-label={`Select article ${post.title}`}
                        className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                    <td className="py-3.5 px-4 min-w-[280px]">
                      <div className="flex gap-3 items-start">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-14 h-12 rounded-lg object-cover shrink-0 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {post.isBreaking && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-xs bg-red-100 text-red-700 font-bold text-[9px] uppercase">
                                <Flame className="w-2.5 h-2.5 fill-red-600" />
                                Breaking
                              </span>
                            )}
                            {post.isAiGenerated && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-xs bg-purple-100 text-purple-700 font-bold text-[9px]">
                                <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                AI Draft
                              </span>
                            )}
                            {post.isEditorPick && (
                              <span className="px-1.5 py-0.2 rounded-xs bg-amber-100 text-amber-800 font-bold text-[9px]">
                                Editor's Pick
                              </span>
                            )}
                          </div>
                          <h3
                            onClick={() => onEditPost(post)}
                            className="font-bold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer line-clamp-1 mt-0.5 text-xs sm:text-sm"
                          >
                            {post.title}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            /{post.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-semibold text-slate-800">{post.author.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {(post.tags || []).slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-sm text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          {post.commentsCount}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          post.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : post.status === 'draft'
                            ? 'bg-amber-100 text-amber-800'
                            : post.status === 'pending_review'
                            ? 'bg-purple-100 text-purple-800 animate-pulse'
                            : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {post.status === 'pending_review' ? 'Needs Approval' : post.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                      {post.publishedAt}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenPreview(post)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Preview Article"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditPost(post)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit in Block Editor"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(post.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Duplicate Post"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRevisionsModalPost(post)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Revision History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revision History Modal */}
      {revisionsModalPost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Revision History</h3>
                <p className="text-xs text-slate-500 truncate max-w-sm">{revisionsModalPost.title}</p>
              </div>
              <button
                onClick={() => setRevisionsModalPost(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(revisionsModalPost.revisions || []).map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{rev.authorName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{rev.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{rev.summary}</p>
                    <span className="text-[10px] text-slate-400">{rev.blocksCount} blocks preserved</span>
                  </div>

                  <button
                    onClick={() => handleRestoreRevision(revisionsModalPost, rev)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 flex items-center gap-1 shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                    <span>Restore</span>
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
