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
  BackupRecord,
  FooterConfig,
  FooterColumn,
  FooterMenuItem,
} from '../types';
import {
  firestoreSync,
  sanitizePost,
  sanitizeCategory,
  sanitizeTag,
  sanitizePage,
  sanitizeAd,
  sanitizeMedia,
  sanitizeComment,
  sanitizeUser,
  sanitizePublicSettings,
  sanitizeAdminSettings,
  sanitizeFooterConfig,
  sanitizeSubscriber,
  sanitizeCampaign,
  sanitizeLog,
} from './firestoreSync';

const STORAGE_KEY = 'alif_news_24_cms_db_v8';

export interface DatabaseState {
  posts: Post[];
  categories: Category[];
  tags: Tag[];
  media: MediaItem[];
  users: User[];
  ads: AdPlacement[];
  pages: Page[];
  comments: Comment[];
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
  settings: SystemSettings;
  logs: ActivityLog[];
  backups: BackupRecord[];
  currentUser: User;
  footerConfig: FooterConfig;
}

// Initial seed categories matching Screenshot 1
const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Business', slug: 'business', color: '#0284C7', description: 'Financial markets, commerce, inflation, and global enterprise', count: 0 },
  { id: 'cat-2', name: 'Politics', slug: 'politics', color: '#6366F1', description: 'Government policies, international diplomacy, elections', count: 0 },
  { id: 'cat-3', name: 'Health', slug: 'health', color: '#10B981', description: 'Medical research, public wellness, clinical advancements', count: 0 },
  { id: 'cat-4', name: 'Sports', slug: 'sports', color: '#EF4444', description: 'Global tournaments, athletics, football, cricket, leagues', count: 0 },
  { id: 'cat-5', name: 'Travels', slug: 'travels', color: '#F59E0B', description: 'Destinations, hospitality, tourism culture and guides', count: 0 },
  { id: 'cat-6', name: "Family's", slug: 'familys', color: '#EC4899', description: 'Living, relationships, parenting, wellness and lifestyle', count: 0 },
  { id: 'cat-7', name: 'Science', slug: 'science', color: '#06B6D4', description: 'Space exploration, quantum computing, ecology discoveries', count: 0 },
  { id: 'cat-8', name: 'Technology', slug: 'technology', color: '#F97316', description: 'Artificial Intelligence, software, semiconductors, gadgets', count: 0 },
  { id: 'cat-9', name: 'Religion', slug: 'religion', color: '#8B5CF6', description: 'Faith, philosophy, interfaith peace and cultural heritage', count: 0 },
];

const initialTags: Tag[] = [
  { id: 't-1', name: 'Inflation', slug: 'inflation', count: 0 },
  { id: 't-2', name: 'Federal Reserve', slug: 'federal-reserve', count: 0 },
  { id: 't-3', name: 'Artificial Intelligence', slug: 'ai', count: 0 },
  { id: 't-4', name: 'Global Economy', slug: 'global-economy', count: 0 },
  { id: 't-5', name: 'Clean Energy', slug: 'clean-energy', count: 0 },
  { id: 't-6', name: 'Health Tech', slug: 'health-tech', count: 0 },
  { id: 't-7', name: 'Cybersecurity', slug: 'cybersecurity', count: 0 },
  { id: 't-8', name: 'SpaceX', slug: 'spacex', count: 0 },
];

const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Alif Sheen (Administrator)',
    email: 'alifsheenshopping@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Administrator',
    status: 'active',
    twoFactorEnabled: true,
    articlesCount: 0,
    bio: 'Lead Operations & Editorial Executive at Alif News 24 Enterprise.',
    lastLogin: 'Today at 08:30 AM',
    loginHistory: [
      { timestamp: '2026-11-12 08:30:12', ip: '192.168.1.104', device: 'Chrome / macOS' },
    ],
  },
  {
    id: 'u-owner-2',
    name: 'Lead Executive Admin',
    email: 'banicne7@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Administrator',
    status: 'active',
    twoFactorEnabled: true,
    articlesCount: 0,
    bio: 'Executive Administrator at Alif News 24.',
  },
  {
    id: 'u-2',
    name: 'Jenny Wilson',
    email: 'jenny.wilson@alifnews24.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Editor',
    status: 'active',
    twoFactorEnabled: true,
    articlesCount: 0,
    bio: 'Senior Political Correspondent and News Desk Lead.',
  },
  {
    id: 'u-3',
    name: 'Marvin McKinney',
    email: 'marvin.m@alifnews24.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Author',
    status: 'active',
    twoFactorEnabled: false,
    articlesCount: 0,
    bio: 'Business & Finance Market Analyst.',
  },
  {
    id: 'u-4',
    name: 'Robert Fox',
    email: 'robert.fox@alifnews24.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'Author',
    status: 'active',
    twoFactorEnabled: true,
    articlesCount: 0,
    bio: 'Science & Emerging Technologies Reporter.',
  },
  {
    id: 'u-5',
    name: 'Cody Fisher',
    email: 'cody.fisher@alifnews24.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    role: 'Contributor',
    status: 'active',
    twoFactorEnabled: false,
    articlesCount: 0,
    bio: 'Culture, Lifestyle and Travel Columnist.',
  },
  {
    id: 'u-6',
    name: 'David Vance',
    email: 'david.vance@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: 'Subscriber',
    status: 'active',
    twoFactorEnabled: false,
    articlesCount: 0,
    bio: 'Verified Premium Digital Subscriber & Daily Reader.',
  },
  {
    id: 'u-7',
    name: 'Sarah Jenkins',
    email: 'sarah.j@outlook.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'Subscriber',
    status: 'active',
    twoFactorEnabled: true,
    articlesCount: 0,
    bio: 'Morning Dispatch Subscriber & Registered Member.',
  },
];

