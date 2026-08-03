'use client';

import Image from 'next/image';
import PortalModal from './PortalModal';
import { Treasure, Cookie, Pet } from '@/lib/types';
import { AdvancedSubstituteRecommendation, COMBO_STRATEGY_RULES, ComboStrategyFocus } from '@/lib/abilitySystem';
import { SparklesIcon, CheckIcon, LightbulbIcon, ArrowRightIcon } from '@/components/icons';

interface BudgetSubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingItem: Treasure | Cookie | Pet | null;
  recommendations: AdvancedSubstituteRecommendation[];
  strategyFocus?: ComboStrategyFocus;
  onSelectSubstitute: (substitute: Treasure | Cookie | Pet, level: number) => void;
}

export default function BudgetSubstituteModal({
  isOpen,
  onClose,
  missingItem,
  recommendations,
  strategyFocus = 'HIGH_SCORE',
  onSelectSubstitute
}: BudgetSubstituteModalProps) {
  if (!isOpen || !missingItem) return null;

  const strategyRule = COMBO_STRATEGY_RULES[strategyFocus] || COMBO_STRATEGY_RULES.HIGH_SCORE;

  return (
    <PortalModal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 max-w-2xl w-full flex flex-col shadow-2xl relative text-zinc-100 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <LightbulbIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>In-Game Type & Active Substitute Finder</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Matches item Types (Magnet, Coins, Pit Lift...) and Actives (Recovery, Blast...).
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-zinc-800 rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Strategy Requirement Focus Banner */}
          <div className="p-3 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-2xl border border-amber-500/30 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-amber-400" />
                <span>Combo Strategy Focus: {strategyRule.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-1">{strategyRule.description}</p>
          </div>

          {/* Target Missing Item Card */}
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative bg-zinc-900 rounded-xl p-1 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Image src={missingItem.imageUrl} alt={missingItem.name} fill className="object-contain p-1" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Missing Recommended Item</span>
                <h4 className="text-sm font-black text-white">{missingItem.name}</h4>
                <p className="text-[10px] text-zinc-400 line-clamp-1 font-medium">
                  {'effect' in missingItem ? missingItem.effect : missingItem.description || missingItem.skill || 'Meta Choice'}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shrink-0">
              Target Item
            </span>
          </div>

          {/* Recommendations List */}
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Owned Substitutes Matching Type & Active Traits ({recommendations.length} Found)</span>
            </h4>

            {recommendations.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950 rounded-2xl border border-zinc-800">
                No matching items found in your inventory for this Type/Active class. Scan more screenshots in your profile to expand your library!
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <div
                  key={rec.substituteItem.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col gap-2.5 ${
                    rec.meetsStrategyThreshold
                      ? 'bg-zinc-950 border-zinc-800 hover:border-amber-500/60'
                      : 'bg-zinc-950/70 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 relative bg-zinc-900 rounded-xl p-1 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <Image src={rec.substituteItem.imageUrl} alt={rec.substituteItem.name} width={36} height={36} unoptimized className="object-contain" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            #{idx + 1} Best Match
                          </span>
                          <h5 className="text-xs font-bold text-white line-clamp-1">{rec.substituteItem.name} (+{rec.userOwnedLevel})</h5>
                        </div>

                        {/* In-Game Type & Active Tag Pills */}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {rec.types.map(t => (
                            <span key={t} className="text-[9px] font-black bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                              Type: {t}
                            </span>
                          ))}
                          {rec.actives.map(a => (
                            <span key={a} className="text-[9px] font-black bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                              Active: {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-black block ${rec.meetsStrategyThreshold ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {rec.efficiencyPercentage}% Yield
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectSubstitute(rec.substituteItem, rec.userOwnedLevel)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <span>Swap</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Strategy Threshold Warning Banner */}
                  {rec.thresholdWarning && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-medium">
                      {rec.thresholdWarning}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Classifies items by Type (Magnet, Pit Lift...) and Active (Blast, Recovery...) to ensure threshold rules for AFK & survival setups are strictly met.</span>
          </div>

        </div>
      </div>
    </PortalModal>
  );
}
