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
  Search,
  Filter,
  UserCheck,
  FileText,
  Mail,
  Calendar,
  Shield,
  Eye,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { User, UserRole, Post } from '../../types';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [posts, setPosts] = useState<Post[]>(db.getPosts());
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Author');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  const refreshUsers = () => {
    setUsers([...db.getUsers()]);
    setPosts([...db.getPosts()]);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('Author');
    setBio('');
    setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    setTwoFactor(false);
    setStatus('active');
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
    setStatus(user.status);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter name and email');
      return;
    }

    db.saveUser({
      id: editingUser ? editingUser.id : undefined,
      name: name.trim(),
      email: email.trim(),
      role,
      bio: bio.trim(),
      avatar,
      twoFactorEnabled: twoFactor,
      status,
    });

    setModalOpen(false);
    refreshUsers();
    toast.success(`User "${name}" saved successfully!`);
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
          if (viewingUser?.id === id) setViewingUser(null);
          toast.success(`User "${userName}" removed`);
        } catch (err: any) {
          toast.error(err.message || 'Cannot delete user');
        }
      },
    });
  };

  const handleToggleStatus = (user: User) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    db.saveUser({
      id: user.id,
      name: user.name,
      email: user.email,
      status: nextStatus,
    });
    refreshUsers();
    toast.info(`Account status for ${user.name} changed to ${nextStatus}`);
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Calculate real articles written by a user
  const getUserArticles = (u: User) => {
    return posts.filter(
      (p) => p.author?.id === u.id || p.author?.name?.toLowerCase().trim() === u.name.toLowerCase().trim()
    );
  };

  // Permissions Matrix Definition
  const permissions = [
    { capability: 'Publish News Directly to Live Portal', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Approve AI-Generated News (Editorial Guardrail)', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Edit Other Authors’ Articles', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Create & Edit Own Drafts', admin: true, editor: true, author: true, contrib: true, sub: false },
    { capability: 'Upload Images & Media Library', admin: true, editor: true, author: true, contrib: true, sub: false },
    { capability: 'Manage Ad Placements & Code', admin: true, editor: false, author: false, contrib: false, sub: false },
    { capability: 'Manage Database & Daily Backups', admin: true, editor: false, author: false, contrib: false, sub: false },
    { capability: 'Moderate Reader Comments', admin: true, editor: true, author: false, contrib: false, sub: false },
    { capability: 'Change Global Site Settings & SMTP', admin: true, editor: false, author: false, contrib: false, sub: false },
    { capability: 'Read Member-Exclusive Analysis', admin: true, editor: true, author: true, contrib: true, sub: true },
  ];

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Users & Authors Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC), newsroom staff, verified subscriber accounts, and 2FA authentication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'users' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Permissions Matrix
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Controls: Search & Role Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Role filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-400 mr-1 flex items-center gap-1 text-[11px]">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { label: 'All', value: 'all', count: users.length },
                { label: 'Administrators', value: 'administrator', count: users.filter((u) => u.role === 'Administrator').length },
                { label: 'Editors', value: 'editor', count: users.filter((u) => u.role === 'Editor').length },
                { label: 'Authors', value: 'author', count: users.filter((u) => u.role === 'Author').length },
                { label: 'Contributors', value: 'contributor', count: users.filter((u) => u.role === 'Contributor').length },
                { label: 'Subscribers', value: 'subscriber', count: users.filter((u) => u.role === 'Subscriber').length },
              ].map((rf) => (
                <button
                  key={rf.value}
                  onClick={() => setRoleFilter(rf.value)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    roleFilter === rf.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rf.label} ({rf.count})
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-6">User / Author</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">2FA Security</th>
                    <th className="py-3.5 px-6">Articles Published</th>
                    <th className="py-3.5 px-6">Account Status</th>
                    <th className="py-3.5 px-6">Last Login</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map((u) => {
                    const userArticles = getUserArticles(u);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6">
                          <div
                            onClick={() => setViewingUser(u)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-sky-400 transition-all"
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-sky-600 transition-colors">
                                {u.name}
                              </p>
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
                                : u.role === 'Contributor'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
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
                        <td className="py-3.5 px-6">
                          {/* 100% Real dynamically calculated articles count */}
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{userArticles.length}</span>
                            <span className="text-slate-400 font-normal text-xs">
                              {userArticles.length === 1 ? 'story' : 'stories'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-0.5 rounded-full font-bold text-xs capitalize cursor-pointer transition-colors ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">
                          {u.lastLogin || 'Today at 08:30 AM'}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingUser(u)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer"
                              title="View User Profile & Stories"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit User"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Permissions Matrix Grid */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">Role Capability Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict editorial controls ensure AI generated news, ads, and system backups require proper clearance.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-6">Capability / Permission</th>
                  <th className="py-3 px-4 text-center">Admin</th>
                  <th className="py-3 px-4 text-center">Editor</th>
                  <th className="py-3 px-4 text-center">Author</th>
                  <th className="py-3 px-4 text-center">Contributor</th>
                  <th className="py-3 px-4 text-center">Subscriber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {permissions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-6 font-semibold text-slate-800">{p.capability}</td>
                    <td className="py-3 px-4 text-center">
                      {p.admin ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.editor ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.author ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.contrib ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.sub ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal (Viewing Real User Profile & Their Actual Articles) */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <img
                  src={viewingUser.avatar}
                  alt={viewingUser.name}
                  className="w-14 h-14 rounded-full object-cover ring-4 ring-sky-100"
                />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <span>{viewingUser.name}</span>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-800 font-bold uppercase tracking-wider">
                      {viewingUser.role}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{viewingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
              {viewingUser.bio && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Author Biography</p>
                  <p className="text-slate-700 leading-relaxed">{viewingUser.bio}</p>
                </div>
              )}

              {/* Security & Access Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">2FA Status</p>
                  <p className="font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    {viewingUser.twoFactorEnabled ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-700">Protected by 2FA</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Standard Password</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Account Status</p>
                  <p className="font-bold text-slate-900 mt-1 capitalize flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${viewingUser.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>{viewingUser.status} Account</span>
                  </p>
                </div>
              </div>

              {/* Real Authored Articles from Database */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Published Articles by {viewingUser.name}</span>
                  </h4>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {getUserArticles(viewingUser).length} total
                  </span>
                </div>

                {getUserArticles(viewingUser).length === 0 ? (
                  <p className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                    No articles published yet by this author.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getUserArticles(viewingUser).map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {p.category} • {p.views.toLocaleString()} views • {p.publishedAt}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md shrink-0">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Login Security Audit Log */}
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Recent Login History</span>
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {(viewingUser.loginHistory || [
                    { timestamp: '2026-11-11 08:30:12', ip: '192.168.1.104', device: 'Chrome / macOS' },
                    { timestamp: '2026-11-10 14:15:20', ip: '192.168.1.104', device: 'Chrome / macOS' },
                  ]).map((lh, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-slate-600">
                      <span>{lh.timestamp}</span>
                      <span>IP: {lh.ip}</span>
                      <span className="text-slate-400">{lh.device}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setViewingUser(null);
                  handleOpenEdit(viewingUser);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Edit User Profile
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingUser ? 'Edit User Profile' : 'Add New User'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure role permissions, 2FA credentials, and author profile details.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
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
                  placeholder="e.g. eleanor@alifnews24.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role & Permissions</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden font-bold"
                  >
                    <option value="Administrator">Administrator (Full Access)</option>
                    <option value="Editor">Editor (Publish & Review)</option>
                    <option value="Author">Author (Create Stories)</option>
                    <option value="Contributor">Contributor (Draft Submissions)</option>
                    <option value="Subscriber">Subscriber (Reader Member)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bio / Beat Description</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary of journalistic focus or role..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Enforce Two-Factor Authentication (2FA)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
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
