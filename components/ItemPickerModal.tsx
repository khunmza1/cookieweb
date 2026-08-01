'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Cookie, Pet, Treasure, Grade, ItemCategory } from '@/lib/types';

interface ItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category: ItemCategory;
  items: (Cookie | Pet | Treasure)[];
  onSelectItem: (id: string) => void;
  selectedId?: string;
  allowNone?: boolean;
}

export default function ItemPickerModal({
  isOpen,
  onClose,
  title,
  category,
  items,
  onSelectItem,
  selectedId,
  allowNone = false
}: ItemPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    if (gradeFilter !== 'ALL' && item.grade !== gradeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(term) || item.id.toLowerCase().includes(term);
    }
    return true;
  });

  const grades: Grade[] = ['C', 'B', 'A', 'S', 'S+', 'L'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 relative text-zinc-100 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{category === 'cookie' ? '🍪 Select Cookie' : category === 'pet' ? '🐾 Select Pet' : '💎 Select Treasure'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{title}</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search & Grade Filter Pills */}
        <div className="space-y-3 mb-4 shrink-0">
          <input
            type="text"
            placeholder={`Search ${category} by name...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition"
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setGradeFilter('ALL')}
              className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                gradeFilter === 'ALL'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              ALL
            </button>
            {grades.map(g => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                  gradeFilter === g
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Visual Asset Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 min-h-[250px]">
          
          {allowNone && (
            <div
              onClick={() => { onSelectItem(''); onClose(); }}
              className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col items-center justify-center text-center ${
                !selectedId
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center font-bold text-zinc-600 mb-2">
                🚫
              </div>
              <span className="text-xs font-bold block">No Relay</span>
              <span className="text-[10px] text-zinc-500">Empty Slot</span>
            </div>
          )}

          {filteredItems.map(item => {
            const isSelected = selectedId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => { onSelectItem(item.id); onClose(); }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col items-center justify-between text-center group ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-white ring-2 ring-amber-500/50'
                    : 'bg-zinc-950 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/90 text-zinc-300'
                }`}
              >
                <div className="w-full flex justify-between items-center mb-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {item.grade}
                  </span>
                  {isSelected && <span className="text-amber-400 font-bold text-xs">✓ Selected</span>}
                </div>

                <div className="w-14 h-14 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="object-contain"
                  />
                </div>

                <span className="text-xs font-extrabold line-clamp-1 mt-1">{item.name}</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span>Showing {filteredItems.length} items</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