// Seed posts matching User's Newsweek screenshot exactly!
const initialPosts: Post[] = [
  {
    id: 'post-nw-1',
    title: 'What If Trump Had Lost in 2016? 10 Years of Alternate History',
    subtitle: 'He has been called the "dominant American of our age," but how might Trump\'s loss to Clinton have altered the country\'s history?',
    slug: 'what-if-trump-had-lost-in-2016-10-years-alternate-history',
    excerpt: 'He has been called the "dominant American of our age," but how might Trump\'s loss to Clinton have altered the country\'s history?',
    featuredImage: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=1200&auto=format&fit=crop&q=80',
    category: 'Analysis',
    readTime: '15 min read',
    tags: ['Elections', 'Politics', 'White House', 'History'],
    author: {
      id: 'u-1',
      name: 'Lead Administrator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Administrator',
    },
    status: 'published',
    publishedAt: 'Today · 15 min read',
    updatedAt: '2026-11-08 10:15',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: true,
    isFeatured: true,
    isEditorPick: true,
    isHomepageSlider: true,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'What If Trump Had Lost in 2016? 10 Years of Alternate History',
      description: 'Ten-year retrospective analyzing political realignments, the Supreme Court, and cultural polarization.',
      focusKeyword: 'Trump 2016 alternate history',
      score: 95,
    },
    blocks: [
      {
        id: 'b-nw1-1',
        type: 'paragraph',
        content: 'Had Donald Trump conceded to Hillary Clinton on November 8, 2016, modern American politics would have diverged into an unfamiliar landscape. The populist coalition he galvanized would not have vanished, but the institutional machinery of Washington would have developed under starkly contrasting pressures.',
      },
      {
        id: 'b-nw1-2',
        type: 'heading',
        level: 2,
        content: 'The Supreme Court and the Judicial Reckoning',
      },
      {
        id: 'b-nw1-3',
        type: 'paragraph',
        content: 'A liberal Supreme Court majority would have rewritten fifty years of environmental, voting rights, and corporate jurisprudence, triggering immediate resistance across conservative statehouses.',
      },
      {
        id: 'b-nw1-4',
        type: 'quote',
        content: 'Every historical turning point carries its own shadow narrative. The 2016 election remains the paramount pivot point of 21st-century Western governance.',
        caption: 'Senior Political Analyst',
      },
    ],
    content: 'Full retrospective on alternate political history...',
  },
  {
    id: 'post-nw-2',
    title: "China's Military Tech Emerges on Both Sides of Saudi-Houthi War",
    subtitle: 'Precision electronic guidance kits and unmanned reconnaissance drones traced through regional defense supply corridors.',
    slug: 'chinas-military-tech-emerges-both-sides-saudi-houthi-war',
    excerpt: 'Dual-use radar tracking platforms and lightweight counter-drone hardware have surfaced among frontline forces across the Arabian peninsula.',
    featuredImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
    category: 'Analysis',
    readTime: '10 min read',
    tags: ['China', 'Military Tech', 'Middle East'],
    author: {
      id: 'u-4',
      name: 'Robert Fox',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Editor',
    },
    status: 'published',
    publishedAt: 'Today · 10 min read',
    updatedAt: '2026-11-08 09:30',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: true,
    isFeatured: false,
    isEditorPick: false,
    isHomepageSlider: false,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: "China's Military Tech Emerges on Both Sides of Saudi-Houthi Conflict",
      description: 'Battlefield forensic report on Chinese drone hardware and guidance systems.',
      focusKeyword: 'Chinese military tech Yemen',
      score: 89,
    },
    blocks: [
      {
        id: 'b-nw2-1',
        type: 'paragraph',
        content: 'Defense intelligence analysts monitoring the Arabian Peninsula have documented an unprecedented surge in Chinese-manufactured optical seekers and commercial drone telemetry systems operating across opposing factions.',
      },
    ],
    content: 'Full investigation into regional arms flow...',
  },
  {
    id: 'post-nw-3',
    title: "The Nobel Peace Prize Is Melania Trump's to Lose",
    subtitle: 'Behind-the-scenes humanitarian initiatives in Eastern Europe and child welfare advocacy draw quiet diplomatic accolades.',
    slug: 'the-nobel-peace-prize-is-melania-trumps-to-lose',
    excerpt: 'Quiet backchannel diplomacy securing release for non-combatant detainees has propelled the former First Lady onto international nomination shortlists.',
    featuredImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    category: 'Analysis',
    readTime: '4 min read',
    isMemberExclusive: true,
    tags: ['For Members', 'Politics', 'Diplomacy'],
    author: {
      id: 'u-3',
      name: 'Marvin McKinney',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Author',
    },
    status: 'published',
    publishedAt: 'Today · 4 min read',
    updatedAt: '2026-11-08 09:10',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: true,
    isFeatured: false,
    isEditorPick: true,
    isHomepageSlider: false,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: "Nobel Peace Prize Speculation: Melania Trump's Humanitarian Record",
      description: 'Examining the diplomatic advocacy and humanitarian record behind unexpected Nobel Prize nomination chatter.',
      focusKeyword: 'Melania Trump Nobel Peace Prize',
      score: 91,
    },
    blocks: [
      {
        id: 'b-nw3-1',
        type: 'paragraph',
        content: 'While media attention gravitates toward electoral podiums, high-ranking Scandinavian diplomats confirm discreet submissions recognizing bilateral prisoner repatriation agreements negotiated through non-governmental channels.',
      },
    ],
    content: 'Full feature on diplomatic initiatives...',
  },
  {
    id: 'post-nw-4',
    title: 'Krakow Shooting Suspect: What We Know As More Victims Discovered',
    subtitle: 'Central European security services cordon historic Old Town after late-night confrontation.',
    slug: 'krakow-shooting-suspect-what-we-know-as-more-victims-discovered',
    excerpt: 'Polish authorities have established a multi-agency command perimeter following an armed incident in central Krakow.',
    featuredImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
    category: 'World',
    readTime: '4 min read',
    tags: ['Poland', 'World', 'Security'],
    author: {
      id: 'u-4',
      name: 'Robert Fox',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Editor',
    },
    status: 'published',
    publishedAt: 'Today · 4 min read',
    updatedAt: '2026-11-08 08:45',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: true,
    isTrending: true,
    isFeatured: false,
    isEditorPick: false,
    isHomepageSlider: false,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'Krakow Incident: Investigation Deepens After Central District Operation',
      description: 'Live updates from Polish authorities investigating overnight shooting in Krakow.',
      focusKeyword: 'Krakow shooting suspect',
      score: 87,
    },
    blocks: [
      {
        id: 'b-nw4-1',
        type: 'paragraph',
        content: 'KRAKOW — Emergency response cordons remained active across the historic district this morning as investigators examined ballistics evidence following an overnight police operation.',
      },
    ],
    content: 'Live reports from Krakow...',
  },
  {
    id: 'post-nw-5',
    title: 'James Talarico Debuts on SNL After Texas Midterm Victory',
    subtitle: 'The Texas representative traded state legislative debate for Saturday Night Live cold open satire.',
    slug: 'james-talarico-debuts-on-snl-after-texas-midterm-victory',
    excerpt: 'Trading the Texas House floor for Studio 8H, the lawmaker made an unexpected cameo during the late-night sketch broadcast.',
    featuredImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    category: 'Entertainment',
    readTime: '2 min read',
    tags: ['SNL', 'Entertainment', 'Culture'],
    author: {
      id: 'u-5',
      name: 'Cody Fisher',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      role: 'Contributor',
    },
    status: 'published',
    publishedAt: 'Today · 2 min read',
    updatedAt: '2026-11-08 08:20',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: false,
    isFeatured: false,
    isEditorPick: false,
    isHomepageSlider: false,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'James Talarico SNL Cameo Draws National Attention',
      description: 'Texas lawmaker joins Saturday Night Live cast in viral cold open sketch.',
      focusKeyword: 'James Talarico SNL',
      score: 86,
    },
    blocks: [
      {
        id: 'b-nw5-1',
        type: 'paragraph',
        content: 'NEW YORK — In a television appearance that quickly circulated across social feeds, Representative James Talarico joined the cast of NBC’s Saturday Night Live, playfully roasting legislative deadlock.',
      },
    ],
    content: 'Entertainment report on SNL debut...',
  },
  {
    id: 'post-nw-6',
    title: 'Trump Offers Glimpse Into Plan For New Press Secretary',
    subtitle: 'Campaign inner circle weighs television combativeness against traditional podium briefing protocols.',
    slug: 'trump-offers-glimpse-into-plan-for-new-press-secretary',
    excerpt: 'Transition insiders disclose top contenders for the West Wing briefing podium as media strategy discussions intensify.',
    featuredImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop&q=80',
    category: 'News',
    readTime: '5 min read',
    tags: ['White House', 'News', 'Politics'],
    author: {
      id: 'u-3',
      name: 'Marvin McKinney',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Author',
    },
    status: 'published',
    publishedAt: 'Today · 5 min read',
    updatedAt: '2026-11-08 07:45',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: true,
    isFeatured: false,
    isEditorPick: false,
    isHomepageSlider: false,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'Trump Transition Weighs Options for Next White House Press Secretary',
      description: 'Inside the vetting process for the West Wing press briefing role.',
      focusKeyword: 'Trump Press Secretary plan',
      score: 90,
    },
    blocks: [
      {
        id: 'b-nw6-1',
        type: 'paragraph',
        content: 'PALM BEACH — Discussions surrounding the upcoming White House communications team have zeroed in on candidates capable of blending rapid digital counter-messaging with high-tempo press conferences.',
      },
    ],
    content: 'Political analysis on press secretary selection...',
  },
  {
    id: 'post-1',
    title: 'US inflation decelerating in boost to economic outlook and Federal Reserve targets',
    subtitle: 'Consumer price index rises moderately while labor resilience persists across key sectors.',
    slug: 'us-inflation-decelerating-in-boost-to-economic-outlook',
    excerpt: 'Consumer price indices reflect cooling price pressures, providing policymakers greater latitude as market confidence rebounds.',
    featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    category: 'Business',
    tags: ['Inflation', 'Federal Reserve', 'Global Economy'],
    author: {
      id: 'u-3',
      name: 'Marvin McKinney',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Author',
    },
    status: 'published',
    publishedAt: '2026-11-08 07:10',
    updatedAt: '2026-11-08 07:15',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: true,
    isTrending: true,
    isFeatured: true,
    isEditorPick: true,
    isHomepageSlider: true,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'US Inflation Decelerating: Key Boost for Economic Momentum',
      description: 'Comprehensive analysis on the slowing US inflation figures, consumer price trends, and Federal Reserve policy implications.',
      focusKeyword: 'US inflation',
      score: 92,
    },
    blocks: [
      {
        id: 'b-1',
        type: 'paragraph',
        content: 'WASHINGTON — The latest release from the Bureau of Labor Statistics revealed that headline inflation eased notably over the previous quarter, reassuring market participants and signalling a stabilizing path for monetary policy.',
      },
      {
        id: 'b-2',
        type: 'heading',
        level: 2,
        content: 'Persistent Moderation Across Core Goods and Energy',
      },
      {
        id: 'b-3',
        type: 'paragraph',
        content: 'Declines in global freight expenses and energy commodities were major contributors. While service inflation demonstrated some stickiness, rental metrics and used vehicle indices recorded steady softening.',
      },
      {
        id: 'b-4',
        type: 'quote',
        content: 'Today’s inflation read confirms that the restrictive policy stance has successfully re-anchored medium-term inflation expectations without dampening employment.',
        caption: 'Dr. Sarah Lin, Chief Global Economist',
      },
      {
        id: 'b-5',
        type: 'paragraph',
        content: 'Financial equities rallied following the morning release, with the S&P 500 and tech-heavy Nasdaq both climbing more than 1.4% in early morning trading.',
      },
    ],
    content: 'Full story on US inflation easing...',
  },
  {
    id: 'post-2',
    title: 'Diplomatic envoys agree on multilateral framework for clean international shipping corridors',
    subtitle: 'Over 30 maritime nations sign landmark agreement to decarbonize coastal trade lanes by 2035.',
    slug: 'diplomatic-envoys-agree-multilateral-clean-shipping-framework',
    excerpt: 'Historic agreement paves the way for zero-emission bunkering stations and synchronized maritime customs.',
    featuredImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
    category: 'Politics',
    tags: ['Global Economy', 'Clean Energy'],
    author: {
      id: 'u-2',
      name: 'Jenny Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Editor',
    },
    status: 'published',
    publishedAt: '2026-11-08 06:40',
    updatedAt: '2026-11-08 06:50',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: true,
    isFeatured: true,
    isEditorPick: true,
    isHomepageSlider: true,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'Multilateral Clean Shipping Corridors Agreement Reached',
      description: 'Thirty countries sign treaty establishing green maritime corridors with zero-emission bunkering standards.',
      focusKeyword: 'clean shipping corridors',
      score: 88,
    },
    blocks: [
      {
        id: 'b-10',
        type: 'paragraph',
        content: 'GENEVA — High-level maritime delegates concluded round-the-clock negotiations today, officially adopting standard guidelines for green maritime transit routes linking Asia, Europe, and North America.',
      },
      {
        id: 'b-11',
        type: 'heading',
        level: 2,
        content: 'Key Pillars of the 2035 Accord',
      },
      {
        id: 'b-12',
        type: 'paragraph',
        content: 'Under the agreement, participating ports will deploy rapid shoreside electric power and certified green methanol refuelling facilities along major trading arteries.',
      },
    ],
    content: 'Full story on international clean shipping treaty...',
  },
  {
    id: 'post-3',
    title: 'Modern parenting and work-life balance: How remote hybrid culture reshaped household routines',
    subtitle: 'Sociological study tracking 10,000 households shows measurable gains in child engagement and well-being.',
    slug: 'modern-parenting-work-life-balance-hybrid-culture',
    excerpt: 'Surveys show dual-income households spend 35% more quality time with children through flexible schedules.',
    featuredImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
    category: "Family's",
    tags: ['Health Tech'],
    author: {
      id: 'u-5',
      name: 'Cody Fisher',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      role: 'Contributor',
    },
    status: 'published',
    publishedAt: '2026-11-07 19:20',
    updatedAt: '2026-11-07 20:00',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: false,
    isFeatured: false,
    isEditorPick: false,
    isHomepageSlider: false,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'Modern Parenting & Work-Life Harmony in Hybrid Work Era',
      description: 'How modern flexible work arrangements are transforming family schedules, youth wellness, and parental presence.',
      focusKeyword: 'modern parenting',
      score: 85,
    },
    blocks: [
      {
        id: 'b-20',
        type: 'paragraph',
        content: 'Recent sociological metrics published by the Urban Family Institute indicate an unprecedented realignment of parental daily priorities.',
      },
    ],
    content: 'Full story on modern parenting and remote work...',
  },
  {
    id: 'post-4',
    title: 'Next-Generation Quantum Processing Unit Achieves Room-Temperature Coherence Breakthrough',
    subtitle: 'Researchers demonstrate 1,024 qubits maintaining entangled states without cryogenic cooling.',
    slug: 'quantum-processing-unit-room-temperature-breakthrough',
    excerpt: 'Breakthrough in synthetic diamond matrix structures enables high-performance quantum computing at standard atmospheric temperatures.',
    featuredImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    category: 'Technology',
    tags: ['Artificial Intelligence', 'Cybersecurity'],
    author: {
      id: 'u-4',
      name: 'Robert Fox',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Author',
    },
    status: 'published',
    publishedAt: '2026-11-07 15:45',
    updatedAt: '2026-11-07 16:10',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: true,
    isTrending: true,
    isFeatured: true,
    isEditorPick: true,
    isHomepageSlider: true,
    isAiGenerated: false,
    aiApprovalStatus: 'approved',
    seo: {
      title: 'Room-Temperature Quantum Computing Breakthrough Announced',
      description: 'Quantum engineers unlock room-temperature coherence using diamond lattices, accelerating practical quantum technology.',
      focusKeyword: 'quantum computing',
      score: 95,
    },
    blocks: [
      {
        id: 'b-30',
        type: 'paragraph',
        content: 'CAMBRIDGE — In what physicists are calling a monumental leap for information science, researchers have demonstrated sustained quantum coherence without liquid helium refrigeration.',
      },
    ],
    content: 'Full story on quantum breakthrough...',
  },
  {
    id: 'post-5',
    title: 'AI In Healthcare: Automated Clinical Diagnostics Receive Universal Regulatory Clearance',
    subtitle: 'Diagnostic neural models demonstrate 99.4% precision in early oncological detection trials.',
    slug: 'ai-healthcare-automated-clinical-diagnostics-clearance',
    excerpt: 'Hospitals across 15 nations initiate rollout of real-time imaging diagnostic copilot tools for clinical practitioners.',
    featuredImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    category: 'Health',
    tags: ['Artificial Intelligence', 'Health Tech'],
    author: {
      id: 'u-2',
      name: 'Jenny Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Editor',
    },
    status: 'draft',
    publishedAt: '2026-11-08 09:00',
    updatedAt: '2026-11-08 09:15',
    views: 0,
    commentsCount: 0,
    sharesCount: 0,
    isBreaking: false,
    isTrending: true,
    isFeatured: false,
    isEditorPick: false,
    isHomepageSlider: false,
    isAiGenerated: true,
    aiApprovalStatus: 'pending', // Requires editorial approval!
    editorialNotes: 'Generated by AI News Assistant. Editor review required before publishing to verify clinical trial citations.',
    seo: {
      title: 'AI Clinical Diagnostics Cleared for Hospital Deployment',
      description: 'International health regulators approve AI diagnostic suite for early oncological imaging.',
      focusKeyword: 'AI healthcare diagnostics',
      score: 87,
    },
    blocks: [
      {
        id: 'b-40',
        type: 'paragraph',
        content: 'Health oversight agencies have authorized the clinical deployment of deep learning diagnostic networks following rigorous multi-center blinded trials.',
      },
    ],
    content: 'Draft content awaiting review...',
  },
];

