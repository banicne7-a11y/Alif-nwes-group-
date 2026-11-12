export type PostStatus = 'published' | 'draft' | 'pending_review' | 'scheduled' | 'trash';
export type UserRole = 'Administrator' | 'Editor' | 'Author' | 'Contributor' | 'Subscriber';

export interface EditorBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'image' | 'video' | 'quote' | 'table' | 'gallery' | 'embed' | 'callout';
  content: any;
  level?: 2 | 3 | 4;
  caption?: string;
  align?: 'left' | 'center' | 'right';
  mediaUrl?: string;
}

export interface PostRevision {
  id: string;
  timestamp: string;
  authorName: string;
  title: string;
  summary: string;
  blocksCount: number;
}

export interface Post {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: string;
  blocks: EditorBlock[];
  excerpt: string;
  featuredImage: string;
  category: string;
  subcategory?: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar: string;
    role: UserRole;
  };
  status: PostStatus;
  publishedAt: string;
  scheduledAt?: string;
  updatedAt: string;
  views: number;
  commentsCount: number;
  sharesCount: number;
  isBreaking: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  isEditorPick: boolean;
  isHomepageSlider: boolean;
  isAiGenerated: boolean;
  aiApprovalStatus: 'pending' | 'approved' | 'rejected';
  editorialNotes?: string;
  seo: {
    title: string;
    description: string;
    focusKeyword: string;
    secondaryKeywords?: string[];
    canonicalUrl?: string;
    score: number;
    metaRobots?: string;
    schemaType?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  customFields?: Record<string, string>;
  readTime?: string;
  isMemberExclusive?: boolean;
  revisions?: PostRevision[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  color: string;
  description: string;
  image?: string;
  count: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: string;
  dimensions: string;
  format: string;
  altText: string;
  caption?: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: 'active' | 'suspended';
  twoFactorEnabled: boolean;
  articlesCount: number;
  bio?: string;
  lastLogin?: string;
  loginHistory?: Array<{ timestamp: string; ip: string; device: string }>;
  activityLogs?: Array<{ action: string; timestamp: string }>;
}

export interface AdPlacement {
  id: string;
  name: string;
  key: string; // e.g. 'author_mobile_top', 'home_sidebar_top', 'article_header'
  type: 'Code' | 'Image' | 'AdSense';
  size: string; // '320x100', '300x250', '300x600', 'Responsive', '728x90'
  status: 'Active' | 'Inactive';
  customCode?: string;
  imageUrl?: string;
  targetUrl?: string;
  impressions: number;
  clicks: number;
  deviceTarget: 'all' | 'desktop' | 'mobile';
  priority?: number;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  template: 'default' | 'about' | 'contact' | 'privacy' | 'terms';
  status: 'published' | 'draft';
  content: string;
  updatedAt: string;
  showInMenu: boolean;
  showInFooter?: boolean;
  menuOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  content: string;
  status: 'approved' | 'pending' | 'spam' | 'trash';
  createdAt: string;
  replies?: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  tags: string[];
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  template: string;
  status: 'draft' | 'scheduled' | 'sent';
  sentAt?: string;
  recipientsCount: number;
  openRate?: string;
  clickRate?: string;
}

export interface SystemSettings {
  siteName: string;
  tagline: string;
  siteUrl: string;
  language: string;
  timezone: string;
  permalinkStructure: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  darkMode: boolean;
  googleAnalyticsId: string;
  searchConsoleCode: string;
  adsenseClientId: string;
  autoAds: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpSecure: boolean;
  robotsTxt: string;
  sitemapAutoPing: boolean;
  backupDaily: boolean;
  backupTime: string;
  lastBackupAt?: string;
  ipBlacklist: string[];
  ipWhitelist: string[];
  maxLoginAttempts: number;
  breakingNewsTickerActive: boolean;
  breakingNewsText: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
  level: 'info' | 'warning' | 'security' | 'success';
}

export interface BackupRecord {
  id: string;
  fileName: string;
  size: string;
  createdAt: string;
  type: 'automated' | 'manual';
  itemsCount: number;
  downloadData?: string;
}

export interface FooterMenuItem {
  id: string;
  label: string;
  url: string;
  target?: '_self' | '_blank';
}

export interface FooterColumn {
  id: string;
  title: string;
  items: FooterMenuItem[];
}

export interface FooterConfig {
  aboutText: string;
  publisherText: string;
  copyrightText: string;
  columns: FooterColumn[];
}
