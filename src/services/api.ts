export interface GeminiResponse<T = any> {
  success: boolean;
  text?: string;
  data?: T;
  error?: string;
  isFallback?: boolean;
}

export interface TrendNewsSnippet {
  title: string;
  snippet: string;
  url: string;
  source: string;
  picture?: string;
}

export interface LiveTrendItem {
  id: string;
  title: string;
  approxTraffic: string;
  pubDate: string;
  picture?: string;
  pictureSource?: string;
  newsItems: TrendNewsSnippet[];
}

export interface AnalyzedTrendTopic {
  topic: string;
  difficulty: 'Low' | 'Medium' | 'High';
  opportunityScore: number;
  recommendedAngle: string;
  suggestedTitle: string;
  targetKeyword: string;
  category: string;
  reason: string;
}

async function postJson<T = any>(url: string, payload: Record<string, any>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
  if (!res.ok && data && typeof data === 'object' && data.success === undefined) {
    return { ...data, success: false } as T;
  }
  return data as T;
}

export const api = {
  async generateArticle(prompt: string): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', { action: 'generate_article', prompt });
  },

  async generateHeadlines(prompt: string): Promise<GeminiResponse<string[]>> {
    return postJson('/api/gemini/generate', { action: 'generate_headlines', prompt });
  },

  async summarizeText(text: string): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', { action: 'summarize', text });
  },

  async checkGrammar(text: string): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', { action: 'grammar_check', text });
  },

  async generateSeo(prompt: string, text: string): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', { action: 'seo_writer', prompt, text });
  },

  async translateText(text: string, targetLang: string): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', { action: 'translate', text, targetLang });
  },

  async generateSocial(prompt: string, text: string): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', { action: 'social_captions', prompt, text });
  },

  async checkDuplicates(text: string): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', { action: 'duplicate_checker', text });
  },

  async fetchGoogleTrends(geo: string = 'US'): Promise<{
    success: boolean;
    geo?: string;
    fetchedAt?: string;
    items?: LiveTrendItem[];
    error?: string;
  }> {
    const res = await fetch(`/api/trends?geo=${encodeURIComponent(geo)}`);
    return res.json().catch(() => ({ success: false, error: 'Failed to load trends' }));
  },

  async analyzeTrends(
    country: string,
    trends: LiveTrendItem[]
  ): Promise<GeminiResponse<AnalyzedTrendTopic[]>> {
    return postJson('/api/gemini/generate', {
      action: 'analyze_trends',
      country,
      trends,
    });
  },

  async generateTrendArticle(payload: {
    topic: string;
    country: string;
    suggestedAngle?: string;
    newsContext?: string;
    wordCountTarget?: 'medium' | 'long';
  }): Promise<GeminiResponse> {
    return postJson('/api/gemini/generate', {
      action: 'generate_trend_article',
      prompt: payload.topic,
      country: payload.country,
      suggestedAngle: payload.suggestedAngle,
      newsContext: payload.newsContext,
      wordCountTarget: payload.wordCountTarget || 'medium',
    });
  },

  async fetchGeoCountry(): Promise<{ countryCode: string; edition: string | null; isBot: boolean }> {
    const res = await fetch('/api/geo');
    return res.json().catch(() => ({ countryCode: '', edition: null, isBot: false }));
  },

  async fetchRss(url: string) {
    return postJson('/api/rss/fetch', { url });
  },
};
