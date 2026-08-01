'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserProfile, CatalogData } from '@/lib/types';
import { RecommendationResult } from '@/lib/store';

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !catalog) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Calculating Personalized Metas...</p>
        </div>
      </div>
    );
  }

  const ownedCookieCount = Object.keys(profile?.ownedCookies || {}).length;
  const ownedPetCount = Object.keys(profile?.ownedPets || {}).length;
  const ownedTreasureCount = Object.keys(profile?.ownedTreasures || {}).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-amber-500/20 via-zinc-900/60 to-zinc-950 border-b border-zinc-800/80 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-4">
              <span>🔥 Cookie Run Classic Personalized Meta Finder</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Custom Recommendations For {profile?.name || profile?.username || 'You'}
            </h1>
            <p className="text-zinc-300 text-base mt-3 leading-relaxed">
              Find the highest scoring and best coin-farming team combinations matched directly against your owned Cookies, Pets, and Treasures.
            </p>

            <div className="flex items-center gap-4 mt-6">
              <Link
                href="/profile"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/20 transition flex items-center gap-2"
              >
                <span>⚙️ Manage Profile ({ownedCookieCount + ownedPetCount + ownedTreasureCount} Owned)</span>
              </Link>
              <Link
                href="/combo"
                className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-sm transition"
              >
                Browse All Metas
              </Link>
            </div>
          </div>

          {/* Quick Inventory Widget */}
          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-sm w-full">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Active Inventory</h3>
                <span className="text-[10px] text-amber-400 font-semibold">{profile?.username || 'guest'}</span>
              </div>
              <Link href="/profile" className="text-xs text-amber-400 font-bold hover:underline">Edit</Link>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                <span className="font-semibold text-zinc-300">🍪 Cookies Owned:</span>
                <span className="font-extrabold text-amber-400 text-sm">{ownedCookieCount} / {catalog.cookies.length}</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                <span className="font-semibold text-zinc-300">🐾 Pets Owned:</span>
                <span className="font-extrabold text-purple-400 text-sm">{ownedPetCount} / {catalog.pets.length}</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                <span className="font-semibold text-zinc-300">💎 Treasures Owned:</span>
                <span className="font-extrabold text-amber-300 text-sm">{ownedTreasureCount} / {catalog.treasures.length}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Top Recommended Setups For You</h2>
            <p className="text-xs text-zinc-400">Ranked by inventory compatibility score & admin boosted meta priority</p>
          </div>
          <Link href="/combo" className="text-xs font-bold text-amber-400 hover:underline">View All Setups →</Link>
        </div>

        {/* Recommendations List */}
        <div className="space-y-6">
          {recommendations.map((rec) => {
            const isFullMatch = rec.matchScore === 100;

            return (
              <div
                key={rec.combo.id}
                className={`rounded-2xl border p-6 transition-all bg-zinc-900/90 shadow-xl ${
                  rec.combo.isBoosted 
                    ? 'border-amber-500/80 ring-1 ring-amber-500/40' 
                    : isFullMatch
                      ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left Section: Combo Details */}
                  <div className="flex-1">
                    
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      {/* Boost Badge */}
                      {rec.combo.isBoosted && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-zinc-950 shadow-md uppercase tracking-wider">
                          ★ BOOSTED META
                        </span>
                      )}

                      {/* Match Score Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isFullMatch 
                          ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20' 
                          : rec.matchScore >= 70
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {isFullMatch ? '✓ 100% Ready To Run' : `${rec.matchScore}% Inventory Match`}
                      </span>

                      {rec.combo.tags.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {t}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-2xl font-black text-white mt-1">{rec.combo.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{rec.combo.description}</p>

                    {/* Missing Items Warning + Alternate Suggestions */}
                    {rec.missingItems.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {rec.missingItems.map((m, idx) => (
                          <div key={idx} className="text-xs bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-rose-300">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">Missing:</span>
                              <span>{m.name} ({m.category})</span>
                            </div>
                            {m.alternates && m.alternates.length > 0 && (
                              <div className="mt-1.5 pt-1.5 border-t border-rose-500/20 flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold shrink-0 text-emerald-300">💡 You own:</span>
                                {m.alternates.map(alt => (
                                  <span key={alt.id} className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 font-semibold text-emerald-300">
                                    {alt.name}
                                  </span>
                                ))}
                                <span className="text-zinc-400">— similar effect, could substitute</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Team Visual Lineup */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
                      
                      {/* Main Cookie */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center">
                          {rec.cookieDetails && (
                            <Image src={rec.cookieDetails.imageUrl} alt={rec.cookieDetails.name} width={32} height={32} unoptimized className="object-contain" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Main Cookie</span>
                          <span className={`text-xs font-bold ${rec.ownedMainCookie ? 'text-amber-400' : 'text-zinc-500 line-through'}`}>
                            {rec.cookieDetails?.name || rec.combo.cookieId}
                          </span>
                        </div>
                      </div>

                      {/* Relay Cookie */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center">
                          {rec.relayCookieDetails ? (
                            <Image src={rec.relayCookieDetails.imageUrl} alt={rec.relayCookieDetails.name} width={32} height={32} unoptimized className="object-contain" />
                          ) : (
                            <span className="text-xs text-zinc-600 font-bold">-</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Relay Cookie</span>
                          <span className={`text-xs font-bold ${rec.ownedRelayCookie ? 'text-amber-300' : 'text-zinc-500 line-through'}`}>
                            {rec.relayCookieDetails?.name || 'No Relay'}
                          </span>
                        </div>
                      </div>

                      {/* Pet */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 relative bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex items-center justify-center">
                          {rec.petDetails && (
                            <Image src={rec.petDetails.imageUrl} alt={rec.petDetails.name} width={32} height={32} unoptimized className="object-contain" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Pet</span>
                          <span className={`text-xs font-bold ${rec.ownedPet ? 'text-purple-400' : 'text-zinc-500 line-through'}`}>
                            {rec.petDetails?.name || rec.combo.petId}
                          </span>
                        </div>
                      </div>

                      {/* Treasures */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {rec.treasureDetails?.slice(0, 3).map((t, i) => (
                            <div key={i} className="w-8 h-8 relative bg-zinc-900 rounded p-0.5 border border-zinc-800">
                              <Image src={t.imageUrl} alt={t.name} width={28} height={28} unoptimized className="object-contain" />
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Treasures</span>
                          <span className="text-xs font-bold text-amber-200">{rec.ownedTreasuresCount}/{rec.combo.treasureIds.length}</span>
                        </div>
                      </div>

                    </div>

                    {/* Pre-Run Boost Badges */}
                    {rec.combo.boosts && (
                      <div className="mt-3 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-amber-400 text-[10px] uppercase">Required Boosts:</span>
                          {rec.combo.boosts.hpExtension && <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800">🧪 HP Extension</span>}
                          {rec.combo.boosts.powerJellyBoost && <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800">⚡ Power Jelly</span>}
                          {rec.combo.boosts.doubleXp && <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800">⭐ Double XP</span>}
                          {rec.combo.boosts.fastStart && <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800">🚀 Fast Start</span>}
                        </div>
                        {rec.combo.boosts.randomBoost && (
                          <div className="text-[10px] text-amber-300 font-black flex items-center gap-1 pt-0.5">
                            <span>🎰 Random Boost:</span>
                            <span className="text-white bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">{rec.combo.boosts.randomBoost}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Section: Target Stats */}
                  <div className="lg:w-48 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Target Score</span>
                    <span className="text-2xl font-black text-amber-400 mt-0.5">{rec.combo.targetScore.toLocaleString()}</span>

                    {rec.combo.coinsPerRun && (
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Coins / Run</span>
                        <span className="text-base font-extrabold text-amber-300">{rec.combo.coinsPerRun.toLocaleString()} coins</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
