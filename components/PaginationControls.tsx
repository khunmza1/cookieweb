'use client';

import React from 'react';

export type PageSizeOption = number | 'ALL';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: PageSizeOption;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
  pageSizeOptions?: PageSizeOption[];
  className?: string;
}

export default function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100, 'ALL'],
  className = ''
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const isAll = pageSize === 'ALL';
  const effectivePageSize = isAll ? totalItems : (pageSize as number);
  const totalPages = isAll ? 1 : Math.ceil(totalItems / effectivePageSize);

  const startItem = totalItems === 0 ? 0 : isAll ? 1 : (currentPage - 1) * effectivePageSize + 1;
  const endItem = isAll ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-zinc-300 ${className}`}>
      {/* Item count & Page Size Selector */}
      <div className="flex items-center gap-3 text-xs flex-wrap justify-center sm:justify-start">
        <span className="font-semibold text-zinc-400">
          Showing <span className="text-amber-400 font-bold">{startItem.toLocaleString()}–{endItem.toLocaleString()}</span> of{' '}
          <span className="text-white font-bold">{totalItems.toLocaleString()}</span> items
        </span>

        <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2 py-1">
          <span className="text-zinc-500 font-medium text-[11px] pr-1">Per page:</span>
          {pageSizeOptions.map((opt) => (
            <button
              key={String(opt)}
              onClick={() => {
                onPageSizeChange(opt);
                onPageChange(1);
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                pageSize === opt
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {opt === 'ALL' ? 'Show All' : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Page Navigation Buttons (Only if not 'ALL' and totalPages > 1) */}
      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First Page"
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition text-zinc-400"
          >
            «
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition text-zinc-400"
          >
            Prev
          </button>

          <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl font-bold text-amber-400 text-[11px]">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition text-zinc-400"
          >
            Next
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Last Page"
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition text-zinc-400"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
