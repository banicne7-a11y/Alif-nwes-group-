import React, { useState } from 'react';
import {
  Menu,
  ExternalLink,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { db } from '../../services/db';

interface HeaderProps {
  onToggleSidebar: () => void;
  onViewWebsite: () => void;
  onNavigate: (view: string) => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onViewWebsite,
  onNavigate,
  currentLanguage,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentUser = db.getState().currentUser;
  const recentLogs = db.getState().logs.slice(0, 5);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇧🇩' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Brand / Sidebar Toggle / View Website */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* View Website Button (matching screenshot) */}
        <button
          onClick={onViewWebsite}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all shadow-2xs"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View Website</span>
        </button>
      </div>

      {/* Right controls: Language, Dark mode, Notifications, Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <span>
              {languages.find((l) => l.name === currentLanguage || l.code === currentLanguage)?.flag || '🇺🇸'}
            </span>
            <span className="hidden sm:inline">
              {languages.find((l) => l.name === currentLanguage || l.code === currentLanguage)?.name || 'English'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Language
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.name);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                    currentLanguage === lang.name ? 'text-sky-600 font-semibold bg-sky-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Mode Switcher */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowLangMenu(false);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800">Notifications & Alerts</span>
                <span className="text-[11px] px-2 py-0.5 bg-red-100 text-red-700 font-semibold rounded-full">
                  3 New
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                <div className="p-3 hover:bg-slate-50 transition-colors flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Editorial Approval Required</p>
                    <p className="text-slate-500 text-[11px]">AI drafted "AI In Healthcare: Automated Clinical Diagnostics" needs editor review.</p>
                    <span className="text-[10px] text-slate-400">10 mins ago</span>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Automated Daily Backup</p>
                    <p className="text-slate-500 text-[11px]">Snapshot encrypted and archived (1.42 MB).</p>
                    <span className="text-[10px] text-slate-400">Today, 02:00 AM</span>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors flex gap-2.5">
                  <FileText className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Viral Traffic Spike</p>
                    <p className="text-slate-500 text-[11px]">"US Inflation Decelerating" reached 7.4k readers.</p>
                    <span className="text-[10px] text-slate-400">1 hour ago</span>
                  </div>
                </div>
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    onNavigate('security');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
                >
                  View All Activity Logs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / User Info */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowLangMenu(false);
            }}
            className="flex items-center gap-2 pl-2 focus:outline-hidden"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/30"
            />
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{currentUser.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-semibold text-xs text-slate-800">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-sky-100 text-sky-700 font-semibold text-[10px] rounded-full">
                  {currentUser.role}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigate('users');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile & Authors</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('security');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Security & 2FA</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Site Configuration</span>
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    alert('Signed out successfully. Returning to Administrator session.');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
