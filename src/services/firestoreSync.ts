import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import {
  firestoreDb,
  auth,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  Post,
  Category,
  Tag,
  MediaItem,
  User,
  AdPlacement,
  Page,
  Comment,
  NewsletterSubscriber,
  NewsletterCampaign,
  SystemSettings,
  ActivityLog,
  FooterConfig,
} from '../types';

const ADMIN_EMAILS = ['alifsheenshopping@gmail.com', 'banicne7@gmail.com'];

export function isFirebaseAdminUser(): boolean {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

// Strip undefined recursively so Firestore never throws on undefined fields
function cleanUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanUndefined(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        out[k] = cleanUndefined(v);
      }
    }
    return out as T;
  }
  return obj;
}

function safeId(id: string): string {
  const cleaned = String(id || `id-${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '-');
  return cleaned.slice(0, 128) || `id-${Date.now()}`;
}

function trunc(val: any, max: number): string {
  return String(val ?? '').slice(0, max);
}

// -------------------------------------------------------------
// Strict Payload Sanitizers matching firestore.rules allowlists
// -------------------------------------------------------------
export function sanitizePost(p: Post): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(p.id),
    title: trunc(p.title || 'Untitled', 300),
    subtitle: trunc(p.subtitle || '', 500),
    slug: trunc(p.slug || safeId(p.id), 300),
    content: trunc(p.content || '', 199000),
    blocks: Array.isArray(p.blocks) ? p.blocks.slice(0, 100) : [],
    excerpt: trunc(p.excerpt || p.title || '', 1000),
    category: trunc(p.category || 'General', 100),
    tags: Array.isArray(p.tags) ? p.tags.slice(0, 25).map((t) => trunc(t, 60)) : [],
    authorId: trunc(p.author?.id || (p as any).authorId || 'u-1', 128),
    authorName: trunc(p.author?.name || (p as any).authorName || 'Editorial Desk', 120),
    authorAvatar: trunc(p.author?.avatar || (p as any).authorAvatar || '', 1000),
    status: ['published', 'draft', 'scheduled', 'pending_review', 'trash'].includes(p.status) ? p.status : 'draft',
    featuredImage: trunc(p.featuredImage || '', 2000),
    imageCaption: trunc((p as any).imageCaption || '', 500),
    seo: p.seo ? cleanUndefined(p.seo) : { title: trunc(p.title, 200), description: '', focusKeyword: '', score: 0 },
    isBreaking: !!p.isBreaking,
    isTrending: !!p.isTrending,
    isHomepageSlider: !!p.isHomepageSlider,
    isEditorPick: !!p.isEditorPick,
    isAiGenerated: !!p.isAiGenerated,
    views: Math.max(0, Number(p.views) || 0),
    commentsCount: Math.max(0, Number(p.commentsCount) || 0),
    readTimeMinutes: Math.max(1, Number((p as any).readTimeMinutes) || 3),
    createdAt: trunc((p as any).createdAt || p.publishedAt || new Date().toISOString(), 64),
    updatedAt: trunc(p.updatedAt || new Date().toISOString(), 64),
  };
  if (p.scheduledAt) allowed.scheduledAt = trunc(p.scheduledAt, 64);
  if (p.aiApprovalStatus && ['pending', 'approved', 'rejected'].includes(p.aiApprovalStatus)) {
    allowed.aiApprovalStatus = p.aiApprovalStatus;
  }
  if (p.editorialNotes) allowed.editorialNotes = trunc(p.editorialNotes, 2000);
  if (p.publishedAt) allowed.publishedAt = trunc(p.publishedAt, 64);
  return cleanUndefined(allowed);
}

export function sanitizeCategory(c: Category): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(c.id),
    name: trunc(c.name || 'Category', 100),
    slug: trunc(c.slug || safeId(c.id), 120),
    color: trunc(c.color || '#0284C7', 32),
    description: trunc(c.description || '', 500),
    count: Math.max(0, Number(c.count) || 0),
  };
  if (c.image) allowed.image = trunc(c.image, 2000);
  if (c.metaTitle) allowed.metaTitle = trunc(c.metaTitle, 200);
  if (c.metaDescription) allowed.metaDescription = trunc(c.metaDescription, 500);
  return cleanUndefined(allowed);
}

export function sanitizeTag(t: Tag): Record<string, any> {
  return cleanUndefined({
    id: safeId(t.id),
    name: trunc(t.name || 'Tag', 100),
    slug: trunc(t.slug || safeId(t.id), 120),
    count: Math.max(0, Number(t.count) || 0),
  });
}

export function sanitizePage(p: Page): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(p.id),
    title: trunc(p.title || 'Page', 200),
    slug: trunc(p.slug || safeId(p.id), 200),
    template: ['default', 'about', 'contact', 'privacy', 'terms'].includes(p.template) ? p.template : 'default',
    status: p.status === 'draft' ? 'draft' : 'published',
    content: trunc(p.content || '', 99000),
    updatedAt: trunc(p.updatedAt || new Date().toISOString().slice(0, 10), 64),
    showInMenu: !!p.showInMenu,
    showInFooter: p.showInFooter !== undefined ? !!p.showInFooter : true,
  };
  if (p.menuOrder !== undefined) allowed.menuOrder = Number(p.menuOrder) || 0;
  if (p.seoTitle) allowed.seoTitle = trunc(p.seoTitle, 200);
  if (p.seoDescription) allowed.seoDescription = trunc(p.seoDescription, 500);
  return cleanUndefined(allowed);
}

export function sanitizeAd(a: AdPlacement): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(a.id),
    name: trunc(a.name || 'Ad Slot', 150),
    key: trunc(a.key || safeId(a.id), 100),
    type: ['Code', 'Image', 'AdSense'].includes(a.type) ? a.type : 'Code',
    size: trunc(a.size || 'Responsive', 64),
    status: a.status === 'Active' ? 'Active' : 'Inactive',
    impressions: Math.max(0, Number(a.impressions) || 0),
    clicks: Math.max(0, Number(a.clicks) || 0),
    deviceTarget: ['all', 'desktop', 'mobile'].includes(a.deviceTarget) ? a.deviceTarget : 'all',
  };
  if (a.customCode) allowed.customCode = trunc(a.customCode, 20000);
  if (a.imageUrl) allowed.imageUrl = trunc(a.imageUrl, 2000);
  if (a.targetUrl) allowed.targetUrl = trunc(a.targetUrl, 2000);
  if (a.priority !== undefined) allowed.priority = Number(a.priority) || 0;
  return cleanUndefined(allowed);
}

export function sanitizeMedia(m: MediaItem): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(m.id),
    name: trunc(m.name || 'media', 200),
    url: trunc(m.url || '', 2000),
    type: m.type === 'video' ? 'video' : 'image',
    size: trunc(m.size || '0 KB', 64),
    dimensions: trunc(m.dimensions || '', 64),
    format: trunc(m.format || 'image/jpeg', 64),
    altText: trunc(m.altText || '', 500),
    uploadedAt: trunc(m.uploadedAt || new Date().toISOString().slice(0, 10), 64),
  };
  if (m.caption) allowed.caption = trunc(m.caption, 500);
  return cleanUndefined(allowed);
}

// Note: Strip authorEmail PII before storing in public /comments collection
export function sanitizeComment(c: Comment): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(c.id),
    postId: trunc(c.postId || '', 128),
    postTitle: trunc(c.postTitle || '', 300),
    authorName: trunc(c.authorName || 'Reader', 120),
    authorAvatar: trunc(c.authorAvatar || '', 1000),
    content: trunc(c.content || '', 3000),
    status: ['approved', 'pending', 'spam', 'trash'].includes(c.status) ? c.status : 'pending',
    createdAt: trunc(c.createdAt || 'Just now', 64),
  };
  if (Array.isArray(c.replies)) allowed.replies = c.replies.slice(0, 20);
  return cleanUndefined(allowed);
}

export function sanitizeUser(u: User): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(u.id),
    name: trunc(u.name || 'User', 120),
    email: trunc(u.email || '', 200),
    avatar: trunc(u.avatar || '', 2000),
    role: ['Administrator', 'Editor', 'Author', 'Contributor'].includes(u.role) ? u.role : 'Contributor',
    status: u.status === 'suspended' ? 'suspended' : 'active',
    twoFactorEnabled: !!u.twoFactorEnabled,
    articlesCount: Math.max(0, Number(u.articlesCount) || 0),
  };
  if (u.bio) allowed.bio = trunc(u.bio, 1000);
  if (u.lastLogin) allowed.lastLogin = trunc(u.lastLogin, 100);
  if (Array.isArray(u.loginHistory)) allowed.loginHistory = u.loginHistory.slice(0, 10);
  if (Array.isArray(u.activityLogs)) allowed.activityLogs = u.activityLogs.slice(0, 20);
  return cleanUndefined(allowed);
}

export function sanitizePublicSettings(s: SystemSettings): Record<string, any> {
  return cleanUndefined({
    id: 'site_settings',
    siteName: trunc(s.siteName, 150),
    tagline: trunc(s.tagline, 300),
    siteUrl: trunc(s.siteUrl, 300),
    language: trunc(s.language, 64),
    timezone: trunc(s.timezone, 100),
    permalinkStructure: trunc(s.permalinkStructure, 150),
    logoUrl: trunc(s.logoUrl, 2000),
    faviconUrl: trunc(s.faviconUrl, 2000),
    primaryColor: trunc(s.primaryColor, 32),
    darkMode: !!s.darkMode,
    googleAnalyticsId: trunc(s.googleAnalyticsId, 100),
    searchConsoleCode: trunc(s.searchConsoleCode, 300),
    adsenseClientId: trunc(s.adsenseClientId, 100),
    autoAds: !!s.autoAds,
    breakingNewsTickerActive: !!s.breakingNewsTickerActive,
    breakingNewsText: trunc(s.breakingNewsText, 1000),
  });
}

export function sanitizeAdminSettings(s: SystemSettings): Record<string, any> {
  const allowed: Record<string, any> = {
    id: 'system',
    smtpHost: trunc(s.smtpHost, 200),
    smtpPort: trunc(s.smtpPort, 20),
    smtpUser: trunc(s.smtpUser, 200),
    smtpSecure: !!s.smtpSecure,
    robotsTxt: trunc(s.robotsTxt, 5000),
    sitemapAutoPing: !!s.sitemapAutoPing,
    backupDaily: !!s.backupDaily,
    backupTime: trunc(s.backupTime, 64),
    ipBlacklist: Array.isArray(s.ipBlacklist) ? s.ipBlacklist.slice(0, 50) : [],
    ipWhitelist: Array.isArray(s.ipWhitelist) ? s.ipWhitelist.slice(0, 50) : [],
    maxLoginAttempts: Math.max(1, Number(s.maxLoginAttempts) || 5),
  };
  if (s.lastBackupAt) allowed.lastBackupAt = trunc(s.lastBackupAt, 100);
  return cleanUndefined(allowed);
}

export function sanitizeFooterConfig(f: FooterConfig): Record<string, any> {
  return cleanUndefined({
    id: 'footer_config',
    aboutText: trunc(f.aboutText, 2000),
    publisherText: trunc(f.publisherText, 300),
    copyrightText: trunc(f.copyrightText, 300),
    columns: Array.isArray(f.columns) ? f.columns.slice(0, 10) : [],
  });
}

export function sanitizeSubscriber(s: NewsletterSubscriber): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(s.id),
    email: trunc(s.email, 200),
    status: s.status === 'unsubscribed' ? 'unsubscribed' : 'active',
    subscribedAt: trunc(s.subscribedAt || new Date().toISOString().slice(0, 10), 64),
    tags: Array.isArray(s.tags) ? s.tags.slice(0, 10).map((t) => trunc(t, 60)) : [],
  };
  if (s.name) allowed.name = trunc(s.name, 120);
  return cleanUndefined(allowed);
}

export function sanitizeCampaign(c: NewsletterCampaign): Record<string, any> {
  const allowed: Record<string, any> = {
    id: safeId(c.id),
    subject: trunc(c.subject, 300),
    template: trunc(c.template, 200),
    status: ['draft', 'scheduled', 'sent'].includes(c.status) ? c.status : 'draft',
    recipientsCount: Math.max(0, Number(c.recipientsCount) || 0),
  };
  if (c.sentAt) allowed.sentAt = trunc(c.sentAt, 64);
  if (c.openRate) allowed.openRate = trunc(c.openRate, 32);
  if (c.clickRate) allowed.clickRate = trunc(c.clickRate, 32);
  return cleanUndefined(allowed);
}

export function sanitizeLog(l: ActivityLog): Record<string, any> {
  return cleanUndefined({
    id: safeId(l.id),
    userId: trunc(l.userId || 'u-1', 128),
    userName: trunc(l.userName || 'System', 120),
    action: trunc(l.action || 'Action', 200),
    details: trunc(l.details || '', 1000),
    ip: trunc(l.ip || '', 64),
    timestamp: trunc(l.timestamp || new Date().toISOString(), 64),
    level: ['info', 'warning', 'security', 'success'].includes(l.level) ? l.level : 'info',
  });
}

// -------------------------------------------------------------
// Real-Time Sync Callbacks
// -------------------------------------------------------------
export interface SyncCallbacks {
  onPostsUpdate: (posts: Post[], firestoreInitialized: boolean) => void;
  onCategoriesUpdate: (categories: Category[], firestoreInitialized: boolean) => void;
  onTagsUpdate: (tags: Tag[], firestoreInitialized: boolean) => void;
  onPagesUpdate: (pages: Page[], firestoreInitialized: boolean) => void;
  onAdsUpdate: (ads: AdPlacement[], firestoreInitialized: boolean) => void;
  onMediaUpdate: (media: MediaItem[], firestoreInitialized: boolean) => void;
  onCommentsUpdate: (comments: Comment[], firestoreInitialized: boolean) => void;
  onPublicSettingsUpdate: (settings: Partial<SystemSettings>) => void;
  onFooterConfigUpdate: (footer: FooterConfig) => void;
  onAdminSettingsUpdate: (settings: Partial<SystemSettings>) => void;
  onUsersUpdate: (users: User[]) => void;
  onSubscribersUpdate: (subscribers: NewsletterSubscriber[]) => void;
  onCampaignsUpdate: (campaigns: NewsletterCampaign[]) => void;
  onLogsUpdate: (logs: ActivityLog[]) => void;
  getSeedState: () => {
    posts: Post[];
    categories: Category[];
    tags: Tag[];
    pages: Page[];
    ads: AdPlacement[];
    media: MediaItem[];
    comments: Comment[];
    users: User[];
    settings: SystemSettings;
    footerConfig: FooterConfig;
    subscribers: NewsletterSubscriber[];
    campaigns: NewsletterCampaign[];
    logs: ActivityLog[];
  };
}

class FirestoreSyncService {
  private unsubscribers: Unsubscribe[] = [];
  private adminUnsubscribers: Unsubscribe[] = [];
  private callbacks: SyncCallbacks | null = null;
  private isRemoteConfigInitialized = false;
  private isSeeding = false;

  public start(callbacks: SyncCallbacks) {
    if (typeof window === 'undefined') return;
    this.callbacks = callbacks;
    this.attachPublicListeners(false);

    // Watch Firebase Auth state to switch between public & full admin listeners
    onAuthStateChanged(auth, async (user) => {
      const adminActive =
        !!user &&
        !!user.email &&
        !!user.emailVerified &&
        ADMIN_EMAILS.includes(user.email.toLowerCase());

      // Re-attach collection listeners with appropriate query privilege
      this.detachAll();
      this.attachPublicListeners(adminActive);

      if (adminActive) {
        await this.ensureAdminDocument(user.uid, user.email!);
        await this.seedFirestoreIfEmpty();
        this.attachAdminListeners();
      }
    });
  }

  private detachAll() {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.adminUnsubscribers.forEach((u) => u());
    this.adminUnsubscribers = [];
  }

  private async ensureAdminDocument(uid: string, email: string) {
    try {
      const adminRef = doc(firestoreDb, 'admins', safeId(uid));
      const snap = await getDoc(adminRef);
      if (!snap.exists()) {
        await setDoc(adminRef, {
          uid: safeId(uid),
          email: email.toLowerCase(),
          role: 'Administrator',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      // Bootstrapped email rules still authorize the admin even if admins doc write fails
      console.warn('Admin doc check skipped:', e);
    }
  }

  private async seedFirestoreIfEmpty() {
    if (this.isSeeding || !this.callbacks) return;
    this.isSeeding = true;
    try {
      const settingsSnap = await getDoc(doc(firestoreDb, 'config', 'site_settings'));
      if (settingsSnap.exists()) {
        this.isRemoteConfigInitialized = true;
        return;
      }

      const seed = this.callbacks.getSeedState();
      const batch = writeBatch(firestoreDb);

      batch.set(doc(firestoreDb, 'config', 'site_settings'), sanitizePublicSettings(seed.settings));
      batch.set(doc(firestoreDb, 'config', 'footer_config'), sanitizeFooterConfig(seed.footerConfig));
      batch.set(doc(firestoreDb, 'admin_config', 'system'), sanitizeAdminSettings(seed.settings));

      seed.posts.forEach((p) => batch.set(doc(firestoreDb, 'posts', safeId(p.id)), sanitizePost(p)));
      seed.categories.forEach((c) => batch.set(doc(firestoreDb, 'categories', safeId(c.id)), sanitizeCategory(c)));
      seed.tags.forEach((t) => batch.set(doc(firestoreDb, 'tags', safeId(t.id)), sanitizeTag(t)));
      seed.pages.forEach((pg) => batch.set(doc(firestoreDb, 'pages', safeId(pg.id)), sanitizePage(pg)));
      seed.ads.forEach((ad) => batch.set(doc(firestoreDb, 'ads', safeId(ad.id)), sanitizeAd(ad)));
      seed.media.forEach((m) => batch.set(doc(firestoreDb, 'media', safeId(m.id)), sanitizeMedia(m)));
      seed.comments.forEach((cm) => batch.set(doc(firestoreDb, 'comments', safeId(cm.id)), sanitizeComment(cm)));
      seed.users.forEach((u) => batch.set(doc(firestoreDb, 'users', safeId(u.id)), sanitizeUser(u)));
      seed.subscribers.forEach((sub) => batch.set(doc(firestoreDb, 'subscribers', safeId(sub.id)), sanitizeSubscriber(sub)));
      seed.campaigns.forEach((camp) => batch.set(doc(firestoreDb, 'campaigns', safeId(camp.id)), sanitizeCampaign(camp)));
      seed.logs.slice(0, 20).forEach((l) => batch.set(doc(firestoreDb, 'logs', safeId(l.id)), sanitizeLog(l)));

      await batch.commit();
      this.isRemoteConfigInitialized = true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_initial_cms');
    } finally {
      this.isSeeding = false;
    }
  }

  private attachPublicListeners(isAdmin: boolean) {
    if (!this.callbacks) return;
    const cb = this.callbacks;

    // 1. Config (site_settings & footer_config) - listen first so we know if DB is seeded
    const unsubConfig = onSnapshot(
      collection(firestoreDb, 'config'),
      (snap) => {
        snap.docs.forEach((d) => {
          const data = d.data();
          if (d.id === 'site_settings') {
            this.isRemoteConfigInitialized = true;
            cb.onPublicSettingsUpdate(data as Partial<SystemSettings>);
          } else if (d.id === 'footer_config') {
            cb.onFooterConfigUpdate({
              aboutText: data.aboutText || '',
              publisherText: data.publisherText || '',
              copyrightText: data.copyrightText || '',
              columns: Array.isArray(data.columns) ? data.columns : [],
            });
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'config');
      }
    );

    // 2. Posts (Query published only for visitors; all for admin)
    const postsQuery = isAdmin
      ? collection(firestoreDb, 'posts')
      : query(collection(firestoreDb, 'posts'), where('status', '==', 'published'));
    const unsubPosts = onSnapshot(
      postsQuery,
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          const list: Post[] = snap.docs.map((d) => {
            const raw = d.data() as any;
            return {
              ...raw,
              id: raw.id || d.id,
              blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
              tags: Array.isArray(raw.tags) ? raw.tags : [],
              author: raw.author || {
                id: raw.authorId || 'u-1',
                name: raw.authorName || 'Editorial Desk',
                avatar:
                  raw.authorAvatar ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
                role: 'Administrator',
              },
              isFeatured: !!raw.isFeatured,
              sharesCount: Number(raw.sharesCount) || 0,
              aiApprovalStatus: raw.aiApprovalStatus || 'approved',
              publishedAt: raw.publishedAt || raw.createdAt || raw.updatedAt || '',
            } as Post;
          });
          list.sort((a, b) => (b.updatedAt || b.publishedAt || '').localeCompare(a.updatedAt || a.publishedAt || ''));
          cb.onPostsUpdate(list, this.isRemoteConfigInitialized || !snap.empty);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      }
    );

    // 3. Categories
    const unsubCats = onSnapshot(
      collection(firestoreDb, 'categories'),
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onCategoriesUpdate(
            snap.docs.map((d) => d.data() as Category),
            this.isRemoteConfigInitialized || !snap.empty
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    // 4. Tags
    const unsubTags = onSnapshot(
      collection(firestoreDb, 'tags'),
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onTagsUpdate(
            snap.docs.map((d) => d.data() as Tag),
            this.isRemoteConfigInitialized || !snap.empty
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'tags');
      }
    );

    // 5. Pages
    const pagesQuery = isAdmin
      ? collection(firestoreDb, 'pages')
      : query(collection(firestoreDb, 'pages'), where('status', '==', 'published'));
    const unsubPages = onSnapshot(
      pagesQuery,
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onPagesUpdate(
            snap.docs.map((d) => d.data() as Page),
            this.isRemoteConfigInitialized || !snap.empty
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'pages');
      }
    );

    // 6. Ads
    const unsubAds = onSnapshot(
      collection(firestoreDb, 'ads'),
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onAdsUpdate(
            snap.docs.map((d) => d.data() as AdPlacement),
            this.isRemoteConfigInitialized || !snap.empty
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'ads');
      }
    );

    // 7. Media
    const unsubMedia = onSnapshot(
      collection(firestoreDb, 'media'),
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onMediaUpdate(
            snap.docs.map((d) => d.data() as MediaItem),
            this.isRemoteConfigInitialized || !snap.empty
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'media');
      }
    );

    // 8. Comments
    const commentsQuery = isAdmin
      ? collection(firestoreDb, 'comments')
      : query(collection(firestoreDb, 'comments'), where('status', '==', 'approved'));
    const unsubComments = onSnapshot(
      commentsQuery,
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onCommentsUpdate(
            snap.docs.map((d) => ({ ...d.data(), authorEmail: '' }) as Comment),
            this.isRemoteConfigInitialized || !snap.empty
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'comments');
      }
    );

    this.unsubscribers.push(
      unsubConfig,
      unsubPosts,
      unsubCats,
      unsubTags,
      unsubPages,
      unsubAds,
      unsubMedia,
      unsubComments
    );
  }

  private attachAdminListeners() {
    if (!this.callbacks) return;
    const cb = this.callbacks;

    const unsubUsers = onSnapshot(
      collection(firestoreDb, 'users'),
      (snap) => {
        if (!snap.empty) cb.onUsersUpdate(snap.docs.map((d) => d.data() as User));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const unsubSubs = onSnapshot(
      collection(firestoreDb, 'subscribers'),
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onSubscribersUpdate(snap.docs.map((d) => d.data() as NewsletterSubscriber));
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'subscribers')
    );

    const unsubCampaigns = onSnapshot(
      collection(firestoreDb, 'campaigns'),
      (snap) => {
        if (!snap.empty || this.isRemoteConfigInitialized) {
          cb.onCampaignsUpdate(snap.docs.map((d) => d.data() as NewsletterCampaign));
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'campaigns')
    );

    const unsubLogs = onSnapshot(
      collection(firestoreDb, 'logs'),
      (snap) => {
        if (!snap.empty) {
          const logs = snap.docs.map((d) => d.data() as ActivityLog);
          logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          cb.onLogsUpdate(logs.slice(0, 100));
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'logs')
    );

    const unsubAdminConfig = onSnapshot(
      doc(firestoreDb, 'admin_config', 'system'),
      (snap) => {
        if (snap.exists()) {
          cb.onAdminSettingsUpdate(snap.data() as Partial<SystemSettings>);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'admin_config/system')
    );

    this.adminUnsubscribers.push(unsubUsers, unsubSubs, unsubCampaigns, unsubLogs, unsubAdminConfig);
  }

  // -------------------------------------------------------------
  // Write Helpers (Admin Mutations -> Firestore Cloud)
  // -------------------------------------------------------------
  public async writeDoc(collectionName: string, id: string, payload: Record<string, any>): Promise<void> {
    if (!isFirebaseAdminUser() && collectionName !== 'comments' && collectionName !== 'subscribers') {
      return;
    }
    const cleanId = safeId(id);
    const path = `${collectionName}/${cleanId}`;
    try {
      await setDoc(doc(firestoreDb, collectionName, cleanId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteRemoteDoc(collectionName: string, id: string): Promise<void> {
    if (!isFirebaseAdminUser()) return;
    const cleanId = safeId(id);
    const path = `${collectionName}/${cleanId}`;
    try {
      await deleteDoc(doc(firestoreDb, collectionName, cleanId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async incrementPostViewsRemote(postId: string): Promise<void> {
    const cleanId = safeId(postId);
    const path = `posts/${cleanId}`;
    try {
      await updateDoc(doc(firestoreDb, 'posts', cleanId), { views: increment(1) });
    } catch (error) {
      // Ignore only not-found for unseeded drafts; log permission diagnostics for monitoring
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        console.warn(`Firestore view increment permission warning on ${path}:`, msg);
      }
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
