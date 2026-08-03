'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserProfile, CatalogData } from '@/lib/types';
import { RecommendationResult } from '@/lib/store';
import AdSenseBanner from '@/components/AdSenseBanner';
import ComboDetailModal from '@/components/ComboDetailModal';
import { useLanguage } from '@/lib/i18nContext';
import { 
  SparklesIcon, 
  CookieIcon, 
  PetIcon, 
  TreasureIcon, 
  TrophyIcon, 
  CoinIcon, 
  XPIcon,
  CheckIcon, 
  LightbulbIcon, 
  StarIcon,
  FlaskIcon,
  LightningIcon,
  RocketIcon,
  DiceIcon,
  EditIcon,
  ChevronRightIcon,
  EyeIcon
} from '@/components/icons';

export default function Home() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Waterfall Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedComboModal, setSelectedComboModal] = useState<RecommendationResult | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await fetch('/api/catalog');
        const catData: CatalogData = await catRes.json();
        setCatalog(catData);

        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        let userProf: UserProfile = authData.profile;

        setProfile(userProf);

        const recRes = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userProf)
        });
        const recData: RecommendationResult[] = await recRes.json();
        setRecommendations(recData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 12);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore]);

  // IntersectionObserver for Automatic Scroll-Down Loading
  useEffect(() => {
    if (loading || visibleCount >= recommendations.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: '300px 0px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [loading, visibleCount, recommendations.length, loadingMore, handleLoadMore]);

  if (loading || !catalog) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium text-sm">{t.home.streaming}</p>
        </div>
      </div>
    );
  }

  const ownedCookieCount = Object.keys(profile?.ownedCookies || {}).length;
  const ownedPetCount = Object.keys(profile?.ownedPets || {}).length;
  const ownedTreasureCount = Object.keys(profile?.ownedTreasures || {}).length;

  const cookiePct = Math.round((ownedCookieCount / catalog.cookies.length) * 100);
  const petPct = Math.round((ownedPetCount / catalog.pets.length) * 100);
  const treasurePct = Math.round((ownedTreasureCount / catalog.treasures.length) * 100);

  const visibleRecommendations = recommendations.slice(0, visibleCount);

  const userOwnedItems = {
    cookies: new Set(Object.keys(profile?.ownedCookies || {})),
    pets: new Set(Object.keys(profile?.ownedPets || {})),
    treasures: new Set(Object.keys(profile?.ownedTreasures || {}))
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 animate-fade-in">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-amber-500/15 via-zinc-900/50 to-zinc-950 border-b border-zinc-800/80 py-12 px-4 sm:px-6">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
              <SparklesIcon className="w-4 h-4 text-amber-400" />
              <span>{t.home.badge}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {t.home.titlePrefix} <span className="text-amber-400">{profile?.name || profile?.username || 'Runner'}</span>
            </h1>
            <p className="text-zinc-300 text-base mt-3 leading-relaxed">
              {t.home.heroDesc}
            </p>

            <div className="flex items-center gap-4 mt-6 flex-wrap">
              <Link
                href="/profile"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <EditIcon className="w-4 h-4" />
                <span>{t.home.manageProfile} ({ownedCookieCount + ownedPetCount + ownedTreasureCount})</span>
              </Link>
              <Link
                href="/combo"
                className="px-6 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-sm transition-all hover:border-zinc-600 flex items-center gap-2 cursor-pointer"
              >
                <TrophyIcon className="w-4 h-4 text-amber-400" />
                <span>{t.home.browseAll}</span>
              </Link>
            </div>
          </div>

          {/* Quick Inventory Completion Widget */}
          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl max-w-sm w-full">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.home.activeInventory}</h3>
                <span className="text-[10px] text-amber-400 font-semibold">{profile?.username || 'guest'}</span>
              </div>
              <Link href="/profile" className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                <span>Edit</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <CookieIcon className="w-4 h-4 text-amber-400" />
                    <span>{t.home.cookiesOwned}</span>
                  </span>
                  <span className="font-black text-amber-400 text-xs">{ownedCookieCount} / {catalog.cookies.length} ({cookiePct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, cookiePct)}%` }}></div>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <PetIcon className="w-4 h-4 text-purple-400" />
                    <span>{t.home.petsOwned}</span>
                  </span>
                  <span className="font-black text-purple-400 text-xs">{ownedPetCount} / {catalog.pets.length} ({petPct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, petPct)}%` }}></div>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <TreasureIcon className="w-4 h-4 text-amber-300" />
                    <span>{t.home.treasuresOwned}</span>
                  </span>
                  <span className="font-black text-amber-300 text-xs">{ownedTreasureCount} / {catalog.treasures.length} ({treasurePct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, treasurePct)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Leaderboard Google AdSense Mockup Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <AdSenseBanner
          type="leaderboard"
          slot="home-top-leaderboard"
        />
      </div>

      {/* Main Waterfall Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <TrophyIcon className="w-6 h-6 text-amber-400" />
              <span>{t.home.topRecommended}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{t.home.recommendedDesc}</p>
          </div>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            {t.home.showing} {visibleRecommendations.length} / {recommendations.length}
          </span>
        </div>

        {/* Waterfall Stream Grid */}
        <div className="space-y-6">
          {visibleRecommendations.map((rec, index) => {
            const isFullMatch = rec.matchScore === 100;
            const showInfeedAd = (index > 0 && index % 5 === 0);

            return (
              <div key={rec.combo.id} className="space-y-6">
                
                {showInfeedAd && (
                  <AdSenseBanner
                    type="infeed"
                    slot={`home-infeed-${index}`}
                  />
                )}

                {/* Setup Card */}
                <div
                  onClick={() => setSelectedComboModal(rec)}
                  className={`rounded-2xl border p-6 transition-all duration-300 bg-zinc-900/90 shadow-xl cursor-pointer hover:-translate-y-1 ${
                    rec.combo.isBoosted 
                      ? 'border-amber-500/80 ring-1 ring-amber-500/40 shadow-amber-500/10 hover:border-amber-400' 
                      : isFullMatch
                        ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 hover:border-emerald-400'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    <div className="flex-1">
                      
                      <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        {rec.combo.isBoosted && (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-zinc-950 shadow-md uppercase tracking-wider flex items-center gap-1">
                            <StarIcon className="w-3.5 h-3.5 fill-zinc-950" />
                            <span>{t.home.boostedMeta}</span>
                          </span>
                        )}

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isFullMatch 
                            ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20' 
                            : rec.matchScore >= 70
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {isFullMatch ? (
                            <>
                              <CheckIcon className="w-3.5 h-3.5" />
                              <span>{t.home.readyToRun}</span>
                            </>
                          ) : (
                            <span>{rec.matchScore}{t.home.matchScore}</span>
                          )}
                        </span>

                        {rec.combo.tags.map((tagItem, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {tagItem}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-white hover:text-amber-300 transition-colors flex items-center gap-2">
                          <span>{rec.combo.title}</span>
                        </h3>
                        <span className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>{t.home.viewDetails}</span>
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{rec.combo.description}</p>

                      {rec.missingItems.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {rec.missingItems.map((m, idx) => (
                            <div key={idx} className="text-xs bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{t.home.missing}</span>
                                <span>{m.name} ({m.category})</span>
                              </div>
                              {m.alternates && m.alternates.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-rose-500/20 flex items-center gap-2 flex-wrap">
                                  <span className="font-bold shrink-0 text-emerald-300 flex items-center gap-1">
                                    <LightbulbIcon className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{t.home.substitute}</span>
                                  </span>
                                  {m.alternates.map(alt => (
                                    <span key={alt.id} className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-semibold text-emerald-300 text-xs">
                                      {alt.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Team Lineup */}
                      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                            {rec.cookieDetails && (
                              <Image src={rec.cookieDetails.imageUrl} alt={rec.cookieDetails.name} width={32} height={32} unoptimized className="object-contain" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">{t.modal.mainRunner}</span>
                            <span className={`text-xs font-bold truncate block ${rec.ownedMainCookie ? 'text-amber-400' : 'text-zinc-500 line-through'}`}>
                              {rec.cookieDetails?.name || rec.combo.cookieId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                            {rec.relayCookieDetails ? (
                              <Image src={rec.relayCookieDetails.imageUrl} alt={rec.relayCookieDetails.name} width={32} height={32} unoptimized className="object-contain" />
                            ) : (
                              <span className="text-xs text-zinc-600 font-bold">-</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">{t.modal.relayRunner}</span>
                            <span className={`text-xs font-bold truncate block ${rec.ownedRelayCookie ? 'text-amber-300' : 'text-zinc-500 line-through'}`}>
                              {rec.relayCookieDetails?.name || '-'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                            {rec.petDetails && (
                              <Image src={rec.petDetails.imageUrl} alt={rec.petDetails.name} width={32} height={32} unoptimized className="object-contain" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">{t.modal.combiPet}</span>
                            <span className={`text-xs font-bold truncate block ${rec.ownedPet ? 'text-purple-400' : 'text-zinc-500 line-through'}`}>
                              {rec.petDetails?.name || rec.combo.petId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 shrink-0">
                            {rec.treasureDetails?.slice(0, 3).map((item, i) => (
                              <div key={i} className="w-8 h-8 relative bg-zinc-900 rounded p-0.5 border border-zinc-800 flex items-center justify-center">
                                <Image src={item.imageUrl} alt={item.name} width={28} height={28} unoptimized className="object-contain" />
                              </div>
                            ))}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Treasures</span>
                            <span className="text-xs font-bold text-amber-200">{rec.ownedTreasuresCount}/{rec.combo.treasureIds.length}</span>
                          </div>
                        </div>

                      </div>

                    </div>

                    <div className="lg:w-48 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center flex flex-col justify-center shrink-0">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.home.targetScore}</span>
                      <span className="text-2xl font-black text-amber-400 mt-0.5">{rec.combo.targetScore.toLocaleString()}</span>

                      {rec.combo.coinsPerRun && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.home.coinsPerRun}</span>
                          <span className="text-base font-extrabold text-amber-300 flex items-center justify-center gap-1">
                            <CoinIcon className="w-4 h-4 text-amber-400" />
                            <span>{rec.combo.coinsPerRun.toLocaleString()}</span>
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {visibleCount < recommendations.length && (
          <div ref={sentinelRef} className="mt-10 text-center py-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 font-black text-sm shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto cursor-pointer"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.home.streaming}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <span>{t.home.loadMore} ({recommendations.length - visibleCount})</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {selectedComboModal && (
        <ComboDetailModal
          combo={selectedComboModal.combo}
          catalog={catalog}
          userOwnedItems={userOwnedItems}
          onClose={() => setSelectedComboModal(null)}
        />
      )}

      <AdSenseBanner
        type="sticky-bottom"
        slot="home-bottom-anchor"
      />

    </div>
  );
}
