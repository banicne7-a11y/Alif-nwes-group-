export type RouteInfo =
  | { type: 'home' }
  | { type: 'article'; slug: string }
  | { type: 'page'; slug: string }
  | { type: 'category'; slug: string }
  | { type: 'admin'; view: string; subParam?: any };

/**
 * Parses the current window.location.pathname into a structured RouteInfo.
 */
export function parseCurrentRoute(pathname = typeof window !== 'undefined' ? window.location.pathname : '/'): RouteInfo {
  // Normalize path
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // Admin routing: /admin or /admin/:view
  if (cleanPath.startsWith('/admin')) {
    const parts = cleanPath.split('/').filter(Boolean);
    const view = parts[1] || 'dashboard';
    return { type: 'admin', view };
  }

  // Article routing: /news/:slug or /article/:slug
  if (cleanPath.startsWith('/news/') || cleanPath.startsWith('/article/')) {
    const slug = cleanPath.replace(/^\/(news|article)\//, '').split('/')[0];
    if (slug) {
      return { type: 'article', slug: decodeURIComponent(slug) };
    }
  }

  // Custom Page routing: /page/:slug
  if (cleanPath.startsWith('/page/')) {
    const slug = cleanPath.replace(/^\/page\//, '').split('/')[0];
    if (slug) {
      return { type: 'page', slug: decodeURIComponent(slug) };
    }
  }

  // Category routing: /category/:slug
  if (cleanPath.startsWith('/category/')) {
    const slug = cleanPath.replace(/^\/category\//, '').split('/')[0];
    if (slug) {
      return { type: 'category', slug: decodeURIComponent(slug) };
    }
  }

  return { type: 'home' };
}

/**
 * Pushes a new URL to the browser address bar and emits a route changed event.
 */
export function navigateTo(path: string, state: any = null) {
  if (typeof window === 'undefined') return;

  const targetPath = path.startsWith('/') ? path : '/' + path;
  if (window.location.pathname !== targetPath) {
    window.history.pushState(state, '', targetPath);
  }
  window.dispatchEvent(new CustomEvent('app:route-changed', { detail: { path: targetPath, state } }));
}

/**
 * Replaces the current URL without adding a new history entry.
 */
export function replaceRoute(path: string, state: any = null) {
  if (typeof window === 'undefined') return;

  const targetPath = path.startsWith('/') ? path : '/' + path;
  window.history.replaceState(state, '', targetPath);
  window.dispatchEvent(new CustomEvent('app:route-changed', { detail: { path: targetPath, state } }));
}
