'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { CatalogData, UserProfile, ComboSetup, Treasure, Cookie, Pet } from '@/lib/types';
import { findTreasureAlternates } from '@/lib/effectTags';
import { findAdvancedBudgetSubstitutes, AdvancedSubstituteRecommendation, ComboStrategyFocus } from '@/lib/abilitySystem';
import AdSenseBanner from '@/components/AdSenseBanner';
import ComboDetailModal from '@/components/ComboDetailModal';
import BudgetSubstituteModal from '@/components/BudgetSubstituteModal';
import PortalModal from '@/components/PortalModal';
import { useLanguage } from '@/lib/i18nContext';
import { 
  TrophyIcon, 
  PlusIcon, 
  SearchIcon, 
  StarIcon, 
  CheckIcon, 
  LightbulbIcon, 
  CoinIcon, 
  XPIcon, 
  GiftIcon, 
  MoonIcon,
  FlaskIcon,
  LightningIcon,
  RocketIcon,
  DiceIcon,
  CloseIcon,
  EyeIcon,
  SparklesIcon
} from '@/components/icons';

export default function ComboPage() {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [combos, setCombos] = useState<ComboSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedComboModal, setSelectedComboModal] = useState<ComboSetup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Interchangeable Budget Substitute State
  const [substituteModalState, setSubstituteModalState] = useState<{
    isOpen: boolean;
    missingItem: Treasure | Cookie | Pet | null;
    recommendations: AdvancedSubstituteRecommendation[];
    strategyFocus?: ComboStrategyFocus;
  }>({
    isOpen: false,
    missingItem: null,
    recommendations: []
  });
  
  // Waterfall Infinite Load State
  const [visibleCount, setVisibleCount] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('Runner');
  const [newMainCookie, setNewMainCookie] = useState('');
  const [newRelayCookie, setNewRelayCookie] = useState('');
  const [newPet, setNewPet] = useState('');
  const [newT1, setNewT1] = useState('');
  const [newT2, setNewT2] = useState('');
  const [newT3, setNewT3] = useState('');
  const [newScore, setNewScore] = useState(50000000);
  const [newCoins, setNewCoins] = useState(25000);
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [selectedEpisode, setSelectedEpisode] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, comboRes, authRes] = await Promise.all([
          fetch('/api/catalog'),
          fetch('/api/setups'),
          fetch('/api/auth/me')
        ]);
        const catData: CatalogData = await catRes.json();
        const comboData: ComboSetup[] = await comboRes.json();
        const authData = await authRes.json();

        setCatalog(catData);
        setCombos(comboData);

        if (catData.cookies.length > 0) setNewMainCookie(catData.cookies[0].id);
        if (catData.pets.length > 0) setNewPet(catData.pets[0].id);
        if (catData.treasures.length > 0) {
          setNewT1(catData.treasures[0].id);
          setNewT2(catData.treasures[1]?.id || catData.treasures[0].id);
          setNewT3(catData.treasures[2]?.id || catData.treasures[0].id);
        }

        if (authData.profile) {
          setProfile(authData.profile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenSubstituteFinder = (missingItem: Treasure | Cookie | Pet) => {
    if (!catalog) return;

    const userInventoryEntries: { item: Treasure | Cookie | Pet; level: number }[] = [];

    if (profile) {
      if (profile.ownedTreasures) {
        Object.values(profile.ownedTreasures).forEach(t => {
          const found = catalog.treasures.find(cat => cat.id === t.itemId);
          if (found) userInventoryEntries.push({ item: found, level: t.level || 9 });
        });
      }
      if (profile.ownedCookies) {
        Object.values(profile.ownedCookies).forEach(c => {
          const found = catalog.cookies.find(cat => cat.id === c.itemId);
          if (found) userInventoryEntries.push({ item: found, level: c.level || 8 });
        });
      }
      if (profile.ownedPets) {
        Object.values(profile.ownedPets).forEach(p => {
          const found = catalog.pets.find(cat => cat.id === p.itemId);
          if (found) userInventoryEntries.push({ item: found, level: p.level || 8 });
        });
      }
    }

    const titleLower = (selectedComboModal?.title || '').toLowerCase();
    const descLower = (selectedComboModal?.description || '').toLowerCase();

    let strategyFocus: ComboStrategyFocus = 'HIGH_SCORE';
    if (titleLower.includes('afk') || titleLower.includes('auto') || descLower.includes('afk')) {
      strategyFocus = 'AFK_AUTO_RUN';
    } else if (titleLower.includes('coin') || descLower.includes('coin')) {
      strategyFocus = 'COIN_FARMING';
    } else if (titleLower.includes('survival') || descLower.includes('distance')) {
      strategyFocus = 'SURVIVAL';
    }

    const recs = findAdvancedBudgetSubstitutes(missingItem, userInventoryEntries, strategyFocus);

    setSubstituteModalState({
      isOpen: true,
      missingItem,
      recommendations: recs,
      strategyFocus
    });
  };

  const handleSelectSubstitute = (substituteItem: Treasure | Cookie | Pet, level: number) => {
    if (selectedComboModal && substituteModalState.missingItem) {
      const missingId = substituteModalState.missingItem.id;
      const updatedTreasureIds = selectedComboModal.treasureIds.map(id =>
        id === missingId ? substituteItem.id : id
      );
      setSelectedComboModal({
        ...selectedComboModal,
        treasureIds: updatedTreasureIds
      });
    }
    setSubstituteModalState({ isOpen: false, missingItem: null, recommendations: [] });
  };

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 12);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore]);

  const handleCreateSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!newTitle || !newMainCookie || !newPet || !newT1) {
      setSubmitError("Please fill in setup title, main cookie, pet, and at least 1 treasure.");
      return;
    }

    setSubmitting(true);
    try {
      const treasures = [newT1, newT2, newT3].filter(Boolean);
      const res = await fetch('/api/setups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor || 'Runner',
          cookieId: newMainCookie,
          relayCookieId: newRelayCookie || undefined,
          petId: newPet,
          treasureIds: treasures,
          targetScore: Number(newScore),
          coinsPerRun: Number(newCoins),
          description: newDesc || 'User submitted Cookie Run Classic setup.',
          tags: ['Community Setup', 'User Build']
        })
      });

      if (res.ok) {
        const created = await res.json();
        setCombos([created, ...combos]);
        setShowSubmitModal(false);
        setNewTitle('');
        setNewDesc('');
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to submit setup.");
      }
    } catch (e) {
      console.error(e);
      setSubmitError("Network error submitting setup.");
    } finally {
      setSubmitting(false);
    }
  };

  // IntersectionObserver for Automatic Scroll-Down Loading
  useEffect(() => {
    if (loading || visibleCount >= combos.length) return;

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
  }, [loading, visibleCount, combos.length, loadingMore, handleLoadMore]);

  if (loading || !catalog) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cookieMap = new Map(catalog.cookies.map(c => [c.id, c]));
  const petMap = new Map(catalog.pets.map(p => [p.id, p]));
  const treasureMap = new Map(catalog.treasures.map(t => [t.id, t]));

  const episodesList = [
    { id: 'ALL', label: t.combo.allEpisodes },
    { id: 'EP1', label: 'EP 1 (Oven Escape)' },
    { id: 'EP2', label: 'EP 2 (Primeval Jungle)' },
    { id: 'EP3', label: 'EP 3 (Dragon\'s Valley)' },
    { id: 'EP4', label: 'EP 4 (City of Wizards)' },
    { id: 'EP5', label: 'EP 5 (Dessert Paradise)' },
    { id: 'Special 1', label: 'Special 1 (Frozen Waves)' },
    { id: 'Special 2', label: 'Special 2 (Island of Memories)' }
  ];

  const categoriesList = [
    { id: 'ALL', label: t.combo.allGoals, icon: TrophyIcon },
    { id: 'High Score (Points)', label: t.combo.highScore, icon: TrophyIcon },
    { id: 'Semi-AFK (준손크로)', label: t.combo.semiAfk, icon: MoonIcon },
    { id: 'Full Manual (손크로)', label: t.combo.fullManual, icon: StarIcon },
    { id: 'Coin Farming', label: t.combo.coinFarming, icon: CoinIcon },
    { id: 'XP Farming', label: t.combo.xpFarming, icon: XPIcon },
    { id: 'Treasure Box Farming', label: t.combo.treasureBox, icon: GiftIcon }
  ];

  const filteredCombos = combos.filter(c => {
    if (selectedEpisode !== 'ALL') {
      if (!c.episode || !c.episode.toLowerCase().includes(selectedEpisode.toLowerCase())) {
        return false;
      }
    }
    if (selectedCategory !== 'ALL') {
      if (c.category !== selectedCategory && !c.tags.includes(selectedCategory)) {
        return false;
      }
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.tags.some(item => item.toLowerCase().includes(term));
    }
    return true;
  });

  const visibleCombos = filteredCombos.slice(0, visibleCount);

  const userOwnedItems = {
    cookies: new Set(Object.keys(profile?.ownedCookies || {})),
    pets: new Set(Object.keys(profile?.ownedPets || {})),
    treasures: new Set(Object.keys(profile?.ownedTreasures || {}))
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28 animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900/40 to-zinc-950 border-b border-zinc-800/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
              <TrophyIcon className="w-4 h-4" />
              <span>{t.combo.badge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {t.combo.title}
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              {t.combo.subtitle}
            </p>
          </div>

          <button
            onClick={() => { setShowSubmitModal(true); setSubmitError(''); }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2 self-start sm:self-auto cursor-pointer hover:scale-105"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            <span>{t.combo.submitSetup}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Top Google AdSense Leaderboard Banner */}
        <div className="mb-8">
          <AdSenseBanner
            type="leaderboard"
            slot="browse-top-banner"
          />
        </div>

        {/* Search & Category Filter Pills */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl">
            <SearchIcon className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.combo.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(12); }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Episode Stage Selector Pills */}
          <div className="space-y-1.5">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">{t.combo.selectEpisode}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {episodesList.map(ep => {
                const isActive = selectedEpisode === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => { setSelectedEpisode(ep.id); setVisibleCount(12); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 shadow-md scale-105'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {ep.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Category Filter Pills */}
          <div className="space-y-1.5">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">{t.combo.selectGoal}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {categoriesList.map(cat => {
                const IconComponent = cat.icon;
                const isActive = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setVisibleCount(12); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-zinc-950 shadow-md scale-105 font-black'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Waterfall Header Info */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800/80">
          <div className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-amber-400" />
            <span>{t.combo.waterfallStream} ({visibleCombos.length} / {filteredCombos.length})</span>
          </div>
          <span className="text-xs text-zinc-400">Masonry Stream</span>
        </div>

        {/* WATERFALL MASONRY GRID */}
        <div className="waterfall-columns">
          {visibleCombos.map((combo, idx) => {
            const mainCookie = cookieMap.get(combo.cookieId);
            const relayCookie = combo.relayCookieId ? cookieMap.get(combo.relayCookieId) : null;
            const pet = petMap.get(combo.petId);
            const treasures = combo.treasureIds.map(tid => treasureMap.get(tid)).filter((item): item is Treasure => Boolean(item));

            const userOwnsMain = userOwnedItems.cookies.has(combo.cookieId);
            const userOwnsRelay = !combo.relayCookieId || userOwnedItems.cookies.has(combo.relayCookieId);
            const userOwnsPet = userOwnedItems.pets.has(combo.petId);
            const userOwnedTreasuresCount = combo.treasureIds.filter(tid => userOwnedItems.treasures.has(tid)).length;

            const isFullMatch = userOwnsMain && userOwnsRelay && userOwnsPet && (userOwnedTreasuresCount === combo.treasureIds.length);
            const showAd = (idx > 0 && idx % 6 === 0);

            return (
              <div key={combo.id} className="waterfall-item">
                
                {showAd && (
                  <div className="mb-6">
                    <AdSenseBanner
                      type="infeed"
                      slot={`browse-infeed-${idx}`}
                    />
                  </div>
                )}

                {/* Setup Card */}
                <div
                  onClick={() => setSelectedComboModal(combo)}
                  className={`rounded-2xl border p-5 bg-zinc-900/90 shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group ${
                    combo.isBoosted
                      ? 'border-amber-500/80 ring-1 ring-amber-500/30 hover:border-amber-400'
                      : isFullMatch
                        ? 'border-emerald-500/60 ring-1 ring-emerald-500/20 hover:border-emerald-400'
                        : 'border-zinc-800/80 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {combo.isBoosted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-zinc-950 uppercase tracking-wider flex items-center gap-1">
                          <StarIcon className="w-3 h-3 fill-zinc-950" />
                          <span>{t.home.boostedMeta}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {combo.episode || 'Classic Stage'}
                      </span>
                    </div>

                    {isFullMatch && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-zinc-950 uppercase tracking-wider flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        <span>{t.combo.ready}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {combo.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{combo.description}</p>

                  <div className="mt-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0">
                        {mainCookie && <Image src={mainCookie.imageUrl} alt={mainCookie.name} fill className="object-contain p-0.5" />}
                      </div>
                      {relayCookie && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0">
                          <Image src={relayCookie.imageUrl} alt={relayCookie.name} fill className="object-contain p-0.5" />
                        </div>
                      )}
                      {pet && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-purple-500/40 bg-zinc-900 shrink-0 ml-auto">
                          <Image src={pet.imageUrl} alt={pet.name} fill className="object-contain p-0.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                      {treasures.map((item, itemIdx) => (
                        <div key={`${item.id}-${itemIdx}`} className="relative w-8 h-8 rounded-md overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0" title={item.name}>
                          <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-0.5" />
                        </div>
                      ))}
                      <span className="text-[10px] font-bold text-zinc-400 ml-auto">
                        Treasures ({treasures.length})
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs border-t border-zinc-800 pt-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">{t.home.targetScore}</span>
                      <span className="font-black text-amber-400">{combo.targetScore.toLocaleString()}</span>
                    </div>
                    {combo.coinsPerRun && (
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">{t.home.coinsPerRun}</span>
                        <span className="font-black text-yellow-400 flex items-center gap-1">
                          <CoinIcon className="w-3.5 h-3.5" />
                          <span>{combo.coinsPerRun.toLocaleString()}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:underline">
                      <EyeIcon className="w-3.5 h-3.5" />
                      <span>{t.combo.inspectDetails}</span>
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {visibleCount < filteredCombos.length && (
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
                  <span>{t.home.loadMore} ({filteredCombos.length - visibleCount})</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {selectedComboModal && (
        <ComboDetailModal
          combo={selectedComboModal}
          catalog={catalog}
          userOwnedItems={userOwnedItems}
          onClose={() => setSelectedComboModal(null)}
          onOpenSubstituteFinder={handleOpenSubstituteFinder}
        />
      )}

      <BudgetSubstituteModal
        isOpen={substituteModalState.isOpen}
        onClose={() => setSubstituteModalState({ isOpen: false, missingItem: null, recommendations: [] })}
        missingItem={substituteModalState.missingItem}
        recommendations={substituteModalState.recommendations}
        strategyFocus={substituteModalState.strategyFocus}
        onSelectSubstitute={handleSelectSubstitute}
      />

      {showSubmitModal && (
        <PortalModal>
          <div className="modal-backdrop animate-fade-in">
            <div className="absolute inset-0" onClick={() => setShowSubmitModal(false)}></div>

            <div className="relative w-full max-w-xl bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-modal-pop max-h-[90vh] overflow-y-auto">
              
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>

              <h2 className="text-2xl font-black text-white mb-1">{t.combo.submitSetup}</h2>
              <p className="text-xs text-zinc-400 mb-6">Share your custom Cookie Run Classic meta build with the community.</p>

              {submitError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleCreateSetup} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Setup Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., EP 3 Dragon Run 80M Score Build"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">{t.modal.mainRunner}</label>
                    <select
                      value={newMainCookie}
                      onChange={(e) => setNewMainCookie(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                    >
                      {catalog.cookies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">{t.modal.relayRunner}</label>
                    <select
                      value={newRelayCookie}
                      onChange={(e) => setNewRelayCookie(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                    >
                      <option value="">None</option>
                      {catalog.cookies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">{t.modal.combiPet}</label>
                    <select
                      value={newPet}
                      onChange={(e) => setNewPet(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                    >
                      {catalog.pets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-zinc-300">{t.modal.equippedTreasures}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newT1}
                      onChange={(e) => setNewT1(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white outline-none focus:border-amber-500"
                    >
                      {catalog.treasures.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={newT2}
                      onChange={(e) => setNewT2(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white outline-none focus:border-amber-500"
                    >
                      {catalog.treasures.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <select
                      value={newT3}
                      onChange={(e) => setNewT3(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-white outline-none focus:border-amber-500"
                    >
                      {catalog.treasures.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">{t.home.targetScore}</label>
                    <input
                      type="number"
                      value={newScore}
                      onChange={(e) => setNewScore(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">{t.home.coinsPerRun}</label>
                    <input
                      type="number"
                      value={newCoins}
                      onChange={(e) => setNewCoins(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">{t.modal.strategyNotes}</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your run strategy, timing, or boost recommendations..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-amber-500 resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : t.combo.postSetup}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </PortalModal>
      )}

    </div>
  );
}
