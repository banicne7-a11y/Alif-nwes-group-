import { db } from './db';

/**
 * Normalizes user input for Google Search Console verification.
 * Supports:
 * 1. Full meta tag: <meta name="google-site-verification" content="TOKEN" />
 * 2. Prefix format: google-site-verification=TOKEN
 * 3. Raw token: TOKEN
 */
export function cleanGoogleVerificationCode(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // If user pasted a full <meta ...> tag
  const contentMatch = str.match(/content=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1]) {
    str = contentMatch[1];
  }

  // If user pasted with google-site-verification= prefix
  if (str.toLowerCase().startsWith('google-site-verification=')) {
    str = str.replace(/^google-site-verification=/i, '');
  }

  // Remove surrounding quotes, slashes, or angle brackets
  str = str.replace(/[/"'>]/g, '').trim();
  return str;
}

export function applyDynamicFavicon(customUrl?: string): string {
  const settings = db.getSettings();
  const href = (customUrl !== undefined ? customUrl : settings.faviconUrl || '').trim() || '/favicon.svg';

  if (typeof document !== 'undefined') {
    let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = href;
    if (href.endsWith('.svg')) {
      iconLink.type = 'image/svg+xml';
    } else {
      iconLink.removeAttribute('type');
    }

    let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = href;
  }

  return href;
}

/**
 * Dynamically injects or updates the Google Search Console verification tag in document <head>.
 */
export function applyGoogleVerificationTag(code?: string): string {
  const settings = db.getSettings();
  const rawCode = code !== undefined ? code : settings.searchConsoleCode;
  const cleanCode = cleanGoogleVerificationCode(rawCode);

  if (typeof document !== 'undefined') {
    let metaTag = document.querySelector<HTMLMetaElement>('meta[name="google-site-verification"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'google-site-verification';
      document.head.appendChild(metaTag);
    }
    metaTag.content = cleanCode;
    applyDynamicFavicon();
  }

  return cleanCode;
}

/**
 * Dynamically updates page metadata (title, description, canonical URL, OpenGraph)
 */
export function updatePageSeo(options: {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
}) {
  if (typeof document === 'undefined') return;

  const siteName = 'Alif News 24';
  const fullTitle = options.title ? `${options.title} | ${siteName}` : `${siteName} - America's 24/7 Live News Portal`;
  document.title = fullTitle;

  // Description
  const desc = options.description || "Alif News 24 - Real-time American breaking news, politics, Wall Street markets, technology, national investigations, and global dispatches.";
  setMeta('description', desc);

  // Canonical URL
  const currentUrl = options.canonicalUrl || (window.location.origin + window.location.pathname);
  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = currentUrl;

  // OpenGraph
  setMetaProperty('og:title', options.title || fullTitle);
  setMetaProperty('og:description', desc);
  setMetaProperty('og:url', currentUrl);
  setMetaProperty('og:site_name', siteName);
  setMetaProperty('og:type', options.ogType || 'website');
  if (options.ogImage) {
    setMetaProperty('og:image', options.ogImage);
  }

  // Twitter
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', options.title || fullTitle);
  setMeta('twitter:description', desc);
  if (options.ogImage) {
    setMeta('twitter:image', options.ogImage);
  }

  // Always ensure Google Site Verification and Favicon are synced
  applyGoogleVerificationTag();
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}