// Seed Ad Placements matching Screenshot 2 exactly!
const initialAds: AdPlacement[] = [
  { id: 'ad-1', name: 'Author Profile - Mobile Top', key: 'author_mobile_top', type: 'Code', size: '320x100', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'mobile', customCode: '<!-- Ad: Author Mobile Top -->' },
  { id: 'ad-2', name: 'Author Profile - Sidebar Top', key: 'author_sidebar_1', type: 'Code', size: '300x250', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'desktop', customCode: '<!-- Ad: Author Sidebar 1 -->' },
  { id: 'ad-3', name: 'Author Profile - Sidebar Bottom', key: 'author_sidebar_2', type: 'Code', size: '300x250', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'desktop', customCode: '<!-- Ad: Author Sidebar 2 -->' },
  { id: 'ad-4', name: 'Home - Mobile Top', key: 'home_mobile_top', type: 'Code', size: '320x100', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'mobile', customCode: '<!-- Ad: Home Mobile Top -->' },
  { id: 'ad-5', name: 'Home - Sidebar Top', key: 'home_sidebar_top', type: 'Code', size: '300x250', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'desktop', customCode: '<!-- Ad: Home Sidebar Top -->' },
  { id: 'ad-6', name: 'Home - Sidebar Bottom', key: 'home_sidebar_bottom', type: 'Code', size: '300x600', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'desktop', customCode: '<!-- Ad: Home Sidebar Bottom -->' },
  { id: 'ad-7', name: 'Article - Mobile Top', key: 'article_mobile_top', type: 'Code', size: '320x100', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'mobile', customCode: '<!-- Ad: Article Mobile Top -->' },
  { id: 'ad-8', name: 'Article - Sidebar Top', key: 'article_sidebar_top', type: 'Code', size: '300x250', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'desktop', customCode: '<!-- Ad: Article Sidebar Top -->' },
  { id: 'ad-9', name: 'Article - Sidebar Bottom', key: 'article_sidebar_bottom', type: 'Code', size: '300x600', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'desktop', customCode: '<!-- Ad: Article Sidebar Bottom -->' },
  { id: 'ad-10', name: 'Article - Header (All)', key: 'article_header', type: 'Code', size: 'Responsive', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'all', customCode: '<!-- Ad: Article Header All -->' },
  { id: 'ad-11', name: 'Article - After Cover (Rect)', key: 'article_after_cover', type: 'Code', size: '300x250', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'all', customCode: '<!-- Ad: Article After Cover -->' },
  { id: 'ad-12', name: 'Global - Header Top', key: 'global_header_top', type: 'Code', size: 'Responsive', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'all', customCode: '<!-- Ad: Global Header Top -->' },
  { id: 'ad-13', name: 'Global - Mobile Sticky Bottom', key: 'global_sticky_bottom', type: 'Code', size: '320x50', status: 'Active', impressions: 0, clicks: 0, deviceTarget: 'mobile', customCode: '<!-- Ad: Global Mobile Sticky Bottom -->' },
];

// Seed comments matching Screenshot 1 "Latest Comments"
const initialComments: Comment[] = [
  {
    id: 'comm-1',
    postId: 'post-1',
    postTitle: 'US inflation decelerating in boost to economic outlook and Federal Reserve targets',
    authorName: 'Jenny Wilson',
    authorEmail: 'jenny.w@example.com',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    content: 'Great News',
    status: 'approved',
    createdAt: '2 Mins ago',
  },
  {
    id: 'comm-2',
    postId: 'post-1',
    postTitle: 'US inflation decelerating in boost to economic outlook and Federal Reserve targets',
    authorName: 'Marvin McKinney',
    authorEmail: 'marvin.m@example.com',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    content: 'Great News',
    status: 'approved',
    createdAt: '2 Mins ago',
  },
  {
    id: 'comm-3',
    postId: 'post-2',
    postTitle: 'Diplomatic envoys agree on multilateral framework for clean international shipping corridors',
    authorName: 'Robert Fox',
    authorEmail: 'robert.f@example.com',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    content: 'Great News',
    status: 'approved',
    createdAt: '2 Mins ago',
  },
  {
    id: 'comm-4',
    postId: 'post-4',
    postTitle: 'Next-Generation Quantum Processing Unit Achieves Room-Temperature Coherence Breakthrough',
    authorName: 'Cody Fisher',
    authorEmail: 'cody.f@example.com',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    content: 'Great News',
    status: 'approved',
    createdAt: '2 Mins ago',
  },
  {
    id: 'comm-5',
    postId: 'post-3',
    postTitle: 'Modern parenting and work-life balance: How remote hybrid culture reshaped household routines',
    authorName: 'Jane Cooper',
    authorEmail: 'jane.cooper@example.com',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
    content: 'Great News',
    status: 'approved',
    createdAt: '2 Mins ago',
  },
];

