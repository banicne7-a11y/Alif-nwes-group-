import { GoogleGenAI, Type } from '@google/genai';

export interface GoogleTrendNewsItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
  picture?: string;
}

export interface GoogleTrendItem {
  id: string;
  title: string;
  approxTraffic: string;
  pubDate: string;
  picture?: string;
  pictureSource?: string;
  newsItems: GoogleTrendNewsItem[];
}

export interface AnalyzedTrend {
  topic: string;
  difficulty: 'Low' | 'Medium' | 'High';
  opportunityScore: number;
  recommendedAngle: string;
  suggestedTitle: string;
  targetKeyword: string;
  category: string;
  reason: string;
}

function decodeXmlEntities(raw: string): string {
  return String(raw || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractXmlTag(block: string, tagName: string): string {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = block.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  return m && m[1] ? decodeXmlEntities(m[1]) : '';
}

export async function fetchGoogleTrendsFeed(geoRaw: string = 'US'): Promise<{
  geo: string;
  fetchedAt: string;
  items: GoogleTrendItem[];
}> {
  const geoMap: Record<string, string> = {
    usa: 'US',
    us: 'US',
    uk: 'GB',
    gb: 'GB',
    canada: 'CA',
    ca: 'CA',
    australia: 'AU',
    au: 'AU',
  };
  const geo = geoMap[String(geoRaw || 'US').toLowerCase().trim()] || 'US';

  const rssUrls = [
    `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`,
    `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${encodeURIComponent(geo)}`,
  ];

  let xml = '';
  let lastError = 'Unable to reach Google Trends RSS feed';

  for (const url of rssUrls) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const text = await response.text();
        if (text && text.includes('<item>')) {
          xml = text;
          break;
        }
      } else {
        lastError = `Google Trends responded with status ${response.status}`;
      }
    } catch (err: any) {
      lastError = err?.message || lastError;
    }
  }

  if (!xml) {
    throw new Error(lastError);
  }

  const items: GoogleTrendItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null && items.length < 20) {
    const block = itemMatch[1];
    const title = extractXmlTag(block, 'title');
    if (!title) continue;

    const approxTraffic = extractXmlTag(block, 'ht:approx_traffic') || 'Trending';
    const pubDate = extractXmlTag(block, 'pubDate') || new Date().toISOString();
    const picture = extractXmlTag(block, 'ht:picture');
    const pictureSource = extractXmlTag(block, 'ht:picture_source');

    const newsItems: GoogleTrendNewsItem[] = [];
    const newsRegex = /<ht:news_item>([\s\S]*?)<\/ht:news_item>/gi;
    let newsMatch: RegExpExecArray | null;
    while ((newsMatch = newsRegex.exec(block)) !== null && newsItems.length < 4) {
      const nb = newsMatch[1];
      const nTitle = extractXmlTag(nb, 'ht:news_item_title');
      if (!nTitle) continue;
      newsItems.push({
        title: nTitle,
        snippet: extractXmlTag(nb, 'ht:news_item_snippet'),
        url: extractXmlTag(nb, 'ht:news_item_url'),
        source: extractXmlTag(nb, 'ht:news_item_source'),
        picture: extractXmlTag(nb, 'ht:news_item_picture'),
      });
    }

    items.push({
      id: `${geo}-${items.length}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title,
      approxTraffic,
      pubDate,
      picture: picture || newsItems.find((n) => n.picture)?.picture || undefined,
      pictureSource: pictureSource || newsItems[0]?.source || undefined,
      newsItems,
    });
  }

  items.sort((a, b) => {
    const ta = Date.parse(a.pubDate) || 0;
    const tb = Date.parse(b.pubDate) || 0;
    return tb - ta;
  });

  return {
    geo,
    fetchedAt: new Date().toISOString(),
    items,
  };
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseJsonSafely(rawText: string): any {
  const trimmed = (rawText || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      return JSON.parse(match[1].trim());
    }
    return null;
  }
}

export async function runGeminiEditorialAction(body: {
  action: string;
  prompt?: string;
  text?: string;
  targetLang?: string;
  country?: string;
  trends?: GoogleTrendItem[];
  suggestedAngle?: string;
  newsContext?: string;
  wordCountTarget?: 'medium' | 'long';
}): Promise<{
  success: true;
  text: string;
  data: any;
}> {
  const ai = createGeminiClient();
  const model = 'gemini-4-hydrogen';
  const { action, prompt = '', text = '', targetLang = 'Bengali' } = body;

  // 1. Analyze Google Trends topics for a new site (Opportunity + Competition Filter)
  if (action === 'analyze_trends') {
    const countryLabel = (body.country || 'USA').toUpperCase();
    const compactTrends = (Array.isArray(body.trends) ? body.trends : []).slice(0, 15).map((t) => ({
      topic: t.title,
      approxTraffic: t.approxTraffic,
      newsHeadlines: (t.newsItems || []).map((n) => `${n.title}${n.source ? ` (${n.source})` : ''}`).slice(0, 3),
    }));

    if (compactTrends.length === 0) {
      throw new Error('No trending topics provided to analyze.');
    }

    const response = await ai.models.generateContent({
      model,
      contents: `Analyze these live Google Trends search topics for target audience country: ${countryLabel}.\n\nTrending topics JSON:\n${JSON.stringify(compactTrends, null, 2)}`,
      config: {
        systemInstruction:
          'You are an SEO & digital newsroom strategist helping a newer online news publication ("Alif News 24") pick Google Trends topics that can realistically rank and earn AdSense traffic. Evaluate each trending topic honestly: live sports scores, generic 1-word queries, and massive breaking wire events dominated by CNN/ESPN are "High" difficulty with lower opportunityScore (20-45). Specific "Who is...", "Why is ... trending", explainer questions, local policy changes, viral personalities, tech/consumer updates, or niche angles have "Low" or "Medium" difficulty and higher opportunityScore (65-95). Never recommend unsafe, adult, gambling, or pirated-stream topics. Return a JSON array sorted from highest opportunityScore to lowest. Allowed category values: Business, Politics, Health, Sports, Travels, Family\'s, Science, Technology, Religion.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING, description: 'Exact trending topic title from input.' },
              difficulty: { type: Type.STRING, description: 'Low, Medium, or High' },
              opportunityScore: { type: Type.INTEGER, description: 'Score 1 to 100 for a new site' },
              recommendedAngle: {
                type: Type.STRING,
                description: 'Specific explainer or informational angle to beat big media competition',
              },
              suggestedTitle: {
                type: Type.STRING,
                description: 'Clear, engaging, non-clickbait SEO article headline (50-68 chars)',
              },
              targetKeyword: { type: Type.STRING, description: 'Best long-tail SEO focus keyword' },
              category: {
                type: Type.STRING,
                description: 'One of Business, Politics, Health, Sports, Travels, Science, Technology, Religion',
              },
              reason: {
                type: Type.STRING,
                description: '1 short sentence explaining competition and why this topic is good or risky',
              },
            },
          },
        },
      },
    });

    const rawText = response.text || '[]';
    const data = parseJsonSafely(rawText) || [];
    return { success: true, text: rawText, data };
  }

  // 2. Write a full AdSense-safe, SEO-optimized article from a chosen Google Trend
  if (action === 'generate_trend_article') {
    const countryCode = (body.country || 'usa').toLowerCase();
    const countryNameMap: Record<string, string> = {
      usa: 'United States (American English, US audience)',
      uk: 'United Kingdom (British English, UK audience)',
      canada: 'Canada (Canadian English, Canada audience)',
      australia: 'Australia (Australian English, Australia audience)',
    };
    const audienceLabel = countryNameMap[countryCode] || 'United States (American English)';
    const targetWords = body.wordCountTarget === 'long' ? '1000-1250 words' : '650-850 words';

    const response = await ai.models.generateContent({
      model,
      contents: `Write an original, factual, Google AdSense-compliant news explainer article for ${audienceLabel}.\n\nTrending Topic: ${prompt}\nEditorial Angle: ${body.suggestedAngle || 'Comprehensive explainer and background'}\nVerified Current Context & Headlines:\n${body.newsContext || 'Use verifiable public background and explain clearly why readers are searching this today.'}\nTarget length: ${targetWords}.`,
      config: {
        systemInstruction:
          'You are a senior editor writing for Alif News 24. Produce original, reader-first journalism tailored to the target country. Structure the body `content` with clean Markdown `## Section Headings` (3-5 sections), crisp informative paragraphs explaining Who/What/Why it is trending right now, broader context, and key takeaways. Do NOT invent fake quotes, fabricated statistics, or clickbait. Keep facts strictly grounded in the provided verified headlines/context and established background. Return clean JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING, description: '2-3 sentence excerpt summarizing the story' },
            content: {
              type: Type.STRING,
              description: 'Full formatted article body using ## subheadings and clean paragraphs separated by blank lines',
            },
            seoKeyword: { type: Type.STRING },
            seoTitle: { type: Type.STRING, description: 'SEO title under 62 characters' },
            metaDescription: { type: Type.STRING, description: 'Meta description 120-155 characters' },
            slug: { type: Type.STRING, description: 'lowercase-hyphenated-url-slug' },
            imageSearchQuery: { type: Type.STRING },
          },
        },
      },
    });

    const rawText = response.text || '{}';
    const data = parseJsonSafely(rawText);
    return { success: true, text: rawText, data };
  }

  // 3. Existing editorial assistant actions upgraded to gemini-4-hydrogen
  let systemInstruction =
    'You are an enterprise newsroom AI editorial assistant for "Alif News 24". Respond with journalistic rigor, SEO optimization, and high accuracy.';
  let promptContent = '';
  let expectJson = false;

  if (action === 'generate_article') {
    expectJson = true;
    systemInstruction +=
      ' Generate a complete structured news article in JSON format with fields: title, subtitle, category (one of Business, Politics, Health, Sports, Travels, Science, Technology, Religion), tags (array of 4 tags), summary (2-3 sentences), content (formatted with markdown ## headings and clean paragraphs), seoKeyword, metaDescription, and imageSearchQuery.';
    promptContent = `Generate a full professional news article based on: "${prompt}". Provide high journalistic quality.`;
  } else if (action === 'generate_headlines') {
    expectJson = true;
    systemInstruction +=
      ' Generate 5 diverse, catchy, high-CTR news headlines for the given topic or story. Output JSON array of strings.';
    promptContent = `Generate 5 catchy news headlines for: "${prompt || text}".`;
  } else if (action === 'summarize') {
    systemInstruction += ' Provide a concise executive summary: 3 bullet points followed by a 1-paragraph TL;DR.';
    promptContent = `Summarize the following news content:\n\n${text}`;
  } else if (action === 'grammar_check') {
    expectJson = true;
    systemInstruction +=
      ' Improve the grammar, journalistic clarity, tone, and active voice. Return JSON with fields: correctedText, improvementsList (array of strings), readabilityScore (e.g. "88/100 - Grade 8 level").';
    promptContent = `Proofread and polish this news copy:\n\n${text}`;
  } else if (action === 'seo_writer') {
    expectJson = true;
    systemInstruction +=
      ' Generate comprehensive SEO metadata in JSON with fields: focusKeyword, seoTitle (max 60 chars), metaDescription (max 155 chars), slug, secondaryKeywords (array of strings), and searchIntent.';
    promptContent = `Generate SEO metadata for this story: Title: "${prompt}", Content: "${text || ''}".`;
  } else if (action === 'translate') {
    systemInstruction += ` Translate the text accurately into ${targetLang}. Maintain journalistic tone, professional syntax, and preserve proper names.`;
    promptContent = `Translate the following news article text into ${targetLang}:\n\n${text}`;
  } else if (action === 'social_captions') {
    expectJson = true;
    systemInstruction +=
      ' Generate engaging social media copy in JSON with fields: twitter (max 260 chars with hashtags), facebook (engaging question + summary + hashtags), linkedin (professional summary with insights).';
    promptContent = `Write social media posts for this news article:\nTitle: "${prompt}"\nContent: "${text}"`;
  } else if (action === 'duplicate_checker') {
    expectJson = true;
    systemInstruction +=
      ' Analyze this article for original phrasing vs cliched reporting. Return JSON with fields: originalityScore (number 0-100), riskLevel ("Low", "Medium", "High"), feedback, suggestions (array of strings).';
    promptContent = `Analyze originality for this copy:\n\n${text}`;
  } else {
    promptContent = prompt || text || 'Provide news editorial recommendations.';
  }

  const response = await ai.models.generateContent({
    model,
    contents: promptContent,
    config: {
      systemInstruction,
      ...(expectJson ? { responseMimeType: 'application/json' } : {}),
    },
  });

  const rawText = response.text || '';
  let parsedJson = null;
  if (expectJson) {
    try {
      parsedJson = parseJsonSafely(rawText);
    } catch {
      parsedJson = null;
    }
  }

  return {
    success: true,
    text: rawText,
    data: parsedJson,
  };
}
