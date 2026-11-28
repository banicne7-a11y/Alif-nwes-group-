import { db } from './db';
import { Post, SeoRedirectRule } from '../types';
import { getPostPublicPath } from '../utils/countryEditions';
import { buildArticleGraphSchema, smartExcerpt } from '../utils/rankSeo';

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

  const contentMatch = str.match(/content=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1]) {
    str = contentMatch[1];
  }

  if (str.toLowerCase().startsWith('google-site-verification=')) {
    str = str.replace(/^google-site-verification=/i, '');
  }

  str = str.replace(/[/"'>]/g, '').trim();
  return str;
}

export function cleanGenericVerificationCode(input: string): string {
  if (!input) return '';
  let str = input.trim();
  const contentMatch = str.match(/content=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1]) {
    str = contentMatch[1];
  }
  return str.replace(/[/"'>]/g, '').trim();
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
 * Dynamically injects Google, Bing, Yandex webmaster verification tags in document <head>.
 */
export function applyGoogleVerificationTag(code?: string): string {
  const settings = db.getSettings();
  const rawCode = code !== undefined ? code : settings.searchConsoleCode;
  const cleanCode = cleanGoogleVerificationCode(rawCode);

  if (typeof document !== 'undefined') {
    if (cleanCode) {
      setMeta('google-site-verification', cleanCode);
    }
    const bingCode = cleanGenericVerificationCode(settings.rankSeo?.bingVerificationCode || '');
    if (bingCode) {
      setMeta('msvalidate.01', bingCode);
    }
    const yandexCode = cleanGenericVerificationCode(settings.rankSeo?.yandexVerificationCode || '');
    if (yandexCode) {
      setMeta('yandex-verification', yandexCode);
    }
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

function setJsonLdScript(jsonLd?: Record<string, any> | null) {
  if (typeof document === 'undefined') return;
  let script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
  if (!jsonLd) return;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd);
}

/**
 * Dynamically updates page metadata (title, description, robots, canonical URL, OpenGraph, Twitter, JSON-LD)
 */
export function updatePageSeo(options: {
  title?: string;
  noSiteSuffix?: boolean;
  description?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary_large_image' | 'summary';
  twitterTitle?: string;
  twitterDescription?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  jsonLd?: Record<string, any> | null;
}) {
  if (typeof document === 'undefined') return;

  const settings = db.getSettings();
  const rankSeo = settings.rankSeo;
  const siteName = settings.siteName || 'Alif News 24';
  const sep = rankSeo?.titleSeparator || '|';

  const fullTitle = options.title
    ? options.noSiteSuffix || options.title.toLowerCase().includes(siteName.toLowerCase())
      ? options.title
      : `${options.title} ${sep} ${siteName}`
    : rankSeo?.homeSeoTitle || `${siteName} - America's 24/7 Live News Portal`;
  document.title = fullTitle;

  const desc =
    options.description ||
    rankSeo?.homeSeoDescription ||
    "Alif News 24 - Real-time American breaking news, politics, Wall Street markets, technology, national investigations, and global dispatches.";
  setMeta('description', desc);

  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const hasSearchParam =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).has('search') ||
      new URLSearchParams(window.location.search).has('s'));
  const robotsValue = isAdmin
    ? 'noindex, nofollow'
    : options.metaRobots?.trim() ||
      (hasSearchParam && rankSeo?.noindexSearchResults !== false
        ? 'noindex, follow'
        : rankSeo?.defaultRobots || 'index, follow, max-image-preview:large');
  setMeta('robots', robotsValue);

  const currentUrl =
    options.canonicalUrl ||
    (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://www.official1.online/');
  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = currentUrl;

  const resolvedOgImage = options.ogImage || rankSeo?.defaultOgImage;
  const resolvedOgTitle = options.ogTitle || options.title || rankSeo?.defaultOgTitle || fullTitle;
  const resolvedOgDesc = options.ogDescription || desc;

  setMetaProperty('og:title', resolvedOgTitle);
  setMetaProperty('og:description', resolvedOgDesc);
  setMetaProperty('og:url', currentUrl);
  setMetaProperty('og:site_name', siteName);
  setMetaProperty('og:type', options.ogType || 'website');
  if (resolvedOgImage) {
    setMetaProperty('og:image', resolvedOgImage);
    setMetaProperty('og:image:alt', options.ogImageAlt || resolvedOgTitle);
  }
  if (options.ogType === 'article') {
    if (options.publishedTime) setMetaProperty('article:published_time', options.publishedTime);
    if (options.modifiedTime) setMetaProperty('article:modified_time', options.modifiedTime);
    if (options.section) setMetaProperty('article:section', options.section);
  }

  setMeta('twitter:card', options.twitterCard || 'summary_large_image');
  setMeta('twitter:title', options.twitterTitle || resolvedOgTitle);
  setMeta('twitter:description', options.twitterDescription || resolvedOgDesc);
  if (rankSeo?.twitterHandle) {
    setMeta('twitter:site', rankSeo.twitterHandle);
  }
  if (resolvedOgImage) {
    setMeta('twitter:image', resolvedOgImage);
  }

  if (options.jsonLd) {
    setJsonLdScript(options.jsonLd);
  }

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

export function applyPostSeoToHead(post: Post) {
  if (typeof window === 'undefined') return;
  const settings = db.getSettings();
  const rankSeo = settings.rankSeo;
  const origin = window.location.origin;
  const canonicalUrl = post.seo?.canonicalUrl?.trim() || `${origin}${getPostPublicPath(post)}`;
  const title = post.seo?.title?.trim() || post.title;
  const description =
    post.seo?.description?.trim() ||
    smartExcerpt(post.excerpt || post.subtitle || post.content || post.title, 160);
  const ogImage = post.seo?.ogImage?.trim() || post.featuredImage || rankSeo?.defaultOgImage;

  const jsonLd = buildArticleGraphSchema({
    post,
    canonicalUrl,
    baseUrl: origin,
    siteName: rankSeo?.publisherName || settings.siteName || 'Alif News 24',
    publisherLogo: rankSeo?.publisherLogo || settings.logoUrl,
    enableBreadcrumbs: rankSeo?.enableBreadcrumbs !== false,
    enableOrganizationSchema: rankSeo?.enableOrganizationSchema !== false,
  });

  updatePageSeo({
    title,
    description,
    canonicalUrl,
    metaRobots: post.seo?.metaRobots || rankSeo?.defaultRobots || 'index, follow',
    ogTitle: post.seo?.ogTitle?.trim() || title,
    ogDescription: post.seo?.ogDescription?.trim() || description,
    ogImage,
    ogImageAlt: post.seo?.featuredImageAlt?.trim() || post.title,
    ogType: 'article',
    twitterCard: post.seo?.twitterCardType || 'summary_large_image',
    twitterTitle: post.seo?.twitterTitle?.trim() || post.seo?.ogTitle?.trim() || title,
    twitterDescription: post.seo?.twitterDescription?.trim() || post.seo?.ogDescription?.trim() || description,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt || post.publishedAt,
    author: post.author?.name,
    section: post.category,
    jsonLd,
  });
}

export function applyHomeSeoToHead(titleOverride?: string, descriptionOverride?: string) {
  const settings = db.getSettings();
  const rankSeo = settings.rankSeo;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.official1.online';
  const siteName = settings.siteName || 'Alif News 24';

  updatePageSeo({
    title: titleOverride || rankSeo?.homeSeoTitle || `${siteName} - America's 24/7 Live News Portal`,
    noSiteSuffix: !titleOverride && Boolean(rankSeo?.homeSeoTitle),
    description: descriptionOverride || rankSeo?.homeSeoDescription,
    ogTitle: !titleOverride ? rankSeo?.defaultOgTitle : undefined,
    ogDescription: !titleOverride ? rankSeo?.defaultOgDescription : descriptionOverride,
    ogImage: rankSeo?.defaultOgImage,
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: rankSeo?.publisherName || siteName,
      url: origin,
      logo: rankSeo?.publisherLogo || `${origin}/favicon.svg`,
      description: rankSeo?.homeSeoDescription || settings.tagline,
    },
  });
}

export function matchClientRedirectRule(
  pathname: string,
  rules: SeoRedirectRule[] = db.getSettings().seoRedirects || []
): SeoRedirectRule | null {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  for (const rule of rules) {
    if (!rule || !rule.active || !rule.sourcePath) continue;
    const src = rule.sourcePath.trim().replace(/\/+$/, '') || '/';
    if (src.endsWith('*')) {
      const prefix = src.slice(0, -1);
      if (cleanPath.startsWith(prefix)) return rule;
    } else if (cleanPath.toLowerCase() === src.toLowerCase()) {
      return rule;
    }
  }
  return null;
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
