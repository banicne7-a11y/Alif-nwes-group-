import React, { useState } from 'react';
import {
  Mail,
  Send,
  Plus,
  Download,
  CheckCircle2,
  Users,
  Eye,
} from 'lucide-react';
import { db } from '../../services/db';
import { NewsletterSubscriber, NewsletterCampaign } from '../../types';

export const NewsletterView: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(db.getSubscribers());
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>(db.getCampaigns());
  const [activeTab, setActiveTab] = useState<'campaigns' | 'subscribers'>('campaigns');

  // New campaign state
  const [newSubEmail, setNewSubEmail] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignTemplate, setCampaignTemplate] = useState('Daily Morning Dispatch');
  const [sending, setSending] = useState(false);

  const refreshState = () => {
    setSubscribers([...db.getSubscribers()]);
    setCampaigns([...db.getCampaigns()]);
  };

  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail) return;
    db.addSubscriber(newSubEmail);
    setNewSubEmail('');
    refreshState();
    alert('Subscriber added successfully!');
  };

  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject) return;
    setSending(true);

    setTimeout(() => {
      db.saveCampaign({
        subject: campaignSubject,
        template: campaignTemplate,
        status: 'sent',
      });
      setSending(false);
      setCampaignSubject('');
      refreshState();
      alert('Email newsletter dispatch sent to 10,000 subscribers!');
    }, 1200);
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Email,SubscribedAt,Status', ...subscribers.map((s) => `${s.email},${s.subscribedAt},${s.status}`)].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `maan_news_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Newsletter & Dispatches</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            10,000 active subscribers • Morning briefings, breaking alerts, and email analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'campaigns' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'subscribers' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Subscribers ({subscribers.length + 9997})
          </button>
        </div>
      </div>

      {activeTab === 'campaigns' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dispatch Creator (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
              Dispatch New Campaign
            </h3>

            <form onSubmit={handleSendCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Subject Line *</label>
                <input
                  type="text"
                  required
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  placeholder="e.g. Morning Dispatch: US Inflation Slowdown Eases Market Pressure"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Layout</label>
                <select
                  value={campaignTemplate}
                  onChange={(e) => setCampaignTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Daily Morning Dispatch">Daily Morning Dispatch</option>
                  <option value="Breaking News Flash">Breaking News Flash (Urgent)</option>
                  <option value="Weekend In-Depth Feature">Weekend In-Depth Feature</option>
                  <option value="Tech & Markets Weekly">Tech & Markets Weekly</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-800">Recipients Audience:</span>
                <p className="text-slate-500 text-[11px]">
                  All 10,000 verified readers with active subscription tiers.
                </p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>{sending ? 'Sending Campaign...' : 'Send Campaign Now'}</span>
              </button>
            </form>
          </div>

          {/* Past Campaigns Table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Past Campaigns</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-6">Subject</th>
                    <th className="py-3 px-6">Template</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Open Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{camp.subject}</td>
                      <td className="py-3.5 px-6 text-slate-500">{camp.template}</td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            camp.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-sky-600">
                        {camp.openRate || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Subscribers Tab */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Reader Subscribers</h3>
              <p className="text-xs text-slate-500">
                10,000 total subscribers recorded in system.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          <form onSubmit={handleAddSubscriber} className="flex gap-3 max-w-md">
            <input
              type="email"
              required
              value={newSubEmail}
              onChange={(e) => setNewSubEmail(e.target.value)}
              placeholder="reader@example.com"
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Add Subscriber
            </button>
          </form>

          <div className="divide-y divide-slate-100 text-xs">
            {subscribers.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{sub.email}</p>
                  <span className="text-[10px] text-slate-400">Subscribed on {sub.subscribedAt}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
