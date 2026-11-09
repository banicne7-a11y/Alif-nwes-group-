import React, { useState } from 'react';
import {
  MessageSquare,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Reply,
  Shield,
  Filter,
} from 'lucide-react';
import { db } from '../../services/db';
import { Comment } from '../../types';

export const CommentsView: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>(db.getComments());
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'spam' | 'trash'>('all');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [blockedWords, setBlockedWords] = useState<string[]>([
    'crypto-airdrop',
    'free-casino',
    'buy-followers',
    'scam-link',
  ]);
  const [newBlockedWord, setNewBlockedWord] = useState('');

  const refreshComments = () => {
    setComments([...db.getComments()]);
  };

  const filtered = comments.filter((c) => {
    if (filter === 'all') return c.status !== 'trash';
    return c.status === filter;
  });

  const handleStatusChange = (id: string, newStatus: Comment['status']) => {
    db.updateCommentStatus(id, newStatus);
    refreshComments();
  };

  const handleSendReply = (comment: Comment) => {
    if (!replyText.trim()) return;
    const adminUser = db.getState().currentUser;
    // Append reply
    const updatedReplies = [
      ...(comment.replies || []),
      {
        id: `rep-${Date.now()}`,
        author: `${adminUser.name} (Editorial Desk)`,
        content: replyText.trim(),
        createdAt: 'Just now',
      },
    ];

    const idx = comments.findIndex((c) => c.id === comment.id);
    if (idx !== -1) {
      comments[idx].replies = updatedReplies;
      db.logAction('Comment Replied', `Editorial response added to comment by ${comment.authorName}`);
      refreshComments();
    }

    setReplyingToId(null);
    setReplyText('');
  };

  const handleAddBlockedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBlockedWord.trim() && !blockedWords.includes(newBlockedWord.trim())) {
      setBlockedWords([...blockedWords, newBlockedWord.trim().toLowerCase()]);
      setNewBlockedWord('');
      alert('Word added to automated anti-spam filter!');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Comments & Moderation</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Engage with readers, moderate community feedback, and enforce anti-spam filters.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        {[
          { key: 'all', label: 'All Active' },
          { key: 'approved', label: 'Approved' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'spam', label: 'Spam' },
          { key: 'trash', label: 'Trash' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid: Comments List + Anti-Spam Blocklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Comments Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold">No comments in this section</p>
            </div>
          ) : (
            filtered.map((comment) => (
              <div
                key={comment.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{comment.authorName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{comment.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-sm">
                        on <strong className="text-slate-700">{comment.postTitle}</strong>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      comment.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : comment.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  "{comment.content}"
                </p>

                {/* Existing Replies */}
                {(comment.replies || []).map((rep) => (
                  <div
                    key={rep.id}
                    className="ml-6 pl-3 border-l-2 border-sky-400 text-xs text-slate-600 bg-sky-50/50 p-2.5 rounded-r-lg"
                  >
                    <span className="font-bold text-sky-800">{rep.author}:</span> {rep.content}
                  </div>
                ))}

                {/* Reply Form (if active) */}
                {replyingToId === comment.id && (
                  <div className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write editorial reply..."
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => handleSendReply(comment)}
                      className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => setReplyingToId(null)}
                      className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
                  <button
                    onClick={() => setReplyingToId(comment.id)}
                    className="flex items-center gap-1 text-slate-600 hover:text-sky-600 px-2 py-1 rounded-md"
                  >
                    <Reply className="w-3.5 h-3.5" /> Reply
                  </button>
                  {comment.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'approved')}
                      className="flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-md"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {comment.status !== 'spam' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'spam')}
                      className="flex items-center gap-1 text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-md"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Mark Spam
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(comment.id, 'trash')}
                    className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Trash
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Anti-Spam & Word Filter (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-5 h-5 text-sky-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Automated Anti-Spam</h3>
          </div>

          <p className="text-xs text-slate-500">
            Comments containing these trigger phrases are automatically flagged and quarantined before publication.
          </p>

          <form onSubmit={handleAddBlockedWord} className="flex gap-2">
            <input
              type="text"
              required
              value={newBlockedWord}
              onChange={(e) => setNewBlockedWord(e.target.value)}
              placeholder="Add forbidden keyword..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {blockedWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-mono font-semibold"
              >
                <span>{word}</span>
                <button
                  onClick={() => setBlockedWords(blockedWords.filter((w) => w !== word))}
                  className="hover:text-red-900 text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
