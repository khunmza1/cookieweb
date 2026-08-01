'use client';

import { useState } from 'react';
import Image from 'next/image';
import ItemPickerModal from './ItemPickerModal';
import { ScannedTileResult } from '@/lib/scannerEngine';
import { Treasure } from '@/lib/types';

interface ScanVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotUrls: string[];
  initialTiles: ScannedTileResult[];
  catalogTreasures: Treasure[];
  onConfirmImport: (verifiedTiles: ScannedTileResult[]) => void;
}

let nextManualSlotIndex = 100000;

// NOTE: `tiles` is only initialized from `initialTiles` once, on mount — it is
// NOT re-synced if `initialTiles` changes while this component stays mounted.
// The parent must remount this component (e.g. `key={scanRunId}`) whenever a
// fresh scan result should replace the current editable tile list
export default function ScanVerificationModal({
  isOpen,
  onClose,
  screenshotUrls,
  initialTiles,
  catalogTreasures,
  onConfirmImport
}: ScanVerificationModalProps) {
  const [tiles, setTiles] = useState<ScannedTileResult[]>(initialTiles);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [sortBy, setSortBy] = useState<'slot' | 'accuracy'>('slot');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  if (!isOpen) return null;

  const handleLevelChange = (slotIndex: number, newLevel: number) => {
    setTiles(prev => prev.map(t => t.slotIndex === slotIndex ? { ...t, level: newLevel } : t));
  };

  const handleRemoveTile = (slotIndex: number) => {
    setTiles(prev => prev.filter(t => t.slotIndex !== slotIndex));
  };

  const handleTreasureChange = (slotIndex: number, newTreasureId: string) => {
    const found = catalogTreasures.find(t => t.id === newTreasureId);
    setTiles(prev => prev.map(t => {
      if (t.slotIndex === slotIndex) {
        return {
          ...t,
          treasureId: newTreasureId || null,
          treasureName: found?.name || null,
          imageUrl: found?.imageUrl || null,
          isEvolved: found ? (found.grade === 'S' || found.grade === 'S+') : false
        };
      }
      return t;
    }));
  };

  const handleAddManualTile = (treasureId: string) => {
    const found = catalogTreasures.find(t => t.id === treasureId);
    if (!found) return;
    const newSlot = nextManualSlotIndex++;
    setTiles(prev => [
      ...prev,
      {
        slotIndex: newSlot,
        treasureId: found.id,
        treasureName: found.name,
        imageUrl: found.imageUrl,
        level: 0,
        isEvolved: found.grade === 'S' || found.grade === 'S+',
        confidence: 100,
        sourceImageIndexes: []
      }
    ]);
    setShowAddPicker(false);
  };

  const activeEditingTile = editingSlotIndex !== null ? tiles.find(t => t.slotIndex === editingSlotIndex) : null;
  const activeHoveredTile = hoveredSlotIndex !== null ? tiles.find(t => t.slotIndex === hoveredSlotIndex) : activeEditingTile;
  const identifiedCount = tiles.filter(t => t.treasureId).length;
  const conflictCount = tiles.filter(t => t.conflict).length;

  const sortedTiles = [...tiles].sort((a, b) => {
    if (sortBy === 'accuracy') {
      return b.confidence - a.confidence || a.slotIndex - b.slotIndex;
    }
    return a.slotIndex - b.slotIndex;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-6xl w-full p-6 relative text-zinc-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
                <span>🎯 AI Vision Scanner & Verification</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Verify Detected Treasures & Enhancement Levels (+0 to +9)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review what was detected across your {screenshotUrls.length} screenshot{screenshotUrls.length !== 1 ? 's' : ''}. Hover over any frame box to inspect DB treasure image on the side preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition"
            >
              {isDrawerOpen ? '◀ Hide List Drawer' : '▶ Open List Drawer'}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-sm shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conflict warning banner */}
        {conflictCount > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 shrink-0">
            ⚠ {conflictCount} treasure{conflictCount !== 1 ? 's were' : ' was'} detected at more than one level across your screenshots.
            Both readings are listed below — when you confirm, the <strong>higher level</strong> will be saved for each.
          </div>
        )}

        {/* Main Content Area: Screenshot thumbnails + tile list */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pr-1">

          {/* Left: Uploaded Screenshot Preview with Interactive Clean Frames + Fixed-Height Side Hover Card */}
          <div className={`${isDrawerOpen ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col bg-zinc-950 p-4 rounded-2xl border border-zinc-800 transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                📸 Screenshot & Frame Tracker
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {identifiedCount}/{tiles.length} detected
              </span>
            </div>

            {/* Fixed Height (h-[68px]) Hover Side Preview Card (No Layout Glitching/Expansion) */}
            <div className="mb-3 p-3 rounded-xl bg-zinc-900 border border-amber-500/30 flex items-center gap-3 h-[68px] shrink-0 transition-all overflow-hidden">
              {activeHoveredTile?.imageUrl ? (
                <>
                  <div className="w-11 h-11 bg-zinc-950 rounded-xl p-1 border border-zinc-800 flex items-center justify-center shrink-0 shadow">
                    <Image src={activeHoveredTile.imageUrl} alt={activeHoveredTile.treasureName || ''} width={38} height={38} unoptimized className="object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Slot #{activeHoveredTile.slotIndex + 1}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        +{activeHoveredTile.level}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {activeHoveredTile.confidence}% match
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">
                      {activeHoveredTile.treasureName}
                    </h4>
                  </div>
                </>
              ) : (
                <div className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span>Hover over any frame box on the screenshot to view full DB details here.</span>
                </div>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {screenshotUrls.map((url, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black">
                  <span className="absolute top-1.5 left-1.5 z-20 text-[9px] font-black bg-black/80 text-amber-400 px-2 py-0.5 rounded border border-zinc-800">
                    Screenshot #{idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Screenshot ${idx + 1}`} className="block w-full h-auto" />

                  {/* Clean Frame Overlay with Slot # and Level + */}
                  {tiles.map((tile) => {
                    const box = tile.box || {
                      xPct: 8.2 + (tile.slotIndex % 4) * 7.7,
                      yPct: 31.8 + Math.floor(tile.slotIndex / 4) * 16.9,
                      wPct: 7.2,
                      hPct: 15.5
                    };
                    const isEditing = editingSlotIndex === tile.slotIndex;
                    const isHovered = hoveredSlotIndex === tile.slotIndex;
                    return (
                      <div
                        key={tile.slotIndex}
                        onClick={() => setEditingSlotIndex(tile.slotIndex)}
                        onMouseEnter={() => setHoveredSlotIndex(tile.slotIndex)}
                        onMouseLeave={() => setHoveredSlotIndex(null)}
                        style={{
                          left: `${box.xPct}%`,
                          top: `${box.yPct}%`,
                          width: `${box.wPct}%`,
                          height: `${box.hPct}%`
                        }}
                        className={`absolute rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between p-0.5 z-10 ${
                          isEditing || isHovered
                            ? 'border-amber-400 bg-amber-500/30 ring-2 ring-amber-400 scale-105 z-20 shadow-xl'
                            : tile.treasureId
                              ? 'border-emerald-400/90 bg-emerald-500/10 hover:bg-emerald-500/30'
                              : 'border-zinc-500/50 bg-black/40 hover:border-amber-400/60'
                        }`}
                      >
                        <span className="text-[7px] font-black bg-black/80 px-1 rounded text-white self-start leading-none">
                          #{tile.slotIndex + 1}
                        </span>
                        {tile.level !== undefined && tile.treasureId && (
                          <span className="text-[8px] font-black bg-amber-400 text-zinc-950 px-1 rounded self-end leading-none shadow">
                            +{tile.level}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Tile List (Collapsible Drawer) */}
          {isDrawerOpen && (
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    {tiles.length} Detected Slot{tiles.length !== 1 ? 's' : ''}
                  </span>

                {/* Sort Toggle Controls */}
                <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setSortBy('slot')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${
                      sortBy === 'slot'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sort by Slot #
                  </button>
                  <button
                    onClick={() => setSortBy('accuracy')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${
                      sortBy === 'accuracy'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sort by Accuracy %
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowAddPicker(true)}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30 hover:border-amber-500/60 transition"
              >
                + Add treasure manually
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {sortedTiles.length === 0 && (
                <div className="text-center text-xs text-zinc-500 py-10">
                  No tiles left — add one manually or cancel and re-upload a clearer screenshot.
                </div>
              )}
              {sortedTiles.map(tile => (
                <div
                  key={tile.slotIndex}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    editingSlotIndex === tile.slotIndex
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40'
                      : tile.conflict
                        ? 'bg-amber-500/5 border-amber-500/40'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Treasure Thumbnail & Name */}
                  <div
                    onClick={() => setEditingSlotIndex(tile.slotIndex)}
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <div className="w-11 h-11 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                      {tile.imageUrl ? (
                        <Image src={tile.imageUrl} alt={tile.treasureName || ''} width={36} height={36} unoptimized className="object-contain" />
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-bold">?</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Slot #{tile.slotIndex + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {tile.treasureName || 'Empty Slot'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-amber-400 font-bold shrink-0">
                          ✏️ Click to change
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                          tile.confidence > 80
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tile.confidence > 50
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tile.confidence}% match
                        </span>
                        {tile.conflict && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 shrink-0">
                            ⚠ also seen at +{tile.conflict.otherLevels.join(', +')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhancement Level Selector + Remove */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">Level:</span>
                    <select
                      value={tile.level}
                      onChange={(e) => handleLevelChange(tile.slotIndex, Number(e.target.value))}
                      className="bg-zinc-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs font-black text-amber-400 outline-none"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                        <option key={lvl} value={lvl}>+{lvl}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveTile(tile.slotIndex)}
                      title="Remove this row"
                      className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-rose-500/20 border border-zinc-800 hover:border-rose-500/40 flex items-center justify-center text-zinc-500 hover:text-rose-400 font-bold text-xs transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirmImport(tiles)}
            disabled={identifiedCount === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
          >
            <span>✅ Confirm & Import Verified Collection ({identifiedCount} Items)</span>
          </button>
        </div>

      </div>

      {/* ITEM PICKER MODAL FOR INDIVIDUAL SLOT SELECTION */}
      {editingSlotIndex !== null && activeEditingTile && (
        <ItemPickerModal
          isOpen={editingSlotIndex !== null}
          onClose={() => setEditingSlotIndex(null)}
          title={`Change Item`}
          category="treasure"
          items={catalogTreasures}
          selectedId={activeEditingTile.treasureId || undefined}
          allowNone={true}
          onSelectItem={(selectedId) => {
            handleTreasureChange(editingSlotIndex, selectedId);
            setEditingSlotIndex(null);
          }}
        />
      )}

      {/* ITEM PICKER MODAL FOR ADDING A TREASURE MANUALLY */}
      {showAddPicker && (
        <ItemPickerModal
          isOpen={showAddPicker}
          onClose={() => setShowAddPicker(false)}
          title="Add a treasure the scanner missed"
          category="treasure"
          items={catalogTreasures}
          onSelectItem={handleAddManualTile}
        />
      )}
    </div>
  );
}
