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
    applyGoogleAnalyticsTag();
  }

  return cleanCode;
}

const PLACEHOLDER_GA_ID = 'G-AN24820921';

export function cleanGoogleAnalyticsId(input: string): string {
  if (!input) return '';
  const match = input.trim().match(/\b(G-[A-Z0-9]{6,})\b/i);
  return match ? match[1].toUpperCase() : '';
}

export function applyGoogleAnalyticsTag(gaId?: string): string {
  const settings = db.getSettings();
  const cleanId = cleanGoogleAnalyticsId(gaId !== undefined ? gaId : settings.googleAnalyticsId || '');
  const isRealGa = Boolean(cleanId && cleanId !== PLACEHOLDER_GA_ID);

  if (typeof document !== 'undefined' && isRealGa) {
    const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (isAdminRoute) {
      return cleanId;
    }
    let script = document.querySelector<HTMLScriptElement>('script[data-alif-ga="true"]');
    const desiredSrc = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanId)}`;
    if (!script) {
      script = document.createElement('script');
      script.async = true;
      script.src = desiredSrc;
      script.setAttribute('data-alif-ga', 'true');
      document.head.appendChild(script);

      const inline = document.createElement('script');
      inline.setAttribute('data-alif-ga-init', 'true');
      inline.text = `window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} window.gtag = window.gtag || gtag; gtag('js', new Date()); if (!window.location.pathname.startsWith('/admin')) { gtag('config', '${cleanId}'); }`;
      document.head.appendChild(inline);
    } else if (script.src !== desiredSrc) {
      script.src = desiredSrc;
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('config', cleanId);
      }
    }
  }
  return isRealGa ? cleanId : '';
}

const PLACEHOLDER_ADSENSE_ID = 'ca-pub-9386736849071234';

/**
 * Extracts a normalized AdSense Publisher ID (ca-pub-XXXXXXXXXXXXXXXX) from:
 * - Raw ID: ca-pub-1234567890123456 or pub-1234567890123456
 * - Script snippet: <script async src="...client=ca-pub-1234567890123456"...></script>
 * - Meta tag: <meta name="google-adsense-account" content="ca-pub-1234567890123456">
 * - ads.txt line: google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
 */
export function cleanAdSensePublisherId(input: string): string {
  if (!input) return '';
  const match = input.trim().match(/(?:ca-)?(pub-\d{10,})/i);
  if (!match) return '';
  return `ca-${match[1].toLowerCase()}`;
}

export function isValidAdSensePublisherId(input?: string): boolean {
  const clean = cleanAdSensePublisherId(input || '');
  return /^ca-pub-\d{10,}$/.test(clean) && clean !== PLACEHOLDER_ADSENSE_ID;
}

/**
 * Injects or updates Google AdSense domain verification <meta name="google-adsense-account">
 * and the official AdSense verification <script> in document <head>.
 */
export function applyAdSenseVerificationTags(code?: string): string {
  const settings = db.getSettings();
  const raw = code !== undefined ? code : settings.adsenseClientId;
  const cleanId = cleanAdSensePublisherId(raw);

  if (typeof document !== 'undefined' && cleanId && cleanId !== PLACEHOLDER_ADSENSE_ID) {
    let metaTag = document.querySelector<HTMLMetaElement>('meta[name="google-adsense-account"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'google-adsense-account';
      document.head.appendChild(metaTag);
    }
    metaTag.content = cleanId;

    const desiredSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cleanId)}`;
    let script = document.querySelector<HTMLScriptElement>('script[data-alif-adsense="true"]');
    if (!script) {
      script = document.createElement('script');
      script.async = true;
      script.src = desiredSrc;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-alif-adsense', 'true');
      document.head.appendChild(script);
    } else if (script.src !== desiredSrc) {
      script.src = desiredSrc;
    }
  }

  return cleanId;
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

  // Always ensure Google Site Verification, AdSense Verification, GA4, and Favicon are synced
  applyGoogleVerificationTag();
  applyAdSenseVerificationTags();

  const activeGaId = applyGoogleAnalyticsTag();
  if (
    activeGaId &&
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/admin') &&
    typeof (window as any).gtag === 'function'
  ) {
    (window as any).gtag('event', 'page_view', {
      page_title: fullTitle,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  }
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
