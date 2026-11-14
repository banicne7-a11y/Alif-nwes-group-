import React, { useEffect, useRef } from 'react';
import { AdPlacement } from '../../types';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const PLACEHOLDER_PUB_ID = 'ca-pub-9386736849071234';

export function isRealPublisherId(clientId?: string): boolean {
  const clean = (clientId || '').trim();
  return /^ca-pub-\d{10,}$/.test(clean) && clean !== PLACEHOLDER_PUB_ID;
}

export function ensureAdSenseScript(publisherId?: string): void {
  if (typeof document === 'undefined') return;
  const clean = (publisherId || '').trim();
  if (!isRealPublisherId(clean)) return;

  const existing = document.querySelector<HTMLScriptElement>('script[data-alif-adsense="true"]');
  const desiredSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clean)}`;
  if (existing) {
    if (existing.src !== desiredSrc) {
      existing.src = desiredSrc;
    }
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = desiredSrc;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-alif-adsense', 'true');
  document.head.appendChild(script);
}

function stripComments(code: string): string {
  return code.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function isNumericSlotId(code: string): boolean {
  return /^\d{6,20}$/.test(code.trim());
}

interface AdSlotRendererProps {
  placementKey: string;
  ads: AdPlacement[];
  publisherId?: string;
  className?: string;
}

export const AdSlotRenderer: React.FC<AdSlotRendererProps> = ({
  placementKey,
  ads,
  publisherId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const placement = ads.find(
    (ad) => ad.key === placementKey && ad.status === 'Active'
  );

  const rawCode = placement?.customCode?.trim() || '';
  const strippedCode = stripComments(rawCode);
  const slotOnly = isNumericSlotId(strippedCode);

  const hasRenderableImage =
    placement?.type === 'Image' && Boolean(placement.imageUrl?.trim());
  const hasRenderableCode =
    Boolean(placement) &&
    placement?.type !== 'Image' &&
    Boolean(strippedCode) &&
    (!slotOnly || isRealPublisherId(publisherId));

  useEffect(() => {
    if (!hasRenderableCode || !containerRef.current || !placement) return;

    const host = containerRef.current;
    host.innerHTML = '';

    if (slotOnly && isRealPublisherId(publisherId)) {
      ensureAdSenseScript(publisherId);
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', (publisherId || '').trim());
      ins.setAttribute('data-ad-slot', strippedCode);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      host.appendChild(ins);
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Ignore AdSense push timing errors
      }
      return;
    }

    // Parse full HTML / AdSense snippet safely
    const template = document.createElement('template');
    template.innerHTML = strippedCode;
    const scripts = Array.from(template.content.querySelectorAll('script'));
    scripts.forEach((s) => s.parentNode?.removeChild(s));

    host.appendChild(template.content.cloneNode(true));

    // Re-attach external scripts if needed (e.g. adsbygoogle.js)
    scripts.forEach((orig) => {
      if (orig.src) {
        if (orig.src.includes('adsbygoogle.js') && document.querySelector('script[src*="adsbygoogle.js"]')) {
          return;
        }
        const s = document.createElement('script');
        s.async = true;
        s.src = orig.src;
        if (orig.crossOrigin) s.crossOrigin = orig.crossOrigin;
        host.appendChild(s);
      } else if (orig.textContent?.includes('adsbygoogle')) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // Ignore AdSense push timing errors
        }
      }
    });

    if (host.querySelector('ins.adsbygoogle')) {
      if (isRealPublisherId(publisherId)) {
        ensureAdSenseScript(publisherId);
      }
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Ignore duplicate push
      }
    }
  }, [hasRenderableCode, placement?.id, strippedCode, slotOnly, publisherId]);

  if (!placement || (!hasRenderableImage && !hasRenderableCode)) {
    return null;
  }

  const deviceVisibilityClass =
    placement.deviceTarget === 'desktop'
      ? 'hidden md:block'
      : placement.deviceTarget === 'mobile'
      ? 'block md:hidden'
      : 'block';

  return (
    <div
      className={`${deviceVisibilityClass} ${className}`}
      data-ad-slot-key={placement.key}
    >
      <div className="text-[9px] uppercase tracking-widest text-slate-400 text-center mb-1 font-semibold">
        Advertisement
      </div>

      {hasRenderableImage ? (
        <a
          href={placement.targetUrl || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:opacity-95 transition-opacity"
        >
          <img
            src={placement.imageUrl}
            alt={placement.name}
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-64 object-cover mx-auto"
          />
        </a>
      ) : (
        <div
          ref={containerRef}
          className="w-full overflow-hidden flex justify-center min-h-[50px]"
        />
      )}
    </div>
  );
};
