'use client';

import { useState } from 'react';
import { SparklesIcon, ExternalLinkIcon, CloseIcon } from '@/components/icons';
import { useLanguage } from '@/lib/i18nContext';

export type AdType = 'leaderboard' | 'infeed' | 'sidebar' | 'sticky-bottom';

interface AdSenseBannerProps {
  type?: AdType;
  client?: string;
  slot?: string;
  className?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  linkUrl?: string;
}

export default function AdSenseBanner({
  type = 'leaderboard',
  client = 'ca-pub-0000000000000000',
  slot = '1234567890',
  className = '',
  title,
  description,
  ctaText,
  linkUrl = 'https://adsense.google.com'
}: AdSenseBannerProps) {
  const [closed, setClosed] = useState(false);
  const { t } = useLanguage();

  if (closed) return null;

  const displayTitle = title || (type === 'infeed' ? 'Cookie Run Classic Official Merch' : 'Google AdSense Runner Gear Pass');
  const displayDesc = description || 'Unlock exclusive in-game treasure guides, high-FPS gaming accessories, and runner gear!';
  const displayCta = ctaText || t.ads.learnMore;

  // 1. Leaderboard / Horizontal Banner
  if (type === 'leaderboard') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-amber-950/20 to-zinc-900 border border-amber-500/30 p-4 sm:p-5 shadow-lg group hover:border-amber-500/50 transition-all duration-300 ${className}`}>
        {/* Background Accent Glow */}
        <div className="absolute top-0 right-0 w-64 h-full bg-amber-500/5 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {t.ads.advertisement}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Google AdSense ({slot})</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                {displayTitle}
              </h4>
              <p className="text-xs text-zinc-400 max-w-xl mt-0.5 line-clamp-1">
                {displayDesc}
              </p>
            </div>
          </div>

          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>{displayCta}</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 2. In-Feed Native Card (Fits right inside Waterfall grid!)
  if (type === 'infeed') {
    return (
      <div className={`rounded-2xl border border-amber-500/40 p-6 bg-gradient-to-br from-zinc-900/90 via-amber-950/20 to-zinc-900 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-amber-400/60 hover:shadow-amber-500/10 ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950">
              {t.ads.sponsored}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">AdSense Unit</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Google Ads</span>
        </div>

        <h3 className="text-lg font-black text-white mt-1 leading-snug">{displayTitle}</h3>
        <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{displayDesc}</p>

        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-amber-400/90">{t.ads.featuredPartner}</span>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{displayCta}</span>
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 3. Sidebar Rectangle Ad
  if (type === 'sidebar') {
    return (
      <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-xl text-center relative overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-wider font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {t.ads.advertisement}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">300x250 AdSlot</span>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <SparklesIcon className="w-7 h-7" />
        </div>

        <h4 className="text-base font-black text-white">{displayTitle}</h4>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{displayDesc}</p>

        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition block cursor-pointer"
        >
          {displayCta}
        </a>
      </div>
    );
  }

  // 4. Sticky Bottom Anchor Ad
  if (type === 'sticky-bottom') {
    return (
      <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-2xl bg-zinc-900/95 border border-amber-500/40 p-4 shadow-2xl backdrop-blur-2xl animate-slide-up ${className}`}>
        <button
          onClick={() => setClosed(true)}
          className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 hover:bg-rose-500 hover:text-white border border-zinc-700 flex items-center justify-center transition shadow-md cursor-pointer"
          title="Close Ad"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950 px-1.5 rounded">
                {t.ads.advertisement}
              </span>
              <span className="text-[10px] font-bold text-white line-clamp-1">{displayTitle}</span>
            </div>
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{displayDesc}</p>
          </div>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 shadow-md transition cursor-pointer"
          >
            {displayCta}
          </a>
        </div>
      </div>
    );
  }

  return null;
}
