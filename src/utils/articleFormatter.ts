import { EditorBlock } from '../types';

export type FormattedSection =
  | { id: string; type: 'heading'; level: 2 | 3 | 4; text: string }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'quote'; text: string; caption?: string }
  | { id: string; type: 'list'; ordered: boolean; items: string[] }
  | { id: string; type: 'callout'; text: string }
  | { id: string; type: 'image'; url: string; caption?: string }
  | { id: string; type: 'table'; rows: string[][] };

/**
 * Splits a long wall-of-text paragraph (e.g., pasted with collapsed newlines)
 * into clean headings (like "Who Is ...?" or embedded Title-Case subheadings)
 * and balanced 2-3 sentence journalistic paragraphs.
 */
function recoverWallOfText(raw: string, baseId: string): FormattedSection[] {
  const sections: FormattedSection[] = [];
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return sections;

  // Step 1: Extract leading question heading (e.g. "Who Is Kimberly Powell? Kimberly Powell is...")
  let remaining = text;
  const leadingQuestionMatch = remaining.match(/^((?:Who|What|Why|How|When|Where|Is|Are|Can|Will|Should)\s+[^?]{4,85}\?)\s+(.+)$/);
  if (leadingQuestionMatch) {
    sections.push({
      id: `${baseId}-hq-0`,
      type: 'heading',
      level: 2,
      text: leadingQuestionMatch[1].trim(),
    });
    remaining = leadingQuestionMatch[2].trim();
  }

  // Step 2: Detect mid-text embedded question headings right after a period
  // e.g. "...development. Why Is Kimberly Powell Trending in the United States? Kimberly Powell..."
  const SENTENCE_QUESTION_SPLIT = /(?<=[.!"”])\s+((?:Who|What|Why|How|When|Where|Is|Are|Can|Will|Should)\s+[A-Z][^?!.]{4,85}\?)\s+/g;
  const qParts = remaining.split(SENTENCE_QUESTION_SPLIT);

  const chunks: Array<{ kind: 'heading' | 'prose'; text: string }> = [];
  for (let i = 0; i < qParts.length; i++) {
    const part = (qParts[i] || '').trim();
    if (!part) continue;
    // Matched capture groups sit at odd indices from .split(regexWithGroup)
    if (i % 2 === 1) {
      chunks.push({ kind: 'heading', text: part });
    } else {
      chunks.push({ kind: 'prose', text: part });
    }
  }

  // Step 3: For prose chunks, detect sentence boundaries and group into 3 sentences (~380-480 chars) max per paragraph
  let chunkCounter = 0;
  for (const chunk of chunks) {
    if (chunk.kind === 'heading') {
      sections.push({
        id: `${baseId}-h-${chunkCounter++}`,
        type: 'heading',
        level: 2,
        text: chunk.text,
      });
      continue;
    }

    const prose = chunk.text;
    // Also detect inline Title-Case subheadings directly after sentence endings where the next sentence starts with a common opener
    // e.g. "...established. Kimberly Powell's Early Career and Education Before becoming..."
    const normalizedProse = prose.replace(
      /(?<=[.!"”])\s+((?:[A-Z][a-zA-Z'’\-]*)(?:\s+(?:of|and|for|in|the|to|on|at|with|by|&|[A-Z][a-zA-Z'’\-]*)){2,8})\s+(?=(?:Before|After|Since|During|Although|While|However|According|Additionally|Furthermore|Moreover|Meanwhile|Over|Under|For|With|From|Through|Many|Some|Several|These|Those|This|That|Today|Recently|Following|Artificial|Modern|Global|In\s+\d|In\s+the|At\s+the|The\s+[a-z]|An?\s+[a-z])\b)/g,
      '\n## $1\n'
    );

    const subLines = normalizedProse.split('\n');
    for (const subLine of subLines) {
      const trimmed = subLine.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('## ')) {
        sections.push({
          id: `${baseId}-sh-${chunkCounter++}`,
          type: 'heading',
          level: 2,
          text: trimmed.slice(3).trim(),
        });
        continue;
      }

      if (trimmed.length <= 420) {
        sections.push({
          id: `${baseId}-p-${chunkCounter++}`,
          type: 'paragraph',
          text: trimmed,
        });
        continue;
      }

      // Split prose into individual sentences safely (respecting abbreviations like U.S., Dr., Mr., Inc.)
      const sentences = trimmed.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [trimmed];
      let buffer = '';
      let sentenceInPara = 0;

      for (const rawSentence of sentences) {
        const sentence = rawSentence.trim();
        if (!sentence) continue;
        const candidate = buffer ? `${buffer} ${sentence}` : sentence;
        sentenceInPara++;

        // Break into a new paragraph after ~3 sentences or ~400 chars
        if (buffer && (candidate.length > 420 || sentenceInPara > 3)) {
          sections.push({
            id: `${baseId}-p-${chunkCounter++}`,
            type: 'paragraph',
            text: buffer.trim(),
          });
          buffer = sentence;
          sentenceInPara = 1;
        } else {
          buffer = candidate;
        }
      }

      if (buffer.trim()) {
        sections.push({
          id: `${baseId}-p-${chunkCounter++}`,
          type: 'paragraph',
          text: buffer.trim(),
        });
      }
    }
  }

  return sections;
}

function isLikelyStandaloneHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 90) return false;
  if (/[.!,;:]$/.test(trimmed)) return false;
  if (trimmed.endsWith('?')) return true;
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 12) return false;
  const minor = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 'with', 'as']);
  let titleCased = 0;
  for (const w of words) {
    if (minor.has(w.toLowerCase()) || /^[A-Z0-9\u0980-\u09FF"“'(]/.test(w)) {
      titleCased++;
    }
  }
  return titleCased === words.length;
}

