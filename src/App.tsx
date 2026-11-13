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
import { ToastContainer } from './components/common/ToastContainer';
import { db } from './services/db';
import { Post } from './types';
import { parseCurrentRoute, navigateTo, RouteInfo } from './services/router';
import { updatePageSeo, applyGoogleVerificationTag } from './services/seo';
import { authService } from './services/auth';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { toast } from './services/toast';

export default function App() {
  const initialRoute = parseCurrentRoute();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => authService.isAuthenticated());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [currentView, setCurrentView] = useState(() => {
    if (initialRoute.type === 'admin') return initialRoute.view || 'dashboard';
    return 'dashboard';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ALWAYS default to public website for all incoming visitors, UNLESS the URL is explicitly /admin AND they are already logged in
  const [isWebsiteMode, setIsWebsiteMode] = useState(() => {
    if (initialRoute.type === 'admin') {
      return !authService.isAuthenticated();
    }
    return true;
  });

  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);

  // Cross-view state (editing a post or previewing)
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Post | null>(() => {
    if (initialRoute.type === 'article') {
      const found = db.getPosts().find((p) => p.slug === initialRoute.slug || p.id === initialRoute.slug);
      return found || null;
    }
    return null;
  });

  const [previewPage, setPreviewPage] = useState<any>(() => {
    if (initialRoute.type === 'page') {
      const found = db.getPages().find((p) => p.slug === initialRoute.slug || p.id === initialRoute.slug);
      return found || null;
    }
    return null;
  });

  const [postsFilterParam, setPostsFilterParam] = useState<any>('all');
  const [, setDbRevision] = useState(0);

  // Synchronize browser address bar, real-time Firestore state, and SEO meta tags
  React.useEffect(() => {
    applyGoogleVerificationTag();

    const handleSync = () => {
      const route = parseCurrentRoute();
      if (route.type === 'admin') {
        if (!authService.isAuthenticated()) {
          setIsWebsiteMode(true);
          setIsLoginModalOpen(true);
          updatePageSeo({ title: 'Editorial Desk | Alif News 24' });
        } else {
          setIsWebsiteMode(false);
          setCurrentView(route.view || 'dashboard');
          setPreviewArticle(null);
          setPreviewPage(null);
          updatePageSeo({ title: `Editorial Workspace - ${route.view || 'Dashboard'}` });
        }
      } else if (route.type === 'article') {
        const found = db.getPosts().find((p) => p.slug === route.slug || p.id === route.slug);
        if (found) {
          setIsWebsiteMode(true);
          setPreviewArticle(found);
          setPreviewPage(null);
          updatePageSeo({
            title: found.title,
            description: found.excerpt,
            ogImage: found.featuredImage,
            ogType: 'article',
          });
        }
      } else if (route.type === 'page') {
        const found = db.getPages().find((p) => p.slug === route.slug || p.id === route.slug);
        if (found) {
          setIsWebsiteMode(true);
          setPreviewPage(found);
          setPreviewArticle(null);
          updatePageSeo({
            title: found.seoTitle || found.title,
            description: found.seoDescription || found.title,
          });
        }
      } else if (route.type === 'category') {
        setIsWebsiteMode(true);
        setPreviewArticle(null);
        setPreviewPage(null);
        updatePageSeo({ title: `${route.slug.toUpperCase()} News` });
      } else {
        setIsWebsiteMode(true);
        setPreviewArticle(null);
        setPreviewPage(null);
        updatePageSeo({ title: "America's 24/7 Live News Portal" });
      }
    };

    handleSync();

    const unsubscribeDb = db.subscribe(() => {
      setDbRevision((r) => r + 1);
      applyGoogleVerificationTag();
      const route = parseCurrentRoute();
      if (route.type === 'article' || route.type === 'page') {
        handleSync();
      }
    });

    window.addEventListener('popstate', handleSync);
    window.addEventListener('app:route-changed', handleSync);

    const handleAuthEvent = (e: any) => {
      const isAuthed = !!e.detail?.isAuthenticated;
      setIsAdminAuthenticated(isAuthed);
    };
    window.addEventListener('app:auth-changed', handleAuthEvent);

    return () => {
      unsubscribeDb();
      window.removeEventListener('popstate', handleSync);
      window.removeEventListener('app:route-changed', handleSync);
      window.removeEventListener('app:auth-changed', handleAuthEvent);
    };
  }, []);

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
    navigateTo('/admin/' + view);
    updatePageSeo({ title: `Admin Panel - ${view}` });
  };

  const handleOpenEditor = (post: Post) => {
    setEditingPost(post);
    setCurrentView('editor');
    setIsWebsiteMode(false);
    navigateTo('/admin/editor');
  };

  const handleOpenPreview = (post: Post) => {
    db.incrementPostViews(post.id);
    setPreviewArticle(post);
    setPreviewPage(null);
    setIsWebsiteMode(true);
    navigateTo('/news/' + post.slug);
    updatePageSeo({
      title: post.title,
      description: post.excerpt,
      ogImage: post.featuredImage,
      ogType: 'article',
    });
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsLoginModalOpen(false);
    setIsWebsiteMode(false);
    setCurrentView('dashboard');
    navigateTo('/admin/dashboard');
    updatePageSeo({ title: 'Admin Panel - Dashboard' });
  };

  const handleLogoutAdmin = async () => {
    await authService.logout();
    setIsAdminAuthenticated(false);
    setIsWebsiteMode(true);
    navigateTo('/');
    updatePageSeo({ title: "America's 24/7 Live News Portal" });
    toast.success('Logged out successfully. Returned to public news portal.');
  };

  const handleBackToAdmin = () => {
    if (authService.isAuthenticated()) {
      setIsWebsiteMode(false);
      setPreviewArticle(null);
      setPreviewPage(null);
      navigateTo('/admin/dashboard');
      updatePageSeo({ title: 'Admin Panel - Dashboard' });
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // If user is in public website mode (DEFAULT for all visitors)
  if (isWebsiteMode) {
    return (
      <>
        <ToastContainer />
        <PublicWebsiteView
          onBackToAdmin={handleBackToAdmin}
          onOpenAdminLogin={() => setIsLoginModalOpen(true)}
          isAdminAuthenticated={isAdminAuthenticated}
          onLogoutAdmin={handleLogoutAdmin}
          initialPost={previewArticle}
          initialPage={previewPage}
        />
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex ${darkMode ? 'dark bg-slate-900 text-slate-100' : ''}`}>
      <ToastContainer />
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
            setPreviewPage(null);
            setIsWebsiteMode(true);
            navigateTo('/');
            updatePageSeo({ title: "America's 24/7 Live News Portal" });
          }}
          onNavigate={handleNavigate}
          onLogout={handleLogoutAdmin}
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
                navigateTo('/page/' + page.slug);
                updatePageSeo({
                  title: page.seoTitle || page.title,
                  description: page.seoDescription || page.title,
                });
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
