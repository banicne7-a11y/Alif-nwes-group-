import React, { useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Key,
  Clock,
  Lock,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { User, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Author');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);

  const refreshUsers = () => {
    setUsers([...db.getUsers()]);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('Author');
    setBio('');
    setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    setTwoFactor(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setBio(user.bio || '');
    setAvatar(user.avatar);
    setTwoFactor(user.twoFactorEnabled);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    db.saveUser({
      id: editingUser ? editingUser.id : undefined,
      name,
      email,
      role,
      bio,
      avatar,
      twoFactorEnabled: twoFactor,
    });

    setModalOpen(false);
    refreshUsers();
    toast.success(`User profile "${name}" saved!`);
  };

  const handleDelete = (id: string, userName: string) => {
    toast.confirm({
      title: 'Remove User Account',
      message: `Are you sure you want to remove user account "${userName}"?`,
      confirmLabel: 'Remove Account',
      isDestructive: true,
      onConfirm: () => {
        try {
          db.deleteUser(id);
          refreshUsers();
          toast.success(`User "${userName}" removed`);
        } catch (err: any) {
          toast.error(err.message || 'Cannot delete user');
        }
      },
    });
  };

  // Permissions Matrix Definition
  const permissions = [
    { capability: 'Publish News Directly', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Approve AI-Generated Stories (Guardrail)', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Edit Other Authors’ Articles', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Create & Edit Own Drafts', admin: true, editor: true, author: true, contrib: true, sub: false },
    { capability: 'Upload Images & Media Library', admin: true, editor: true, author: true, contrib: true, sub: false },
    { capability: 'Manage Ad Placements & Code', admin: true, editor: false, author: false, contrib: false, sub: false },
    { capability: 'Manage Database & Daily Backups', admin: true, editor: false, author: false, contrib: false, sub: false },
    { capability: 'Moderate Reader Comments', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Change Global Site Settings & SMTP', admin: true, editor: false, author: false, contrib: false, sub: false },
  ];

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & Permissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Role-based access control (RBAC), newsroom hierarchy, and 2FA authentication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'users' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Staff ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Permissions Matrix
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Staff Member</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">2FA Security</th>
                  <th className="py-3.5 px-6">Articles Published</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</p>
                          <p className="text-slate-400 text-xs font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.role === 'Administrator'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'Editor'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'Author'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {u.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                          <ShieldCheck className="w-4 h-4" /> Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                          <Lock className="w-4 h-4" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {u.articlesCount} stories
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete User"
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
      ) : (
        /* Permissions Matrix Grid */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-extrabold text-base text-slate-900">
              Newsroom Permissions Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Defines operational boundaries for editorial publishing and administrative functions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-6">System Capability</th>
                  <th className="py-3 px-4 text-center">Administrator</th>
                  <th className="py-3 px-4 text-center">Editor</th>
                  <th className="py-3 px-4 text-center">Author</th>
                  <th className="py-3 px-4 text-center">Contributor</th>
                  <th className="py-3 px-4 text-center">Subscriber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {permissions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6 font-semibold text-slate-900">{p.capability}</td>
                    <td className="py-3 px-4 text-center">
                      {p.admin ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.editor ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.author ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.contrib ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.sub ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-slate-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              {editingUser ? 'Edit User Profile' : 'Add New Staff Account'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure credentials, newsroom role, and authentication security.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.j@maannews.com"
                  className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Editor">Editor</option>
                    <option value="Author">Author</option>
                    <option value="Contributor">Contributor</option>
                    <option value="Subscriber">Subscriber</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">2FA Status</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={twoFactor}
                      onChange={(e) => setTwoFactor(e.target.checked)}
                      className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Require 2FA</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Avatar URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Author Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Author bio for article pages..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden"
                />
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
