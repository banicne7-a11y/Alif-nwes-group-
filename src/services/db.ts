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
  { id: 'page-1', title: 'About Alif News 24', slug: 'about-us', template: 'about', status: 'published', showInMenu: true, showInFooter: true, content: 'Alif News 24 is an independent American news organization dedicated to rigorous, fair, and uncompromising investigative reporting. Headquartered with newsrooms in Washington, D.C. and New York, our correspondents deliver real-time coverage across national politics, Wall Street markets, global diplomacy, technological innovation, and societal affairs around the clock.', updatedAt: '2026-11-01' },
  { id: 'page-2', title: 'Editorial Guidelines & Ethics Policy', slug: 'editorial-policy', template: 'default', status: 'published', showInMenu: false, showInFooter: true, content: 'Our commitment to journalistic integrity, rigorous fact-checking, editorial independence, attribution standards, and transparent correction policies.', updatedAt: '2026-11-02' },
  { id: 'page-3', title: 'Contact Newsroom (US Bureau)', slug: 'contact', template: 'contact', status: 'published', showInMenu: true, showInFooter: true, content: 'Reach our editorial desk, investigative tips team, or press office at our Washington, D.C. headquarters.', updatedAt: '2026-11-03' },
  { id: 'page-4', title: 'Privacy & Data Protection Policy', slug: 'privacy-policy', template: 'privacy', status: 'published', showInMenu: false, showInFooter: true, content: 'How Alif News 24 protects subscriber privacy, complies with US federal privacy standards, and ensures transparent data practices.', updatedAt: '2026-11-04' },
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
  tagline: "America's Trusted 24/7 Independent News & Investigative Journalism",
  siteUrl: 'https://alifnews24.com',
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
  smtpHost: 'smtp.alifnews24.com',
  smtpPort: '587',
  smtpUser: 'newsroom-alerts@alifnews24.com',
  smtpSecure: true,
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://alifnews24.com/sitemap.xml\nSitemap: https://alifnews24.com/google-news-sitemap.xml',
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
    'Alif News 24 is an independent American news organization committed to rigorous, non-partisan, around-the-clock investigative journalism covering Capitol Hill, Wall Street, Silicon Valley, and global affairs.',
  publisherText: 'Editor-in-Chief & Publisher: Alif Media Group, LLC.',
  copyrightText: '© 2026 Alif News 24 Media Enterprise, LLC. All rights reserved.',
  columns: [
    {
      id: 'col-1',
      title: 'News Desks',
      items: [
        { id: 'item-1-1', label: 'Business & Finance', url: '/category/business' },
        { id: 'item-1-2', label: 'Politics & White House', url: '/category/politics' },
        { id: 'item-1-3', label: 'Technology & AI', url: '/category/technology' },
        { id: 'item-1-4', label: 'Health & Science', url: '/category/health' },
        { id: 'item-1-5', label: 'Sports & Olympics', url: '/category/sports' },
        { id: 'item-1-6', label: 'Opinion & Editorial', url: '/category/opinion' },
      ],
    },
    {
      id: 'col-2',
      title: 'Company & Legal',
      items: [
        { id: 'item-2-1', label: 'About Alif News 24', url: '/page/about-us' },
        { id: 'item-2-2', label: 'Editorial Guidelines & Ethics', url: '/page/editorial-policy' },
        { id: 'item-2-3', label: 'Contact Newsroom (US Bureau)', url: '/page/contact' },
        { id: 'item-2-4', label: 'Privacy & Data Protection', url: '/page/privacy-policy' },
      ],
    },
    {
      id: 'col-3',
      title: 'Services & Subscriptions',
      items: [
        { id: 'item-3-1', label: 'Morning Wire Dispatch', url: '/newsletter' },
        { id: 'item-3-2', label: 'RSS News Feed', url: '/rss' },
        { id: 'item-3-3', label: 'Digital E-Paper Archive', url: '/archive' },
        { id: 'item-3-4', label: 'Staff & Reader Portal', url: '#login' },
      ],
    },
  ],
};

class DatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: DatabaseState = JSON.parse(saved);
        if (parsed.settings) {
          parsed.settings.siteName = 'Alif News 24';
          parsed.settings.tagline = "America's Trusted 24/7 Independent News & Investigative Journalism";
          parsed.settings.siteUrl = 'https://alifnews24.com';
          parsed.settings.breakingNewsText = 'BREAKING: US Federal Reserve signals data-driven interest rate adjustments | Wall Street rallies on cooler inflation index | Bipartisan infrastructure accords advance in Congress';
        }
        if (!parsed.footerConfig || !Array.isArray(parsed.footerConfig.columns)) {
          parsed.footerConfig = initialFooterConfig;
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

  public incrementPostViews(id: string): void {
    const post = this.state.posts.find((p) => p.id === id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.save();
    }
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

    let post: Post;
    if (isNew) {
      const id = `post-${Date.now()}`;
      const slug = (postData.slug || postData.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
        category: postData.category || 'Business',
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
        updatedAt: now,
        revisions: [newRevision, ...(existing.revisions || [])].slice(0, 15),
      };
      this.state.posts[index] = post;
      this.logAction('Post Updated', `Updated article "${post.title}"`, 'info');
    }

    this.save();
    return post;
  }

  public deletePost(id: string, forcePermanent = false): void {
    const post = this.state.posts.find((p) => p.id === id);
    if (!post) return;

    if (post.status !== 'trash' && !forcePermanent) {
      post.status = 'trash';
      this.logAction('Post Moved to Trash', `Article "${post.title}" moved to trash.`, 'warning');
    } else {
      this.state.posts = this.state.posts.filter((p) => p.id !== id);
      this.logAction('Post Permanently Deleted', `Article "${post.title}" permanently removed.`, 'warning');
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
    return this.state.categories.map((c) => ({
      ...c,
      count: this.state.posts.filter(
        (p) => p.category.toLowerCase().trim() === c.name.toLowerCase().trim()
      ).length,
    }));
  }

  public saveCategory(catData: Partial<Category> & { name: string }): Category {
    if (catData.id) {
      const idx = this.state.categories.findIndex((c) => c.id === catData.id);
      if (idx !== -1) {
        this.state.categories[idx] = { ...this.state.categories[idx], ...catData };
        this.logAction('Category Updated', `Updated category "${catData.name}"`);
        this.save();
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
    return newCat;
  }

  public deleteCategory(id: string): void {
    const cat = this.state.categories.find((c) => c.id === id);
    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    if (cat) this.logAction('Category Deleted', `Deleted category "${cat.name}"`, 'warning');
    this.save();
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
    const existing = this.state.tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const newTag: Tag = {
      id: `t-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      count: 1,
    };
    this.state.tags.push(newTag);
    this.save();
    return newTag;
  }

  public deleteTag(id: string): void {
    this.state.tags = this.state.tags.filter((t) => t.id !== id);
    this.save();
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
    return newItem;
  }

  public updateMediaItem(id: string, updates: Partial<MediaItem>): void {
    const idx = this.state.media.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.state.media[idx] = { ...this.state.media[idx], ...updates };
      this.save();
    }
  }

  public deleteMediaItem(id: string): void {
    this.state.media = this.state.media.filter((m) => m.id !== id);
    this.save();
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
    return newAd;
  }

  public deleteAd(id: string): void {
    const ad = this.state.ads.find((a) => a.id === id);
    this.state.ads = this.state.ads.filter((a) => a.id !== id);
    if (ad) this.logAction('Ad Placement Deleted', `Removed ad placement "${ad.name}"`, 'warning');
    this.save();
  }

  public toggleAdStatus(id: string): void {
    const ad = this.state.ads.find((a) => a.id === id);
    if (ad) {
      ad.status = ad.status === 'Active' ? 'Inactive' : 'Active';
      this.logAction('Ad Status Changed', `${ad.name} is now ${ad.status}`);
      this.save();
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
        this.logAction('User Profile Updated', `Updated user "${userData.name}"`, 'security');
        this.save();
        return this.state.users[idx];
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
    return newUser;
  }

  public deleteUser(id: string): void {
    const user = this.state.users.find((u) => u.id === id);
    if (user?.role === 'Administrator' && this.state.users.filter((u) => u.role === 'Administrator').length <= 1) {
      throw new Error('Cannot delete the sole Administrator account.');
    }
    this.state.users = this.state.users.filter((u) => u.id !== id);
    if (user) this.logAction('User Deleted', `Deleted user account "${user.name}"`, 'security');
    this.save();
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
    }
  }

  public addComment(postId: string, postTitle: string, authorName: string, authorEmail: string, content: string): Comment {
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      postId,
      postTitle,
      authorName,
      authorEmail,
      authorAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`,
      content,
      status: 'approved',
      createdAt: 'Just now',
    };
    this.state.comments = [newComment, ...this.state.comments];
    // increment post commentsCount
    const post = this.state.posts.find((p) => p.id === postId);
    if (post) post.commentsCount += 1;
    this.save();
    return newComment;
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
    return this.state.footerConfig;
  }

  public resetFooterConfig(): FooterConfig {
    this.state.footerConfig = JSON.parse(JSON.stringify(initialFooterConfig));
    this.logAction('Footer Configuration Reset', 'Footer restored to default editorial template.');
    this.save();
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
