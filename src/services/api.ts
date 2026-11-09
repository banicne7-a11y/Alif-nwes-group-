export interface GeminiResponse<T = any> {
  success: boolean;
  text?: string;
  data?: T;
  error?: string;
  isFallback?: boolean;
}

export const api = {
  async generateArticle(prompt: string): Promise<GeminiResponse> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate_article', prompt }),
    });
    return res.json();
  },

  async generateHeadlines(prompt: string): Promise<GeminiResponse<string[]>> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate_headlines', prompt }),
    });
    return res.json();
  },

  async summarizeText(text: string): Promise<GeminiResponse> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'summarize', text }),
    });
    return res.json();
  },

  async checkGrammar(text: string): Promise<GeminiResponse> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'grammar_check', text }),
    });
    return res.json();
  },

  async generateSeo(prompt: string, text: string): Promise<GeminiResponse> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seo_writer', prompt, text }),
    });
    return res.json();
  },

  async translateText(text: string, targetLang: string): Promise<GeminiResponse> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'translate', text, targetLang }),
    });
    return res.json();
  },

  async generateSocial(prompt: string, text: string): Promise<GeminiResponse> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'social_captions', prompt, text }),
    });
    return res.json();
  },

  async checkDuplicates(text: string): Promise<GeminiResponse> {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'duplicate_checker', text }),
    });
    return res.json();
  },

  async fetchRss(url: string) {
    const res = await fetch('/api/rss/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  },
};
