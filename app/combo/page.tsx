'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CatalogData, UserProfile, ComboSetup } from '@/lib/types';
import { findTreasureAlternates, TreasureAlternate } from '@/lib/effectTags';
import PaginationControls, { PageSizeOption } from '@/components/PaginationControls';
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
  DiceIcon
} from '@/components/icons';

export default function ComboPage() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [combos, setCombos] = useState<ComboSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(20);

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

  const [selectedEpisode, setSelectedEpisode] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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
    { id: 'ALL', label: 'All Episodes' },
    { id: 'EP1', label: 'EP 1 (Oven Escape)' },
    { id: 'EP2', label: 'EP 2 (Primeval Jungle)' },
    { id: 'EP3', label: 'EP 3 (Dragon\'s Valley)' },
    { id: 'EP4', label: 'EP 4 (City of Wizards)' },
    { id: 'EP5', label: 'EP 5 (Dessert Paradise)' },
    { id: 'Special 1', label: 'Special 1 (Frozen Waves)' },
    { id: 'Special 2', label: 'Special 2 (Island of Memories)' }
  ];

  const categoriesList = [
    { id: 'ALL', label: 'All Goals', icon: TrophyIcon },
    { id: 'High Score (Points)', label: 'High Score', icon: TrophyIcon },
    { id: 'Semi-AFK (준손크로)', label: 'Semi-AFK (준손크로)', icon: MoonIcon },
    { id: 'Full Manual (손크로)', label: 'Full Manual (손크로)', icon: StarIcon },
    { id: 'Coin Farming', label: 'Coin Farming', icon: CoinIcon },
    { id: 'XP Farming', label: 'XP Farming', icon: XPIcon },
    { id: 'Treasure Box Farming', label: 'Treasure Box', icon: GiftIcon }
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
        c.tags.some(t => t.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900/40 to-zinc-950 border-b border-zinc-800/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
              <TrophyIcon className="w-4 h-4" />
              <span>Cookie Run Classic Combos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Community Metas & Setups
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Explore authentic LINE/Kakao combinations, coin farming builds, and high score runs submitted by players.
            </p>
          </div>

          <button
            onClick={() => { setShowSubmitModal(true); setSubmitError(''); }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            <span>Submit New Setup</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Search & Category Filter Pills */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl">
            <SearchIcon className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search combos by name, strategy, or tag (e.g. Coin Farming, Magnet)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Episode Stage Selector Pills */}
          <div className="space-y-1.5">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">1. Select Episode / Stage:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {episodesList.map(ep => {
                const isActive = selectedEpisode === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => { setSelectedEpisode(ep.id); setCurrentPage(1); }}
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
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">2. Select Goal / Purpose:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {categoriesList.map(cat => {
                const IconComponent = cat.icon;
                const isActive = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
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

        {/* Top Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredCombos.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          className="mb-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4"
        />

        {/* Combo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(pageSize === 'ALL'
            ? filteredCombos
            : filteredCombos.slice((currentPage - 1) * pageSize, currentPage * pageSize)
          ).map(combo => {
            const mainCookie = cookieMap.get(combo.cookieId);
            const relayCookie = combo.relayCookieId ? cookieMap.get(combo.relayCookieId) : null;
            const pet = petMap.get(combo.petId);
            const treasures = combo.treasureIds.map(tid => treasureMap.get(tid)).filter(Boolean);

            // Check inventory match if profile loaded
            let isFullMatch = false;
            let missingCount = 0;
            const missingTreasureAlternates: { id: string; name: string; alternates: TreasureAlternate[] }[] = [];
            if (profile) {
              const hasMain = Boolean(profile.ownedCookies[combo.cookieId]);
              const hasRelay = combo.relayCookieId ? Boolean(profile.ownedCookies[combo.relayCookieId]) : true;
              const hasPet = Boolean(profile.ownedPets[combo.petId]);
              const hasT = combo.treasureIds.every(tid => Boolean(profile.ownedTreasures[tid]));
              isFullMatch = hasMain && hasRelay && hasPet && hasT;

              if (!hasMain) missingCount++;
              if (combo.relayCookieId && !hasRelay) missingCount++;
              if (!hasPet) missingCount++;

              const ownedTreasureIds = new Set(Object.keys(profile.ownedTreasures));
              const usedInCombo = new Set(combo.treasureIds);
              combo.treasureIds.forEach(tid => {
                if (!profile.ownedTreasures[tid]) {
                  missingCount++;
                  const t = treasureMap.get(tid);
                  if (t) {
                    const alternates = findTreasureAlternates(t, catalog.treasures, ownedTreasureIds, usedInCombo);
                    if (alternates.length > 0) {
                      missingTreasureAlternates.push({ id: tid, name: t.name, alternates });
                    }
                  }
                }
              });
            }

            return (
              <div
                key={combo.id}
                className={`bg-zinc-900/80 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-xl ${
                  combo.isBoosted ? 'border-amber-500/80 ring-1 ring-amber-500/30' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {combo.isBoosted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-zinc-950 uppercase tracking-wider flex items-center gap-1">
                          <StarIcon className="w-3 h-3 fill-zinc-950" />
                          <span>BOOSTED META</span>
                        </span>
                      )}
                      {combo.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-amber-300 border border-zinc-700">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {profile && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                        isFullMatch 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {isFullMatch ? (
                          <>
                            <CheckIcon className="w-3 h-3" />
                            <span>100% Owned</span>
                          </>
                        ) : (
                          <span>{missingCount} missing</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Title & Author */}
                  <h2 className="text-xl font-black text-white">{combo.title}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">By <span className="text-amber-400 font-semibold">{combo.author}</span></p>

                  {/* Item Lineup Display */}
                  <div className="my-5 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 grid grid-cols-4 gap-2 text-center">
                    
                    {/* Main Cookie */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                        {mainCookie && (
                          <Image src={mainCookie.imageUrl} alt={mainCookie.name} width={40} height={40} unoptimized className="object-contain" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 mt-1 line-clamp-1">{mainCookie?.name || combo.cookieId}</span>
                      <span className="text-[9px] text-zinc-500 uppercase font-semibold">Main</span>
                    </div>

                    {/* Relay Cookie */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                        {relayCookie ? (
                          <Image src={relayCookie.imageUrl} alt={relayCookie.name} width={40} height={40} unoptimized className="object-contain" />
                        ) : (
                          <span className="text-xs text-zinc-600 font-bold">None</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-amber-300 mt-1 line-clamp-1">{relayCookie?.name || 'No Relay'}</span>
                      <span className="text-[9px] text-zinc-500 uppercase font-semibold">Relay</span>
                    </div>

                    {/* Pet */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                        {pet && (
                          <Image src={pet.imageUrl} alt={pet.name} width={40} height={40} unoptimized className="object-contain" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-purple-400 mt-1 line-clamp-1">{pet?.name || combo.petId}</span>
                      <span className="text-[9px] text-zinc-500 uppercase font-semibold">Pet</span>
                    </div>

                    {/* Treasures */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-0.5 justify-center">
                        {treasures.slice(0, 3).map((t, idx) => (
                          <div key={idx} className="w-8 h-8 relative bg-zinc-900 rounded p-0.5 border border-zinc-800 flex items-center justify-center">
                            {t && <Image src={t.imageUrl} alt={t.name} width={28} height={28} unoptimized className="object-contain" />}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-amber-200 mt-1">{treasures.length} Treasures</span>
                      <span className="text-[9px] text-zinc-500 uppercase font-semibold">Items</span>
                    </div>

                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">{combo.description}</p>

                  {/* Alternate Treasure Suggestions */}
                  {missingTreasureAlternates.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {missingTreasureAlternates.map(m => (
                        <div key={m.id} className="text-[11px] bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2 text-emerald-300 flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold shrink-0 flex items-center gap-1">
                            <LightbulbIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Missing {m.name} — substitute:</span>
                          </span>
                          {m.alternates.map(alt => (
                            <span key={alt.id} className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-semibold text-xs">
                              {alt.name}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pre-Run Boost Badges */}
                  {combo.boosts && (
                    <div className="mb-3 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-400 text-[10px] uppercase">Required Boosts:</span>
                        {combo.boosts.hpExtension && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800 flex items-center gap-1">
                            <FlaskIcon className="w-3 h-3 text-red-400" />
                            <span>HP Extension</span>
                          </span>
                        )}
                        {combo.boosts.powerJellyBoost && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800 flex items-center gap-1">
                            <LightningIcon className="w-3 h-3 text-amber-400" />
                            <span>Power Jelly</span>
                          </span>
                        )}
                        {combo.boosts.doubleXp && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800 flex items-center gap-1">
                            <XPIcon className="w-3 h-3 text-purple-400" />
                            <span>Double XP</span>
                          </span>
                        )}
                        {combo.boosts.fastStart && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800 flex items-center gap-1">
                            <RocketIcon className="w-3 h-3 text-cyan-400" />
                            <span>Fast Start</span>
                          </span>
                        )}
                      </div>
                      {combo.boosts.randomBoost && (
                        <div className="text-[10px] text-amber-300 font-black flex items-center gap-1 pt-0.5">
                          <DiceIcon className="w-3 h-3 text-amber-400" />
                          <span>Random Boost:</span>
                          <span className="text-white bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">{combo.boosts.randomBoost}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Target Metrics */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[10px] block">Target Score</span>
                    <span className="text-amber-400 font-black text-sm">{combo.targetScore.toLocaleString()} pts</span>
                  </div>
                  {combo.coinsPerRun && (
                    <div className="text-right">
                      <span className="text-zinc-500 font-bold uppercase text-[10px] block">Coins / Run</span>
                      <span className="text-amber-300 font-black text-sm flex items-center justify-end gap-1">
                        <CoinIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{combo.coinsPerRun.toLocaleString()}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredCombos.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          className="mt-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4"
        />

      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative text-zinc-100 shadow-2xl">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <PlusIcon className="w-5 h-5 text-amber-400 stroke-[3]" />
                <span>Submit Cookie Run Setup</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Share your high score or coin farming build with the community.</p>
            </div>

            {submitError && (
              <div className="mb-4 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl">
                ⚠️ {submitError}
              </div>
            )}

            <form onSubmit={handleCreateSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Setup Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moonlight Starlight Score Meta"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Main Cookie</label>
                  <select
                    value={newMainCookie}
                    onChange={(e) => setNewMainCookie(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    {catalog.cookies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Relay Cookie (Optional)</label>
                  <select
                    value={newRelayCookie}
                    onChange={(e) => setNewRelayCookie(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">-- No Relay --</option>
                    {catalog.cookies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Pet</label>
                <select
                  value={newPet}
                  onChange={(e) => setNewPet(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  {catalog.pets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Grade {p.grade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Treasures (Up to 3)</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newT1}
                    onChange={(e) => setNewT1(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-[11px] text-white outline-none cursor-pointer"
                  >
                    {catalog.treasures.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={newT2}
                    onChange={(e) => setNewT2(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-[11px] text-white outline-none cursor-pointer"
                  >
                    {catalog.treasures.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={newT3}
                    onChange={(e) => setNewT3(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-[11px] text-white outline-none cursor-pointer"
                  >
                    {catalog.treasures.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Score</label>
                  <input
                    type="number"
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Coins Per Run</label>
                  <input
                    type="number"
                    value={newCoins}
                    onChange={(e) => setNewCoins(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Strategy Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explain why this combination works..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Post Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