const initialPages: Page[] = [
  {
    id: 'page-1',
    title: 'About Alif News 24',
    slug: 'about-us',
    template: 'about',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'About Us | Alif News 24 · Alif Sheen Group',
    seoDescription:
      'Learn about Alif News 24, operated by Alif Sheen Group at official1.online — independent 24/7 digital journalism covering USA, UK, Canada, Australia, and global affairs.',
    content: `## Who We Are
Alif News 24 (available at https://www.official1.online) is an independent, 24/7 multi-edition digital news publication operated by Alif Sheen Group. We deliver timely reporting, in-depth analysis, and clear explainers across Business & Finance, Politics, Technology & AI, Health & Science, World Affairs, and Sports.

## Regional Editions We Serve
To give readers relevant, clutter-free coverage tailored to their region, Alif News 24 publishes dedicated country editions:
- United States Edition (/usa) — US markets, federal policy, technology, and national developments
- United Kingdom Edition (/uk) — UK economy, Westminster policy, technology, and public affairs
- Canada Edition (/canada) — Canadian business, national policy, energy, and innovation
- Australia Edition (/australia) — Australian markets, Asia-Pacific developments, and tech trends
- Global International Desk (/) — Cross-border breaking stories and global perspective

## Our Mission & Editorial Values
Our newsroom is built around clarity, reader utility, and factual integrity. We strive to summarize complex developments in accessible English without sensationalism, clickbait, or misleading claims. Every article published on Alif News 24 undergoes editorial review prior to going live.

## Publisher & Contact Information
- Publication: Alif News 24
- Parent Organization: Alif Sheen Group
- Official Website: https://www.official1.online
- Editorial & Business Email: alifsheenshopping@gmail.com`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-2',
    title: 'Editorial Guidelines & Fact-Checking Policy',
    slug: 'editorial-policy',
    template: 'default',
    status: 'published',
    showInMenu: false,
    showInFooter: true,
    seoTitle: 'Editorial Policy & Fact-Checking Standards | Alif News 24',
    seoDescription:
      'Read Alif News 24 editorial independence guidelines, fact-checking workflow, AI-assisted drafting transparency, and corrections policy.',
    content: `## Journalistic Independence
Alif News 24, published by Alif Sheen Group, maintains strict separation between editorial decisions and advertising or commercial partnerships. Sponsored notices, advertisements, or affiliate placements never influence our news coverage or editorial conclusions.

## Verification & Fact-Checking Process
Before any story is published on https://www.official1.online, our editorial team follows a structured verification standard:
- Primary Source Confirmation: Claims, statistics, and market figures are cross-checked against official government releases, regulatory filings, company disclosures, or established wire reports.
- Clear Attribution: Quotes, projections, and third-party findings are explicitly attributed to their originating organization or spokesperson.
- Context & Balance: Developing stories clearly distinguish verified facts from ongoing investigations or analyst commentary.

## Use of AI-Assisted Editorial Tools
Alif News 24 may use automated research and drafting tools to monitor public trend signals and structure initial outlines. However, no automated output is published without human editorial review, fact-checking, rewriting for clarity, and explicit approval by a human editor.

## Corrections & Updates Policy
Accuracy is an ongoing commitment. If an error of fact, spelling, or attribution is identified after publication, we correct the article promptly and clearly reflect the update date. Readers can report corrections directly to our editorial desk at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-3',
    title: 'Contact Us — Alif News 24',
    slug: 'contact',
    template: 'contact',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'Contact Us | Alif News 24 · Alif Sheen Group',
    seoDescription:
      'Contact the Alif News 24 editorial desk and Alif Sheen Group for news tips, article corrections, privacy inquiries, and advertising partnerships.',
    content: `## Reach Our Editorial & Management Team
We welcome reader feedback, verified news tips, correction requests, and advertising or partnership inquiries at Alif News 24 (Alif Sheen Group).

## Official Contact Channels
- General Inquiries & Newsroom Desk: alifsheenshopping@gmail.com
- Corrections & Fact-Check Requests: alifsheenshopping@gmail.com (Please include the article URL and specific details)
- Advertising, AdSense & Commercial Partnerships: alifsheenshopping@gmail.com
- Privacy & Data Removal Requests: alifsheenshopping@gmail.com
- Official Website: https://www.official1.online

## Response Timeline
Our editorial team reviews incoming messages daily and typically responds within 24 to 48 business hours. You may also use the direct contact form below to send a message to our desk.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-4',
    title: 'Privacy Policy & Advertising Disclosure',
    slug: 'privacy-policy',
    template: 'privacy',
    status: 'published',
    showInMenu: false,
    showInFooter: true,
    seoTitle: 'Privacy Policy & Cookies Disclosure | Alif News 24',
    seoDescription:
      'Privacy Policy for Alif News 24 (official1.online) by Alif Sheen Group covering data collection, cookies, Google AdSense advertising, GDPR, and CCPA rights.',
    content: `## Introduction
At Alif News 24, accessible from https://www.official1.online and operated by Alif Sheen Group, protecting the privacy of our visitors is a top priority. This Privacy Policy explains what information is collected when you visit our website and how it is used.

## Information We Collect
- Log Files & Technical Data: Like most standard web servers and news portals, we may log non-identifying technical metadata such as IP-derived country region (used solely to route readers to the relevant country edition), browser type, device category, referring pages, and timestamps.
- Information You Voluntarily Provide: When you subscribe to our newsletter, submit a reader comment, or use our contact form, we collect the name, email address, and message content you choose to provide.

## Cookies and Web Beacons
Alif News 24 uses essential browser cookies and local storage to remember reader preferences (such as dark/light display mode, edition selection, and comment moderation notices). You can disable or clear cookies anytime through your browser settings.

## Google AdSense & Third-Party Advertising Partners
Third-party vendors, including Google, use cookies to serve advertisements based on a user's prior visits to https://www.official1.online or other websites on the Internet.
- Google's use of advertising cookies enables Google and its partners to serve relevant ads to readers based on their visit to our site and/or other sites across the web.
- Users may opt out of personalized advertising by visiting Google Ads Settings at https://adssettings.google.com.
- Alternatively, users can opt out of third-party vendor use of cookies for personalized advertising by visiting https://www.aboutads.info/choices/.

## Google Analytics
We may use Google Analytics to measure aggregated site traffic, page performance, and readership trends. Analytics data helps us improve editorial quality and site speed without selling personal data to third parties.

## Regional Privacy Rights (GDPR, CCPA, PIPEDA & Australia Privacy Act)
- UK & EEA Visitors (GDPR): You have the right to request access to, correction of, or deletion of personal data you provided directly (such as newsletter subscriptions or comments).
- California Residents (CCPA/CPRA): Alif News 24 does not sell your personal information. You may request disclosure or deletion of any voluntarily submitted personal data.
- Canadian & Australian Visitors: We adhere to applicable consent, transparency, and data minimization principles under PIPEDA and Australian Privacy Principles.

## Children's Privacy
Alif News 24 does not knowingly collect personally identifiable information from children under the age of 13. If you believe a child has submitted personal data on our site, please contact us immediately so we can remove it.

## Contact Us Regarding Privacy
If you have questions about this Privacy Policy or wish to exercise your data rights, contact Alif Sheen Group at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-5',
    title: 'Terms of Service',
    slug: 'terms-of-service',
    template: 'terms',
    status: 'published',
    showInMenu: false,
    showInFooter: true,
    seoTitle: 'Terms of Service | Alif News 24 · Alif Sheen Group',
    seoDescription:
      'Terms and Conditions governing the use of Alif News 24 (official1.online), operated by Alif Sheen Group.',
    content: `## Acceptance of Terms
By accessing or reading Alif News 24 at https://www.official1.online, operated by Alif Sheen Group, you agree to comply with these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, please discontinue use of the website.

## Intellectual Property Rights
Unless otherwise stated, Alif Sheen Group and Alif News 24 own or license the editorial articles, layout, logos, graphics, and compilations published on this website. You may view, read, and share links to our articles for personal, non-commercial use. Republishing full articles, scraping content automatically, or redistributing materials commercially without prior written permission is prohibited.

## Reader Comments & User Conduct
Readers who post comments or submit contact messages agree not to publish unlawful, defamatory, abusive, hateful, spam, or copyright-infringing material. Alif News 24 reserves the right to moderate, edit, or remove any user-submitted content at our sole discretion.

## Third-Party Links & Advertisements
Our website may display third-party advertisements (including Google AdSense) and links to external reference websites. Alif News 24 is not responsible for the content, privacy policies, or practices of external third-party websites.

## Limitation of Liability
All content on Alif News 24 is provided on an "as is" and "as available" basis without warranties of any kind. Alif Sheen Group shall not be liable for any direct, indirect, or incidental damages arising from your access to or reliance on information published on this site.

## Changes to These Terms
We may revise these Terms of Service from time to time without prior notice. Continued use of https://www.official1.online constitutes acceptance of the current version of these terms. For inquiries, contact alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-6',
    title: 'Disclaimer',
    slug: 'disclaimer',
    template: 'default',
    status: 'published',
    showInMenu: false,
    showInFooter: true,
    seoTitle: 'Editorial & Legal Disclaimer | Alif News 24',
    seoDescription:
      'Important editorial, financial, medical, and external link disclaimers for readers of Alif News 24 (official1.online).',
    content: `## General Information Purpose
The articles, reports, summaries, and commentary published on Alif News 24 (https://www.official1.online) by Alif Sheen Group are provided strictly for general informational and journalistic purposes. While we work diligently to verify accuracy at the time of publication, news, statistics, and market figures change rapidly.

## No Professional, Financial, Legal, or Medical Advice
- Business & Financial News: Market coverage, inflation updates, stock commentary, and economic articles are never personalized financial, tax, or investment advice. Always consult a licensed financial advisor before making investment decisions.
- Health & Science News: Health articles report on public research and medical developments and are not a substitute for professional medical diagnosis, advice, or treatment.
- Legal & Policy Coverage: Legislative or regulatory summaries do not constitute formal legal advice.

## External Links & Third-Party Views
References or outbound links to official reports, research studies, or external sites are included for reader convenience. Inclusion of a link does not imply endorsement of every view or product hosted on external websites. Opinions expressed in labeled Opinion columns belong solely to their respective authors.

## Contact
If you have questions regarding this Disclaimer, email us at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-7',
    title: 'Business & Finance — Markets, Economy & Corporate Coverage',
    slug: 'business-finance',
    template: 'default',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'Business & Finance News | Markets & Economy | Alif News 24',
    seoDescription:
      'Read verified Business & Finance coverage on Alif News 24 by Alif Sheen Group — market trends, inflation data, central bank updates, and corporate news across USA, UK, Canada & Australia.',
    content: `## Business & Finance Coverage at Alif News 24
Welcome to the Business & Finance Desk of Alif News 24, operated by Alif Sheen Group (https://www.official1.online). Our business desk delivers clear, fact-checked reporting on global financial markets, macroeconomic policy, corporate strategy, banking, consumer finance, and emerging industries.

## Key Topics We Cover
- Global & Regional Stock Markets: Daily analysis of major equity indices, corporate earnings reports, and sector performance across the United States, United Kingdom, Canada, and Australia.
- Central Banks & Monetary Policy: Interest rate decisions, inflation trends, bond yields, and economic policy updates from the Federal Reserve, Bank of England, Bank of Canada, and Reserve Bank of Australia.
- Corporate & Startup Economy: Mergers, acquisitions, technology investments, artificial intelligence commercialization, supply-chain developments, and regulatory shifts.
- Personal Finance & Cost of Living: Practical explainers on housing affordability, employment data, taxation changes, energy prices, and household financial trends.

## Editorial Standards & Market Reporting
Accuracy and clarity come first in financial reporting. Every business article published on Alif News 24 relies on primary financial disclosures, official statistical releases, and verified institutional reports. We avoid hype, clickbait stock tips, and unverified market rumors.

## Important Financial Disclaimer
Articles and market summaries published by the Business & Finance Desk are strictly for informational and journalistic purposes. Nothing on Alif News 24 constitutes personalized investment, tax, or financial advice. Readers should consult a licensed financial advisor before making investment or business decisions.

## Contact the Business Desk
For corporate press releases, market corrections, or editorial inquiries, please reach out to our newsroom at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-8',
    title: 'Politics & Policy — Governance, Elections & Public Affairs',
    slug: 'politics-policy',
    template: 'default',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'Politics & Policy News | Elections & Government Updates | Alif News 24',
    seoDescription:
      'Follow non-partisan Politics & Policy news on Alif News 24 by Alif Sheen Group — covering legislation, elections, diplomacy, and governance across USA, UK, Canada & Australia.',
    content: `## Politics & Policy Coverage at Alif News 24
Welcome to the Politics & Policy Desk of Alif News 24, operated by Alif Sheen Group (https://www.official1.online). Our politics desk provides balanced, non-partisan, and fact-checked reporting on legislation, public policy, elections, international diplomacy, and regulatory affairs.

## Core Areas We Cover
- National Governance & Legislation: Clear coverage of parliamentary debates, congressional bills, executive orders, federal budgets, and high-court rulings across the United States, United Kingdom, Canada, and Australia.
- Elections & Public Opinion: Verified updates on election schedules, policy platforms, voter initiatives, and official electoral commission announcements without partisan bias.
- Foreign Affairs & Diplomacy: Trade agreements, international summits, defense alliances, immigration policy, and cross-border diplomatic developments.
- Regulation & Public Services: Policy decisions affecting healthcare, taxation, clean energy transitions, artificial intelligence governance, and digital privacy laws.

## Non-Partisan Editorial Commitment
Alif News 24 is committed to fair, independent journalism. Our political reporting separates verified facts and official public records from opinion or commentary. We attribute all statements to named officials, legislative documents, or recognized public institutions and strive to present multiple viewpoints on contested policy debates.

## Corrections & Reader Feedback
If you identify a factual error, outdated legislative status, or attribution issue in any political report, please notify our editorial team at alifsheenshopping@gmail.com with the article link so we can review and update it promptly.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-9',
    title: 'Technology & AI — Innovation, Software & Digital Trends',
    slug: 'technology-ai',
    template: 'default',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'Technology & AI News | Cybersecurity & Innovation | Alif News 24',
    seoDescription:
      'Stay updated on Technology & AI news at Alif News 24 by Alif Sheen Group — covering artificial intelligence, cybersecurity, consumer tech, and digital policy.',
    content: `## Technology & AI Coverage at Alif News 24
Welcome to the Technology & AI Desk of Alif News 24, operated by Alif Sheen Group (https://www.official1.online). Our technology desk covers how artificial intelligence, software platforms, semiconductors, cybersecurity, and consumer electronics are reshaping business and everyday life.

## Key Topics We Cover
- Artificial Intelligence & Machine Learning: Major model releases, enterprise AI adoption, automation trends, productivity tools, and AI safety regulations across the USA, UK, Canada, and Australia.
- Cybersecurity & Digital Privacy: Verified reports on software vulnerabilities, data protection laws, cloud infrastructure resilience, and practical digital security guidance for readers.
- Big Tech, Startups & Hardware: Product launches, semiconductor breakthroughs, telecom and 5G rollouts, electric mobility, and technology sector earnings.
- Consumer Tech & Platforms: Clear explainers on operating system updates, developer tools, social platforms, and emerging digital media ecosystems.

## Verification & Accuracy Standards
Technology moves quickly, and speculation is common. At Alif News 24, we verify technical claims against official engineering blogs, peer-reviewed benchmarks, regulatory notices, and primary company announcements before publishing.

## Contact the Technology Desk
For software briefings, research updates, or factual corrections, contact our editorial team at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-10',
    title: 'Health & Science — Medical Research, Wellness & Discovery',
    slug: 'health-science',
    template: 'default',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'Health & Science News | Medical Research & Discovery | Alif News 24',
    seoDescription:
      'Read evidence-based Health & Science reporting on Alif News 24 by Alif Sheen Group — medical research, biotech, space science, and public health updates.',
    content: `## Health & Science Coverage at Alif News 24
Welcome to the Health & Science Desk of Alif News 24, published by Alif Sheen Group (https://www.official1.online). We report on public health updates, clinical breakthroughs, medical technology, climate science, space exploration, and evidence-based wellness research.

## What We Cover
- Public Health & Healthcare Policy: Verified updates from health agencies, hospital systems, vaccination programs, and healthcare affordability initiatives across the US, UK, Canada, and Australia.
- Medical Research & Biotech: Clear, accessible summaries of peer-reviewed clinical studies, diagnostic technologies, pharmaceutical approvals, and preventive care findings.
- Space, Climate & Physical Sciences: Mission updates from space agencies, clean energy science, quantum computing research, and environmental monitoring reports.
- Everyday Health Literacy: Fact-checked explainers on nutrition science, mental health awareness, sleep research, and preventive health habits.

## Evidence-First Reporting & Medical Disclaimer
Our health and science coverage prioritizes peer-reviewed journals, university research institutions, and official public health bodies. All Health & Science articles on Alif News 24 are strictly for general informational and educational purposes and must never be treated as professional medical advice, diagnosis, or treatment. Always consult a qualified physician or healthcare provider regarding any medical condition.

## Contact & Corrections
To submit verified research updates or request a factual correction, email our desk at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-11',
    title: 'Sports & World — Global Affairs & International Athletics',
    slug: 'sports-world',
    template: 'default',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'Sports & World News | Global Events & Major Leagues | Alif News 24',
    seoDescription:
      'Follow Sports & World coverage on Alif News 24 by Alif Sheen Group — major leagues, international tournaments, world affairs, and global trends.',
    content: `## Sports & World Coverage at Alif News 24
Welcome to the Sports & World Desk of Alif News 24, operated by Alif Sheen Group (https://www.official1.online). Here we bring together fast-moving international developments alongside major global and regional sporting events.

## Core Coverage Areas
- Major Sports Leagues & Tournaments: Match previews, tournament standings, player milestones, and official updates across NFL, NBA, Premier League football, cricket, tennis, Formula 1, and international championships.
- Sports Business & Governance: Broadcasting rights, league policies, athlete safety rules, and stadium or host-city developments across the USA, UK, Canada, and Australia.
- World Affairs & Global Events: Diplomatic summits, humanitarian updates, infrastructure projects, aviation, and cross-border economic trends shaping international headlines.
- Culture, Society & Trending Topics: High-interest public events, major cultural milestones, and global trends explained with clear factual context.

## Journalistic Standards
All scores, statistics, schedules, and international dispatches are checked against official league records, federation announcements, and verified international reporting before publication.

## Contact the Sports & World Desk
Have a news tip, schedule correction, or press inquiry? Email us at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
  {
    id: 'page-12',
    title: 'Opinion & Editorial — Analysis, Commentary & Viewpoints',
    slug: 'opinion-editorial',
    template: 'default',
    status: 'published',
    showInMenu: true,
    showInFooter: true,
    seoTitle: 'Opinion & Editorial | Analysis & Commentary | Alif News 24',
    seoDescription:
      'Read labeled Opinion & Editorial commentary on Alif News 24 by Alif Sheen Group — thoughtful perspectives on economy, policy, technology, and global society.',
    content: `## Opinion & Editorial Standards at Alif News 24
Welcome to the Opinion & Editorial Desk of Alif News 24, published by Alif Sheen Group (https://www.official1.online). Our opinion section provides thoughtful commentary, policy analysis, economic perspectives, and essays on major issues shaping the United States, United Kingdom, Canada, Australia, and the wider world.

## Separation of News and Opinion
At Alif News 24, we maintain a strict, transparent boundary between straight news reporting and opinion journalism:
- Clearly Labeled Commentary: Every column, op-ed, or editorial analysis published in this section is clearly labeled as Opinion or Editorial so readers always know they are reading perspective and interpretation rather than straight news.
- Factual Grounding: While opinion pieces present arguments and viewpoints, authors are still expected to ground factual claims in accurate, verifiable public records and honest attribution.
- Diverse & Constructive Debate: We value reasoned discussion on technology, economic policy, public institutions, and social change while rejecting hate speech, harassment, and misinformation.

## Author Responsibility Disclaimer
The views and opinions expressed in signed Opinion columns belong solely to the respective authors and contributors, and do not necessarily represent the official position of Alif Sheen Group or all editorial staff.

## Submit Commentary or Feedback
Readers and guest contributors wishing to respond to an editorial or propose a column may contact our editors at alifsheenshopping@gmail.com.`,
    updatedAt: '2026-11-18',
  },
];

const initialMedia: MediaItem[] = [
  { id: 'm-1', name: 'stock-market-rally.jpg', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80', type: 'image', size: '284 KB', dimensions: '1920x1080', format: 'image/jpeg', altText: 'Wall Street financial exchange screens', uploadedAt: '2026-11-08' },
  { id: 'm-2', name: 'container-ship-port.jpg', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80', type: 'image', size: '315 KB', dimensions: '1920x1280', format: 'image/jpeg', altText: 'Modern commercial cargo ship dock', uploadedAt: '2026-11-08' },
  { id: 'm-3', name: 'family-living-room.jpg', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80', type: 'image', size: '240 KB', dimensions: '1600x1067', format: 'image/jpeg', altText: 'Happy family gathered around home workspace', uploadedAt: '2026-11-07' },
  { id: 'm-4', name: 'quantum-chip-circuit.jpg', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80', type: 'image', size: '412 KB', dimensions: '2048x1365', format: 'image/jpeg', altText: 'Laser-cooled quantum processor array', uploadedAt: '2026-11-07' },
  { id: 'm-5', name: 'clinical-scanner-doctor.jpg', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80', type: 'image', size: '350 KB', dimensions: '1920x1080', format: 'image/jpeg', altText: 'Physician reviewing high-definition MRI scan', uploadedAt: '2026-11-06' },
];

const initialSettings: SystemSettings = {
  siteName: 'Alif News 24',
  tagline: "Alif Sheen Group · 24/7 Independent News & Multi-Country Coverage",
  siteUrl: 'https://www.official1.online',
  language: 'English',
  timezone: 'America/New_York (UTC-5)',
  permalinkStructure: '/%year%/%month%/%postname%/',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#E11D48',
  darkMode: false,
  googleAnalyticsId: 'G-AN24820921',
  searchConsoleCode: 'google-site-verification=alif-news-24-enterprise-auth-key-88',
  adsenseClientId: 'ca-pub-9386736849071234',
  autoAds: true,
  smtpHost: 'smtp.official1.online',
  smtpPort: '587',
  smtpUser: 'alifsheenshopping@gmail.com',
  smtpSecure: true,
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://www.official1.online/sitemap.xml\nSitemap: https://www.official1.online/google-news-sitemap.xml',
  sitemapAutoPing: true,
  backupDaily: true,
  backupTime: '02:00 UTC',
  lastBackupAt: 'Today at 02:00 AM (Automated)',
  ipBlacklist: ['198.51.100.44', '203.0.113.19'],
  ipWhitelist: ['127.0.0.1', '192.168.1.1/24'],
  maxLoginAttempts: 5,
  breakingNewsTickerActive: true,
  breakingNewsText: 'BREAKING: US Federal Reserve signals data-driven interest rate adjustments | Wall Street rallies on cooler inflation index | Bipartisan infrastructure accords advance in Congress',
};

const initialLogs: ActivityLog[] = [
  { id: 'log-1', userId: 'u-1', userName: 'Administrator', action: 'System Backup Completed', details: 'Automated daily database snapshot verified and encrypted.', ip: '127.0.0.1', timestamp: '2026-11-08 02:00:00', level: 'success' },
  { id: 'log-2', userId: 'u-3', userName: 'Marvin McKinney', action: 'Article Published', details: 'Published "US inflation decelerating in boost to economic outlook"', ip: '192.168.1.104', timestamp: '2026-11-08 07:10:22', level: 'info' },
  { id: 'log-3', userId: 'u-2', userName: 'Jenny Wilson', action: 'AI Draft Generated', details: 'Created draft "AI In Healthcare: Automated Clinical Diagnostics" (Pending Approval)', ip: '192.168.1.112', timestamp: '2026-11-08 09:15:00', level: 'warning' },
  { id: 'log-4', userId: 'u-1', userName: 'Administrator', action: 'Ad Placement Updated', details: 'Updated status for "Global - Header Top" placement.', ip: '192.168.1.104', timestamp: '2026-11-08 09:25:10', level: 'info' },
];

const initialBackups: BackupRecord[] = [
  { id: 'bk-1', fileName: 'alif_news_24_cms_backup.json', size: '1.42 MB', createdAt: '2026-11-08 02:00:00', type: 'automated', itemsCount: 11 },
  { id: 'bk-2', fileName: 'alif_news_24_cms_backup.json', size: '1.38 MB', createdAt: '2026-11-07 02:00:00', type: 'automated', itemsCount: 11 },
  { id: 'bk-3', fileName: 'alif_news_24_cms_backup.json', size: '1.35 MB', createdAt: '2026-11-06 18:45:00', type: 'manual', itemsCount: 11 },
];

const initialSubscribers: NewsletterSubscriber[] = [
  { id: 'sub-1', email: 'investor.daily@vanguard.com', name: 'Vanguard Research', status: 'active', subscribedAt: '2026-10-15', tags: ['Business', 'Breaking'] },
  { id: 'sub-2', email: 'techdesk@reuters.net', name: 'Reuters Tech', status: 'active', subscribedAt: '2026-10-22', tags: ['Technology', 'AI'] },
  { id: 'sub-3', email: 'sarah.palmer@harvard.edu', name: 'Sarah Palmer', status: 'active', subscribedAt: '2026-11-01', tags: ['Politics', 'Health'] },
];

const initialCampaigns: NewsletterCampaign[] = [
  { id: 'camp-1', subject: 'Morning Wire: US Inflation Decelerates, Markets Rally', template: 'Daily Morning Dispatch', status: 'sent', sentAt: '2026-11-08 08:00', recipientsCount: 3, openRate: '100%', clickRate: '66.7%' },
  { id: 'camp-2', subject: 'Weekend Deep Dive: Room-Temperature Quantum Breakthrough', template: 'Weekend In-Depth Feature', status: 'draft', recipientsCount: 3 },
];

export const initialFooterConfig: FooterConfig = {
  aboutText:
    'Alif News 24 is an independent multi-edition digital news publication operated by Alif Sheen Group (official1.online), delivering verified coverage across the USA, UK, Canada, Australia, and global affairs.',
  publisherText: 'Published by Alif Sheen Group · official1.online',
  copyrightText: '© 2026 Alif Sheen Group · Alif News 24. All rights reserved.',
  columns: [
    {
      id: 'col-1',
      title: 'News Desks',
      items: [
        { id: 'item-1-1', label: 'Business & Finance', url: '/category/business' },
        { id: 'item-1-2', label: 'Politics & Policy', url: '/category/politics' },
        { id: 'item-1-3', label: 'Technology & AI', url: '/category/technology' },
        { id: 'item-1-4', label: 'Health & Science', url: '/category/health' },
        { id: 'item-1-5', label: 'Sports & World', url: '/category/sports' },
        { id: 'item-1-6', label: 'Opinion & Editorial', url: '/category/opinion' },
      ],
    },
    {
      id: 'col-2',
      title: 'Company & Legal',
      items: [
        { id: 'item-2-1', label: 'About Alif News 24', url: '/page/about-us' },
        { id: 'item-2-2', label: 'Editorial & Fact-Check Policy', url: '/page/editorial-policy' },
        { id: 'item-2-3', label: 'Contact Us', url: '/page/contact' },
        { id: 'item-2-4', label: 'Privacy Policy', url: '/page/privacy-policy' },
        { id: 'item-2-5', label: 'Terms of Service', url: '/page/terms-of-service' },
        { id: 'item-2-6', label: 'Disclaimer', url: '/page/disclaimer' },
      ],
    },
    {
      id: 'col-3',
      title: 'Regional Editions',
      items: [
        { id: 'item-3-1', label: 'USA Edition', url: '/usa' },
        { id: 'item-3-2', label: 'UK Edition', url: '/uk' },
        { id: 'item-3-3', label: 'Canada Edition', url: '/canada' },
        { id: 'item-3-4', label: 'Australia Edition', url: '/australia' },
        { id: 'item-3-5', label: 'RSS News Feed', url: '/rss' },
        { id: 'item-3-6', label: 'Staff & Reader Portal', url: '#login' },
      ],
    },
  ],
};

class DatabaseService {
  private state: DatabaseState;
  private listeners = new Set<() => void>();
  private isSyncingPolicyPages = false;

  constructor() {
    this.state = this.loadFromStorage();
    this.initRealtimeSync();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Subscriber notification error:', e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('db:updated'));
    }
  }

  private initRealtimeSync(): void {
    firestoreSync.start({
      onPostsUpdate: (posts) => {
        this.state.posts = posts;
        this.save();
      },
      onCategoriesUpdate: (categories) => {
        this.state.categories = categories;
        this.save();
      },
      onTagsUpdate: (tags) => {
        this.state.tags = tags;
        this.save();
      },
      onPagesUpdate: (pages) => {
        this.state.pages = this.mergeUpgradedPolicyPages(pages);
        this.save();
        if (this.hasStaleOrMissingPolicyPages(pages)) {
          this.syncAdSensePolicyPages(false, true).catch(() => {});
        }
      },
      onAdsUpdate: (ads) => {
        this.state.ads = ads;
        this.save();
      },
      onMediaUpdate: (media) => {
        this.state.media = media;
        this.save();
      },
      onCommentsUpdate: (comments) => {
        this.state.comments = comments;
        this.save();
      },
      onPublicSettingsUpdate: (updates) => {
        this.state.settings = { ...this.state.settings, ...updates };
        if (this.state.settings.siteUrl === 'https://alifnews24.com') {
          this.state.settings.siteUrl = 'https://www.official1.online';
          this.state.settings.robotsTxt = initialSettings.robotsTxt;
        }
        this.save();
      },
      onFooterConfigUpdate: (footer) => {
        const isLegacyFooter =
          (footer.publisherText || '').includes('Alif Media Group') ||
          !footer.columns?.some((c) => c.items?.some((it) => it.url === '/page/terms-of-service'));
        this.state.footerConfig = isLegacyFooter ? JSON.parse(JSON.stringify(initialFooterConfig)) : footer;
        this.save();
        if (isLegacyFooter) {
          this.syncAdSensePolicyPages(false, true).catch(() => {});
        }
      },
      onAdminSettingsUpdate: (updates) => {
        this.state.settings = { ...this.state.settings, ...updates };
        this.save();
      },
      onUsersUpdate: (users) => {
        this.state.users = users;
        this.save();
      },
      onSubscribersUpdate: (subscribers) => {
        this.state.subscribers = subscribers;
        this.save();
      },
      onCampaignsUpdate: (campaigns) => {
        this.state.campaigns = campaigns;
        this.save();
      },
      onLogsUpdate: (logs) => {
        this.state.logs = logs;
        this.save();
      },
      getSeedState: () => ({
        posts: this.state.posts,
        categories: this.state.categories,
        tags: this.state.tags,
        pages: this.state.pages,
        ads: this.state.ads,
        media: this.state.media,
        comments: this.state.comments,
        users: this.state.users,
        settings: this.state.settings,
        footerConfig: this.getFooterConfig(),
        subscribers: this.state.subscribers,
        campaigns: this.state.campaigns,
        logs: this.state.logs,
      }),
    });
  }

  private loadFromStorage(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: DatabaseState = JSON.parse(saved);
        if (!parsed.footerConfig || !Array.isArray(parsed.footerConfig.columns) || (parsed.footerConfig.publisherText || '').includes('Alif Media Group')) {
          parsed.footerConfig = JSON.parse(JSON.stringify(initialFooterConfig));
        }
        if (Array.isArray(parsed.pages)) {
          parsed.pages = this.mergeUpgradedPolicyPages(parsed.pages);
        } else {
          parsed.pages = initialPages;
        }
        if (parsed.settings?.siteUrl === 'https://alifnews24.com') {
          parsed.settings.siteUrl = 'https://www.official1.online';
          parsed.settings.robotsTxt = initialSettings.robotsTxt;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial seed data', e);
    }

    return {
      posts: initialPosts,
      categories: initialCategories,
      tags: initialTags,
      media: initialMedia,
      users: initialUsers,
      ads: initialAds,
      pages: initialPages,
      comments: initialComments,
      subscribers: initialSubscribers,
      campaigns: initialCampaigns,
      settings: initialSettings,
      logs: initialLogs,
      backups: initialBackups,
      currentUser: initialUsers[0],
      footerConfig: initialFooterConfig,
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
    this.notifyListeners();
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getCurrentUser(): User {
    return this.state.currentUser;
  }

  public updateCurrentUser(user: User): void {
    this.state.currentUser = user;
    this.save();
  }

  // -------------------------
  // Log Action Helper
  // -------------------------
  public logAction(action: string, details: string, level: 'info' | 'warning' | 'security' | 'success' = 'info'): void {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      userId: this.state.currentUser.id,
      userName: this.state.currentUser.name,
      action,
      details,
      ip: '192.168.1.104',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      level,
    };
    this.state.logs = [newLog, ...this.state.logs.slice(0, 99)];
    this.save();
    firestoreSync.writeDoc('logs', newLog.id, sanitizeLog(newLog)).catch(() => {});
  }

  // -------------------------
  // Post Operations
  // -------------------------
  public getPosts(): Post[] {
    return this.state.posts.map((p) => ({
      ...p,
      commentsCount: this.state.comments.filter((c) => c.postId === p.id).length,
    }));
  }

  public hasViewedPost(id: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('alif_viewed_posts_v1');
      if (!raw) return false;
      const list = JSON.parse(raw);
      return Array.isArray(list) && list.includes(id);
    } catch {
      return false;
    }
  }

  public incrementPostViews(id: string): void {
    const post = this.state.posts.find((p) => p.id === id);
    if (!post || post.status !== 'published') return;
    if (this.hasViewedPost(id)) return;

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('alif_viewed_posts_v1');
        const list: string[] = raw ? JSON.parse(raw) : [];
        const updated = Array.isArray(list) ? [...list.slice(-499), id] : [id];
        localStorage.setItem('alif_viewed_posts_v1', JSON.stringify(updated));
      } catch {
        // Proceed even if storage quota is full
      }
    }

    post.views = (post.views || 0) + 1;
    this.save();
    firestoreSync.incrementPostViewsRemote(id).catch(() => {});
  }

  public getPostById(id: string): Post | undefined {
    const post = this.state.posts.find((p) => p.id === id);
    if (!post) return undefined;
    return {
      ...post,
      commentsCount: this.state.comments.filter((c) => c.postId === post.id).length,
    };
  }

  public savePost(postData: Partial<Post> & { title: string }): Post {
    const isNew = !postData.id;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const normalizeCats = (cats?: string[], primary?: string, fallback: string = 'Business'): string[] => {
      const merged = [
        ...(Array.isArray(cats) ? cats : []),
        ...(primary ? [primary] : []),
      ]
        .map((c) => String(c || '').trim())
        .filter(Boolean);
      const unique: string[] = [];
      const seen = new Set<string>();
      for (const c of merged) {
        const key = c.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(c);
        }
        if (unique.length >= 10) break;
      }
      return unique.length > 0 ? unique : [fallback];
    };

    let post: Post;
    if (isNew) {
      const id = `post-${Date.now()}`;
      const rawSlug = (postData.slug || postData.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = rawSlug || id;
      const cats = normalizeCats(postData.categories, postData.category, 'Business');
      post = {
        id,
        title: postData.title,
        subtitle: postData.subtitle || '',
        slug,
        content: postData.content || '',
        blocks: postData.blocks || [
          { id: `b-${Date.now()}`, type: 'paragraph', content: postData.content || 'Start writing your news article here...' },
        ],
        excerpt: postData.excerpt || postData.title,
        featuredImage: postData.featuredImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
        category: cats[0],
        categories: cats,
        subcategory: postData.subcategory,
        tags: postData.tags || ['News'],
        author: postData.author || {
          id: this.state.currentUser.id,
          name: this.state.currentUser.name,
          avatar: this.state.currentUser.avatar,
          role: this.state.currentUser.role,
        },
        status: postData.status || (postData.isAiGenerated ? 'pending_review' : 'published'),
        publishedAt: postData.publishedAt || now,
        scheduledAt: postData.scheduledAt,
        updatedAt: now,
        views: postData.views || 0,
        commentsCount: 0,
        sharesCount: 0,
        isBreaking: !!postData.isBreaking,
        isTrending: !!postData.isTrending,
        isFeatured: !!postData.isFeatured,
        isEditorPick: !!postData.isEditorPick,
        isHomepageSlider: !!postData.isHomepageSlider,
        isAiGenerated: !!postData.isAiGenerated,
        aiApprovalStatus: postData.aiApprovalStatus || (postData.isAiGenerated ? 'pending' : 'approved'),
        editorialNotes: postData.editorialNotes,
        targetCountry: postData.targetCountry || 'usa',
        seo: postData.seo || {
          title: postData.title,
          description: postData.excerpt || postData.title,
          focusKeyword: postData.title.split(' ')[0] || 'news',
          score: 85,
        },
        revisions: [
          {
            id: `rev-${Date.now()}`,
            timestamp: now,
            authorName: this.state.currentUser.name,
            title: postData.title,
            summary: 'Initial creation',
            blocksCount: (postData.blocks || []).length || 1,
          },
        ],
      };
      this.state.posts = [post, ...this.state.posts];
      this.logAction('Post Created', `Created article "${post.title}" (${post.status})`, post.isAiGenerated ? 'warning' : 'info');
    } else {
      const index = this.state.posts.findIndex((p) => p.id === postData.id);
      if (index === -1) throw new Error('Post not found');
      const existing = this.state.posts[index];

      const cats = normalizeCats(
        postData.categories ?? existing.categories,
        postData.category ?? existing.category,
        existing.category || 'Business'
      );

      const newRevision = {
        id: `rev-${Date.now()}`,
        timestamp: now,
        authorName: this.state.currentUser.name,
        title: postData.title,
        summary: `Updated: status=${postData.status || existing.status}`,
        blocksCount: (postData.blocks || existing.blocks).length,
      };

      post = {
        ...existing,
        ...postData,
        targetCountry: postData.targetCountry || existing.targetCountry || 'usa',
        category: cats[0],
        categories: cats,
        updatedAt: now,
        revisions: [newRevision, ...(existing.revisions || [])].slice(0, 15),
      };
      this.state.posts[index] = post;
      this.logAction('Post Updated', `Updated article "${post.title}"`, 'info');
    }

    this.save();
    firestoreSync.writeDoc('posts', post.id, sanitizePost(post)).catch(console.error);
    return post;
  }

  public deletePost(id: string, forcePermanent = false): void {
    const post = this.state.posts.find((p) => p.id === id);
    if (!post) return;

    if (post.status !== 'trash' && !forcePermanent) {
      post.status = 'trash';
      this.logAction('Post Moved to Trash', `Article "${post.title}" moved to trash.`, 'warning');
      firestoreSync.writeDoc('posts', post.id, sanitizePost(post)).catch(console.error);
    } else {
      this.state.posts = this.state.posts.filter((p) => p.id !== id);
      this.logAction('Post Permanently Deleted', `Article "${post.title}" permanently removed.`, 'warning');
      firestoreSync.deleteRemoteDoc('posts', id).catch(console.error);
    }
    this.save();
  }

  public duplicatePost(id: string): Post | undefined {
    const original = this.getPostById(id);
    if (!original) return undefined;

    const copyData: Partial<Post> & { title: string } = {
      ...original,
      id: undefined,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      views: 0,
      commentsCount: 0,
      sharesCount: 0,
      isAiGenerated: false,
    };
    return this.savePost(copyData);
  }

  // -------------------------
  // Category Operations
  // -------------------------
  public getCategories(): Category[] {
    return this.state.categories.map((c) => {
      const target = c.name.toLowerCase().trim();
      return {
        ...c,
        count: this.state.posts.filter((p) => {
          const cats = p.categories && p.categories.length > 0 ? p.categories : [p.category];
          return cats.some((pc) => pc.toLowerCase().trim() === target);
        }).length,
      };
    });
  }

  public saveCategory(catData: Partial<Category> & { name: string }): Category {
    if (catData.id) {
      const idx = this.state.categories.findIndex((c) => c.id === catData.id);
      if (idx !== -1) {
        this.state.categories[idx] = { ...this.state.categories[idx], ...catData };
        this.logAction('Category Updated', `Updated category "${catData.name}"`);
        this.save();
        firestoreSync.writeDoc('categories', this.state.categories[idx].id, sanitizeCategory(this.state.categories[idx])).catch(console.error);
        return this.state.categories[idx];
      }
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catData.name,
      slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      parentId: catData.parentId || null,
      color: catData.color || '#0284C7',
      description: catData.description || '',
      image: catData.image,
      count: 0,
      metaTitle: catData.metaTitle,
      metaDescription: catData.metaDescription,
    };
    this.state.categories.push(newCat);
    this.logAction('Category Created', `Created category "${newCat.name}"`);
    this.save();
    firestoreSync.writeDoc('categories', newCat.id, sanitizeCategory(newCat)).catch(console.error);
    return newCat;
  }

  public deleteCategory(id: string): void {
    const cat = this.state.categories.find((c) => c.id === id);
    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    if (cat) this.logAction('Category Deleted', `Deleted category "${cat.name}"`, 'warning');
    this.save();
    firestoreSync.deleteRemoteDoc('categories', id).catch(console.error);
  }

  // -------------------------
  // Tags Operations
  // -------------------------
  public getTags(): Tag[] {
    return this.state.tags.map((t) => ({
      ...t,
      count: this.state.posts.filter((p) =>
        p.tags.some((tag) => tag.toLowerCase().trim() === t.name.toLowerCase().trim())
      ).length,
    }));
  }

  public saveTag(name: string): Tag {
    const cleanName = name.trim();
    const existing = this.state.tags.find((t) => t.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    const cleanSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newTag: Tag = {
      id: `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: cleanName || 'news',
      slug: cleanSlug || `tag-${Date.now()}`,
      count: 1,
    };
    this.state.tags.push(newTag);
    this.save();
    firestoreSync.writeDoc('tags', newTag.id, sanitizeTag(newTag)).catch(console.error);
    return newTag;
  }

  public deleteTag(id: string): void {
    this.state.tags = this.state.tags.filter((t) => t.id !== id);
    this.save();
    firestoreSync.deleteRemoteDoc('tags', id).catch(console.error);
  }

  // -------------------------
  // Media Operations
  // -------------------------
  public getMedia(): MediaItem[] {
    return this.state.media;
  }

  public addMediaItem(item: Omit<MediaItem, 'id' | 'uploadedAt'>): MediaItem {
    const newItem: MediaItem = {
      ...item,
      id: `m-${Date.now()}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    this.state.media = [newItem, ...this.state.media];
    this.logAction('Media Uploaded', `Uploaded asset "${newItem.name}" (${newItem.size})`);
    this.save();
    firestoreSync.writeDoc('media', newItem.id, sanitizeMedia(newItem)).catch(console.error);
    return newItem;
  }

  public updateMediaItem(id: string, updates: Partial<MediaItem>): void {
    const idx = this.state.media.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.state.media[idx] = { ...this.state.media[idx], ...updates };
      this.save();
      firestoreSync.writeDoc('media', id, sanitizeMedia(this.state.media[idx])).catch(console.error);
    }
  }

  public deleteMediaItem(id: string): void {
    this.state.media = this.state.media.filter((m) => m.id !== id);
    this.save();
    firestoreSync.deleteRemoteDoc('media', id).catch(console.error);
  }

  // -------------------------
  // Ad Placements Operations
  // -------------------------
  public getAds(): AdPlacement[] {
    return this.state.ads;
  }

  public saveAd(adData: Partial<AdPlacement> & { name: string; key: string }): AdPlacement {
    if (adData.id) {
      const idx = this.state.ads.findIndex((a) => a.id === adData.id);
      if (idx !== -1) {
        this.state.ads[idx] = { ...this.state.ads[idx], ...adData };
        this.logAction('Ad Placement Updated', `Updated placement "${adData.name}"`);
        this.save();
        firestoreSync.writeDoc('ads', this.state.ads[idx].id, sanitizeAd(this.state.ads[idx])).catch(console.error);
        return this.state.ads[idx];
      }
    }

    const newAd: AdPlacement = {
      id: `ad-${Date.now()}`,
      name: adData.name,
      key: adData.key,
      type: adData.type || 'Code',
      size: adData.size || '300x250',
      status: adData.status || 'Active',
      customCode: adData.customCode || '',
      imageUrl: adData.imageUrl,
      targetUrl: adData.targetUrl,
      impressions: 0,
      clicks: 0,
      deviceTarget: adData.deviceTarget || 'all',
    };
    this.state.ads.push(newAd);
    this.logAction('Ad Placement Created', `Added new placement "${newAd.name}"`);
    this.save();
    firestoreSync.writeDoc('ads', newAd.id, sanitizeAd(newAd)).catch(console.error);
    return newAd;
  }

  public deleteAd(id: string): void {
    const ad = this.state.ads.find((a) => a.id === id);
    this.state.ads = this.state.ads.filter((a) => a.id !== id);
    if (ad) this.logAction('Ad Placement Deleted', `Removed ad placement "${ad.name}"`, 'warning');
    this.save();
    firestoreSync.deleteRemoteDoc('ads', id).catch(console.error);
  }

  public toggleAdStatus(id: string): void {
    const ad = this.state.ads.find((a) => a.id === id);
    if (ad) {
      ad.status = ad.status === 'Active' ? 'Inactive' : 'Active';
      this.logAction('Ad Status Changed', `${ad.name} is now ${ad.status}`);
      this.save();
      firestoreSync.writeDoc('ads', ad.id, sanitizeAd(ad)).catch(console.error);
    }
  }

  // -------------------------
  // User Management
  // -------------------------
  public getUsers(): User[] {
    return this.state.users.map((u) => {
      const realCount = this.state.posts.filter(
        (p) => p.author?.id === u.id || p.author?.name?.toLowerCase().trim() === u.name?.toLowerCase().trim()
      ).length;
      return {
        ...u,
        articlesCount: realCount,
      };
    });
  }

  public saveUser(userData: Partial<User> & { name: string; email: string }): User {
    if (userData.id) {
      const idx = this.state.users.findIndex((u) => u.id === userData.id);
      if (idx !== -1) {
        this.state.users[idx] = { ...this.state.users[idx], ...userData };
        const updatedUser = this.state.users[idx];
        if (
          this.state.currentUser.id === updatedUser.id ||
          this.state.currentUser.email.toLowerCase() === updatedUser.email.toLowerCase()
        ) {
          this.state.currentUser = updatedUser;
          try {
            const rawAuth = localStorage.getItem('alif_news_24_admin_auth_v1');
            if (rawAuth) {
              const parsed = JSON.parse(rawAuth);
              localStorage.setItem(
                'alif_news_24_admin_auth_v1',
                JSON.stringify({
                  ...parsed,
                  name: updatedUser.name,
                  avatar: updatedUser.avatar,
                  role: updatedUser.role,
                })
              );
            }
          } catch {}
        }
        this.logAction('User Profile Updated', `Updated user "${userData.name}"`, 'security');
        this.save();
        firestoreSync.writeDoc('users', updatedUser.id, sanitizeUser(updatedUser)).catch(console.error);
        return updatedUser;
      }
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: userData.role || 'Author',
      status: userData.status || 'active',
      twoFactorEnabled: !!userData.twoFactorEnabled,
      articlesCount: 0,
      bio: userData.bio || '',
      lastLogin: 'Never',
    };
    this.state.users.push(newUser);
    this.logAction('User Created', `Created user account "${newUser.name}" (${newUser.role})`, 'security');
    this.save();
    firestoreSync.writeDoc('users', newUser.id, sanitizeUser(newUser)).catch(console.error);
    return newUser;
  }

  public renameAuthorAcrossPosts(
    oldAuthorName: string,
    newAuthor: { id?: string; name: string; avatar?: string; role?: string }
  ): number {
    const cleanOld = oldAuthorName.trim().toLowerCase();
    const cleanNew = newAuthor.name.trim();
    if (!cleanNew) return 0;

    let updatedCount = 0;
    this.state.posts = this.state.posts.map((post) => {
      const matchesName = cleanOld && post.author?.name?.trim().toLowerCase() === cleanOld;
      const matchesId = newAuthor.id && post.author?.id === newAuthor.id;
      if (!matchesName && !matchesId) return post;

      const updatedPost: Post = {
        ...post,
        author: {
          id: newAuthor.id || post.author?.id || this.state.currentUser.id,
          name: cleanNew,
          avatar: newAuthor.avatar || post.author?.avatar || this.state.currentUser.avatar,
          role: (newAuthor.role as any) || post.author?.role || 'Administrator',
        },
        updatedAt: new Date().toISOString(),
      };
      updatedCount += 1;
      firestoreSync.writeDoc('posts', updatedPost.id, sanitizePost(updatedPost)).catch(console.error);
      return updatedPost;
    });

    if (updatedCount > 0) {
      this.logAction(
        'Author Renamed',
        `Updated author byline to "${cleanNew}" across ${updatedCount} existing posts`,
        'info'
      );
      this.save();
    }
    return updatedCount;
  }

  public deleteUser(id: string): void {
    const user = this.state.users.find((u) => u.id === id);
    if (user?.role === 'Administrator' && this.state.users.filter((u) => u.role === 'Administrator').length <= 1) {
      throw new Error('Cannot delete the sole Administrator account.');
    }
    this.state.users = this.state.users.filter((u) => u.id !== id);
    if (user) this.logAction('User Deleted', `Deleted user account "${user.name}"`, 'security');
    this.save();
    firestoreSync.deleteRemoteDoc('users', id).catch(console.error);
  }

  // -------------------------
  // Comments
  // -------------------------
  public getComments(): Comment[] {
    return this.state.comments;
  }

  public updateCommentStatus(id: string, status: Comment['status']): void {
    const comment = this.state.comments.find((c) => c.id === id);
    if (comment) {
      comment.status = status;
      this.logAction('Comment Moderated', `Comment by ${comment.authorName} marked as ${status}`);
      this.save();
      firestoreSync.writeDoc('comments', comment.id, sanitizeComment(comment)).catch(console.error);
    }
  }

  public addComment(postId: string, postTitle: string, authorName: string, authorEmail: string, content: string): Comment {
    const cleanName = authorName.trim();
    const cleanContent = content.trim();
    const spamTriggers = ['http://', 'https://', 'crypto-airdrop', 'free-casino', 'buy-followers', 'scam-link'];
    const lowerContent = cleanContent.toLowerCase();
    const isFlagged = spamTriggers.some((trigger) => lowerContent.includes(trigger));
    const formattedTime = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newComment: Comment = {
      id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      postId,
      postTitle,
      authorName: cleanName,
      authorEmail,
      authorAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      content: cleanContent,
      status: isFlagged ? 'pending' : 'approved',
      createdAt: formattedTime,
    };
    this.state.comments = [newComment, ...this.state.comments];
    const post = this.state.posts.find((p) => p.id === postId);
    if (post) post.commentsCount += 1;
    this.save();
    firestoreSync.writeDoc('comments', newComment.id, sanitizeComment(newComment)).catch(console.error);
    return newComment;
  }

  public replyToComment(id: string, author: string, content: string): void {
    const comment = this.state.comments.find((c) => c.id === id);
    if (!comment || !content.trim()) return;
    const reply = {
      id: `rep-${Date.now()}`,
      author,
      content: content.trim(),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    comment.replies = [...(comment.replies || []), reply];
    if (comment.status === 'pending') {
      comment.status = 'approved';
    }
    this.logAction('Comment Replied', `Editorial response added to comment by ${comment.authorName}`);
    this.save();
    firestoreSync.writeDoc('comments', comment.id, sanitizeComment(comment)).catch(console.error);
  }

  // -------------------------
  // Pages
  // -------------------------
  public getPages(): Page[] {
    return this.state.pages;
  }

  public savePage(pageData: Partial<Page> & { title: string }): Page {
    const now = new Date().toISOString().slice(0, 10);
    if (pageData.id) {
      const idx = this.state.pages.findIndex((p) => p.id === pageData.id);
      if (idx !== -1) {
        this.state.pages[idx] = { ...this.state.pages[idx], ...pageData, updatedAt: now };
        this.logAction('Page Updated', `Updated static page "${pageData.title}"`);
        this.save();
        firestoreSync.writeDoc('pages', this.state.pages[idx].id, sanitizePage(this.state.pages[idx])).catch(console.error);
        return this.state.pages[idx];
      }
    }
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title: pageData.title,
      slug: pageData.slug || pageData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      template: pageData.template || 'default',
      status: pageData.status || 'published',
      showInMenu: pageData.showInMenu !== undefined ? pageData.showInMenu : true,
      showInFooter: pageData.showInFooter !== undefined ? pageData.showInFooter : true,
      content: pageData.content || 'Page content here...',
      updatedAt: now,
      seoTitle: pageData.seoTitle,
      seoDescription: pageData.seoDescription,
    };
    this.state.pages.push(newPage);
    this.logAction('Page Created', `Created page "${newPage.title}" (Show in Menu: ${newPage.showInMenu ? 'Yes' : 'No'})`);
    this.save();
    firestoreSync.writeDoc('pages', newPage.id, sanitizePage(newPage)).catch(console.error);
    return newPage;
  }

  public togglePageMenuVisibility(id: string): Page | undefined {
    const page = this.state.pages.find((p) => p.id === id);
    if (page) {
      page.showInMenu = !page.showInMenu;
      this.logAction(
        page.showInMenu ? 'Page Added to Menu' : 'Page Hidden from Menu',
        `Page "${page.title}" is now ${page.showInMenu ? 'visible in the navigation menu' : 'hidden from the navigation menu'}`
      );
      this.save();
      firestoreSync.writeDoc('pages', page.id, sanitizePage(page)).catch(console.error);
      return page;
    }
    return undefined;
  }

  public deletePage(id: string): void {
    const page = this.state.pages.find((p) => p.id === id);
    this.state.pages = this.state.pages.filter((p) => p.id !== id);
    if (page) {
      this.logAction('Page Deleted', `Deleted page "${page.title}"`, 'warning');
      this.save();
      firestoreSync.deleteRemoteDoc('pages', id).catch(console.error);
    }
  }

  private isLegacyStubPage(existing: Page | undefined): boolean {
    if (!existing) return true;
    const text = (existing.content || '').trim();
    return text.length < 320 || text.includes('Washington, D.C. headquarters');
  }

  private hasStaleOrMissingPolicyPages(pages: Page[]): boolean {
    for (const defPage of initialPages) {
      const match = pages.find((p) => p.id === defPage.id || p.slug === defPage.slug);
      if (this.isLegacyStubPage(match)) return true;
    }
    return false;
  }

  private mergeUpgradedPolicyPages(existingPages: Page[]): Page[] {
    const merged = [...existingPages];
    for (const defPage of initialPages) {
      const idx = merged.findIndex((p) => p.id === defPage.id || p.slug === defPage.slug);
      if (idx === -1) {
        merged.push({ ...defPage });
      } else if (this.isLegacyStubPage(merged[idx])) {
        merged[idx] = { ...defPage, id: merged[idx].id || defPage.id };
      }
    }
    return merged;
  }

  public async syncAdSensePolicyPages(forceOverwrite = false, onlyIfAdmin = false): Promise<number> {
    if (this.isSyncingPolicyPages && !forceOverwrite) return 0;
    this.isSyncingPolicyPages = true;
    try {
      if (onlyIfAdmin) {
        const { auth } = await import('./firebase');
        const email = auth.currentUser?.email?.toLowerCase() || '';
        if (!email || !['alifsheenshopping@gmail.com', 'banicne7@gmail.com'].includes(email)) {
          return 0;
        }
      }

      let updatedCount = 0;
      const nextPages = [...this.state.pages];
      const pagesToWrite: Page[] = [];

      for (const defPage of initialPages) {
        const idx = nextPages.findIndex((p) => p.id === defPage.id || p.slug === defPage.slug);
        if (idx === -1) {
          const added = { ...defPage };
          nextPages.push(added);
          pagesToWrite.push(added);
          updatedCount++;
        } else if (forceOverwrite || this.isLegacyStubPage(nextPages[idx])) {
          const updated = { ...defPage, id: nextPages[idx].id || defPage.id };
          nextPages[idx] = updated;
          pagesToWrite.push(updated);
          updatedCount++;
        }
      }

      this.state.pages = nextPages;

      const needsFooterUpdate =
        forceOverwrite ||
        (this.state.footerConfig?.publisherText || '').includes('Alif Media Group') ||
        !this.state.footerConfig?.columns?.some((c) => c.items?.some((it) => it.url === '/page/terms-of-service'));

      if (needsFooterUpdate) {
        this.state.footerConfig = JSON.parse(JSON.stringify(initialFooterConfig));
      }

      const needsSiteUrlUpdate = forceOverwrite || this.state.settings?.siteUrl === 'https://alifnews24.com';
      if (needsSiteUrlUpdate) {
        this.state.settings = {
          ...this.state.settings,
          siteUrl: 'https://www.official1.online',
          robotsTxt: initialSettings.robotsTxt,
        };
      }

      this.save();

      for (const pg of pagesToWrite) {
        await firestoreSync.writeDoc('pages', pg.id, sanitizePage(pg)).catch(console.error);
      }
      if (needsFooterUpdate) {
        await firestoreSync
          .writeDoc('config', 'footer_config', sanitizeFooterConfig(this.state.footerConfig))
          .catch(console.error);
      }
      if (needsSiteUrlUpdate) {
        await firestoreSync
          .writeDoc('config', 'site_settings', sanitizePublicSettings(this.state.settings))
          .catch(console.error);
      }

      if (updatedCount > 0 || needsFooterUpdate) {
        this.logAction(
          'AdSense Policy Pages Synced',
          `Published/updated ${pagesToWrite.length} compliance & desk pages with Alif Sheen Group footer`,
          'success'
        );
      }
      return pagesToWrite.length;
    } finally {
      this.isSyncingPolicyPages = false;
    }
  }

  // -------------------------
  // Newsletter
  // -------------------------
  public getSubscribers(): NewsletterSubscriber[] {
    return this.state.subscribers;
  }

  public addSubscriber(email: string, name?: string): NewsletterSubscriber {
    const existing = this.state.subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email,
      name,
      status: 'active',
      subscribedAt: new Date().toISOString().slice(0, 10),
      tags: ['Website Reader'],
    };
    this.state.subscribers = [newSub, ...this.state.subscribers];
    this.save();
    firestoreSync.writeDoc('subscribers', newSub.id, sanitizeSubscriber(newSub)).catch(console.error);
    return newSub;
  }

  public getCampaigns(): NewsletterCampaign[] {
    return this.state.campaigns;
  }

  public saveCampaign(campaign: Partial<NewsletterCampaign> & { subject: string; template: string }): NewsletterCampaign {
    if (campaign.id) {
      const idx = this.state.campaigns.findIndex((c) => c.id === campaign.id);
      if (idx !== -1) {
        this.state.campaigns[idx] = { ...this.state.campaigns[idx], ...campaign };
        this.save();
        firestoreSync.writeDoc('campaigns', this.state.campaigns[idx].id, sanitizeCampaign(this.state.campaigns[idx])).catch(console.error);
        return this.state.campaigns[idx];
      }
    }
    const newCamp: NewsletterCampaign = {
      id: `camp-${Date.now()}`,
      subject: campaign.subject,
      template: campaign.template,
      status: campaign.status || 'draft',
      recipientsCount: this.state.subscribers.length,
      sentAt: campaign.status === 'sent' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : undefined,
    };
    this.state.campaigns.push(newCamp);
    this.save();
    firestoreSync.writeDoc('campaigns', newCamp.id, sanitizeCampaign(newCamp)).catch(console.error);
    return newCamp;
  }

  // -------------------------
  // Settings
  // -------------------------
  public getSettings(): SystemSettings {
    return this.state.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.state.settings = { ...this.state.settings, ...updates };
    this.logAction('Settings Updated', 'Global enterprise CMS configuration updated.');
    this.save();
    firestoreSync.writeDoc('config', 'site_settings', sanitizePublicSettings(this.state.settings)).catch(console.error);
    firestoreSync.writeDoc('admin_config', 'system', sanitizeAdminSettings(this.state.settings)).catch(console.error);
    return this.state.settings;
  }

  // -------------------------
  // Backups & Snapshots
  // -------------------------
  public getBackups(): BackupRecord[] {
    return this.state.backups;
  }

  public createBackup(type: 'automated' | 'manual' = 'manual'): BackupRecord {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `alif_news_24_db_${timestamp}_${type}.json`;
    const snapshotJson = JSON.stringify(this.state, null, 2);
    const sizeKb = Math.max(1, Math.round(snapshotJson.length / 1024));

    const newRecord: BackupRecord = {
      id: `bk-${Date.now()}`,
      fileName,
      size: `${(sizeKb / 1024).toFixed(2)} MB`,
      createdAt: now.toISOString().slice(0, 19).replace('T', ' '),
      type,
      itemsCount: this.state.posts.length + this.state.categories.length + this.state.ads.length + this.state.users.length,
      downloadData: snapshotJson,
    };

    this.state.backups = [newRecord, ...this.state.backups];
    this.state.settings.lastBackupAt = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString()} (${type})`;
    this.logAction('Database Backup Created', `Created ${type} backup snapshot "${fileName}" (${newRecord.size})`, 'success');
    this.save();
    return newRecord;
  }

  public restoreBackup(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.posts || !parsed.categories || !parsed.settings) {
        throw new Error('Invalid backup file schema');
      }
      this.state = parsed;
      this.logAction('Database Restored', 'Database restored from snapshot backup.', 'security');
      this.save();
      return true;
    } catch (e) {
      console.error('Failed to restore backup', e);
      return false;
    }
  }

  public deleteBackup(id: string): void {
    this.state.backups = this.state.backups.filter((b) => b.id !== id);
    this.save();
  }

  // -------------------------
  // Footer Menus & Configuration
  // -------------------------
  public getFooterConfig(): FooterConfig {
    if (!this.state.footerConfig || !Array.isArray(this.state.footerConfig.columns)) {
      this.state.footerConfig = JSON.parse(JSON.stringify(initialFooterConfig));
    }
    return this.state.footerConfig;
  }

  public updateFooterConfig(updates: Partial<FooterConfig>): FooterConfig {
    this.state.footerConfig = {
      ...this.getFooterConfig(),
      ...updates,
    };
    this.logAction('Footer Configuration Updated', 'Footer columns and menu links updated.');
    this.save();
    firestoreSync.writeDoc('config', 'footer_config', sanitizeFooterConfig(this.state.footerConfig)).catch(console.error);
    return this.state.footerConfig;
  }

  public resetFooterConfig(): FooterConfig {
    this.state.footerConfig = JSON.parse(JSON.stringify(initialFooterConfig));
    this.logAction('Footer Configuration Reset', 'Footer restored to default editorial template.');
    this.save();
    firestoreSync.writeDoc('config', 'footer_config', sanitizeFooterConfig(this.state.footerConfig)).catch(console.error);
    return this.state.footerConfig;
  }

  public addFooterColumn(title: string): FooterColumn {
    const config = this.getFooterConfig();
    const newCol: FooterColumn = {
      id: `col-${Date.now()}`,
      title: title || 'New Footer Section',
      items: [],
    };
    config.columns = [...config.columns, newCol];
    this.updateFooterConfig({ columns: config.columns });
    return newCol;
  }

  public updateFooterColumn(columnId: string, updates: Partial<FooterColumn>): void {
    const config = this.getFooterConfig();
    config.columns = config.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c));
    this.updateFooterConfig({ columns: config.columns });
  }

  public deleteFooterColumn(columnId: string): void {
    const config = this.getFooterConfig();
    config.columns = config.columns.filter((c) => c.id !== columnId);
    this.updateFooterConfig({ columns: config.columns });
  }

  public addFooterItem(columnId: string, item: { label: string; url: string }): FooterMenuItem {
    const config = this.getFooterConfig();
    const newItem: FooterMenuItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: item.label,
      url: item.url,
    };
    config.columns = config.columns.map((col) => {
      if (col.id === columnId) {
        return { ...col, items: [...col.items, newItem] };
      }
      return col;
    });
    this.updateFooterConfig({ columns: config.columns });
    return newItem;
  }

  public updateFooterItem(columnId: string, itemId: string, updates: Partial<FooterMenuItem>): void {
    const config = this.getFooterConfig();
    config.columns = config.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          items: col.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it)),
        };
      }
      return col;
    });
    this.updateFooterConfig({ columns: config.columns });
  }

  public deleteFooterItem(columnId: string, itemId: string): void {
    const config = this.getFooterConfig();
    config.columns = config.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          items: col.items.filter((it) => it.id !== itemId),
        };
      }
      return col;
    });
    this.updateFooterConfig({ columns: config.columns });
  }

  public reorderFooterItem(columnId: string, itemIdx: number, dir: 'up' | 'down'): void {
    const config = this.getFooterConfig();
    config.columns = config.columns.map((col) => {
      if (col.id === columnId) {
        const items = [...col.items];
        if (dir === 'up' && itemIdx > 0) {
          const temp = items[itemIdx];
          items[itemIdx] = items[itemIdx - 1];
          items[itemIdx - 1] = temp;
        } else if (dir === 'down' && itemIdx < items.length - 1) {
          const temp = items[itemIdx];
          items[itemIdx] = items[itemIdx + 1];
          items[itemIdx + 1] = temp;
        }
        return { ...col, items };
      }
      return col;
    });
    this.updateFooterConfig({ columns: config.columns });
  }

  public resetToFactory(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadFromStorage();
  }
}

export const db = new DatabaseService();