const CAMEL_CASE_WHITELIST = new Set([
  'youtube', 'linkedin', 'paypal', 'github', 'tiktok', 'wordpress', 'javascript',
  'typescript', 'macbook', 'whatsapp', 'playstation', 'powerpoint', 'sharepoint',
  'onedrive', 'cloudflare', 'openai', 'deepmind', 'chatgpt', 'spacex', 'quickbooks',
  'godaddy', 'fedex', 'mastercard', 'blackberry', 'dreamworks', 'soundcloud',
  'jetblue', 'airbnb', 'ebay', 'iphone', 'ipad', 'ios', 'macos', 'tvos', 'watchos',
]);

function splitGluedHeadingLine(line: string): string {
  const m = line.match(/^(#{1,4})\s+(.+)$/);
  if (!m) return line;
  const hashes = m[1];
  const rest = m[2].trim();

  // Case A: Question or exclamation heading glued directly to prose (e.g. "## Is There a Full Moon?The Moon...")
  const qMatch = rest.match(/^([^?\n!]{3,115}[?!])([A-Z0-9"“'(\u0980-\u09FF].{12,})$/);
  if (qMatch) {
    return `${hashes} ${qMatch[1].trim()}\n\n${qMatch[2].trim()}`;
  }

  // Case B: Exact repeated city/topic word at boundary (e.g. "### SydneySydney residents...")
  const dupMatch = rest.match(/^(.*?\b([A-Z][a-z]{2,}))(\2\b.{10,})$/);
  if (dupMatch && dupMatch[1].length <= 115) {
    return `${hashes} ${dupMatch[1].trim()}\n\n${dupMatch[3].trim()}`;
  }

  // Case C: Number glued directly to prose starter (e.g. "## Moonrise Times – November 25Moonrise times vary...")
  const digitBound = rest.match(/^(.{4,110}?\d)([A-Z][a-z]{1,}\s+.{15,})$/);
  if (digitBound) {
    return `${hashes} ${digitBound[1].trim()}\n\n${digitBound[2].trim()}`;
  }

  // Case D: Lowercase heading end glued to prose starter (e.g. "### MelbourneIn Melbourne..." or "# TitleThe Moon...")
  const camelRegex = /([a-z]{2,})([A-Z][a-z]{1,}\s+|(?:A|I)\s+[a-z])/g;
  let cm: RegExpExecArray | null;
  while ((cm = camelRegex.exec(rest)) !== null) {
    const splitPos = cm.index + cm[1].length;
    if (splitPos < 4 || splitPos > 120) continue;
    const before = rest.slice(0, splitPos);
    const after = rest.slice(splitPos);
    if (after.length < 20) continue;
    const prevWordMatch = before.match(/([A-Za-z]+)$/);
    const nextWordMatch = after.match(/^([A-Za-z]+)/);
    const combined = `${prevWordMatch?.[1] || ''}${nextWordMatch?.[1] || ''}`.toLowerCase();
    if (CAMEL_CASE_WHITELIST.has(combined)) continue;
    return `${hashes} ${before.trim()}\n\n${after.trim()}`;
  }

  return line;
}

/**
 * Restores lost line breaks when articles with Markdown (#, ##, tables, bullets)
 * are pasted from mobile browsers or editors that flatten newlines.
 */
export function expandCollapsedMarkdown(rawText: string): string {
  let text = String(rawText || '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  // 1. Insert breaks before pipe tables glued after punctuation, and between collapsed table rows (||)
  text = text.replace(/([.!?:)"”])(\|\s*[^|\n]+\|\s*[^|\n]*\|)/g, '$1\n\n$2');
  text = text.replace(/\|\s*\|(?=(?:[-:]{2,}|[^|\n]+\|))/g, '|\n|');

  // 2. Detach trailing prose glued right after a table row's closing pipe
  text = text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        const lastPipe = trimmed.lastIndexOf('|');
        if (lastPipe > 0 && lastPipe < trimmed.length - 1) {
          const tablePart = trimmed.slice(0, lastPipe + 1).trim();
          const trailing = trimmed.slice(lastPipe + 1).trim();
          if (trailing) {
            return `${tablePart}\n\n${trailing}`;
          }
        }
      }
      return line;
    })
    .join('\n');

  // 3. Insert breaks before embedded markdown headings (e.g. "permitted.## Is There...")
  text = text.replace(/([^\n#])(#{1,4}\s+)/g, '$1\n\n$2');

  // 4. Insert breaks before collapsed bullet items (e.g. "suggestions:- Find...- Move...")
  text = text.replace(/([.!?:)"”])(-\s+(?=[A-Z0-9\u0980-\u09FF]))/g, '$1\n\n$2');

  // 5. Split glued sentences lacking spaces after periods (e.g. "sky.The Moon", "equipment.*Moonrise")
  text = text.replace(
    /([a-z0-9)"”])\.(?!\d)(?<!\b(?:Mr|Mrs|Ms|Dr|St|Mt|Prof|Sr|Jr|vs|etc|Fig|No|Vol))(\*?(?:[A-Z][a-z]{1,}|A|I)\s+[a-zA-Z0-9])/g,
    '$1.\n\n$2'
  );

  // 6. Detach prose glued to the end of markdown heading lines
  text = text
    .split('\n')
    .map((line) => splitGluedHeadingLine(line.trim()))
    .join('\n');

  return text;
}

function isMarkdownTableLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.indexOf('|', 1) !== -1;
}

function isTableSeparatorLine(line: string): boolean {
  return /^\|(?:\s*:?-{2,}:?\s*\|)+\s*$/.test(line.trim());
}

function parseMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.replace(/\*\*/g, '').trim());
}

/**
 * Parses raw multi-line or markdown-like text into clean semantic sections.
 */
function parseRawTextToSections(rawText: string, baseId: string): FormattedSection[] {
  const sections: FormattedSection[] = [];
  const normalized = expandCollapsedMarkdown(rawText);
  if (!normalized) return sections;

  // Split by blank lines or single newlines if no blank lines exist
  const hasDoubleNewlines = /\n\s*\n/.test(normalized);
  const rawChunks = hasDoubleNewlines ? normalized.split(/\n\s*\n+/) : normalized.split(/\n+/);

  let idx = 0;
  for (const rawChunk of rawChunks) {
    const chunk = rawChunk.trim();
    if (!chunk) continue;

    const lines = chunk
      .split('\n')
      .map((l) => l.trim().replace(/^#{1,4}(?=[A-Z\u0980-\u09FF][a-zA-Z\u0980-\u09FF\s,.'’-]{15,})/, ''))
      .filter(Boolean);

    // Check if the entire chunk is a Markdown table
    if (lines.length >= 2 && lines.every(isMarkdownTableLine)) {
      const rows = lines
        .filter((l) => !isTableSeparatorLine(l))
        .map(parseMarkdownTableRow)
        .filter((r) => r.length > 0);
      if (rows.length > 0) {
        sections.push({
          id: `${baseId}-tbl-${idx++}`,
          type: 'table',
          rows,
        });
      }
      continue;
    }

    // Check if the chunk is a bullet or numbered list
    if (lines.length > 0 && lines.every((l) => /^([-*•]\s+|\d+[.)]\s+)/.test(l))) {
      const ordered = /^\d+[.)]\s+/.test(lines[0]);
      sections.push({
        id: `${baseId}-list-${idx++}`,
        type: 'list',
        ordered,
        items: lines.map((l) => l.replace(/^([-*•]\s+|\d+[.)]\s+)/, '').trim()),
      });
      continue;
    }

    // Handle multi-line chunks that contain mixed lines (headings, tables, lists, paragraphs)
    if (
      lines.length > 1 &&
      lines.some((l) => /^(#{1,4}\s+|>\s+|[-*•]\s+|\d+[.)]\s+)/.test(l) || isMarkdownTableLine(l) || isLikelyStandaloneHeading(l))
    ) {
      let currentList: { ordered: boolean; items: string[] } | null = null;
      let currentTable: string[][] | null = null;

      const flushList = () => {
        if (currentList && currentList.items.length > 0) {
          sections.push({
            id: `${baseId}-list-${idx++}`,
            type: 'list',
            ordered: currentList.ordered,
            items: currentList.items,
          });
          currentList = null;
        }
      };

      const flushTable = () => {
        if (currentTable && currentTable.length > 0) {
          sections.push({
            id: `${baseId}-tbl-${idx++}`,
            type: 'table',
            rows: currentTable,
          });
          currentTable = null;
        }
      };

      for (const line of lines) {
        if (isMarkdownTableLine(line)) {
          flushList();
          if (!isTableSeparatorLine(line)) {
            if (!currentTable) currentTable = [];
            currentTable.push(parseMarkdownTableRow(line));
          }
          continue;
        }
        flushTable();

        const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
          flushList();
          const lvl = Math.min(4, Math.max(2, headingMatch[1].length)) as 2 | 3 | 4;
          sections.push({
            id: `${baseId}-hd-${idx++}`,
            type: 'heading',
            level: lvl,
            text: headingMatch[2].replace(/\*\*/g, '').trim(),
          });
        } else if (line.startsWith('> ')) {
          flushList();
          sections.push({
            id: `${baseId}-qt-${idx++}`,
            type: 'quote',
            text: line.slice(2).trim(),
          });
        } else if (/^([-*•]\s+|\d+[.)]\s+)/.test(line)) {
          const ordered = /^\d+[.)]\s+/.test(line);
          const itemText = line.replace(/^([-*•]\s+|\d+[.)]\s+)/, '').trim();
          if (!currentList || currentList.ordered !== ordered) {
            flushList();
            currentList = { ordered, items: [] };
          }
          currentList.items.push(itemText);
        } else if (isLikelyStandaloneHeading(line)) {
          flushList();
          sections.push({
            id: `${baseId}-hd-${idx++}`,
            type: 'heading',
            level: 2,
            text: line.replace(/\*\*/g, '').trim(),
          });
        } else {
          flushList();
          if (line.length > 260 || /^(?:Who|What|Why|How|When|Where)\s+[^?]{4,85}\?\s+/.test(line)) {
            sections.push(...recoverWallOfText(line, `${baseId}-w-${idx++}`));
          } else {
            sections.push({
              id: `${baseId}-p-${idx++}`,
              type: 'paragraph',
              text: line,
            });
          }
        }
      }
      flushList();
      flushTable();
      continue;
    }

    const joined = lines.join(' ').trim();

    // Markdown heading
    const mdHeading = joined.match(/^(#{1,4})\s+(.+)$/);
    if (mdHeading) {
      const lvl = Math.min(4, Math.max(2, mdHeading[1].length)) as 2 | 3 | 4;
      sections.push({
        id: `${baseId}-hd-${idx++}`,
        type: 'heading',
        level: lvl,
        text: mdHeading[2].replace(/\*\*/g, '').trim(),
      });
      continue;
    }

    // Markdown quote
    if (joined.startsWith('> ')) {
      sections.push({
        id: `${baseId}-qt-${idx++}`,
        type: 'quote',
        text: joined.slice(2).trim(),
      });
      continue;
    }

    // Short bold heading like **Why It Matters**
    const boldHeading = joined.match(/^\*\*(.{4,90})\*\*$/);
    if (boldHeading) {
      sections.push({
        id: `${baseId}-bh-${idx++}`,
        type: 'heading',
        level: 2,
        text: boldHeading[1].trim(),
      });
      continue;
    }

    if (isLikelyStandaloneHeading(joined)) {
      sections.push({
        id: `${baseId}-sh-${idx++}`,
        type: 'heading',
        level: 2,
        text: joined,
      });
      continue;
    }

    // Large or dense collapsed wall of text -> recover into clean subheadings & paragraphs
    if (joined.length > 260 || /^(?:Who|What|Why|How|When|Where)\s+[^?]{4,85}\?\s+/.test(joined)) {
      sections.push(...recoverWallOfText(joined, `${baseId}-w-${idx++}`));
    } else {
      sections.push({
        id: `${baseId}-p-${idx++}`,
        type: 'paragraph',
        text: joined,
      });
    }
  }

  return sections;
}

/**
 * Turns a post's Gutenberg blocks + optional raw content fallback into clean,
 * readable, newspaper-formatted sections.
 */
export function formatArticleForReader(
  blocks?: EditorBlock[],
  fallbackContent?: string,
  articleTitle?: string
): FormattedSection[] {
  const validBlocks = Array.isArray(blocks)
    ? blocks.filter((b) => {
        if (b.type === 'table') return Array.isArray(b.content) && b.content.length > 0;
        return typeof b.content === 'string' && b.content.trim().length > 0;
      })
    : [];

  let out: FormattedSection[] = [];
  if (validBlocks.length === 0) {
    if (!fallbackContent || !fallbackContent.trim()) return [];
    out = parseRawTextToSections(fallbackContent, 'content');
  } else {
    validBlocks.forEach((block, i) => {
      const baseId = block.id || `blk-${i}`;
      if (block.type === 'heading') {
        out.push({
          id: baseId,
          type: 'heading',
          level: block.level || 2,
          text: String(block.content).trim(),
        });
      } else if (block.type === 'quote') {
        out.push({
          id: baseId,
          type: 'quote',
          text: String(block.content).trim(),
          caption: block.caption,
        });
      } else if (block.type === 'callout') {
        out.push({
          id: baseId,
          type: 'callout',
          text: String(block.content).trim(),
        });
      } else if (block.type === 'image') {
        out.push({
          id: baseId,
          type: 'image',
          url: String(block.content).trim(),
          caption: block.caption,
        });
      } else if (block.type === 'table' && Array.isArray(block.content)) {
        out.push({
          id: baseId,
          type: 'table',
          rows: block.content,
        });
      } else if (block.type === 'paragraph') {
        out.push(...parseRawTextToSections(String(block.content), baseId));
      }
    });
  }

  if (articleTitle && out.length > 0 && out[0].type === 'heading') {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ').trim();
    const firstNorm = norm(out[0].text);
    const titleNorm = norm(articleTitle);
    if (firstNorm && titleNorm && (firstNorm === titleNorm || titleNorm.startsWith(firstNorm) || firstNorm.startsWith(titleNorm))) {
      out = out.slice(1);
    }
  }

  return out;
}

/**
 * Converts pasted/raw article text into clean EditorBlocks for the CMS Gutenberg Editor.
 */
export function parseTextToEditorBlocks(rawText: string): EditorBlock[] {
  const sections = parseRawTextToSections(rawText, `b-${Date.now()}`);
  const blocks: EditorBlock[] = [];

  sections.forEach((sec, idx) => {
    const id = `b-${Date.now()}-${idx}`;
    if (sec.type === 'heading') {
      blocks.push({ id, type: 'heading', level: sec.level, content: sec.text });
    } else if (sec.type === 'quote') {
      blocks.push({ id, type: 'quote', content: sec.text, caption: sec.caption });
    } else if (sec.type === 'table') {
      blocks.push({ id, type: 'table', content: sec.rows });
    } else if (sec.type === 'list') {
      const formattedList = sec.items
        .map((item, i) => (sec.ordered ? `${i + 1}. ${item}` : `• ${item}`))
        .join('\n');
      blocks.push({ id, type: 'paragraph', content: formattedList });
    } else if (sec.type === 'paragraph') {
      blocks.push({ id, type: 'paragraph', content: sec.text });
    }
  });

  return blocks.length > 0
    ? blocks
    : [{ id: `b-${Date.now()}`, type: 'paragraph', content: rawText }];
}

export function estimateReadingTimeMinutes(sections: FormattedSection[], title = ''): number {
  const textParts = [title];
  for (const s of sections) {
    if (s.type === 'paragraph' || s.type === 'heading' || s.type === 'quote' || s.type === 'callout') {
      textParts.push(s.text);
    } else if (s.type === 'list') {
      textParts.push(...s.items);
    }
  }
  const words = textParts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
