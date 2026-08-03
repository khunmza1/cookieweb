'use client';

import React from 'react';
import Image from 'next/image';
import { Pet, CatalogData } from '@/lib/types';
import PortalModal from './PortalModal';
import { CloseIcon, SparklesIcon, TrophyIcon } from './icons';

interface PetDetailWikiModalProps {
  pet: Pet;
  catalog?: CatalogData;
  onClose: () => void;
}

export const PetDetailWikiModal: React.FC<PetDetailWikiModalProps> = ({
  pet,
  catalog,
  onClose
}) => {
  if (!pet) return null;

  // Resolve related treasure & cookie from catalog
  const rewardTreasureObj = catalog?.treasures.find(t => 
    t.id === pet.rewardTreasure?.id || 
    t.name.toLowerCase() === pet.rewardTreasure?.name.toLowerCase()
  );

  const combiCookieObj = catalog?.cookies.find(c => 
    c.id === pet.combiCookieId ||
    c.name.toLowerCase() === (pet.combiCookieName || '').toLowerCase()
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
        <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full flex flex-col shadow-2xl relative text-zinc-100 max-h-[92vh] overflow-hidden">
          
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
              <div className="w-24 h-24 relative bg-zinc-900 rounded-3xl p-2 border-2 border-purple-500/50 shadow-xl flex items-center justify-center shrink-0">
                <Image
                  src={pet.imageUrl}
                  alt={pet.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-black text-purple-400 uppercase tracking-widest">
                  Pet · {pet.code || pet.id}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {pet.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black border uppercase tracking-wider ${gradeColors[pet.grade] || gradeColors.S}`}>
                    Grade {pet.grade}
                  </span>
                  {pet.abilityTag && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      ✨ {pet.abilityTag}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Skill Description */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4" />
                <span>Pet Skill</span>
              </div>
              <p className="text-sm text-purple-100 leading-relaxed font-medium">
                {pet.skill}
              </p>
            </div>

            {/* Combi Bonus */}
            {pet.combiBonus && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Combi Bonus</div>
                <div className="text-sm font-black text-white mt-1 flex items-center gap-1.5">
                  <span>{pet.combiBonus}</span>
                </div>
              </div>
            )}

            {/* Standardized Ability Traits */}
            {pet.standardizedTraits && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Standardized Ability Classification</div>
                <div className="flex flex-wrap gap-2">
                  {pet.standardizedTraits.typeTags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Type: {tag}
                    </span>
                  ))}
                  {pet.standardizedTraits.activeTags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Active: {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Level Progression Table */}
            {pet.levelProgression && pet.levelProgression.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrophyIcon className="w-4 h-4" />
                  <span>Level Progression</span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/80">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Level</th>
                        <th className="p-3">Ability Magnitude</th>
                        <th className="p-3 text-right">Upgrade Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-medium">
                      {pet.levelProgression.map(row => (
                        <tr key={row.level} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3 font-bold text-purple-400">Lv. {row.level}</td>
                          <td className="p-3 font-bold text-white">{row.abilityMagnitude}</td>
                          <td className="p-3 text-right text-zinc-300 font-semibold">{row.upgradeCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Related Items (Reward Treasure & Combi Cookie) */}
            {(pet.rewardTreasure || combiCookieObj || pet.combiCookieName) && (
              <div className="space-y-2">
                <div className="text-xs font-black text-purple-400 uppercase tracking-wider">Related Items</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Reward Treasure */}
                  {pet.rewardTreasure && (
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 relative bg-zinc-950 rounded-xl border border-zinc-800 p-1 shrink-0 flex items-center justify-center">
                        <Image
                          src={rewardTreasureObj?.imageUrl || '/images/treasures/default.png'}
                          alt={pet.rewardTreasure.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{pet.rewardTreasure.name}</div>
                        <div className="text-[11px] text-amber-400 font-bold">{pet.rewardTreasure.subText || 'Lv.8 Treasure reward'}</div>
                      </div>
                    </div>
                  )}

                  {/* Combi Cookie */}
                  {(combiCookieObj || pet.combiCookieName) && (
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-12 h-12 relative bg-zinc-950 rounded-xl border border-zinc-800 p-1 shrink-0 flex items-center justify-center">
                        <Image
                          src={combiCookieObj?.imageUrl || '/images/cookies/gingerbrave.png'}
                          alt={combiCookieObj?.name || pet.combiCookieName || 'Cookie'}
                          width={40}
                          height={40}
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{combiCookieObj?.name || pet.combiCookieName}</div>
                        <div className="text-[11px] text-amber-400 font-bold">Combi Partner Cookie</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Hidden Stat Effects Table */}
            {pet.hiddenStats && pet.hiddenStats.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">Hidden Stat Effects</div>
                <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-2.5">Effect</th>
                        <th className="p-2.5 text-right">Lv.1</th>
                        <th className="p-2.5 text-right">Lv.8</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-medium">
                      {pet.hiddenStats.map((stat, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-2.5 font-bold text-white">{stat.effect}</td>
                          <td className="p-2.5 text-right font-semibold text-zinc-300">{stat.lv1}</td>
                          <td className="p-2.5 text-right font-black text-purple-400">{stat.lv8}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Story / Lore Section */}
            {pet.story && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-1.5">
                <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">Story & Lore</div>
                <p className="text-xs text-zinc-300 leading-relaxed font-normal italic">
                  "{pet.story}"
                </p>
              </div>
            )}

          </div>

          {/* Footer Action */}
          <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-zinc-950 font-black text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </PortalModal>
  );
};
