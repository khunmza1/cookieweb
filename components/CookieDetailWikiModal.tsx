'use client';

import React from 'react';
import Image from 'next/image';
import { Cookie, CatalogData } from '@/lib/types';
import PortalModal from './PortalModal';
import { CloseIcon, SparklesIcon, TrophyIcon } from './icons';

interface CookieDetailWikiModalProps {
  cookie: Cookie;
  catalog?: CatalogData;
  onClose: () => void;
}

export const CookieDetailWikiModal: React.FC<CookieDetailWikiModalProps> = ({
  cookie,
  catalog,
  onClose
}) => {
  if (!cookie) return null;

  // Resolve related treasure & pet from catalog if available
  const rewardTreasureObj = catalog?.treasures.find(t => 
    t.id === cookie.rewardTreasure?.id || 
    t.name.toLowerCase() === cookie.rewardTreasure?.name.toLowerCase()
  );

  const combiPetObj = catalog?.pets.find(p => 
    p.name.toLowerCase() === (cookie.combiPetName || '').toLowerCase() ||
    p.id === cookie.combiPetId
  );

  const gradeColors: Record<string, string> = {
    C: 'bg-zinc-700 text-zinc-200 border-zinc-500',
    B: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    A: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    S: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    'S+': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    L: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  };

  return (
    <PortalModal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full flex flex-col shadow-2xl relative text-zinc-100 max-h-[92vh] overflow-hidden">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm transition cursor-pointer z-10"
          >
            <CloseIcon className="w-5 h-5" />
          </button>

          {/* Scrollable Container */}
          <div className="overflow-y-auto pr-2 space-y-6">

            {/* Hero Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-zinc-800/80 pb-6">
              <div className="w-24 h-24 relative bg-zinc-900 rounded-3xl p-2 border-2 border-amber-500/50 shadow-xl flex items-center justify-center shrink-0">
                <Image
                  src={cookie.imageUrl}
                  alt={cookie.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  Cookie · {cookie.code || cookie.id}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {cookie.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black border uppercase tracking-wider ${gradeColors[cookie.grade] || gradeColors.S}`}>
                    Grade {cookie.grade}
                  </span>
                  {cookie.hp && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                      ❤️ {cookie.hp}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Skill Description */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4" />
                <span>Skill Ability</span>
              </div>
              <p className="text-sm text-amber-100 leading-relaxed font-medium">
                {cookie.skill}
              </p>
            </div>

            {/* How to Unlock & Combi Bonus Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cookie.unlockedBy && (
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">How to unlock</div>
                  <div className="text-sm font-black text-white mt-1">{cookie.unlockedBy}</div>
                </div>
              )}

              {cookie.combiBonus && (
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Combi Bonus</div>
                  <div className="text-sm font-black text-white mt-1 flex items-center gap-1.5">
                    <span>{cookie.combiBonus}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Standardized Ability Traits */}
            {cookie.standardizedTraits && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Standardized Ability Classification</div>
                <div className="flex flex-wrap gap-2">
                  {cookie.standardizedTraits.typeTags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Type: {tag}
                    </span>
                  ))}
                  {cookie.standardizedTraits.activeTags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Active: {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Level Progression Table */}
            {cookie.levelProgression && cookie.levelProgression.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrophyIcon className="w-4 h-4" />
                  <span>Level Progression</span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/80">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Level</th>
                        <th className="p-3">Title / Effect</th>
                        <th className="p-3 text-right">Energy (HP)</th>
                        <th className="p-3 text-right">Upgrade Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-medium">
                      {cookie.levelProgression.map(row => (
                        <tr key={row.level} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3 font-bold text-amber-400">Lv. {row.level}</td>
                          <td className="p-3 font-bold text-white">{row.title}</td>
                          <td className="p-3 text-right font-black text-emerald-400">{row.energy} HP</td>
                          <td className="p-3 text-right text-zinc-300 font-semibold">{row.upgradeCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Related Items (Treasure Reward & Combi Pet) */}
            {(cookie.rewardTreasure || combiPetObj || cookie.combiPetName) && (
              <div className="space-y-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Related Items</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Reward Treasure */}
                  {cookie.rewardTreasure && (
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 relative bg-zinc-950 rounded-xl border border-zinc-800 p-1 shrink-0 flex items-center justify-center">
                        <Image
                          src={rewardTreasureObj?.imageUrl || '/images/treasures/default.png'}
                          alt={cookie.rewardTreasure.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{cookie.rewardTreasure.name}</div>
                        <div className="text-[11px] text-amber-400 font-bold">{cookie.rewardTreasure.subText || 'Lv.8 Treasure reward'}</div>
                      </div>
                    </div>
                  )}

                  {/* Combi Pet */}
                  {(combiPetObj || cookie.combiPetName) && (
                    <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 relative bg-zinc-950 rounded-xl border border-zinc-800 p-1 shrink-0 flex items-center justify-center">
                        <Image
                          src={combiPetObj?.imageUrl || '/images/pets/choco_drop.png'}
                          alt={combiPetObj?.name || cookie.combiPetName || 'Pet'}
                          width={40}
                          height={40}
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{combiPetObj?.name || cookie.combiPetName}</div>
                        <div className="text-[11px] text-purple-400 font-bold">Combi Partner Pet</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Skins Section */}
            {cookie.skins && cookie.skins.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Skins</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cookie.skins.map((skin, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                        🎨
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{skin.name}</div>
                        <div className="text-[10px] text-zinc-400 font-semibold">{skin.subText}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Story / Lore Section */}
            {cookie.story && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-1.5">
                <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">Story & Lore</div>
                <p className="text-xs text-zinc-300 leading-relaxed font-normal italic">
                  "{cookie.story}"
                </p>
              </div>
            )}

          </div>

          {/* Footer Action */}
          <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </PortalModal>
  );
};
