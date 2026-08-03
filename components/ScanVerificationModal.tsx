'use client';

import { useState } from 'react';
import Image from 'next/image';
import ItemPickerModal from './ItemPickerModal';
import PortalModal from './PortalModal';
import { ScannedTileResult, calculateGridSlotBox } from '@/lib/scannerEngine';
import { Treasure } from '@/lib/types';
import { 
  SparklesIcon, 
  CameraIcon, 
  CheckIcon, 
  PlusIcon, 
  TrashIcon, 
  LightbulbIcon, 
  EditIcon 
} from '@/components/icons';

interface ScanVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotUrls: string[];
  initialTiles: ScannedTileResult[];
  catalogTreasures: Treasure[];
  onConfirmImport: (verifiedTiles: ScannedTileResult[]) => void;
}

let nextManualSlotIndex = 100000;

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [sortBy, setSortBy] = useState<'slot' | 'accuracy'>('slot');

  // Interactive Grid Alignment Adjustments State
  const [gridXOffset, setGridXOffset] = useState<number>(0);
  const [gridYOffset, setGridYOffset] = useState<number>(0);
  const [gridScale, setGridScale] = useState<number>(1.0);
  const [showAlignmentControls, setShowAlignmentControls] = useState<boolean>(false);

  if (!isOpen) return null;

  const identifiedCount = tiles.filter(t => t.treasure && !t.treasure.id.startsWith('unmatched-')).length;
  const activeHoveredTile = tiles.find(t => t.slotIndex === (hoveredSlotIndex ?? editingSlotIndex));

  const sortedTiles = [...tiles].sort((a, b) => {
    if (sortBy === 'accuracy') {
      return b.confidence - a.confidence;
    }
    return (a.slotIndex ?? 0) - (b.slotIndex ?? 0);
  });

  const handleLevelChange = (slotIndex: number, newLevel: number) => {
    setTiles(prev =>
      prev.map(tile =>
        tile.slotIndex === slotIndex ? { ...tile, level: newLevel } : tile
      )
    );
  };

  const handleTreasureSelect = (slotIndex: number, selectedTreasure: Treasure) => {
    setTiles(prev =>
      prev.map(tile =>
        tile.slotIndex === slotIndex ? { ...tile, treasure: selectedTreasure } : tile
      )
    );
    setEditingSlotIndex(null);
  };

  const handleAddManualTreasure = (selectedTreasure: Treasure) => {
    const newSlotIdx = nextManualSlotIndex++;
    const newTile: ScannedTileResult = {
      treasure: selectedTreasure,
      level: 9,
      confidence: 100,
      sourceImageIndexes: [0],
      slotIndex: newSlotIdx,
      box: calculateGridSlotBox(tiles.length, gridXOffset, gridYOffset, gridScale)
    };
    setTiles(prev => [...prev, newTile]);
    setShowAddPicker(false);
  };

  const handleRemoveTile = (slotIndex: number) => {
    setTiles(prev => prev.filter(t => t.slotIndex !== slotIndex));
    if (editingSlotIndex === slotIndex) setEditingSlotIndex(null);
    if (hoveredSlotIndex === slotIndex) setHoveredSlotIndex(null);
  };

  const resetGridAlignment = () => {
    setGridXOffset(0);
    setGridYOffset(0);
    setGridScale(1.0);
  };

  return (
    <PortalModal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-zinc-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>AI Inventory Verification</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {identifiedCount} Identified
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Review, adjust levels (+0 to +9), or calibrate overlay grid frames before importing to inventory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAlignmentControls(!showAlignmentControls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showAlignmentControls || gridXOffset !== 0 || gridYOffset !== 0 || gridScale !== 1.0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
            >
              <span>🎯 Calibrate Grid Alignment</span>
            </button>

            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-300 transition cursor-pointer"
            >
              {isDrawerOpen ? 'Hide Tile Drawer' : 'Show Tile Drawer'}
            </button>
          </div>
        </div>

        {/* Optional Collapsible Grid Alignment Calibrator Toolbar */}
        {showAlignmentControls && (
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl p-3 mb-4 shrink-0 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1">
                <span>Grid X Shift (Left / Right)</span>
                <span className="text-amber-400">{gridXOffset > 0 ? `+${gridXOffset}%` : `${gridXOffset}%`}</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                value={gridXOffset}
                onChange={e => setGridXOffset(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1">
                <span>Grid Y Shift (Up / Down)</span>
                <span className="text-amber-400">{gridYOffset > 0 ? `+${gridYOffset}%` : `${gridYOffset}%`}</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                value={gridYOffset}
                onChange={e => setGridYOffset(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1">
                <span>Grid Frame Size (Scale)</span>
                <span className="text-amber-400">{gridScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={gridScale}
                onChange={e => setGridScale(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={resetGridAlignment}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition cursor-pointer"
              >
                Reset Alignment
              </button>
            </div>
          </div>
        )}

        {/* Modal Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          
          {/* Left: Interactive Bounding Box Overlay Preview */}
          <div className={`${isDrawerOpen ? 'lg:col-span-6' : 'lg:col-span-12'} bg-zinc-950 rounded-2xl p-4 border border-zinc-800 flex flex-col justify-between overflow-hidden relative`}>
            
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CameraIcon className="w-4 h-4 text-amber-400" />
                <span>Uploaded Screenshot & Calibrated AI Bounding Overlays</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {screenshotUrls.length} File{screenshotUrls.length > 1 ? 's' : ''} Scanned
              </span>
            </div>

            {/* Screenshot Container with Bounding Box Overlay */}
            <div className="relative flex-1 min-h-0 bg-black/60 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800/80">
              {screenshotUrls[0] ? (
                <div className="relative inline-block max-h-[420px] max-w-full">
                  <img
                    src={screenshotUrls[0]}
                    alt="Scanned Screenshot"
                    className="max-h-[420px] w-auto h-auto max-w-full object-contain rounded-lg block"
                  />

                  {/* Bounding Box Overlays */}
                  {tiles.map((tile, idx) => {
                    const slotIdx = tile.slotIndex ?? idx;
                    const calibratedBox = calculateGridSlotBox(slotIdx, gridXOffset, gridYOffset, gridScale);
                    const box = tile.box ? {
                      xPct: Number((tile.box.xPct + gridXOffset).toFixed(1)),
                      yPct: Number((tile.box.yPct + gridYOffset).toFixed(1)),
                      wPct: Number((tile.box.wPct * gridScale).toFixed(1)),
                      hPct: Number((tile.box.hPct * gridScale).toFixed(1))
                    } : calibratedBox;

                    const isEditing = editingSlotIndex === slotIdx;
                    const isHovered = hoveredSlotIndex === slotIdx;
                    const isRecognized = tile.treasure && !tile.treasure.id.startsWith('unmatched-');

                    return (
                      <div
                        key={`overlay-${slotIdx}-${tile.treasure?.id || idx}`}
                        onClick={() => setEditingSlotIndex(slotIdx)}
                        onMouseEnter={() => setHoveredSlotIndex(slotIdx)}
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
                            : isRecognized
                              ? 'border-emerald-400/90 bg-emerald-500/10 hover:bg-emerald-500/30'
                              : 'border-zinc-500/50 bg-black/40 hover:border-amber-400/60'
                        }`}
                      >
                        <span className="text-[7px] font-black bg-black/80 px-1 rounded text-white self-start leading-none">
                          #{slotIdx + 1}
                        </span>
                        {tile.level !== undefined && (
                          <span className="text-[8px] font-black bg-amber-400 text-zinc-950 px-1 rounded self-end leading-none shadow">
                            +{tile.level}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-zinc-600 text-xs font-bold">No image available</div>
              )}
            </div>

            {/* Active Hover / Active Edit Tooltip */}
            <div className="mt-3 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between shrink-0">
              {activeHoveredTile ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 relative bg-zinc-950 rounded-lg p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                    {activeHoveredTile.treasure ? (
                      <Image src={activeHoveredTile.treasure.imageUrl} alt={activeHoveredTile.treasure.name} width={28} height={28} unoptimized className="object-contain" />
                    ) : (
                      <span className="text-xs text-zinc-600 font-bold">?</span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-400">
                      Slot #{(activeHoveredTile.slotIndex ?? 0) + 1}: {activeHoveredTile.treasure.name} (+{activeHoveredTile.level})
                    </h5>
                    <p className="text-[10px] text-zinc-400">Confidence: {activeHoveredTile.confidence}% match</p>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                  <LightbulbIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Hover or tap any highlighted tile on the screenshot to view or modify details.</span>
                </div>
              )}
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
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                        sortBy === 'slot'
                          ? 'bg-amber-500 text-zinc-950 shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Sort by Slot #
                    </button>
                    <button
                      onClick={() => setSortBy('accuracy')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
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
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 hover:border-amber-500/60 transition flex items-center gap-1 cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add treasure manually</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {sortedTiles.length === 0 && (
                  <div className="text-center text-xs text-zinc-500 py-10">
                    No tiles left — add one manually or cancel and re-upload a clearer screenshot.
                  </div>
                )}
                {sortedTiles.map((tile, idx) => {
                  const slotIdx = tile.slotIndex ?? idx;
                  return (
                    <div
                      key={`tile-list-${slotIdx}-${tile.treasure?.id || idx}`}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        editingSlotIndex === slotIdx
                          ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40'
                          : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Treasure Thumbnail & Name */}
                      <div
                        onClick={() => setEditingSlotIndex(slotIdx)}
                        className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                      >
                        <div className="w-11 h-11 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                          {tile.treasure ? (
                            <Image src={tile.treasure.imageUrl} alt={tile.treasure.name} width={36} height={36} unoptimized className="object-contain" />
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-bold">?</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Slot #{slotIdx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-white line-clamp-1">
                              {tile.treasure?.name || 'Empty Slot'}
                            </h4>
                          </div>
                          {tile.auditReason && (
                            <p className="text-[10px] text-emerald-400 font-medium mt-0.5 line-clamp-1">
                              <span className="font-bold text-emerald-300">🔍 Audit:</span> {tile.auditReason}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-amber-400 font-bold shrink-0 flex items-center gap-0.5">
                              <EditIcon className="w-3 h-3" />
                              <span>Click to change</span>
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
                          </div>
                        </div>
                      </div>

                      {/* Enhancement Level Selector + Remove */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">Level:</span>
                        <select
                          value={tile.level}
                          onChange={(e) => handleLevelChange(slotIdx, Number(e.target.value))}
                          className="bg-zinc-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs font-black text-amber-400 outline-none cursor-pointer"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                            <option key={lvl} value={lvl}>
                              +{lvl}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleRemoveTile(slotIdx)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition cursor-pointer"
                          title="Remove item"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirmImport(tiles)}
            disabled={identifiedCount === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <CheckIcon className="w-4 h-4 stroke-[3]" />
            <span>Confirm & Import Verified Collection ({identifiedCount} Items)</span>
          </button>
        </div>

      </div>

      {/* Manual Item Selector Modal */}
      {editingSlotIndex !== null && (
        <ItemPickerModal
          isOpen={true}
          onClose={() => setEditingSlotIndex(null)}
          title="Select Correct Treasure"
          category="treasure"
          items={catalogTreasures}
          onSelectItem={(id) => {
            const found = catalogTreasures.find(t => t.id === id);
            if (found) handleTreasureSelect(editingSlotIndex, found);
          }}
        />
      )}

      {/* Manual Add Item Selector Modal */}
      {showAddPicker && (
        <ItemPickerModal
          isOpen={true}
          onClose={() => setShowAddPicker(false)}
          title="Add Treasure to Collection"
          category="treasure"
          items={catalogTreasures}
          onSelectItem={(id) => {
            const found = catalogTreasures.find(t => t.id === id);
            if (found) handleAddManualTreasure(found);
          }}
        />
      )}
      </div>
    </PortalModal>
  );
}
