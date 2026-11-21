import React from 'react';

const INLINE_TOKEN_REGEX = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;

/**
 * Safely renders inline **bold** and *italic* markers into React elements
 * without raw HTML injection.
 */
export function renderInlineFormatting(text: string): React.ReactNode {
  if (!text || (!text.includes('**') && !text.includes('*'))) {
    return text;
  }

  const parts = text.split(INLINE_TOKEN_REGEX);
  if (parts.length <= 1) {
    return text;
  }

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}
