import { TargetCountry } from '../types';

export interface CountryEditionMeta {
  code: TargetCountry;
  geoCode: 'US' | 'GB' | 'CA' | 'AU' | 'GLOBAL';
  label: string;
  fullName: string;
  flag: string;
  pathPrefix: string;
  tagline: string;
  languageLabel: string;
}

export const COUNTRY_EDITIONS: Record<TargetCountry, CountryEditionMeta> = {
  usa: {
    code: 'usa',
    geoCode: 'US',
    label: 'USA',
    fullName: 'United States',
    flag: '🇺🇸',
    pathPrefix: '/usa',
    tagline: "America's 24/7 Live News Portal · US Edition",
    languageLabel: 'American English',
  },
  uk: {
    code: 'uk',
    geoCode: 'GB',
    label: 'UK',
    fullName: 'United Kingdom',
    flag: '🇬🇧',
    pathPrefix: '/uk',
    tagline: 'United Kingdom 24/7 Live News & Analysis · UK Edition',
    languageLabel: 'British English',
  },
  canada: {
    code: 'canada',
    geoCode: 'CA',
    label: 'Canada',
    fullName: 'Canada',
    flag: '🇨🇦',
    pathPrefix: '/canada',
    tagline: 'Canada 24/7 National News & Trends · Canada Edition',
    languageLabel: 'Canadian English',
  },
  australia: {
    code: 'australia',
    geoCode: 'AU',
    label: 'Australia',
    fullName: 'Australia',
    flag: '🇦🇺',
    pathPrefix: '/australia',
    tagline: 'Australia 24/7 Live News & Insights · Australia Edition',
    languageLabel: 'Australian English',
  },
  global: {
    code: 'global',
    geoCode: 'GLOBAL',
    label: 'Global',
    fullName: 'International Desk',
    flag: '🌐',
    pathPrefix: '/',
    tagline: '24/7 Global & Investigative News Portal',
    languageLabel: 'International English',
  },
};

export const TARGET_COUNTRY_LIST: CountryEditionMeta[] = [
  COUNTRY_EDITIONS.usa,
  COUNTRY_EDITIONS.uk,
  COUNTRY_EDITIONS.canada,
  COUNTRY_EDITIONS.australia,
  COUNTRY_EDITIONS.global,
];

export const COUNTRY_ROUTE_SLUGS = ['usa', 'uk', 'canada', 'australia'] as const;
export type CountryRouteSlug = (typeof COUNTRY_ROUTE_SLUGS)[number];

export function isCountryEditionSlug(value?: string | null): value is CountryRouteSlug {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'usa' || lower === 'uk' || lower === 'canada' || lower === 'australia';
}

export function normalizeTargetCountry(value?: string | null): TargetCountry {
  const lower = String(value || '').toLowerCase().trim();
  if (lower === 'usa' || lower === 'us') return 'usa';
  if (lower === 'uk' || lower === 'gb') return 'uk';
  if (lower === 'canada' || lower === 'ca') return 'canada';
  if (lower === 'australia' || lower === 'au') return 'australia';
  return 'global';
}

export function getEditionFromIsoCountry(isoCode?: string | null): CountryRouteSlug | null {
  const code = String(isoCode || '').toUpperCase().trim();
  if (code === 'US') return 'usa';
  if (code === 'GB' || code === 'UK') return 'uk';
  if (code === 'CA') return 'canada';
  if (code === 'AU') return 'australia';
  return null;
}

export function getPostPublicPath(post: {
  slug?: string;
  id?: string;
  targetCountry?: TargetCountry;
}): string {
  const slug = encodeURIComponent(post.slug || post.id || '');
  if (post.targetCountry && isCountryEditionSlug(post.targetCountry)) {
    return `/${post.targetCountry}/${slug}`;
  }
  return `/news/${slug}`;
}

export function doesPostBelongToEdition(
  post: { targetCountry?: TargetCountry },
  edition: TargetCountry
): boolean {
  if (edition === 'global') return true;
  if (edition === 'usa') {
    // Legacy posts without an explicit targetCountry belong to the US desk by default;
    // any post explicitly targeted to UK, Canada, Australia, or Global stays out of /usa.
    return post.targetCountry === 'usa' || !post.targetCountry;
  }
  return post.targetCountry === edition;
}
