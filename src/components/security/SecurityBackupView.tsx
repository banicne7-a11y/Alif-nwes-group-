import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Download,
  RotateCcw,
  Trash2,
  Clock,
  Lock,
  Plus,
  AlertOctagon,
  CheckCircle2,
  Upload,
  FileJson,
} from 'lucide-react';
import { db } from '../../services/db';
import { toast } from '../../services/toast';
import { BackupRecord, ActivityLog } from '../../types';

export const SecurityBackupView: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>(db.getBackups());
  const [logs, setLogs] = useState<ActivityLog[]>(db.getState().logs);
  const [settings, setSettings] = useState(db.getSettings());
  const [dailyBackup, setDailyBackup] = useState(settings.backupDaily);
  const [backupTime, setBackupTime] = useState(settings.backupTime);
  const [ipBlacklist, setIpBlacklist] = useState<string[]>(settings.ipBlacklist);
  const [newIp, setNewIp] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshState = () => {
    setBackups([...db.getBackups()]);
    setLogs([...db.getState().logs]);
    setSettings({ ...db.getSettings() });
  };

  const handleCreateBackup = (type: 'manual' | 'automated' = 'manual') => {
    const record = db.createBackup(type);
    refreshState();
    toast.success(`Backup "${record.fileName}" created successfully (${record.size})!`);
  };

  const handleDownloadBackup = (record: BackupRecord) => {
    const dataStr = record.downloadData || JSON.stringify(db.getState(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.info(`Downloading "${record.fileName}"`);
  };

  const handleRestore = (record: BackupRecord) => {
    toast.confirm({
      title: 'Restore Database Snapshot',
      message: `Restoring from "${record.fileName}" will reload all database collections from this snapshot. Proceed?`,
      confirmLabel: 'Restore Snapshot',
      onConfirm: () => {
        const dataStr = record.downloadData || JSON.stringify(db.getState());
        const success = db.restoreBackup(dataStr);
        if (success) {
          refreshState();
          toast.success('Database restored successfully from snapshot!');
        } else {
          toast.error('Failed to restore backup snapshot.');
        }
      },
    });
  };

  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      toast.confirm({
        title: 'Restore from File',
        message: `Restore system database from uploaded file "${file.name}"?`,
        confirmLabel: 'Restore Database',
        onConfirm: () => {
          const ok = db.restoreBackup(content);
          if (ok) {
            refreshState();
            toast.success('Database restored successfully from uploaded file!');
          } else {
            toast.error('Invalid backup JSON format.');
          }
        },
      });
    };
    reader.readAsText(file);
  };

  const handleDeleteBackup = (id: string) => {
    toast.confirm({
      title: 'Delete Backup Snapshot',
      message: 'Delete this backup snapshot?',
      confirmLabel: 'Delete Backup',
      isDestructive: true,
      onConfirm: () => {
        db.deleteBackup(id);
        refreshState();
        toast.success('Backup snapshot deleted');
      },
    });
  };

  const handleSaveBackupSettings = () => {
    db.updateSettings({
      backupDaily: dailyBackup,
      backupTime,
      ipBlacklist,
    });
    refreshState();
    toast.success('Security and Automated Backup policies updated!');
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIp.trim() && !ipBlacklist.includes(newIp.trim())) {
      const updated = [...ipBlacklist, newIp.trim()];
      setIpBlacklist(updated);
      db.updateSettings({ ipBlacklist: updated });
      setNewIp('');
      refreshState();
    }
  };

  const handleRemoveIp = (ip: string) => {
    const updated = ipBlacklist.filter((i) => i !== ip);
    setIpBlacklist(updated);
    db.updateSettings({ ipBlacklist: updated });
    refreshState();
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Backup</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Automated Daily Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated daily snapshots, disaster recovery restore, audit trail, and firewall rules.
          </p>
        </div>

        {/* Create Manual Backup Button */}
        <button
          onClick={() => handleCreateBackup('manual')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-md self-start sm:self-auto"
        >
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Create Snapshot Now</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Row: Automated Backup Policy & Upload Restore */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Automated Daily Backup Config (8 cols) */}
        <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <h2 className="font-extrabold text-base text-slate-900">
                  Automated Daily Disaster Recovery
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Last: {settings.lastBackupAt || 'Today at 02:00 AM'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Daily automated backups securely archive articles, media records, user accounts, ad placements, comments, and settings into encrypted JSON snapshots stored in local storage and available for cold offsite download.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={dailyBackup}
                    onChange={(e) => setDailyBackup(e.target.checked)}
                    className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Enable Automated Daily Backup</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Triggers scheduled automated snapshot once every 24 hours.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">Backup Schedule Time</label>
                <select
                  value={backupTime}
                  onChange={(e) => setBackupTime(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="02:00 UTC">02:00 UTC (Off-peak)</option>
                  <option value="04:00 UTC">04:00 UTC (Early Morning)</option>
                  <option value="12:00 UTC">12:00 UTC (Midday)</option>
                  <option value="23:00 UTC">23:00 UTC (Midnight)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={handleSaveBackupSettings}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
            >
              Save Backup Policy
            </button>
          </div>
        </div>

        {/* Upload File to Restore (4 cols) */}
        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-3">
              <Upload className="w-5 h-5 text-purple-600" />
              <h2 className="font-extrabold text-sm text-slate-900">Restore from File</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload a previously exported <code className="font-mono text-purple-600">.json</code> snapshot to restore all tables.
            </p>

            <div className="relative border-2 border-dashed border-purple-200 bg-purple-50/30 p-5 rounded-xl text-center hover:border-purple-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUploadRestore}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileJson className="w-8 h-8 text-purple-500 mx-auto mb-1" />
              <span className="text-xs font-bold text-purple-900">Select Backup .JSON</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Click or drop snapshot file</p>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 text-center mt-3">
            Warning: Overwrites current in-memory database with snapshot data.
          </span>
        </div>
      </div>

      {/* Backup Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900">
            Available Backup Snapshots
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {backups.length} Snapshots Archived
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-6">Snapshot File</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Created Timestamp</th>
                <th className="py-3 px-6">Data Size</th>
                <th className="py-3 px-6">Records</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {backups.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{bk.fileName}</span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        bk.type === 'automated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {bk.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-500">{bk.createdAt}</td>
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-700 font-bold">{bk.size}</td>
                  <td className="py-3.5 px-6 text-xs text-slate-600">{bk.itemsCount} entries</td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownloadBackup(bk)}
                        className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs"
                        title="Download JSON Snapshot"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                      <button
                        onClick={() => handleRestore(bk)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs"
                        title="Restore Database to this Point"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-500" />
                        <span className="hidden sm:inline">Restore</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(bk.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Backup"
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

      {/* IP Firewall & Activity Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* IP Blocking (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h3 className="font-extrabold text-sm text-slate-900">Firewall & IP Blocking</h3>
          </div>

          <form onSubmit={handleAddIp} className="flex gap-2">
            <input
              type="text"
              required
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="Enter IP (e.g. 192.0.2.1)..."
              className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Block IP
            </button>
          </form>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500">Currently Blacklisted IPs:</p>
            {ipBlacklist.map((ip) => (
              <div
                key={ip}
                className="flex items-center justify-between p-2 bg-red-50/50 border border-red-100 rounded-lg text-xs font-mono text-red-800"
              >
                <span>{ip}</span>
                <button
                  onClick={() => handleRemoveIp(ip)}
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Security Audit Logs (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Security Audit Trail</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Session</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-xs font-bold text-[9px] uppercase ${
                        log.level === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.level === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : log.level === 'security'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {log.level}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                  <span className="text-[10px] text-slate-400">By {log.userName} • IP {log.ip}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
