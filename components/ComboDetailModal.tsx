'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ComboSetup, CatalogData, Cookie, Pet, Treasure } from '@/lib/types';
import { findTreasureAlternates } from '@/lib/effectTags';
import { useLanguage } from '@/lib/i18nContext';
import PortalModal from '@/components/PortalModal';
import { 
  CloseIcon, 
  TrophyIcon, 
  CoinIcon, 
  StarIcon, 
  CheckIcon, 
  LightbulbIcon, 
  SparklesIcon,
  ExternalLinkIcon
} from '@/components/icons';

interface ComboDetailModalProps {
  combo: ComboSetup | null;
  catalog: CatalogData | null;
  userOwnedItems?: {
    cookies: Set<string>;
    pets: Set<string>;
    treasures: Set<string>;
  };
  onClose: () => void;
  onOpenSubstituteFinder?: (item: Treasure | Cookie | Pet) => void;
}

export default function ComboDetailModal({
  combo,
  catalog,
  userOwnedItems,
  onClose,
  onOpenSubstituteFinder
}: ComboDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  if (!combo || !catalog) return null;

  const cookieMap = new Map(catalog.cookies.map(c => [c.id, c]));
  const petMap = new Map(catalog.pets.map(p => [p.id, p]));
  const treasureMap = new Map(catalog.treasures.map(t => [t.id, t]));

  const mainCookie = cookieMap.get(combo.cookieId);
  const relayCookie = combo.relayCookieId ? cookieMap.get(combo.relayCookieId) : null;
  const pet = petMap.get(combo.petId);

  const treasures = combo.treasureIds
    .map(id => treasureMap.get(id))
    .filter((t): t is Treasure => Boolean(t));

  const hasCookie = !userOwnedItems || userOwnedItems.cookies.has(combo.cookieId);
  const hasRelay = !userOwnedItems || !combo.relayCookieId || userOwnedItems.cookies.has(combo.relayCookieId);
  const hasPet = !userOwnedItems || userOwnedItems.pets.has(combo.petId);

  const missingTreasures = treasures.filter(t => userOwnedItems && !userOwnedItems.treasures.has(t.id));

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PortalModal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 max-w-2xl w-full flex flex-col shadow-2xl relative text-zinc-100 overflow-hidden max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <TrophyIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{combo.title}</h2>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                  <span>By <strong className="text-amber-400 font-bold">{combo.author || 'Pro Runner'}</strong></span>
                  <span>•</span>
                  <span>{combo.episode || 'Classic Stage'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto pr-1 space-y-5">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">{t.home.targetScore}</span>
                <span className="text-base font-black text-amber-400">{combo.targetScore.toLocaleString()}</span>
              </div>

              {combo.coinsPerRun && (
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">{t.home.coinsPerRun}</span>
                  <span className="text-base font-black text-amber-400 flex items-center gap-1">
                    <CoinIcon className="w-4 h-4 text-amber-400" />
                    <span>+{combo.coinsPerRun.toLocaleString()}</span>
                  </span>
                </div>
              )}

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">Ownership Status</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full inline-block mt-1 ${
                  hasCookie && hasRelay && hasPet && missingTreasures.length === 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {hasCookie && hasRelay && hasPet && missingTreasures.length === 0
                    ? '100% Owned'
                    : `Missing ${missingTreasures.length} Treasure${missingTreasures.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-1">Setup Strategy</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{combo.description}</p>
            </div>

            {/* Combi Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                <span>{t.modal.combiBreakdown}</span>
              </h3>

              <div className="bg-zinc-950/90 p-4 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex flex-wrap items-center gap-4 border-b border-zinc-800/80 pb-4">
                  {mainCookie && (
                    <div className="flex items-center gap-3">
                      <div className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 bg-zinc-900 shrink-0 ${hasCookie ? 'border-amber-500' : 'border-rose-500 opacity-60'}`}>
                        <Image src={mainCookie.imageUrl} alt={mainCookie.name} fill className="object-contain p-1" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400">{t.modal.mainRunner}</div>
                        <div className="text-sm font-black text-white">{mainCookie.name}</div>
                      </div>
                    </div>
                  )}

                  {relayCookie && (
                    <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
                      <div className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 bg-zinc-900 shrink-0 ${hasRelay ? 'border-amber-500' : 'border-rose-500 opacity-60'}`}>
                        <Image src={relayCookie.imageUrl} alt={relayCookie.name} fill className="object-contain p-1" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400">{t.modal.relayRunner}</div>
                        <div className="text-sm font-black text-white">{relayCookie.name}</div>
                      </div>
                    </div>
                  )}

                  {pet && (
                    <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
                      <div className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 bg-zinc-900 shrink-0 ${hasPet ? 'border-purple-500' : 'border-rose-500 opacity-60'}`}>
                        <Image src={pet.imageUrl} alt={pet.name} fill className="object-contain p-1" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-purple-400">{t.modal.combiPet}</div>
                        <div className="text-sm font-black text-white">{pet.name}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Treasures List */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-2">{t.modal.equippedTreasures}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {treasures.map((item, itemIdx) => {
                      const isOwned = !userOwnedItems || userOwnedItems.treasures.has(item.id);
                      return (
                        <div key={`${item.id}-${itemIdx}`} className={`p-2.5 rounded-xl border flex flex-col justify-between bg-zinc-900 ${isOwned ? 'border-amber-500/40 bg-amber-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 shrink-0">
                              <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{item.name}</div>
                              <div className="text-[10px] text-zinc-400 truncate">{item.grade} Grade</div>
                            </div>
                          </div>

                          {!isOwned && onOpenSubstituteFinder && (
                            <button
                              onClick={() => onOpenSubstituteFinder(item)}
                              className="mt-2 w-full px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-black cursor-pointer flex items-center justify-center gap-1 transition shadow"
                            >
                              <LightbulbIcon className="w-3 h-3" />
                              <span>Find Budget Substitute</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Boosts List & Power+ Effects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Pre-Run Boosts */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1">
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>Pre-Run Boosts</span>
                      </span>
                      {combo.boosts?.hasAll && (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          ALL BOOSTS ON
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className={`p-1.5 rounded-lg border ${combo.boosts?.health ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Energy Boost: {combo.boosts?.health ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.boosts?.itemTime ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Item Time: {combo.boosts?.itemTime ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.boosts?.fastStart ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Fast Start: {combo.boosts?.fastStart ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.boosts?.draw ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        {typeof combo.boosts?.draw === 'string' ? combo.boosts.draw : combo.boosts?.draw ? 'Random Boost' : 'No Boost'}
                      </div>
                    </div>
                  </div>

                  {/* Power+ Special Effects */}
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 flex items-center gap-1">
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>Power+ Special Effects</span>
                      </span>
                      {combo.powerPlusEffects?.hasAll && (
                        <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          ALL POWER+ ON
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className={`p-1.5 rounded-lg border ${combo.powerPlusEffects?.cheerleader ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Cheerleader: {combo.powerPlusEffects?.cheerleader ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.powerPlusEffects?.commando ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Special Forces: {combo.powerPlusEffects?.commando ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.powerPlusEffects?.fairy ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Fairy Shield: {combo.powerPlusEffects?.fairy ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.powerPlusEffects?.cheesecake ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Cheesecake: {combo.powerPlusEffects?.cheesecake ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.powerPlusEffects?.seaFairy ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        Sea Fairy: {combo.powerPlusEffects?.seaFairy ? 'ON' : 'OFF'}
                      </div>
                      <div className={`p-1.5 rounded-lg border ${combo.powerPlusEffects?.expParty ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'}`}>
                        EXP Party: {combo.powerPlusEffects?.expParty ? 'ON' : 'OFF'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Footer Share Button */}
          <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between shrink-0">
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLinkIcon className="w-3.5 h-3.5" />
              <span>{copied ? 'Link Copied!' : 'Share Combo Link'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </PortalModal>
  );
}
