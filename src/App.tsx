/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PostsView } from './components/posts/PostsView';
import { AdvancedEditorView } from './components/editor/AdvancedEditorView';
import { AiNewsAssistantView } from './components/ai/AiNewsAssistantView';
import { BreakingTrendingView } from './components/breaking/BreakingTrendingView';
import { AdPlacementsView } from './components/ads/AdPlacementsView';
import { MediaLibraryView } from './components/media/MediaLibraryView';
import { CategoriesView } from './components/categories/CategoriesView';
import { PagesView } from './components/pages/PagesView';
import { UsersView } from './components/users/UsersView';
import { CommentsView } from './components/comments/CommentsView';
import { SeoManagerView } from './components/seo/SeoManagerView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { NewsletterView } from './components/newsletter/NewsletterView';
import { AdvancedToolsView } from './components/advanced/AdvancedToolsView';
import { AppearanceView } from './components/appearance/AppearanceView';
import { SecurityBackupView } from './components/security/SecurityBackupView';
import { SettingsView } from './components/settings/SettingsView';
import { PublicWebsiteView } from './components/website/PublicWebsiteView';
import { Post } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWebsiteMode, setIsWebsiteMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);

  // Cross-view state (editing a post or previewing)
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Post | null>(null);
  const [previewPage, setPreviewPage] = useState<any>(null);
  const [postsFilterParam, setPostsFilterParam] = useState<any>('all');

  const handleNavigate = (view: string, subParam?: any) => {
    if (view === 'editor') {
      if (subParam?.isNew) {
        setEditingPost(null);
      } else if (subParam) {
        setEditingPost(subParam);
      }
    } else if (view === 'posts' && subParam?.filter) {
      setPostsFilterParam(subParam.filter);
    } else {
      setPostsFilterParam('all');
    }
    setCurrentView(view);
    setIsWebsiteMode(false);
  };

  const handleOpenEditor = (post: Post) => {
    setEditingPost(post);
    setCurrentView('editor');
    setIsWebsiteMode(false);
  };

  const handleOpenPreview = (post: Post) => {
    setPreviewArticle(post);
    setPreviewPage(null);
    setIsWebsiteMode(true);
  };

  // If user clicked "View Website"
  if (isWebsiteMode) {
    return (
      <PublicWebsiteView
        onBackToAdmin={() => {
          setIsWebsiteMode(false);
          setPreviewArticle(null);
          setPreviewPage(null);
        }}
        initialPost={previewArticle}
        initialPage={previewPage}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex ${darkMode ? 'dark bg-slate-900 text-slate-100' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onViewWebsite={() => {
            setPreviewArticle(null);
            setIsWebsiteMode(true);
          }}
          onNavigate={handleNavigate}
          currentLanguage={currentLanguage}
          onLanguageChange={(lang) => setCurrentLanguage(lang)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenArticle={handleOpenPreview}
            />
          )}

          {currentView === 'posts' && (
            <PostsView
              onNavigate={handleNavigate}
              onEditPost={handleOpenEditor}
              onOpenPreview={handleOpenPreview}
              initialFilter={postsFilterParam}
            />
          )}

          {currentView === 'editor' && (
            <AdvancedEditorView
              postToEdit={editingPost}
              onBack={() => setCurrentView('posts')}
              onSaved={(savedPost) => {
                setEditingPost(savedPost);
                setCurrentView('posts');
              }}
            />
          )}

          {currentView === 'ai-assistant' && (
            <AiNewsAssistantView onNavigateToEditor={handleOpenEditor} />
          )}

          {currentView === 'breaking-news' && <BreakingTrendingView />}

          {currentView === 'ads' && <AdPlacementsView />}

          {currentView === 'media' && <MediaLibraryView />}

          {currentView === 'categories' && <CategoriesView />}

          {currentView === 'tags' && <CategoriesView />}

          {currentView === 'pages' && (
            <PagesView
              onOpenPublicPage={(page) => {
                setPreviewPage(page);
                setPreviewArticle(null);
                setIsWebsiteMode(true);
              }}
            />
          )}

          {currentView === 'users' && <UsersView />}

          {currentView === 'comments' && <CommentsView />}

          {currentView === 'seo' && <SeoManagerView />}

          {currentView === 'analytics' && <AnalyticsView />}

          {currentView === 'newsletter' && <NewsletterView />}

          {currentView === 'rss' && (
            <AdvancedToolsView onNavigateToEditor={handleOpenEditor} defaultTab="rss" />
          )}

          {currentView === 'calendar' && (
            <AdvancedToolsView onNavigateToEditor={handleOpenEditor} defaultTab="calendar" />
          )}

          {currentView === 'appearance' && <AppearanceView />}

          {currentView === 'security' && <SecurityBackupView />}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
