import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Mail,
  Sliders,
  Shield,
  Send,
  CheckCircle,
} from 'lucide-react';
import { db } from '../../services/db';

export const SettingsView: React.FC = () => {
  const currentSettings = db.getSettings();

  const [siteName, setSiteName] = useState(currentSettings.siteName);
  const [tagline, setTagline] = useState(currentSettings.tagline);
  const [siteUrl, setSiteUrl] = useState(currentSettings.siteUrl);
  const [timezone, setTimezone] = useState(currentSettings.timezone);
  const [permalinkStructure, setPermalinkStructure] = useState(currentSettings.permalinkStructure);

  // SMTP
  const [smtpHost, setSmtpHost] = useState(currentSettings.smtpHost);
  const [smtpPort, setSmtpPort] = useState(currentSettings.smtpPort);
  const [smtpUser, setSmtpUser] = useState(currentSettings.smtpUser);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  // AdSense & GA
  const [adsenseId, setAdsenseId] = useState(currentSettings.adsenseClientId);
  const [autoAds, setAutoAds] = useState(currentSettings.autoAds);
  const [gaId, setGaId] = useState(currentSettings.googleAnalyticsId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings({
      siteName,
      tagline,
      siteUrl,
      timezone,
      permalinkStructure,
      smtpHost,
      smtpPort,
      smtpUser,
      adsenseClientId: adsenseId,
      autoAds,
      googleAnalyticsId: gaId,
    });
    alert('System settings updated successfully!');
  };

  const handleSendTestEmail = () => {
    setTestEmailResult('Sending test email via SMTP...');
    setTimeout(() => {
      setTestEmailResult('Test email successfully sent to newsroom administrator!');
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Website Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          General site parameters, SMTP email dispatching, permalink structures, and Google services.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* General Settings Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Globe className="w-5 h-5 text-sky-600" />
            <h2 className="font-extrabold text-sm text-slate-900">General Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website Name *</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Production URL *</label>
              <input
                type="url"
                required
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Permalinks */}
          <div className="pt-2 text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Permalink URL Structure</label>
            <select
              value={permalinkStructure}
              onChange={(e) => setPermalinkStructure(e.target.value)}
              className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg"
            >
              <option value="/%year%/%month%/%postname%/">/%year%/%month%/%postname%/ (Default SEO)</option>
              <option value="/news/%postname%/">/news/%postname%/</option>
              <option value="/%postname%/">/%postname%/ (Short)</option>
              <option value="/?p=%post_id%">/?p=%post_id% (Plain)</option>
            </select>
          </div>
        </div>

        {/* SMTP Mail Delivery */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-sm text-slate-900">SMTP Newsroom Mail Server</h2>
            </div>
            <button
              type="button"
              onClick={handleSendTestEmail}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Send Test Email
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Port</label>
              <input
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sender Email</label>
              <input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {testEmailResult && (
            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
              {testEmailResult}
            </p>
          )}
        </div>

        {/* Google Integrations & Monetization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-purple-600" />
            <h2 className="font-extrabold text-sm text-slate-900">Google Integrations & AdSense</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google AdSense Publisher ID
              </label>
              <input
                type="text"
                value={adsenseId}
                onChange={(e) => setAdsenseId(e.target.value)}
                placeholder="ca-pub-..."
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google Analytics 4 ID
              </label>
              <input
                type="text"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                placeholder="G-..."
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={autoAds}
                onChange={(e) => setAutoAds(e.target.checked)}
                className="rounded-sm border-slate-300 text-purple-600"
              />
              <span>Enable AdSense Auto-Ads on Public Frontpage</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all text-xs"
          >
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
};
